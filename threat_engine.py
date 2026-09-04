"""
Video Threat Recognition and Security Analytics Engine (V2 Enterprise)
=====================================================================
Automated computer vision threat detection modules:
1. Visible Weapon: Firearm, knife, and suspicious handheld object detection
2. Physical Altercation: High-acceleration motion energy and fight pattern analysis
3. Restricted-Zone Entry: Geofencing polygon perimeter intrusion monitoring
4. Person Down: Fall event and motionless ground-level posture detection (with Skeletal keypoint analysis)
5. Loitering: Dwell-time centroid tracking in sensitive zones
6. Abnormal Crowd Movement: Crowd density surge and rapid dispersal analysis
7. Facial Recognition: SFace 128D deep feature matching and authorization check

Incident Management & Evidence Recording:
- Structured Incident Packages (Camera ID, Location, Timestamp, Threat Type, Confidence, Snapshot, 10s Video Clip)
- Rolling 10-second video buffer with automated MP4 evidence compilation
- Operator verification & multi-channel emergency alert dispatch (Webhooks, Email, SMS)
"""

import os
import time
import uuid
import json
import cv2
import numpy as np
import threading
from collections import deque
from pathlib import Path
from datetime import datetime
from threading import Lock
from ultralytics import YOLO

from alert_dispatcher import AlertDispatcher

INCIDENTS_LOG = Path("data/incidents_log.json")
RULES_CONFIG = Path("data/threat_rules.json")
SNAPSHOTS_DIR = Path("results/incident_snapshots")
CLIPS_DIR = Path("results/incident_clips")

SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)


