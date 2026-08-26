"""
Face Recognition Engine - Powered by OpenCV SFace Deep Neural Network
========================================================================
- OpenCV YuNet DNN: Ultra-accurate face detection & 5-point landmark alignment
- OpenCV SFace DNN: 128-Dimensional Deep Feature Extraction
- Cosine Distance Metric matching (Benchmark threshold: 0.363)
- Real-time video processing, phone camera streaming & instant security alerts
"""

import os
import time
import pickle
import numpy as np
import cv2
import json
from pathlib import Path
from datetime import datetime
from threading import Lock

ENCODINGS_FILE = Path("data/face_encodings.pkl")
METADATA_FILE = Path("data/metadata.json")
ALERTS_LOG = Path("data/alerts_log.json")
YUNET_MODEL = Path("models/face_detection_yunet_2023mar.onnx")
SFACE_MODEL = Path("models/face_recognition_sface_2021dec.onnx")

# Standard OpenCV SFace Cosine Distance Threshold
# Scores >= 0.363 are true identity matches; < 0.363 are strictly UNKNOWN
COSINE_MATCH_THRESHOLD = 0.363


class FaceRecognitionEngine:
    """
    High-Precision Deep Learning Face Recognition Engine.
    Uses YuNet for face alignment and SFace for 128D deep feature matching.
    """

    def __init__(self):
        self.known_embeddings = None   # Matrix of shape (N, 128)
        self.known_names = []          # List of person names
        self.metadata = {}
        self.alerts = []
        self.lock = Lock()
        self.model_loaded = False
        self.last_alert_time = 0

        # Initialize Deep Learning Models
        self._init_models()

        # Load trained embeddings & data
        self._load_model()
        self._load_metadata()
        self._load_alerts()

    def _init_models(self):
        """Initialize YuNet Detector and SFace Recognizer."""
        self.yunet = None
        self.sface = None

        if YUNET_MODEL.exists() and SFACE_MODEL.exists():
            try:
                self.yunet = cv2.FaceDetectorYN.create(
                    str(YUNET_MODEL), "", (320, 320), 0.5, 0.3, 5000
                )
                self.sface = cv2.FaceRecognizerSF.create(str(SFACE_MODEL), "")
                print("[Engine] + YuNet Face Detector + SFace Deep Recognizer Initialized!")
            except Exception as e:
                print(f"[Engine] ! Error initializing DNN models: {e}")
        else:
            print("[Engine] ! ONNX model files missing in models/ directory.")

        # Fallback Haar Cascade
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    def _load_model(self):
        """Load trained 128D SFace embeddings from pickle file."""
        if ENCODINGS_FILE.exists():
            try:
                with open(ENCODINGS_FILE, "rb") as f:
                    data = pickle.load(f)
                self.known_embeddings = data.get("embeddings")
                self.known_names = data.get("names", [])
                self.model_loaded = (
                    self.known_embeddings is not None and
                    len(self.known_embeddings) > 0 and
                    len(self.known_names) > 0
                )
                if self.model_loaded:
                    print(f"[Engine] + Model loaded: {len(self.known_names)} persons with 128D Deep Embeddings")
            except Exception as e:
                print(f"[Engine] ! Error loading embeddings: {e}")
                self.model_loaded = False
        else:
            print(f"[Engine] ! No embeddings file found at {ENCODINGS_FILE}. Run train_encodings.py")
            self.model_loaded = False

    def _load_metadata(self):
        """Load metadata."""
        if METADATA_FILE.exists():
            try:
                with open(METADATA_FILE, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception:
                self.metadata = {"total_persons": 0, "persons": []}
        else:
            self.metadata = {"total_persons": 0, "persons": []}

    def _load_alerts(self):
        """Load alerts log."""
        if ALERTS_LOG.exists():
            try:
                with open(ALERTS_LOG, "r", encoding="utf-8") as f:
                    self.alerts = json.load(f)
            except Exception:
                self.alerts = []
        else:
            self.alerts = []

    def reload_model(self):
        """Reload embeddings after adding a new person."""
        with self.lock:
            self._load_model()
            self._load_metadata()
        print("[Engine] + Model reloaded with updated persons list.")

    def match_face(self, face_feat):
        """
        Compare 128D face feature against all known persons using Cosine Similarity.
        Returns: (name, confidence_percent, cosine_score)
        """
        if not self.model_loaded or self.known_embeddings is None or face_feat is None:
            return "Unknown", 0, 0.0

        try:
            feat_norm = face_feat / (np.linalg.norm(face_feat) + 1e-7)
            # Dot product with normalized embeddings gives Cosine Similarity
            scores = np.dot(self.known_embeddings, feat_norm.flatten())

            best_idx = int(np.argmax(scores))
            best_score = float(scores[best_idx])

            if best_score >= COSINE_MATCH_THRESHOLD:
                name = self.known_names[best_idx]
                confidence = min(99, max(55, int(best_score * 100)))
                return name, confidence, best_score
            else:
                confidence = int(best_score * 100)
                return "Unknown", confidence, best_score
        except Exception:
            return "Unknown", 0, 0.0

    def process_frame(self, frame):
        """
        Process a single image/video frame:
        Detects faces via YuNet, aligns landmarks, computes SFace deep embeddings,
        matches against database, draws bounding boxes, and handles alerts.
        """
        if frame is None or frame.size == 0:
            return None, [], []

        annotated = frame.copy()
        h, w = frame.shape[:2]
        recognized = []
        unknowns = []

        if self.yunet is not None and self.sface is not None:
            self.yunet.setInputSize((w, h))
            _, faces = self.yunet.detect(frame)

            if faces is not None and len(faces) > 0:
                for f in faces:
                    box = f[0:4].astype(int)
                    bx, by, bw, bh = box
                    bx, by = max(0, bx), max(0, by)
                    bw, bh = min(w - bx, bw), min(h - by, bh)

                    if bw < 18 or bh < 18:
                        continue

                    # Deep alignment and feature extraction
                    try:
                        aligned = self.sface.alignCrop(frame, f)
                        feat = self.sface.feature(aligned)
                        name, confidence, score = self.match_face(feat)
                    except Exception:
                        name, confidence, score = "Unknown", 0, 0.0

                    if name == "Unknown":
                        color = (0, 0, 240)   # Red
                        label = "UNKNOWN (ALERT!)"
                        unknowns.append({"time": datetime.now().isoformat(), "confidence": confidence})
                        self._log_alert("Unknown person detected in camera view", confidence=confidence)
                    else:
                        color = (0, 220, 50)  # Green
                        label = f"{name} ({confidence}%)"
                        recognized.append({"name": name, "confidence": confidence, "score": score})

                    # Draw bounding box
                    cv2.rectangle(annotated, (bx, by), (bx + bw, by + bh), color, 2)

                    # Draw text banner
                    (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                    cv2.rectangle(annotated, (bx, by - lh - 10), (bx + lw + 8, by), color, -1)
                    cv2.putText(annotated, label, (bx + 4, by - 4),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

        # Status HUD Overlay
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(annotated, ts, (10, annotated.shape[0] - 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

        total_faces = len(recognized) + len(unknowns)
        hud_text = f"Faces: {total_faces} | Recognized: {len(recognized)} | Unknown: {len(unknowns)}"
        cv2.putText(annotated, hud_text, (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 255), 2)

        return annotated, recognized, unknowns

    def process_image_file(self, image_path):
        """Process an uploaded photo file."""
        frame = cv2.imread(str(image_path))
        if frame is None:
            return None, {"error": "Could not read image"}

        annotated, recognized, unknowns = self.process_frame(frame)
        results = {
            "total_faces": len(recognized) + len(unknowns),
            "recognized_persons": recognized,
            "unknown_persons": len(unknowns),
            "all_in_dataset": len(unknowns) == 0,
            "alert": len(unknowns) > 0
        }
        return annotated, results

    def process_video_file(self, video_path, output_path, progress_callback=None):
        """Process an uploaded video file frame by frame."""
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return {"error": "Could not open video"}

        fps = max(1, int(cap.get(cv2.CAP_PROP_FPS)) or 25)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

        all_recognized = set()
        all_unknown_frames = 0
        frame_count = 0
        process_every = max(1, fps // 2)

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1

            if frame_count % process_every == 0:
                annotated, recognized, unknowns = self.process_frame(frame.copy())
                for r in recognized:
                    all_recognized.add(r["name"])
                if unknowns:
                    all_unknown_frames += 1
                out.write(annotated)
            else:
                out.write(frame)

            if progress_callback and total_frames > 0 and frame_count % 30 == 0:
                progress_callback(int((frame_count / total_frames) * 100))

        cap.release()
        out.release()

        return {
            "total_frames": frame_count,
            "recognized_persons": list(all_recognized),
            "frames_with_unknowns": all_unknown_frames,
            "all_in_dataset": all_unknown_frames == 0,
            "alert": all_unknown_frames > 0
        }

    def _log_alert(self, message, confidence=0):
        """Log an alert with cooldown rate-limiting."""
        now = time.time()
        if now - self.last_alert_time < 3.0:
            return

        self.last_alert_time = now
        alert = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "message": message,
            "confidence": confidence,
            "distance": 1.0 - (confidence / 100.0) if confidence else 1.0
        }
        self.alerts.append(alert)
        self.alerts = self.alerts[-100:]

        os.makedirs("data", exist_ok=True)
        try:
            with open(ALERTS_LOG, "w", encoding="utf-8") as f:
                json.dump(self.alerts, f, indent=2)
        except Exception:
            pass

    def get_alerts(self, limit=50):
        """Return recent alerts."""
        return self.alerts[-limit:][::-1]

    def get_stats(self):
        """Return system statistics."""
        return {
            "total_persons": len(self.known_names),
            "model": "SFace Deep Neural Network (128D)",
            "threshold": f"{COSINE_MATCH_THRESHOLD} Cosine Similarity",
            "encodings_loaded": self.model_loaded,
            "model_loaded": self.model_loaded,
            "persons": self.known_names
        }
