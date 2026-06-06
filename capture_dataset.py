"""
capture_dataset.py
──────────────────
Jalankan: python capture_dataset.py

Fungsi:
- Buka webcam
- Tampilkan panduan per karakter (A-Z, 0-9)
- Foto otomatis saat tangan terdeteksi + tombol SPACE untuk manual
- Simpan ke data/<CHAR>/ untuk training
- Simpan 1 foto terbaik ke static/images/letters/ atau numbers/ untuk UI
"""

import cv2
import os
import time
import mediapipe as mp

# ── Konfigurasi ──────────────────────────────────────────────
CHARS         = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
PHOTOS_EACH   = 300       # jumlah foto per karakter
DATA_DIR      = "data"
LETTERS_DIR   = "static/images/letters"
NUMBERS_DIR   = "static/images/numbers"
IMG_SIZE      = 224       # ukuran simpan
COUNTDOWN_SEC = 3         # hitung mundur sebelum mulai capture
AUTO_INTERVAL = 0.15      # jeda antar foto otomatis (detik)

# ── Setup folder ─────────────────────────────────────────────
for c in CHARS:
    os.makedirs(os.path.join(DATA_DIR, c), exist_ok=True)
os.makedirs(LETTERS_DIR, exist_ok=True)
os.makedirs(NUMBERS_DIR, exist_ok=True)

# ── MediaPipe ─────────────────────────────────────────────────
mp_hands    = mp.solutions.hands
mp_drawing  = mp.solutions.drawing_utils
hands       = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,        # ← SIBI pakai 1 tangan
    min_detection_confidence=0.6
)

# ── Helper: crop SEMUA tangan jadi 1 gambar ───────────────────
def crop_both_hands(frame, all_landmarks):
    """
    Gabungkan bounding box semua tangan yang terdeteksi
    (1 atau 2 tangan) menjadi 1 region crop.
    Ini penting untuk SIBI yang menggunakan 1 tangan.
    """
    h, w = frame.shape[:2]
    all_xs, all_ys = [], []

    for lm in all_landmarks:
        all_xs += [p.x * w for p in lm.landmark]
        all_ys += [p.y * h for p in lm.landmark]

    bw = max(all_xs) - min(all_xs)
    bh = max(all_ys) - min(all_ys)
    pad_x = int(bw * 0.35) + 30
    pad_y = int(bh * 0.35) + 30

    x1 = max(0, int(min(all_xs)) - pad_x)
    x2 = min(w, int(max(all_xs)) + pad_x)
    y1 = max(0, int(min(all_ys)) - pad_y)
    y2 = min(h, int(max(all_ys)) + pad_y)

    cropped = frame[y1:y2, x1:x2]
    if cropped.size == 0:
        return None, None
    return cropped, (x1, y1, x2, y2)

# Alias agar kode lama tetap kompatibel
def crop_hand(frame, landmarks):
    return crop_both_hands(frame, [landmarks])

# ── Helper: simpan foto ───────────────────────────────────────
def save_image(char, img, count, save_preview=False):
    folder = os.path.join(DATA_DIR, char)
    path   = os.path.join(folder, f"{char}_{count:04d}.jpg")
    resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    cv2.imwrite(path, resized)

    if save_preview:
        if char.isalpha():
            prev_path = os.path.join(LETTERS_DIR, f"{char}.jpg")
        else:
            prev_path = os.path.join(NUMBERS_DIR, f"{char}.jpg")
        cv2.imwrite(prev_path, resized)
        print(f"  ✓ Preview disimpan: {prev_path}")

    return path

