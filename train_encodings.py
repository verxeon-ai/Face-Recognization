"""
Face Recognition Training Script - SFace Deep Neural Network
=============================================================
Uses OpenCV's official SFace Deep Learning Model (128-D Embeddings) + YuNet:
- State-of-the-art Deep Feature Extraction (Cosine distance matching)
- Robust against lighting, angles, mobile screen glare, and poses
- Highly accurate: Recognizes known persons and reliably rejects unknown persons
"""

import os
import pickle
import numpy as np
import cv2
import json
from pathlib import Path

DATASET_DIR = Path("dataset/known_persons")
ENCODINGS_FILE = Path("data/face_encodings.pkl")
METADATA_FILE = Path("data/metadata.json")
YUNET_MODEL = Path("models/face_detection_yunet_2023mar.onnx")
SFACE_MODEL = Path("models/face_recognition_sface_2021dec.onnx")


def train_deep_embeddings():
    """Extract 128D deep feature embeddings for all persons in the dataset."""
    print("=" * 60)
    print("AI Face Recognition - SFace Deep Neural Network Training")
    print("=" * 60 + "\n")

    if not YUNET_MODEL.exists() or not SFACE_MODEL.exists():
        print("[Train] ERROR: Models not found in models/ directory.")
        return

    # 1. Initialize YuNet face detector
    yunet = cv2.FaceDetectorYN.create(
        str(YUNET_MODEL), "", (320, 320), 0.5, 0.3, 5000
    )

    # 2. Initialize SFace deep recognizer
    sface = cv2.FaceRecognizerSF.create(str(SFACE_MODEL), "")

    person_dirs = sorted([d for d in DATASET_DIR.iterdir() if d.is_dir()])
    if not person_dirs:
        print("[Train] ERROR: No person directories in dataset.")
        return

    known_embeddings = []  # List of 128D numpy arrays
    known_names = []       # List of names
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    total_images_processed = 0
    total_faces_extracted = 0

    print(f"[Train] Processing {len(person_dirs)} persons...\n")

    for i, pdir in enumerate(person_dirs, 1):
        name = pdir.name.replace("_", " ")
        img_files = [f for f in pdir.iterdir() if f.suffix.lower() in valid_exts]

        if not img_files:
            continue

        person_feats = []

        for img_path in img_files:
            img = cv2.imread(str(img_path))
            if img is None:
                continue

            total_images_processed += 1
            h, w = img.shape[:2]
            yunet.setInputSize((w, h))

            _, faces = yunet.detect(img)
            if faces is not None and len(faces) > 0:
                # Pick largest face
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                try:
                    aligned = sface.alignCrop(img, largest_face)
                    feat = sface.feature(aligned)  # 1x128 float
                    # L2 normalize feature
                    feat_norm = feat / (np.linalg.norm(feat) + 1e-7)
                    person_feats.append(feat_norm.flatten())
                    total_faces_extracted += 1
                except Exception:
                    pass

        if person_feats:
            # Compute average representative feature vector for this person
            mean_feat = np.mean(person_feats, axis=0)
            mean_feat_norm = mean_feat / (np.linalg.norm(mean_feat) + 1e-7)

            known_embeddings.append(mean_feat_norm)
            known_names.append(name)
            print(f"  [{i:2d}/{len(person_dirs)}] + {name:<32} -> {len(person_feats)} faces extracted")

    known_embeddings_matrix = np.array(known_embeddings, dtype=np.float32)

    # Save to file
    os.makedirs("data", exist_ok=True)
    model_data = {
        "embeddings": known_embeddings_matrix,
        "names": known_names,
        "model_type": "OpenCV_SFace_Deep_Embeddings",
        "embedding_dim": 128,
        "cosine_threshold": 0.363
    }

    with open(ENCODINGS_FILE, "wb") as f:
        pickle.dump(model_data, f)

    # Save metadata
    metadata = {
        "total_persons": len(known_names),
        "total_images_processed": total_images_processed,
        "total_faces_extracted": total_faces_extracted,
        "model": "SFace Deep Neural Network (128D)",
        "detector": "YuNet DNN",
        "cosine_threshold": 0.363,
        "persons": known_names
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 60)
    print("OK Deep Feature Training Complete!")
    print(f"   Persons: {len(known_names)}")
    print(f"   Total faces extracted: {total_faces_extracted}")
    print(f"   Embeddings matrix shape: {known_embeddings_matrix.shape}")
    print(f"   Model saved to: {ENCODINGS_FILE.absolute()}")
    print("=" * 60)


if __name__ == "__main__":
    train_deep_embeddings()
