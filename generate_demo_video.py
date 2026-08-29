"""
Automated Demo Video Generator for AegisAI Video Threat Recognition Platform
=============================================================================
Generates a 1080p MP4 demonstration video showcasing:
1. Title & Value Proposition Slide
2. System Hub Dashboard & Telemetry
3. Live Threat SOC & All 6 Detections (Weapon, Altercation, Zone, Fall, Loiter, Crowd)
4. 10-Second Video Clip Evidence Modal & Operator Verification
5. 4-Up Multi-Camera Surveillance Wall Matrix
6. Smartphone QR Code Streamer
"""

import os
import cv2
import numpy as np
from pathlib import Path

OUTPUT_VIDEO = Path("AegisAI_Video_Threat_Demo.mp4")
WIDTH, HEIGHT = 1280, 720
FPS = 25

def create_gradient_bg(w, h, color1=(15, 23, 42), color2=(7, 9, 14)):
    """Create subtle radial/linear dark gradient background."""
    bg = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        alpha = y / h
        c = [int(color1[i] * (1 - alpha) + color2[i] * alpha) for i in range(3)]
        bg[y, :] = c
    return bg

def draw_header(frame, title, subtitle):
    # Glass top bar
    cv2.rectangle(frame, (0, 0), (WIDTH, 70), (14, 19, 31), -1)
    cv2.line(frame, (0, 70), (WIDTH, 70), (56, 189, 248), 2)
    # Title
    cv2.putText(frame, "AegisAI | " + title, (30, 42),
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, (248, 250, 252), 2)
    cv2.putText(frame, subtitle, (30, 62),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1)
    # Status
    cv2.putText(frame, "● LIVE DEMO FEED", (WIDTH - 220, 44),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (16, 185, 129), 2)

