# Real-Time Facial Recognition and Video Threat Detection System

> **Dataset:** [Labeled Faces in the Wild (LFW)](http://vis-www.cs.umass.edu/lfw/) - 50+ identities  
> **Computer Vision Models:** OpenCV YuNet DNN (Face Detection) + OpenCV SFace (128D Deep Feature Embeddings) + YOLOv8 Nano (Threat & Spatial Detection)  
> **Framework:** Flask + OpenCV + Ultralytics + scikit-learn  

A production-ready computer vision platform for real-time facial recognition, spatial threat analytics, and automated security incident response.

---

## Features

| Feature | Description |
|---|---|
| **Live Webcam** | Real-time face recognition via PC webcam with instant person identification |
| **Phone Camera** | Connect phone via 2-Way QR Code scan (no app required) or IP camera stream (DroidCam / IP Webcam) |
| **Image Upload** | Upload photos to check if all persons are recognized or trigger unknown alerts |
| **Video Upload** | Analyze entire video files and generate automated frame-by-frame reports |
| **V1 Threat Detection** | Detects weapons, physical altercations, restricted-zone entry, person down, loitering, and crowd surges |
| **Human Verification** | Security Operations Center (SOC) review workflow with incident packages (Verify / False Alarm) |
| **Security Alerts** | Automatic audit logging when unknown persons or threats are detected |
| **Add Persons** | Add new individuals to the database with automated background model retraining |
| **Dashboard** | Real-time system health, known persons catalog, and threat analytics |

---

## Project Structure

```
face_recognition_system/
|-- app.py                  # Main Flask web application
|-- recognition_engine.py   # SFace Deep Face Recognition & YuNet detection engine
|-- threat_engine.py        # V1 AI Video Threat Recognition engine (6 threat detections)
|-- dataset_setup.py        # Downloads LFW dataset, prepares 50+ persons
|-- train_encodings.py      # Extracts 128D SFace deep embeddings for all persons
|-- requirements.txt        # Python dependencies
|-- setup_windows.bat       # Windows setup script
|-- setup_linux.sh          # Linux/Mac setup script
|-- templates/              # HTML UI templates (Bootstrap 5)
|   |-- base.html           # Layout and navbar
|   |-- index.html          # Main dashboard
|   |-- threat_dashboard.html # V1 SOC Threat Recognition dashboard
|   |-- live.html           # Webcam live feed
|   |-- phone_camera.html   # Two-way QR phone camera page
|   |-- mobile_cam.html     # Mobile browser streaming page
|   |-- upload_image.html   # Image upload and analysis
|   |-- upload_video.html   # Video upload and analysis
|   |-- alerts.html         # Alert audit history
|   |-- add_person.html     # Add new person form
|   `-- persons.html        # Known persons catalog
|-- dataset/
|   `-- known_persons/      # Person image folders (LFW dataset)
|       |-- George_W_Bush/
|       |-- Colin_Powell/
|       `-- ...50+ persons
|-- models/                 # Pretrained ONNX deep learning models
|   |-- face_detection_yunet_2023mar.onnx
|   `-- face_recognition_sface_2021dec.onnx
|-- data/
|   |-- face_encodings.pkl  # Trained 128D SFace deep embeddings matrix
|   |-- metadata.json       # Dataset and model metadata
|   |-- alerts_log.json     # Security alert audit log
|   |-- incidents_log.json  # Threat incident packages
|   `-- threat_rules.json   # Configurable detection thresholds
|-- uploads/                # Temporary uploaded files
`-- results/                # Processed output files and incident snapshots
```

---

## Step-by-Step Setup Guide

### Step 1: Prerequisites

Make sure you have:
- Python 3.10, 3.11, 3.12, 3.13, or 3.14
- pip (Python package manager)
- Webcam (built-in or USB)
- Internet connection (for initial dataset and model downloads)

### Step 2: Navigate to Project Folder

```powershell
cd C:\Users\dell\Desktop\computervision\face_recognition_system
```

### Step 3: Install Dependencies

```powershell
pip install flask werkzeug numpy opencv-python opencv-contrib-python Pillow scikit-learn tqdm requests ultralytics torch torchvision
```

### Step 4: Download and Prepare Dataset

```powershell
python dataset_setup.py
```

**What this does:**
- Downloads the LFW (Labeled Faces in the Wild) dataset from UMass
- Selects top 50 persons with the most photos (at least 5 photos each)
- Saves organized images into `dataset/known_persons/`

**Dataset Details:**
- Source: http://vis-www.cs.umass.edu/lfw/
- Persons included: George W. Bush, Colin Powell, Tony Blair, Arnold Schwarzenegger, and 46+ other public figures
- Total images: 2,773+ images

### Step 5: Train the Deep Learning Model

```powershell
python train_encodings.py
```

**What this does:**
- Detects and aligns faces with OpenCV YuNet DNN (5 facial landmarks)
- Extracts 128-dimensional deep feature embeddings using OpenCV SFace DNN
- Saves L2-normalized embedding matrix to `data/face_encodings.pkl`
- Execution time: approximately 15 to 30 seconds

### Step 6: Start the Web Server

```powershell
python app.py
```

**Open your browser:**
```
http://localhost:5000
```
For the V1 Threat SOC Dashboard:
```
http://localhost:5000/threat_dashboard
```

---

## Phone Camera Setup (Two-Way Connection)

To use your smartphone as a camera:

### Method 1: Instant QR Code Scan (Recommended - No App Required)
1. Navigate to `http://localhost:5000/phone_camera` on your computer
2. Open your iPhone or Android default camera app
3. Point your camera at the QR code displayed on the computer screen
4. Tap the detected link to open the Mobile Streamer in Safari or Chrome
5. Allow camera access: the video will stream directly to the computer dashboard

### Method 2: Laptop Scans Phone Screen
1. On the Phone Camera page, select the tab "2. Laptop Scans Phone"
2. Click "Start Laptop QR Scanner"
3. Display your phone's stream URL or QR code in front of the laptop webcam
4. The laptop camera decodes the QR code and connects automatically

### Method 3: IP Webcam / DroidCam App
1. Install **IP Webcam** (Android) or **DroidCam** (iOS / Android)
2. Start the server inside the app
3. Enter the stream URL on the Phone Camera page:
   - IP Webcam format: `http://PHONE_IP:8080/video`
   - DroidCam format: `http://PHONE_IP:4747/video`
4. Click "Connect App Stream"

*Note: The phone and computer must be connected to the same Wi-Fi network.*

---

## Upload Image and Video Analysis

### Upload Image
1. Open the Upload Image page (`/upload_image`)
2. Drag and drop or select a photo (JPG, PNG, BMP, WEBP)
3. Click "Analyze"
4. Output displayed:
   - Annotated image with green boxes (known persons) or red boxes (unknown persons)
   - List of identified individuals with confidence scores
   - Security alert if an unknown person is detected

### Upload Video
1. Open the Upload Video page (`/upload_video`)
2. Select a video file (MP4, AVI, MOV, MKV - maximum 500 MB)
3. Click "Upload & Analyze Video"
4. The system analyzes frames at 0.5-second intervals
5. Review the final report detailing recognized individuals and frames with unknown persons
6. Download the annotated output video

---

## How Recognition Works

```
Input Frame (Webcam / Phone / Video)
         |
         v
[OpenCV YuNet DNN]
  - Multi-scale face detection
  - 5-point facial landmark alignment (eyes, nose, mouth)
         |
         v
[OpenCV SFace DNN]
  - 128-Dimensional Deep Feature Embedding extraction
  - L2 normalization
         |
         v
[Cosine Similarity Metric Matching]
  - Vector dot product against known dataset embeddings
         |
         v
Cosine Score >= 0.363?
  - YES: Display verified person name and confidence percentage (Green box)
  - NO:  Flag as UNKNOWN and trigger security alert (Red box + audio alert + log)
```

**Threshold:** 0.363 Cosine Similarity (standard SFace benchmark metric).

---

## Video Threat Recognition Analytics

Core automated surveillance analytics modules:

1. **Visible Weapon Detection:** YOLOv8 neural network identifies firearms, knives, and suspicious handheld objects.
2. **Physical Altercation:** Farneback dense optical flow analyzes motion energy vectors between individuals to detect fights.
3. **Restricted-Zone Entry:** Dynamic polygon geofencing identifies unauthorized perimeter intrusions.
4. **Person Down / Fall Detection:** Geometric aspect-ratio and ground-plane analysis detects falls and motionless individuals.
5. **Loitering Detection:** Euclidean centroid tracking flags individuals dwelling beyond the configurable threshold (default: 8 seconds).
6. **Abnormal Crowd Movement:** Spatial density analysis identifies sudden crowd accumulation or rapid dispersal.
7. **Human Verification Workflow:** Generates structured Incident Packages (Camera ID, Location, Timestamp, Threat Type, Confidence, Snapshot) with `Verify & Escalate` and `False Alarm` review actions.

---

## Adding New Persons

1. Open the Add Person page (`/add_person`)
2. Enter the full name
3. Upload 1 to 5 clear photos of the person
4. Click "Add Person & Retrain"
5. The system crops facial features using YuNet, updates the SFace embedding matrix in the background, and reloads the engine automatically within seconds.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Main dashboard |
| `/threat_dashboard` | GET | V1 AI Video Threat Recognition SOC dashboard |
| `/threat_video_feed` | GET | Real-time threat detection MJPEG stream |
| `/api/threat_status` | GET | Live threat status and motion energy data |
| `/api/incidents` | GET | List of structured incident packages |
| `/api/verify_incident` | POST | Human verification action (Verify / False Alarm) |
| `/api/update_rules` | POST | Update detection thresholds and parameters |
| `/live` | GET | Live webcam recognition page |
| `/phone_camera` | GET | Two-way QR code phone camera page |
| `/mobile_cam` | GET | Mobile browser camera streaming page |
| `/video_feed` | GET | Webcam face recognition MJPEG stream |
| `/phone_video_feed` | GET | Phone camera MJPEG stream |
| `/start_camera` | POST | Initialize camera capture |
| `/stop_camera` | POST | Release active camera |
| `/upload_image` | POST | Process uploaded image |
| `/upload_video` | POST | Process uploaded video |
| `/add_person` | POST | Add person and retrain embeddings |
| `/alerts` | GET | Security alert history page |
| `/api/alerts` | GET | Alerts JSON feed |
| `/api/stats` | GET | System statistics JSON |

---

## Troubleshooting

### "No embeddings file found"
Run `python train_encodings.py` to generate the embedding database.

### "Model weights missing"
Verify that `models/face_detection_yunet_2023mar.onnx` and `models/face_recognition_sface_2021dec.onnx` are present in the `models/` directory.

### Camera not opening
Ensure no other software (such as Zoom, Teams, or Skype) is currently accessing the webcam.

### Phone camera not connecting
Verify that both the computer and smartphone are connected to the same local Wi-Fi network.

### Dataset download timeout
The LFW dataset is approximately 200 MB. Ensure a stable internet connection on the first run; files are cached locally for future use.

---

## System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB or higher |
| CPU | Dual-core 2.0 GHz | Quad-core 2.5 GHz or higher |
| Storage | 2 GB available | 5 GB available |
| Camera | Built-in or USB webcam | 720p or 1080p HD camera |
| Network | Local Wi-Fi (for phone streaming) | 5 GHz Wi-Fi / Ethernet |

---

## Credits and References

- **Reference Architecture:** [ageitgey/face_recognition](https://github.com/ageitgey/face_recognition)
- **Dataset:** [Labeled Faces in the Wild (LFW)](http://vis-www.cs.umass.edu/lfw/) - University of Massachusetts
- **Face Models:** OpenCV YuNet (Face Detection) and OpenCV SFace (Deep Representation)
- **Threat Detection:** Ultralytics YOLOv8
- **Streaming:** Flask MJPEG streaming architecture
