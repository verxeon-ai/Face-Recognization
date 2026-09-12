# AegisAI — Video Recognition Pipeline

## Full Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (localhost:3000/demo)                                  │
│                                                                 │
│  <img src="/api/demo/stream">  ← MJPEG stream via HTTP         │
│  <img src="/api/demo/face">    ← target face for recognition    │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTP GET /api/demo/stream
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  FLASK (localhost:5001) — generate_demo_stream()                │
│                                                                 │
│  1. cv2.VideoCapture("test_videos/video.mp4")                   │
│  2. Read frame                                                  │
│  3. Every 3rd frame → run process_frame(), else reuse last     │
│  4. cv2.imencode → JPEG                                         │
│  5. yield as multipart/x-mixed-replace (MJPEG)                  │
│  6. time.sleep(0.05) → ~20fps                                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │ calls
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  recognition_engine.py — process_frame(frame)                    │
│                                                                 │
│  STEP 1: DETECT — YuNet ONNX model                               │
│    yunet.setInputSize((w, h))                                    │
│    yunet.detect(frame) → list of faces (x,y,w,h + 5 landmarks)  │
│                                                                 │
│  STEP 2: FOR EACH DETECTED FACE:                                 │
│    a. Crop & align via sface.alignCrop(frame, face_data)         │
│    b. Extract 128-D embedding via sface.feature(aligned)         │
│    c. Match against data/face_encodings.pkl (52 persons)         │
│       cosine_distance(embedding, db_embedding)                   │
│       if distance < 0.363 → MATCH (name, confidence%)           │
│       else → "Unknown" (RED box)                                 │
│                                                                 │
│  STEP 3: DRAW                                                    │
│    - GREEN box + label for known persons                         │
│    - RED box + "UNKNOWN (ALERT!)" for unknowns                   │
│    - HUD: timestamp, face count stats                            │
│                                                                 │
│  Returns: (annotated_frame, recognized[], unknowns[])            │
└──────────────────┬──────────────────────────────────────────────┘
                   │ annotated frame bytes
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER displays annotated MJPEG — no canvas, no JS decode    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Role |
|------|------|
| `app.py:856` | `generate_demo_stream()` — reads video, throttles detection, yields JPEG |
| `app.py:898` | `/api/demo/stream` — MJPEG route |
| `recognition_engine.py:186` | `process_frame()` — YuNet detect → SFace embed → match → draw boxes |
| `models/face_detection_yunet_2023mar.onnx` | YuNet face detector (~232KB) |
| `models/face_recognition_sface_2021dec.onnx` | SFace recognizer (~38MB) |
| `data/face_encodings.pkl` | 52 pre-registered persons, 2788 embeddings (128D) |
| `frontend/src/app/demo/page.tsx` | Stream + target face + enroll button UI |

## Model Details

- **Detection (YuNet):** Outputs bounding box + 5 facial landmarks per face
- **Recognition (SFace):** 128-D deep embedding per face, cosine similarity matching
- **Threshold:** 0.363 cosine distance = match cutoff
- **Database:** 52 persons, 2788 pre-computed 128-D embeddings

## Performance Tuning

- Detection runs every **3rd frame** (every frame is expensive)
- Unused frames reuse the last annotated frame
- JPEG quality 80% for smaller payloads
- ~20fps via 50ms sleep between frames
