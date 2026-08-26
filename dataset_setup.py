"""
Dataset Setup Script
====================
Downloads LFW (Labeled Faces in the Wild) dataset via scikit-learn
and prepares known identities with multiple images each for training.
"""

import os
import shutil
import numpy as np
from pathlib import Path
from sklearn.datasets import fetch_lfw_people
from PIL import Image
import pickle

DATASET_DIR = Path("dataset/known_persons")
ENCODINGS_FILE = Path("data/face_encodings.pkl")
MIN_FACES_PER_PERSON = 5
NUM_PERSONS = 50

def download_and_prepare_dataset():
    """Download LFW dataset and organize 50 persons with their images."""
    print("=" * 60)
    print("AI Face Recognition System - Dataset Setup")
    print("Source: Labeled Faces in the Wild (LFW) Dataset")
    print("URL: http://vis-www.cs.umass.edu/lfw/")
    print("=" * 60)
    print(f"\n[1/4] Downloading LFW dataset (min {MIN_FACES_PER_PERSON} images per person)...")
    print("      This may take a few minutes on first run...\n")

    # Fetch dataset - filter persons with at least MIN_FACES_PER_PERSON images
    lfw_people = fetch_lfw_people(
        min_faces_per_person=MIN_FACES_PER_PERSON,
        resize=None,         # Keep original resolution
        color=True,          # Color images
        funneled=True,       # Deep funneled aligned images
        download_if_missing=True
    )

    images = lfw_people.images          # shape: (N, H, W, 3) float
    targets = lfw_people.target
    target_names = lfw_people.target_names

    print(f"  + Dataset downloaded successfully!")
    print(f"  + Total images: {len(images)}")
    print(f"  + Total persons in LFW: {len(target_names)}")

    # Select top NUM_PERSONS by face count
    person_counts = {}
    for t in targets:
        person_counts[t] = person_counts.get(t, 0) + 1

    sorted_persons = sorted(person_counts.items(), key=lambda x: x[1], reverse=True)
    selected_ids = [pid for pid, _ in sorted_persons[:NUM_PERSONS]]

    print(f"\n[2/4] Selecting top {NUM_PERSONS} persons by image count...")

    # Create dataset directory structure
    DATASET_DIR.mkdir(parents=True, exist_ok=True)

    saved_persons = 0
    total_images_saved = 0
    persons_info = []

    for person_id in selected_ids:
        name = target_names[person_id]
        # Clean name for directory
        dir_name = name.replace(" ", "_")
        person_dir = DATASET_DIR / dir_name

        # Check if already exists
        if person_dir.exists():
            existing = list(person_dir.glob("*.jpg"))
            if len(existing) >= MIN_FACES_PER_PERSON:
                saved_persons += 1
                total_images_saved += len(existing)
                persons_info.append((name, len(existing)))
                continue

        person_dir.mkdir(exist_ok=True)

        # Save all images for this person
        person_indices = np.where(targets == person_id)[0]
        img_count = 0
        for idx in person_indices:
            img_array = (images[idx] * 255).astype(np.uint8) if images[idx].max() <= 1.0 else images[idx].astype(np.uint8)
            pil_img = Image.fromarray(img_array)
            # Resize to 200x200 for consistency
            pil_img = pil_img.resize((200, 200), Image.LANCZOS)
            save_path = person_dir / f"{dir_name}_{img_count:04d}.jpg"
            pil_img.save(save_path, "JPEG", quality=95)
            img_count += 1

        saved_persons += 1
        total_images_saved += img_count
        persons_info.append((name, img_count))
        count = person_counts[person_id]
        print(f"  + {name:<35} -> {img_count} images saved")

    print(f"\n[3/4] Dataset Summary:")
    print(f"  + Persons saved: {saved_persons}")
    print(f"  + Total images saved: {total_images_saved}")
    print(f"  + Dataset directory: {DATASET_DIR.absolute()}")

    # Save persons info
    os.makedirs("data", exist_ok=True)
    info_file = Path("data/persons_info.pkl")
    with open(info_file, "wb") as f:
        pickle.dump({
            "persons": [p[0] for p in persons_info],
            "counts": {p[0]: p[1] for p in persons_info}
        }, f)

    print(f"\n[4/4] Persons list saved to: {info_file.absolute()}")
    print("\n" + "=" * 60)
    print(f"OK Dataset ready! {saved_persons} persons, {total_images_saved} images total")
    print("   Next step: Run `python train_encodings.py` to train the model")
    print("=" * 60)

    return persons_info


if __name__ == "__main__":
    persons = download_and_prepare_dataset()
    print("\nPerson List:")
    for i, (name, count) in enumerate(persons, 1):
        print(f"  {i:2d}. {name} ({count} images)")
