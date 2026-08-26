"""
Flask Web Application - Video Threat Recognition & Security Platform
=====================================================================
Modules:
- Real-time Threat Detections: Weapons, Altercations, Zone Intrusions, Falls, Loitering, Crowd Surges
- Human Verification Workflow and Incident Triage
- Rules & Zone Configuration Engine
- SFace Deep Face Recognition & Identity Verification Layer
- Live Camera Feeds, Mobile Browser Streaming (QR Code), IP Camera Integration
- Media Batch Upload Analysis (Images and Videos)
- Security Audit Logging
"""

import os
import uuid
import json
import cv2
import base64
import socket
import threading
import time
import numpy as np
from pathlib import Path
from datetime import datetime
from flask import (Flask, render_template, request, jsonify, Response,
                   send_from_directory)
from werkzeug.utils import secure_filename

from recognition_engine import FaceRecognitionEngine
from threat_engine import V1ThreatDetectionEngine

# ─────────────────────────── Configuration ──────────────────────────── #
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "vision_security_secret_key_prod")
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB max upload

UPLOAD_FOLDER = Path("uploads")
RESULTS_FOLDER = Path("results")
SNAPSHOTS_DIR = Path("results/incident_snapshots")
UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXT = {"jpg", "jpeg", "png", "bmp", "gif", "webp"}
ALLOWED_VIDEO_EXT = {"mp4", "avi", "mov", "mkv", "webm", "flv"}

# ─────────────────────────── Engines Init ────────────────────────────── #
print("[App] Initializing SFace Face Recognition Engine...")
face_engine = FaceRecognitionEngine()

print("[App] Initializing V1 Video Threat Recognition Engine...")
threat_engine = V1ThreatDetectionEngine(face_engine=face_engine)
print("[App] All Threat & AI Vision Engines Ready!")

# ─────────────────────── Camera Stream State ────────────────────────── #
camera_lock = threading.Lock()
active_camera = None
camera_source = "webcam"
phone_stream_url = ""

# Buffers for Phone stream (via QR scan mobile web page)
phone_frame_lock = threading.Lock()
latest_phone_frame = None
latest_phone_time = 0

latest_threat_hud = {}