# ── Main ─────────────────────────────────────────────────────
def main():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("\n" + "="*50)
    print("  Tanara — Capture Dataset SIBI")
    print("="*50)
    print(f"  Total karakter : {len(CHARS)}")
    print(f"  Foto per kelas : {PHOTOS_EACH}")
    print(f"  Total target   : {len(CHARS) * PHOTOS_EACH} foto")
    print("\n  Kontrol:")
    print("  SPACE  → mulai capture karakter ini")
    print("  S      → skip ke karakter berikutnya")
    print("  R      → ulangi karakter ini")
    print("  Q      → keluar")
    print("="*50 + "\n")

    char_idx   = 0
    # Cari karakter yang belum selesai
    for i, c in enumerate(CHARS):
        folder = os.path.join(DATA_DIR, c)
        existing = len([f for f in os.listdir(folder) if f.endswith('.jpg')])
        if existing < PHOTOS_EACH:
            char_idx = i
            break
    else:
        print("✅ Semua karakter sudah selesai!")
        return

    while char_idx < len(CHARS):
        char   = CHARS[char_idx]
        folder = os.path.join(DATA_DIR, char)
        existing = len([f for f in os.listdir(folder) if f.endswith('.jpg')])
        count  = existing
        capturing  = False
        last_time  = 0
        preview_saved = os.path.exists(
            os.path.join(LETTERS_DIR if char.isalpha() else NUMBERS_DIR, f"{char}.jpg")
        )

        print(f"\n[{char_idx+1}/{len(CHARS)}] Karakter: {char}  |  Sudah ada: {existing}/{PHOTOS_EACH} foto")
        if existing >= PHOTOS_EACH:
            print(f"  ✓ {char} sudah lengkap, lewati...")
            char_idx += 1
            continue

        while count < PHOTOS_EACH:
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res   = hands.process(rgb)

            hand_detected = False
            bbox = None
            num_hands = 0

            if res.multi_hand_landmarks:
                hand_detected = True
                num_hands = len(res.multi_hand_landmarks)

                # Gambar landmark semua tangan
                for lm in res.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(frame, lm, mp_hands.HAND_CONNECTIONS)

                # Crop SEMUA tangan sekaligus jadi 1 gambar
                cropped, bbox = crop_both_hands(frame, res.multi_hand_landmarks)

                # Auto capture
                if capturing and cropped is not None:
                    now = time.time()
                    if now - last_time >= AUTO_INTERVAL:
                        is_first = (count == existing)
                        save_image(char, cropped, count,
                                   save_preview=(not preview_saved and is_first))
                        if not preview_saved and is_first:
                            preview_saved = True
                        count += 1
                        last_time = now

                # Gambar bounding box gabungan
                if bbox:
                    x1,y1,x2,y2 = bbox
                    color = (0,220,100) if capturing else (255,180,0)
                    cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)

            # ── UI Overlay ─────────────────────────────────────
            h, w = frame.shape[:2]

            # Panel atas
            cv2.rectangle(frame, (0,0), (w,90), (15,15,15), -1)

            # Karakter besar
            cv2.putText(frame, char, (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 2.2, (255,255,255), 3)

            # Progress bar
            pct    = count / PHOTOS_EACH
            bar_w  = w - 180
            cv2.rectangle(frame, (160, 30), (160 + bar_w, 55), (50,50,50), -1)
            cv2.rectangle(frame, (160, 30), (160 + int(bar_w * pct), 55),
                          (40,180,100) if capturing else (60,120,200), -1)
            cv2.putText(frame, f"{count}/{PHOTOS_EACH}", (160 + bar_w + 10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200,200,200), 1)

            # Status
            if not hand_detected:
                status_txt   = "Tidak ada tangan — arahkan tangan ke kamera"
                status_color = (80, 80, 200)
            elif not capturing:
                tangan_info  = f"{num_hands} tangan terdeteksi"
                status_txt   = f"{tangan_info}  |  SPACE = mulai capture"
                status_color = (200, 200, 0) if num_hands < 2 else (40, 220, 80)
            else:
                status_txt   = f"Capturing... {count}/{PHOTOS_EACH}  ({num_hands} tangan)"
                status_color = (40, 220, 80)

            cv2.rectangle(frame, (0, h-40), (w, h), (15,15,15), -1)
            cv2.putText(frame, status_txt, (20, h-12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, status_color, 1)
            cv2.putText(frame, "S=skip  R=ulangi  Q=keluar", (w-260, h-12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (120,120,120), 1)

            # Karakter berikutnya (preview)
            if char_idx + 1 < len(CHARS):
                cv2.putText(frame, f"Berikutnya: {CHARS[char_idx+1]}",
                            (w - 200, 25),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (140,140,140), 1)

            cv2.imshow("Tanara — Capture Dataset", frame)

            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                print("\n⏹ Dihentikan.")
                cap.release()
                cv2.destroyAllWindows()
                _print_summary()
                return

            elif key == ord(' '):
                if not capturing:
                    # Countdown sebelum mulai
                    for cd in range(COUNTDOWN_SEC, 0, -1):
                        ret2, f2 = cap.read()
                        if ret2:
                            f2 = cv2.flip(f2, 1)
                            cv2.rectangle(f2, (0,0), (f2.shape[1], f2.shape[0]),
                                          (15,15,15), -1)
                            cv2.putText(f2, str(cd),
                                        (f2.shape[1]//2 - 40, f2.shape[0]//2 + 40),
                                        cv2.FONT_HERSHEY_SIMPLEX, 5,
                                        (40,220,80), 8)
                            cv2.putText(f2, f"Siapkan isyarat: {char}",
                                        (f2.shape[1]//2 - 160, f2.shape[0]//2 - 80),
                                        cv2.FONT_HERSHEY_SIMPLEX, 1,
                                        (255,255,255), 2)
                            cv2.imshow("Tanara — Capture Dataset", f2)
                            cv2.waitKey(1000)
                    capturing = True
                    last_time = time.time()
                    print(f"  📸 Mulai capture {char}...")
                else:
                    capturing = False
                    print(f"  ⏸ Dijeda di {count} foto")

            elif key == ord('s'):
                print(f"  ⏩ Skip {char} ({count} foto tersimpan)")
                break

            elif key == ord('r'):
                print(f"  🔄 Ulangi {char} (hapus {count - existing} foto baru)")
                # Hapus foto yang baru saja diambil (bukan yang existing)
                files = sorted([f for f in os.listdir(folder) if f.endswith('.jpg')])
                for f in files[existing:]:
                    os.remove(os.path.join(folder, f))
                count     = existing
                capturing = False

        if count >= PHOTOS_EACH:
            print(f"  ✅ {char} selesai! ({count} foto)")

        char_idx += 1

    cap.release()
    cv2.destroyAllWindows()
    print("\n🎉 Semua karakter selesai!")
    _print_summary()


def _print_summary():
    print("\n" + "="*50)
    print("  Ringkasan Dataset")
    print("="*50)
    total = 0
    incomplete = []
    for c in CHARS:
        folder = os.path.join(DATA_DIR, c)
        if not os.path.exists(folder):
            n = 0
        else:
            n = len([f for f in os.listdir(folder) if f.endswith('.jpg')])
        total += n
        status = "✓" if n >= PHOTOS_EACH else f"⚠ {n}/{PHOTOS_EACH}"
        print(f"  {c}: {status}")
        if n < PHOTOS_EACH:
            incomplete.append(c)
    print(f"\n  Total foto  : {total}")
    print(f"  Belum penuh : {incomplete if incomplete else 'tidak ada'}")
    print("="*50)
    if not incomplete:
        print("\n✅ Dataset siap! Jalankan: python app.py untuk training.")
    else:
        print(f"\n⚠ Masih ada {len(incomplete)} karakter yang belum lengkap.")
        print("  Jalankan ulang script ini untuk melanjutkan.")


if __name__ == "__main__":
    main()