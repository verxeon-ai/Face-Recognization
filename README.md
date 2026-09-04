# AegisAI — Video Threat Defense

Real-time facial recognition and video threat detection platform.

**Backend:** Flask + OpenCV (YuNet/SFace) + YOLOv8  
**Frontend:** Next.js + React + TypeScript

---

## Features

- Live webcam face recognition
- Phone camera streaming (HTTPS QR handshake)
- Image / video upload analysis
- SOC threat triage (6 detection modules + human verification)
- Multi-camera wall
- Identity enrollment with background retraining

---

## Project structure

```
app.py                 # Flask API, MJPEG streams, HTTPS phone proxy
recognition_engine.py  # YuNet + SFace recognition
threat_engine.py       # Threat analytics + incidents
alert_dispatcher.py    # Webhook / email / SMS dispatch
dataset_setup.py       # LFW dataset prep
train_encodings.py     # Build face embeddings
frontend/              # Next.js UI (active frontend)
models/                # ONNX face models
data/                  # Encodings, rules, logs
dataset/               # Known person images
```

---

## Setup

### Backend

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python dataset_setup.py           # first time only
python train_encodings.py         # first time only
python app.py                     # API :5001, phone HTTPS :5443
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # UI :3000
```

Or use `./start_dev.sh` to launch both.

Open: [http://localhost:3000](http://localhost:3000)

---

## Main UI routes

| Route | Page |
|-------|------|
| `/` | System Hub |
| `/soc` | SOC Threat Triage |
| `/multi-camera` | Multi-Camera Wall |
| `/live-face` | Live Face Cam |
| `/mobile-streamer` | Phone QR streamer |
| `/mobile-cam` | Phone capture (HTTPS) |
| `/image-triage` | Image analysis |
| `/video-scanner` | Video analysis |
| `/audit-trail` | Alert log |
| `/persons` | Known identities |

---

## Phone camera

1. Open `/mobile-streamer` on the laptop
2. Scan the QR code (`https://<LAN-IP>:5443/mobile-cam`)
3. Accept the certificate warning once
4. Tap **Allow Camera**

Phone and laptop must be on the same Wi‑Fi.

---

## Core API (Flask)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/threat_status` | GET | Live threat HUD |
| `/api/incidents` | GET | Incident packages |
| `/api/verify_incident` | POST | Verify / dismiss |
| `/api/stats` | GET | Model / identity stats |
| `/api/alerts` | GET | Face alert log |
| `/threat_video_feed` | GET | Threat MJPEG |
| `/video_feed` | GET | Face MJPEG |
| `/phone_stream` | GET | Phone MJPEG |
| `/upload_image` | POST | Image analysis |
| `/upload_video` | POST | Video analysis job |
| `/add_person` | POST | Enroll identity |

---

## Troubleshooting

- **No embeddings:** run `python train_encodings.py`
- **Missing ONNX models:** check `models/`
- **Camera busy:** close Zoom/Teams/etc.
- **Phone blocked:** use the HTTPS QR link and allow camera