def get_local_ip():
    """Detect local Wi-Fi / LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


def get_camera(source="webcam", url=None):
    """Initialize camera capture (PC webcam or IP app stream)."""
    global active_camera, camera_source, phone_stream_url
    with camera_lock:
        if active_camera is not None:
            active_camera.release()
            active_camera = None

        if source == "phone" and url:
            phone_stream_url = url
            camera_source = "phone"
            active_camera = cv2.VideoCapture(url)
        else:
            camera_source = "webcam"
            active_camera = cv2.VideoCapture(0)

        return active_camera is not None and active_camera.isOpened()


def release_camera():
    """Release active camera."""
    global active_camera
    with camera_lock:
        if active_camera is not None:
            active_camera.release()
            active_camera = None


def generate_threat_stream():
    """Generator function for V1 AI Video Threat Recognition MJPEG stream."""
    global active_camera, latest_threat_hud

    while True:
        with camera_lock:
            cam = active_camera

        if cam is None or not cam.isOpened():
            # Try to auto-open default camera
            get_camera("webcam")
            with camera_lock:
                cam = active_camera

        if cam is None or not cam.isOpened():
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder, "AI Threat Engine: Waiting for camera...",
                        (80, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (160, 200, 255), 2)
            _, buffer = cv2.imencode(".jpg", placeholder)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                   + buffer.tobytes() + b"\r\n")
            time.sleep(0.2)
            continue

        with camera_lock:
            ret, frame = cam.read()

        if not ret or frame is None:
            time.sleep(0.04)
            continue

        # Run V1 Threat Recognition Engine (All 6 Detections)
        annotated, threats, hud_data = threat_engine.process_threat_frame(frame)
        latest_threat_hud = hud_data

        _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
               + buffer.tobytes() + b"\r\n")
        time.sleep(0.03)


def generate_face_stream():
    """Generator function for Face Recognition MJPEG stream."""
    global active_camera

    while True:
        with camera_lock:
            cam = active_camera

        if cam is None or not cam.isOpened():
            get_camera("webcam")
            with camera_lock:
                cam = active_camera

        if cam is None or not cam.isOpened():
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder, "Camera not active. Click 'Start Camera'",
                        (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
            _, buffer = cv2.imencode(".jpg", placeholder)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                   + buffer.tobytes() + b"\r\n")
            time.sleep(0.2)
            continue

        with camera_lock:
            ret, frame = cam.read()

        if not ret or frame is None:
            time.sleep(0.04)
            continue

        annotated, recognized, unknowns = face_engine.process_frame(frame)

        _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
               + buffer.tobytes() + b"\r\n")
        time.sleep(0.03)


def generate_phone_frames():
    """Generator function for QR Phone Stream."""
    global latest_phone_frame, latest_phone_time

    while True:
        with phone_frame_lock:
            frame = latest_phone_frame
            ts = latest_phone_time

        if frame is None or (time.time() - ts > 3.0):
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder, "Scan QR Code with Phone to Connect",
                        (60, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (160, 150, 254), 2)
            cv2.putText(placeholder, "Waiting for mobile camera...",
                        (140, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (120, 120, 120), 1)
            _, buffer = cv2.imencode(".jpg", placeholder)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                   + buffer.tobytes() + b"\r\n")
            time.sleep(0.2)
            continue

        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
               + buffer.tobytes() + b"\r\n")
        time.sleep(0.04)


# ═══════════════════════════ ROUTES ════════════════════════════════════ #

@app.route("/")
def index():
    """Home dashboard."""
    stats = face_engine.get_stats()
    local_ip = get_local_ip()
    return render_template("index.html", stats=stats, local_ip=local_ip)


@app.route("/threat_dashboard")
def threat_dashboard():
    """V1 AI Video Threat Recognition SOC Dashboard (Page 3 & 4 of PDF)."""
    incidents = threat_engine.get_incidents()
    rules = threat_engine.rules
    return render_template("threat_dashboard.html", incidents=incidents, rules=rules)


@app.route("/threat_video_feed")
def threat_video_feed():
    """MJPEG stream with V1 Threat Engine HUD."""
    return Response(
        generate_threat_stream(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/api/threat_status")
def api_threat_status():
    """Live threat status JSON endpoint for frontend SOC dashboard."""
    global latest_threat_hud
    return jsonify(latest_threat_hud)


@app.route("/api/incidents")
def api_incidents():
    """Return all structured Incident Packages for human verification."""
    return jsonify(threat_engine.get_incidents())


@app.route("/api/verify_incident", methods=["POST"])
def api_verify_incident():
    """
    Human Verification Action endpoint (Page 3 of PDF):
    Escalate / False Alarm / Dismiss / Resolve
    """
    data = request.get_json() or {}
    inc_id = data.get("incident_id")
    action = data.get("action", "VERIFIED")
    notes = data.get("notes", "")

    result = threat_engine.verify_incident(inc_id, action, notes)
    return jsonify(result)


@app.route("/api/update_rules", methods=["POST"])
def api_update_rules():
    """Update detection rules and threshold sliders."""
    data = request.get_json() or {}
    updated = threat_engine.update_rules(data)
    return jsonify({"success": True, "rules": updated})


@app.route("/results/incident_snapshots/<path:filename>")
def serve_snapshot(filename):
    """Serve threat incident snapshot files."""
    return send_from_directory(SNAPSHOTS_DIR, filename)


# ───────────────────── Face Recognition & Live Cam ───────────────────── #

@app.route("/live")
def live():
    """Live webcam recognition page."""
    return render_template("live.html")


@app.route("/phone_camera")
def phone_camera():
    """Two-way QR code phone camera page."""
    local_ip = get_local_ip()
    return render_template("phone_camera.html", local_ip=local_ip)


@app.route("/mobile_cam")
def mobile_cam():
    """Mobile page opened when scanning QR code on phone."""
    return render_template("mobile_cam.html")


@app.route("/api/stream_phone_frame", methods=["POST"])
def stream_phone_frame():
    """API endpoint called by phone browser (QR code streamer)."""
    global latest_phone_frame, latest_phone_time

    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image data"}), 400

    try:
        img_str = data["image"].split(",")[-1]
        img_bytes = base64.b64decode(img_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Decode error"}), 400

        # Process frame with SFace
        annotated, recognized, unknowns = face_engine.process_frame(frame)

        with phone_frame_lock:
            latest_phone_frame = annotated
            latest_phone_time = time.time()

        return jsonify({
            "success": True,
            "recognized": recognized,
            "unknowns": len(unknowns)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/start_camera", methods=["POST"])
def start_camera():
    """Start camera feed."""
    data = request.get_json() or {}
    source = data.get("source", "webcam")
    url = data.get("url", "")
    success = get_camera(source=source, url=url if source == "phone" else None)
    return jsonify({
        "success": success,
        "message": "Camera started" if success else "Failed to open camera"
    })


@app.route("/stop_camera", methods=["POST"])
def stop_camera():
    """Stop active camera."""
    release_camera()
    return jsonify({"success": True, "message": "Camera stopped"})


@app.route("/video_feed")
def video_feed():
    """MJPEG stream for face recognition."""
    return Response(
        generate_face_stream(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/phone_video_feed")
def phone_video_feed():
    """MJPEG stream for QR-connected Phone camera."""
    return Response(
        generate_phone_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/recognition_status")
def recognition_status():
    """Return live recognition status."""
    alerts = face_engine.get_alerts(limit=5)
    return jsonify({
        "recent_alerts": alerts
    })


# ────────────────────── Upload Image & Video ────────────────────────── #

@app.route("/upload_image", methods=["GET"])
def upload_image_page():
    return render_template("upload_image.html")


@app.route("/upload_image", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400

    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    upload_path = UPLOAD_FOLDER / filename
    file.save(upload_path)

    annotated_frame, results = face_engine.process_image_file(upload_path)
    if annotated_frame is None:
        return jsonify({"error": "Could not process image"}), 500

    result_filename = f"result_{filename}"
    result_path = RESULTS_FOLDER / result_filename
    cv2.imwrite(str(result_path), annotated_frame)

    with open(upload_path, "rb") as f:
        original_b64 = base64.b64encode(f.read()).decode()

    _, buf = cv2.imencode(".jpg", annotated_frame)
    result_b64 = base64.b64encode(buf.tobytes()).decode()

    return jsonify({
        "success": True,
        "original_image": f"data:image/jpeg;base64,{original_b64}",
        "result_image": f"data:image/jpeg;base64,{result_b64}",
        "results": results,
        "alert": results.get("alert", False)
    })


@app.route("/upload_video", methods=["GET"])
def upload_video_page():
    return render_template("upload_video.html")


video_progress = {}


@app.route("/upload_video", methods=["POST"])
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_VIDEO_EXT:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400

    job_id = uuid.uuid4().hex
    filename = f"{job_id}_{secure_filename(file.filename)}"
    upload_path = UPLOAD_FOLDER / filename
    file.save(upload_path)

    output_filename = f"output_{job_id}.mp4"
    output_path = RESULTS_FOLDER / output_filename
    video_progress[job_id] = {"progress": 0, "status": "processing", "results": None}

    def process_video_bg():
        def progress_cb(p):
            video_progress[job_id]["progress"] = p

        results = face_engine.process_video_file(upload_path, output_path, progress_cb)
        video_progress[job_id]["progress"] = 100
        video_progress[job_id]["status"] = "done"
        video_progress[job_id]["results"] = results
        video_progress[job_id]["output_filename"] = output_filename

    threading.Thread(target=process_video_bg, daemon=True).start()
    return jsonify({"success": True, "job_id": job_id})


@app.route("/video_progress/<job_id>")
def get_video_progress(job_id):
    info = video_progress.get(job_id, {"progress": 0, "status": "not_found"})
    return jsonify(info)


@app.route("/results/<filename>")
def serve_result(filename):
    return send_from_directory(RESULTS_FOLDER, filename)


# ──────────────────────── Alerts & Management ───────────────────────── #

@app.route("/alerts")
def alerts_page():
    recent_alerts = face_engine.get_alerts(limit=50)
    return render_template("alerts.html", alerts=recent_alerts)


@app.route("/api/alerts")
def api_alerts():
    return jsonify(face_engine.get_alerts(limit=50))


@app.route("/api/stats")
def api_stats():
    return jsonify(face_engine.get_stats())


@app.route("/persons")
def persons_page():
    stats = face_engine.get_stats()
    return render_template("persons.html", stats=stats)


@app.route("/add_person", methods=["GET"])
def add_person_page():
    return render_template("add_person.html")


@app.route("/add_person", methods=["POST"])
def add_person():
    name = request.form.get("name", "").strip()
    if not name:
        return jsonify({"error": "Person name is required"}), 400

    files = request.files.getlist("images")
    if not files or len(files) == 0:
        return jsonify({"error": "At least one image is required"}), 400

    dir_name = name.replace(" ", "_")
    person_dir = Path("dataset/known_persons") / dir_name
    person_dir.mkdir(parents=True, exist_ok=True)

    saved = 0
    for i, file in enumerate(files):
        if file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext in ALLOWED_IMAGE_EXT:
                save_path = person_dir / f"{dir_name}_{i:04d}_{int(time.time())}.{ext}"
                file.save(save_path)
                saved += 1

    if saved == 0:
        return jsonify({"error": "No valid images saved"}), 400

    def retrain_async():
        import subprocess
        import sys
        print(f"[App] Retraining SFace Deep Model with new person: {name}...")
        subprocess.run([sys.executable, "train_encodings.py"], capture_output=True)
        face_engine.reload_model()
        print(f"[App] SFace retraining completed! Loaded {len(face_engine.known_names)} persons.")

    threading.Thread(target=retrain_async, daemon=True).start()

    return jsonify({
        "success": True,
        "message": f"Successfully added '{name}' with {saved} photo(s). Deep Learning model retrained in background!",
        "name": name,
        "images_saved": saved
    })


# ─────────────────────── Run Server ─────────────────────────────────── #
if __name__ == "__main__":
    local_ip = get_local_ip()
    print("\n" + "=" * 65)
    print("  Video Threat Recognition & Security Monitoring Platform")
    print(f"  Threat Detections: Active (Weapon, Altercation, Zone, Fall, Loiter, Crowd)")
    print(f"  Face Recognition:  {len(face_engine.known_names)} Identities Loaded")
    print(f"  SOC Dashboard:     http://localhost:5000/threat_dashboard")
    print(f"  Main Portal:       http://localhost:5000")
    print(f"  Network Endpoint:  http://{local_ip}:5000")
    print("=" * 65 + "\n")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        threaded=True
    )
