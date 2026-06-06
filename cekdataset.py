# cek_dataset.py — jalankan untuk lihat hasil crop
import cv2, os, random

DATA_DIR = "data"
OUT_DIR  = "debug_crops"
os.makedirs(OUT_DIR, exist_ok=True)

for char in os.listdir(DATA_DIR):
    folder = os.path.join(DATA_DIR, char)
    imgs   = [f for f in os.listdir(folder) if f.endswith('.jpg')]
    if not imgs:
        continue
    # Ambil 3 sampel acak per kelas
    samples = random.sample(imgs, min(3, len(imgs)))
    for i, fname in enumerate(samples):
        img = cv2.imread(os.path.join(folder, fname))
        cv2.imwrite(os.path.join(OUT_DIR, f"{char}_{i}.jpg"), img)

print(f"Cek folder debug_crops/ — lihat apakah crop tangan sudah benar")