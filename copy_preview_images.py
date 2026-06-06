"""
copy_preview_images.py
──────────────────────
Jalankan sekali: python copy_preview_images.py

Script ini menyalin 1 foto terbaik per kelas dari folder data/
ke static/images/letters/ dan static/images/numbers/
sehingga halaman Belajar dan Referensi bisa menampilkan foto nyata.
"""

import os
import shutil

DATA_DIR    = "data"
LETTERS_DIR = "static/images/letters"
NUMBERS_DIR = "static/images/numbers"

os.makedirs(LETTERS_DIR, exist_ok=True)
os.makedirs(NUMBERS_DIR, exist_ok=True)

copied = 0
skipped = 0

for class_name in os.listdir(DATA_DIR):
    class_path = os.path.join(DATA_DIR, class_name)
    if not os.path.isdir(class_path):
        continue

    # Ambil file gambar pertama yang valid
    images = [f for f in sorted(os.listdir(class_path))
              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not images:
        print(f"  ⚠ Tidak ada gambar di kelas '{class_name}'")
        skipped += 1
        continue

    src = os.path.join(class_path, images[0])
    key = class_name.upper()

    # Tentukan folder tujuan: huruf atau angka
    if key.isalpha() and len(key) == 1:
        dst_dir = LETTERS_DIR
    elif key.isdigit() and len(key) == 1:
        dst_dir = NUMBERS_DIR
    else:
        print(f"  ⚠ Kelas '{class_name}' tidak dikenali (bukan A-Z atau 0-9), dilewati")
        skipped += 1
        continue

    # Selalu simpan sebagai .jpg
    dst = os.path.join(dst_dir, f"{key}.jpg")
    shutil.copy2(src, dst)
    print(f"  ✓ {class_name} → {dst}")
    copied += 1

print(f"\n✅ Selesai: {copied} foto disalin, {skipped} dilewati.")
print(f"   Foto tersimpan di: {LETTERS_DIR}/ dan {NUMBERS_DIR}/")