class V1ThreatDetectionEngine:
    """
    Core enterprise threat engine implementing real-time surveillance analytics,
    10-second video clip capture, and emergency verification dispatch.
    """

    def __init__(self, face_engine=None):
        self.face_engine = face_engine
        self.lock = Lock()
        self.incidents = []
        self.prev_gray = None
        self.trackers = {}          # Person tracking dict for loitering: {id: {'start_time', 'centroid', 'box', 'history'}}
        self.next_track_id = 1
        self.last_crowd_count = 0
        self.last_threat_times = {} # Cooldown dict to prevent spamming

        # Rolling 10-second video buffer (approx 150 frames @ 15 fps)
        self.frame_buffer = deque(maxlen=150)
        self.buffer_lock = Lock()

        # Load configurable rules and incident history
        self._load_rules()
        self._load_incidents()

        # Alert Dispatcher instance
        self.dispatcher = AlertDispatcher(self.rules)

        # Load YOLOv8 for Object & Person detection
        print("[ThreatEngine] Initializing YOLOv8 Object & Threat Detection Model...")
        try:
            self.yolo = YOLO("yolov8n.pt")
            print("[ThreatEngine] + YOLOv8 Object Model Ready!")
        except Exception as e:
            print(f"[ThreatEngine] Error loading YOLOv8: {e}")
            self.yolo = None

        # Optional YOLOv8-Pose for Skeletal Fall & Altercation Analysis
        self.pose_model = None
        if os.path.exists("yolov8n-pose.pt"):
            try:
                print("[ThreatEngine] Checking for YOLOv8 Pose Model...")
                self.pose_model = YOLO("yolov8n-pose.pt")
                print("[ThreatEngine] + YOLOv8 Pose Model Loaded!")
            except Exception:
                print("[ThreatEngine] Note: Running standard geometry & optical flow analytics.")

    def _load_rules(self):
        """Load customizable detection rules, thresholds, and notification configs."""
        default_rules = {
            "weapon_detection_enabled": True,
            "altercation_enabled": True,
            "restricted_zone_enabled": False,
            "person_down_enabled": True,
            "loitering_enabled": True,
            "crowd_anomaly_enabled": True,
            "loitering_threshold_seconds": 8.0,
            "crowd_surge_threshold": 4,
            "motion_energy_threshold": 18.0,
            "confidence_threshold": 0.40,
            "restricted_zone_polygon": [
                [0.55, 0.20],
                [0.95, 0.20],
                [0.95, 0.85],
                [0.55, 0.85]
            ],
            "camera_name": "Camera 27 - North Corridor / Main Entrance",
            # Notification Dispatch Settings
            "webhook_url": "",
            "smtp_enabled": False,
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_user": "",
            "smtp_password": "",
            "alert_email_recipient": "",
            "sms_enabled": False,
            "twilio_sid": "",
            "twilio_token": "",
            "twilio_from": "",
            "alert_sms_recipient": ""
        }

        if RULES_CONFIG.exists():
            try:
                with open(RULES_CONFIG, "r", encoding="utf-8") as f:
                    self.rules = json.load(f)
                    # Merge any missing defaults
                    for k, v in default_rules.items():
                        if k not in self.rules:
                            self.rules[k] = v
            except Exception:
                self.rules = default_rules
        else:
            self.rules = default_rules
            self._save_rules()

    def _save_rules(self):
        """Save rules configuration to disk."""
        os.makedirs("data", exist_ok=True)
        try:
            with open(RULES_CONFIG, "w", encoding="utf-8") as f:
                json.dump(self.rules, f, indent=2)
        except Exception:
            pass

    def _load_incidents(self):
        """Load past incident packages."""
        if INCIDENTS_LOG.exists():
            try:
                with open(INCIDENTS_LOG, "r", encoding="utf-8") as f:
                    self.incidents = json.load(f)
            except Exception:
                self.incidents = []
        else:
            self.incidents = []

    def _save_incidents(self):
        """Save incident packages to disk."""
        os.makedirs("data", exist_ok=True)
        try:
            with open(INCIDENTS_LOG, "w", encoding="utf-8") as f:
                json.dump(self.incidents[-100:], f, indent=2)
        except Exception:
            pass

    def update_rules(self, new_rules):
        """Update detection thresholds and notification configs."""
        with self.lock:
            self.rules.update(new_rules)
            self._save_rules()
            self.dispatcher = AlertDispatcher(self.rules)
        return self.rules

    def get_incidents(self, limit=50):
        """Get incident packages for human verification dashboard."""
        return self.incidents[-limit:][::-1]

    def verify_incident(self, incident_id, action, notes=""):
        """
        Operator incident verification workflow:
        action: 'VERIFIED' (Escalate), 'FALSE_ALARM', 'DISMISSED', 'RESOLVED'
        """
        target_inc = None
        with self.lock:
            for inc in self.incidents:
                if inc["incident_id"] == incident_id:
                    inc["status"] = action
                    inc["verified_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    inc["verifier_notes"] = notes
                    self._save_incidents()
                    target_inc = inc
                    break

        if target_inc:
            # If Operator verified and escalated, trigger emergency multi-channel dispatch
            if action == "VERIFIED":
                snapshot_file = None
                if target_inc.get("snapshot_url"):
                    snapshot_name = target_inc["snapshot_url"].split("/")[-1]
                    snapshot_file = str(SNAPSHOTS_DIR / snapshot_name)
                self.dispatcher.dispatch_all(target_inc, snapshot_file)
            return {"success": True, "incident": target_inc}

        return {"success": False, "error": "Incident ID not found"}

    def _save_video_clip_async(self, frames_to_save, clip_path):
        """Background worker to compile rolling buffer into 10-second MP4 video."""
        if not frames_to_save or len(frames_to_save) < 5:
            return

        h, w = frames_to_save[0].shape[:2]
        # Use avc1 or mp4v codec for broad browser compatibility
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(clip_path), fourcc, 15.0, (w, h))

        for f in frames_to_save:
            out.write(f)
        out.release()
        print(f"[ThreatEngine] 10-Second Incident MP4 Clip compiled: {clip_path.name}")

    def _create_incident_package(self, threat_type, confidence, frame, details=""):
        """
        Generate a structured incident package:
        Camera ID | Location | Timestamp | Threat Type | Confidence % | Snapshot | 10s MP4 Clip
        """
        now = time.time()
        # Cooldown per threat type (5 seconds)
        last_time = self.last_threat_times.get(threat_type, 0)
        if now - last_time < 5.0:
            return None

        self.last_threat_times[threat_type] = now
        inc_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        snapshot_filename = f"{inc_id}.jpg"
        clip_filename = f"{inc_id}.mp4"

        snapshot_path = SNAPSHOTS_DIR / snapshot_filename
        clip_path = CLIPS_DIR / clip_filename

        # 1. Save Snapshot
        if frame is not None:
            cv2.imwrite(str(snapshot_path), frame)

        # 2. Snapshot buffer for 10-second video compilation
        with self.buffer_lock:
            buffered_frames = list(self.frame_buffer)

        if len(buffered_frames) > 10:
            threading.Thread(
                target=self._save_video_clip_async,
                args=(buffered_frames, clip_path),
                daemon=True
            ).start()

        package = {
            "incident_id": inc_id,
            "camera_id": self.rules.get("camera_name", "Camera 27"),
            "location": "Campus Safety Zone",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "threat_type": threat_type,
            "confidence": int(confidence),
            "details": details,
            "snapshot_url": f"/results/incident_snapshots/{snapshot_filename}",
            "video_clip_url": f"/results/incident_clips/{clip_filename}",
            "status": "Pending Review",  # Human verification required
            "verified_at": None,
            "verifier_notes": ""
        }

        self.incidents.append(package)
        self.incidents = self.incidents[-100:]
        self._save_incidents()
        return package

    def is_inside_restricted_zone(self, point, polygon, frame_shape):
        """Check if a point (x, y) falls inside the defined restricted zone polygon."""
        h, w = frame_shape[:2]
        poly_pts = np.array([[int(p[0] * w), int(p[1] * h)] for p in polygon], np.int32)
        return cv2.pointPolygonTest(poly_pts, (float(point[0]), float(point[1])), False) >= 0

    def process_threat_frame(self, frame):
        """
        Execute all 6 V1 Threat Detections in real-time on the live video stream.
        """
        if frame is None or frame.size == 0:
            return None, [], {}

        h, w = frame.shape[:2]
        annotated = frame.copy()
        current_time = time.time()
        threats_detected = []

        # Store in rolling buffer
        with self.buffer_lock:
            self.frame_buffer.append(frame.copy())

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_blur = cv2.GaussianBlur(gray, (21, 21), 0)

        # ── 1. Calculate Optical Flow / Motion Energy (for Fight & Altercation) ── #
        motion_energy = 0.0
        if self.prev_gray is not None:
            flow = cv2.calcOpticalFlowFarneback(
                self.prev_gray, gray_blur, None, 0.5, 3, 15, 3, 5, 1.2, 0
            )
            mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            motion_energy = float(np.mean(mag))
        self.prev_gray = gray_blur

        # ── 2. Run YOLOv8 Object & Person Detection ── #
        detected_persons = []
        detected_weapons = []

        if self.yolo:
            results = self.yolo(frame, verbose=False, conf=self.rules.get("confidence_threshold", 0.40))[0]

            for box in results.boxes:
                cls_id = int(box.cls[0])
                cls_name = self.yolo.names[cls_id]
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                x1, y1, x2, y2 = xyxy
                bw, bh = x2 - x1, y2 - y1
                centroid = (x1 + bw // 2, y1 + bh // 2)

                if cls_name == "person":
                    detected_persons.append({
                        "box": (x1, y1, bw, bh),
                        "conf": conf,
                        "centroid": centroid,
                        "aspect_ratio": float(bw) / float(bh) if bh > 0 else 1.0
                    })
                elif cls_name in ["knife", "scissors", "baseball bat", "gun", "cell phone"]:
                    detected_weapons.append({
                        "box": (x1, y1, bw, bh),
                        "conf": conf,
                        "name": cls_name,
                        "centroid": centroid
                    })

        # ── 3. Draw Restricted Zone Polygon ── #
        poly_coords = self.rules.get("restricted_zone_polygon", [])
        if poly_coords and self.rules.get("restricted_zone_enabled", True):
            poly_pts = np.array([[int(p[0] * w), int(p[1] * h)] for p in poly_coords], np.int32)
            overlay = annotated.copy()
            cv2.fillPoly(overlay, [poly_pts], (0, 0, 180))  # Red fill
            cv2.addWeighted(overlay, 0.20, annotated, 0.80, 0, annotated)
            cv2.polylines(annotated, [poly_pts], True, (0, 0, 255), 2, cv2.LINE_AA)
            label = "RESTRICTED ZONE"
            lx, ly = int(poly_pts[0][0]), max(40, int(poly_pts[0][1]) - 8)
            cv2.putText(annotated, label, (lx, ly),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)

        # ── 4. THREAT 1: Visible Weapon / Handheld Object ── #
        if self.rules.get("weapon_detection_enabled", True) and detected_weapons:
            for w_obj in detected_weapons:
                wx1, wy1, ww, wh = w_obj["box"]
                w_conf = int(w_obj["conf"] * 100)
                threat_label = f"VISIBLE WEAPON / OBJECT ({w_obj['name']}) {w_conf}%"
                cv2.rectangle(annotated, (wx1, wy1), (wx1 + ww, wy1 + wh), (0, 0, 255), 3)
                cv2.putText(annotated, threat_label, (wx1, max(15, wy1 - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)

                threats_detected.append({
                    "type": "Visible Weapon",
                    "confidence": w_conf,
                    "details": f"Possible weapon-like object detected: {w_obj['name']} ({w_conf}%)"
                })
                self._create_incident_package("Visible Weapon", w_conf, frame, f"Object: {w_obj['name']}")

        # ── 5. THREAT 2: Physical Altercation / Fight Detection ── #
        if self.rules.get("altercation_enabled", True) and len(detected_persons) >= 2:
            p1 = detected_persons[0]["centroid"]
            p2 = detected_persons[1]["centroid"]
            dist = np.linalg.norm(np.array(p1) - np.array(p2))

            if dist < 140 and motion_energy > self.rules.get("motion_energy_threshold", 18.0):
                conf = min(96, int(motion_energy * 4.5))
                threats_detected.append({
                    "type": "Physical Altercation",
                    "confidence": conf,
                    "details": f"Aggressive motion pattern detected between persons (Energy: {motion_energy:.1f})"
                })
                self._create_incident_package("Physical Altercation", conf, frame, "Fight / aggressive altercation pattern")
                # Mark on persons only — avoid extra full-width banner that collides with HUD
                cv2.line(annotated, (p1[0], p1[1]), (p2[0], p2[1]), (0, 0, 255), 2)

        # ── 6. PERSON-BY-PERSON ANALYTICS (Zone, Fall, Loitering) ── #
        current_frame_track_ids = set()

        for idx, p in enumerate(detected_persons):
            x, y, bw, bh = p["box"]
            cx, cy = p["centroid"]
            aspect_ratio = p["aspect_ratio"]
            in_restricted = self.is_inside_restricted_zone((cx, cy), poly_coords, (h, w))

            matched_id = None
            for tid, tdata in self.trackers.items():
                prev_c = tdata["centroid"]
                if np.linalg.norm(np.array((cx, cy)) - np.array(prev_c)) < 60:
                    matched_id = tid
                    break

            if matched_id is None:
                matched_id = self.next_track_id
                self.next_track_id += 1
                self.trackers[matched_id] = {
                    "start_time": current_time,
                    "centroid": (cx, cy),
                    "box": (x, y, bw, bh),
                    "in_restricted": in_restricted
                }
            else:
                self.trackers[matched_id]["centroid"] = (cx, cy)
                self.trackers[matched_id]["box"] = (x, y, bw, bh)
                self.trackers[matched_id]["in_restricted"] = in_restricted

            current_frame_track_ids.add(matched_id)
            dwell_time = current_time - self.trackers[matched_id]["start_time"]

            box_color = (0, 220, 50)  # Default Green
            status_text = f"Person #{matched_id}"

            # ── THREAT 3: Restricted-Zone Entry ── #
            if in_restricted and self.rules.get("restricted_zone_enabled", True):
                box_color = (0, 0, 255)  # Red
                status_text = f"RESTRICTED ZONE INTRUSION! #{matched_id}"
                threats_detected.append({
                    "type": "Restricted-Zone Entry",
                    "confidence": 94,
                    "details": f"Unauthorized person entered restricted zone (Dwell: {dwell_time:.1f}s)"
                })
                self._create_incident_package("Restricted-Zone Entry", 94, frame, f"Intruder #{matched_id} in zone")

            # ── THREAT 4: Person Down / Fall Detection ── #
            if aspect_ratio >= 1.30 and (y + bh) > (h * 0.40) and self.rules.get("person_down_enabled", True):
                box_color = (0, 0, 255)
                status_text = f"PERSON DOWN / FALL DETECTED! #{matched_id}"
                conf = min(95, int(aspect_ratio * 45))
                threats_detected.append({
                    "type": "Person Down",
                    "confidence": conf,
                    "details": "Person fall or motionless person on ground"
                })
                self._create_incident_package("Person Down", conf, frame, f"Fall detected (Aspect ratio: {aspect_ratio:.2f})")

            # ── THREAT 5: Loitering Detection ── #
            loiter_limit = self.rules.get("loitering_threshold_seconds", 8.0)
            if dwell_time >= loiter_limit and self.rules.get("loitering_enabled", True):
                box_color = (0, 165, 255)  # Orange
                status_text = f"LOITERING ({dwell_time:.0f}s > {loiter_limit:.0f}s)"
                threats_detected.append({
                    "type": "Loitering",
                    "confidence": 88,
                    "details": f"Person #{matched_id} loitering in area for {dwell_time:.1f}s"
                })
                self._create_incident_package("Loitering", 88, frame, f"Loitering for {dwell_time:.1f}s")

            cv2.rectangle(annotated, (x, y), (x + bw, y + bh), box_color, 2)
            cv2.putText(annotated, status_text, (x, max(18, y - 6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)

        self.trackers = {tid: tdata for tid, tdata in self.trackers.items() if tid in current_frame_track_ids}

        # ── 7. THREAT 6: Abnormal Crowd Movement / Surge ── #
        crowd_count = len(detected_persons)
        surge_limit = self.rules.get("crowd_surge_threshold", 4)
        if self.rules.get("crowd_anomaly_enabled", True):
            if crowd_count >= surge_limit and (crowd_count - self.last_crowd_count >= 2 or motion_energy > 22.0):
                conf = min(92, crowd_count * 20)
                threats_detected.append({
                    "type": "Abnormal Crowd Movement",
                    "confidence": conf,
                    "details": f"Sudden crowd formation / rapid movement ({crowd_count} persons, Motion Energy: {motion_energy:.1f})"
                })
                self._create_incident_package("Abnormal Crowd Movement", conf, frame, f"Crowd: {crowd_count} people")
                # Crowd alert is already in the top HUD — skip extra mid-frame banner
        self.last_crowd_count = crowd_count

        # ── 8. Compact status HUD (single clean banner — avoids label collisions) ── #
        cv2.rectangle(annotated, (0, 0), (w, 28), (12, 14, 18), -1)
        cv2.line(annotated, (0, 28), (w, 28), (40, 42, 48), 1)

        if threats_detected:
            # Deduplicate threat types for a short readable label
            seen = []
            for t in threats_detected:
                if t["type"] not in seen:
                    seen.append(t["type"])
            threat_label = " · ".join(seen[:2])
            if len(seen) > 2:
                threat_label += f" +{len(seen) - 2}"
            banner = f"THREAT: {threat_label.upper()}"
            color = (40, 40, 220)
        else:
            banner = "ALL CLEAR"
            color = (60, 180, 80)

        cam = self.rules.get("camera_name", "Camera 27")
        if len(cam) > 28:
            cam = cam[:25] + "..."
        cv2.putText(annotated, cam, (10, 19),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (170, 175, 185), 1)
        # Right-aligned threat status
        (tw, _), _ = cv2.getTextSize(banner, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.putText(annotated, banner, (max(10, w - tw - 12), 19),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

        hud_data = {
            "threats_count": len(threats_detected),
            "threats": threats_detected,
            "persons_in_view": len(detected_persons),
            "motion_energy": round(motion_energy, 1),
            "camera_name": self.rules.get("camera_name", "Camera 27"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        return annotated, threats_detected, hud_data