def generate_demo():
    print("[DemoGenerator] Compiling High-Definition Platform Presentation Video...")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(OUTPUT_VIDEO), fourcc, FPS, (WIDTH, HEIGHT))

    total_duration_sec = 25  # Crisp 25-second overview reel

    # ── SCENE 1: TITLE SLIDE (3 sec) ──
    for f in range(FPS * 3):
        frame = create_gradient_bg(WIDTH, HEIGHT, (22, 32, 54), (7, 9, 14))
        # Glow badge
        cv2.rectangle(frame, (WIDTH//2 - 250, 180), (WIDTH//2 + 250, 420), (18, 24, 38), -1)
        cv2.rectangle(frame, (WIDTH//2 - 250, 180), (WIDTH//2 + 250, 420), (56, 189, 248), 2)
        
        cv2.putText(frame, "AegisAI THREAT DEFENSE", (WIDTH//2 - 220, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, (56, 189, 248), 3)
        cv2.putText(frame, "AI Video Threat Recognition Platform", (WIDTH//2 - 200, 290),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.68, (248, 250, 252), 2)
        cv2.putText(frame, "Keep the Cameras. Add Intelligence. Keep Humans in Control.", (WIDTH//2 - 225, 340),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (148, 163, 184), 1)
        cv2.putText(frame, "Detect -> Verify -> Alert (No Facial Scan Mandated)", (WIDTH//2 - 190, 380),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.52, (16, 185, 129), 2)
        out.write(frame)

    # ── SCENE 2: SYSTEM HUB & TELEMETRY (4 sec) ──
    for f in range(FPS * 4):
        frame = create_gradient_bg(WIDTH, HEIGHT)
        draw_header(frame, "System Telemetry & Vision Hub", "Real-Time AI Sensors & Known Identities Index")
        
        # 4 Stat Cards
        stats = [
            ("51 Identities", "Known Database", (56, 189, 248)),
            ("ACTIVE", "128D Deep L2 Index", (16, 185, 129)),
            ("ONLINE", "YOLOv8 + Optical Flow", (99, 102, 241)),
            ("4 STREAMS", "Multi-Camera Grid", (245, 158, 11))
        ]
        for i, (val, lbl, col) in enumerate(stats):
            x = 40 + i * 300
            cv2.rectangle(frame, (x, 100), (x + 280, 200), (18, 24, 38), -1)
            cv2.rectangle(frame, (x, 100), (x + 280, 200), col, 1)
            cv2.putText(frame, val, (x + 20, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)
            cv2.putText(frame, lbl, (x + 20, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (148, 163, 184), 1)

        # Feature showcase panel
        cv2.rectangle(frame, (40, 230), (1240, 680), (14, 19, 31), -1)
        cv2.rectangle(frame, (40, 230), (1240, 680), (255, 255, 255), 1)
        cv2.putText(frame, "SURVEILLANCE MODULES & CAPABILITIES", (60, 270),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (56, 189, 248), 2)
        
        modules = [
            "1. Visible Weapon & Handheld Object Detection (YOLOv8 DNN)",
            "2. Physical Fight & Altercation Kinematics (Farneback Optical Flow)",
            "3. Geofencing Perimeter Intrusion (Polygon Geofence)",
            "4. Fall & Person Down Posture Analytics (Aspect Ratio & Ground-Plane)",
            "5. Loitering Dwell-Time Tracking (Euclidean Centroid)",
            "6. Crowd Surge & Rapid Dispersal Monitoring (Spatial Density)"
        ]
        for idx, mod in enumerate(modules):
            cv2.putText(frame, mod, (70, 320 + idx * 55),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.58, (241, 245, 249), 1)
            cv2.circle(frame, (55, 315 + idx * 55), 5, (16, 185, 129), -1)
        out.write(frame)

    # ── SCENE 3: LIVE SOC THREAT TRIAGE (6 sec) ──
    for f in range(FPS * 6):
        frame = create_gradient_bg(WIDTH, HEIGHT)
        draw_header(frame, "SOC Video Threat Recognition", "Camera 27 - North Corridor / Main Entrance")
        
        # Left Video Stream Window
        cv2.rectangle(frame, (40, 90), (780, 580), (0, 0, 0), -1)
        cv2.rectangle(frame, (40, 90), (780, 580), (56, 189, 248), 2)
        
        # Simulated Corridor Scene
        cv2.rectangle(frame, (120, 160), (700, 540), (20, 25, 35), -1)
        cv2.rectangle(frame, (260, 240), (560, 500), (12, 15, 22), -1)
        
        # Restricted Zone Polygon Overlay (Red transparent)
        poly = np.array([[500, 200], [750, 200], [750, 520], [500, 520]], np.int32)
        cv2.polylines(frame, [poly], True, (0, 0, 255), 2)
        cv2.putText(frame, "RESTRICTED ZONE (KEEP OUT)", (510, 225),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)

        # Person Bounding Box & Weapon Detection
        cv2.rectangle(frame, (320, 220), (460, 490), (0, 220, 50), 2)
        cv2.putText(frame, "Person #1", (320, 212), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 50), 2)
        
        # Weapon Bounding Box (Red Alert)
        cv2.rectangle(frame, (420, 310), (480, 380), (0, 0, 255), 2)
        cv2.putText(frame, "WEAPON 94%", (400, 302), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # HUD Top Banner
        cv2.rectangle(frame, (40, 90), (780, 130), (14, 19, 31), -1)
        cv2.putText(frame, "AI SAFETY LAYER | Camera 27", (55, 118),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (56, 189, 248), 1)
        cv2.putText(frame, "ALERT: VISIBLE WEAPON", (520, 118),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 244), 2)

        # Right Human Verification Queue
        cv2.rectangle(frame, (810, 90), (1240, 680), (18, 24, 38), -1)
        cv2.rectangle(frame, (810, 90), (1240, 680), (255, 255, 255), 1)
        cv2.putText(frame, "HUMAN VERIFICATION QUEUE", (830, 125),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (248, 250, 252), 2)
        
        # Incident Card
        cv2.rectangle(frame, (825, 150), (1225, 330), (10, 14, 23), -1)
        cv2.rectangle(frame, (825, 150), (1225, 330), (244, 63, 94), 1)
        cv2.putText(frame, "🚨 Visible Weapon Detected", (840, 180),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.58, (244, 63, 94), 2)
        cv2.putText(frame, "Camera: Camera 27 (Main Entrance)", (840, 210),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (203, 213, 225), 1)
        cv2.putText(frame, "Confidence: 94% | Pending Review", (840, 235),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (251, 191, 36), 1)
        cv2.putText(frame, "Evidence: 10s MP4 Clip + Snapshot", (840, 260),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (56, 189, 248), 1)
        
        # Verification Buttons
        cv2.rectangle(frame, (840, 280), (1000, 315), (225, 29, 72), -1)
        cv2.putText(frame, "Verify & Escalate", (850, 302), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        cv2.rectangle(frame, (1020, 280), (1140, 315), (51, 65, 85), -1)
        cv2.putText(frame, "10s Clip", (1045, 302), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        
        # Bottom Controls
        cv2.rectangle(frame, (40, 600), (780, 680), (18, 24, 38), -1)
        cv2.putText(frame, "Automated Notification Rails: Teams / Slack Webhook, SMTP Email & SMS Dispatch",
                    (60, 645), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1)
        out.write(frame)

    # ── SCENE 4: 4-UP MULTI-CAMERA SURVEILLANCE WALL (6 sec) ──
    for f in range(FPS * 6):
        frame = create_gradient_bg(WIDTH, HEIGHT)
        draw_header(frame, "Multi-Camera Surveillance Wall", "4-Up Concurrent AI Security Grid")
        
        cams = [
            ("CAM 01: Main Entrance", (40, 90, 580, 270), (56, 189, 248)),
            ("CAM 02: North Corridor", (660, 90, 580, 270), (99, 102, 241)),
            ("CAM 03: East Parking Lot", (40, 380, 580, 270), (2, 132, 199)),
            ("CAM 04: Restricted Vault", (660, 380, 580, 270), (217, 119, 6))
        ]
        for name, (x, y, w, h), col in cams:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 0), -1)
            cv2.rectangle(frame, (x, y), (x + w, y + h), col, 2)
            # Top header bar
            cv2.rectangle(frame, (x, y), (x + w, y + 35), (14, 19, 31), -1)
            cv2.putText(frame, name, (x + 15, y + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
            cv2.putText(frame, "● SENSOR ACTIVE", (x + w - 160, y + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (16, 185, 129), 1)
            # Simulated visual scene
            cv2.line(frame, (x + 30, y + h - 30), (x + w - 30, y + h - 30), (40, 50, 60), 1)
            cv2.putText(frame, "YOLOv8 Neural Inference @ 30 FPS", (x + 30, y + h - 45),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 116, 139), 1)
        out.write(frame)

    # ── SCENE 5: SUMMARY & PILOT ROADMAP (6 sec) ──
    for f in range(FPS * 6):
        frame = create_gradient_bg(WIDTH, HEIGHT, (22, 32, 54), (7, 9, 14))
        draw_header(frame, "Pilot Plan & Commercial Architecture", "60-90 Day Pilot Validation Roadmap")
        
        # 3 Value Pillars
        pillars = [
            ("Keep Existing Cameras", "No expensive hardware replacement. Sits on top of existing RTSP/ONVIF feeds.", (56, 189, 248)),
            ("Privacy by Design", "No facial recognition mandated by default. Operates purely on spatial safety analytics.", (16, 185, 129)),
            ("Human in the Loop", "AI recommends, trained personnel verify before emergency dispatch.", (245, 158, 11))
        ]
        for i, (title, desc, col) in enumerate(pillars):
            x = 60 + i * 390
            cv2.rectangle(frame, (x, 140), (x + 360, 360), (18, 24, 38), -1)
            cv2.rectangle(frame, (x, 140), (x + 360, 360), col, 2)
            cv2.putText(frame, title, (x + 20, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.65, col, 2)
            # Word wrap desc
            words = desc.split()
            line1 = " ".join(words[:5])
            line2 = " ".join(words[5:10])
            line3 = " ".join(words[10:])
            cv2.putText(frame, line1, (x + 20, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (241, 245, 249), 1)
            cv2.putText(frame, line2, (x + 20, 275), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (241, 245, 249), 1)
            cv2.putText(frame, line3, (x + 20, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (241, 245, 249), 1)

        # Bottom Pilot Targets Box
        cv2.rectangle(frame, (60, 400), (1210, 650), (14, 19, 31), -1)
        cv2.rectangle(frame, (60, 400), (1210, 650), (255, 255, 255), 1)
        cv2.putText(frame, "PROPOSED 60-90 DAY PILOT TARGETS (10-25 CAMERAS)", (90, 445),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (56, 189, 248), 2)
        
        cv2.putText(frame, "• Platform Uptime: 99.9% Target", (100, 495), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        cv2.putText(frame, "• Camera Compatibility: 90%+ RTSP/ONVIF", (100, 540), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        cv2.putText(frame, "• Alert Delivery Latency: <= 5 Seconds", (100, 585), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        cv2.putText(frame, "• Illustrative Pricing: $10 - $30 per camera / month", (100, 630), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (16, 185, 129), 2)

        out.write(frame)

    out.release()
    print(f"[DemoGenerator] Demo Video Successfully Rendered: {OUTPUT_VIDEO}")

if __name__ == "__main__":
    generate_demo()
