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

Role passwords (set in project-root `.env`, see `.env.example`):

| Role | Default password |
|------|------------------|
| Admin | `admin123` |
| Security Operator | `operator123` |

Switch roles from the navbar **Role** menu — each switch asks for that role’s password.

### Frontend

```bash
cd frontend
npm install
npm run dev                       # UI :3000
```

Or use `./start_dev.sh` to launch both.

Open: [http://localhost:3000](http://localhost:3000)

---

## Deploy on AWS (webcam / phone camera)

EC2 has no USB webcam. Use **phone camera over HTTPS** (ALB + ACM).

Full guide: [docs/AWS_DEPLOY.md](docs/AWS_DEPLOY.md)

Quick path:

```bash
# On Ubuntu EC2 after copying the project
sudo bash deploy/ec2-bootstrap.sh
cp deploy/env.aws.example .env.aws   # set PUBLIC_BASE_URL=https://your-domain
docker compose --env-file .env.aws up -d --build
```

Then put an **Application Load Balancer** with an **ACM HTTPS certificate** in front of instance port 80. Phone QR becomes `https://your-domain/mobile-cam`.

---

## Main UI routes

| Route | Page |
|-------|------|
| `/` | Redirects to SOC |
| `/soc` | SOC Threat Triage |
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
