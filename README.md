# 🤟 Tanara — Teman Bicara (SIBI Sign Language to Text)

Aplikasi web berbasis AI yang dirancang untuk menerjemahkan abjad jari Sistem Isyarat Bahasa Indonesia (SIBI) dan angka menjadi teks secara *real-time*. Aplikasi ini membantu menjembatani jurang komunikasi antara Teman Dengar dan Teman Tuli dengan antarmuka yang modern, bersih, dan interaktif.

---

## 🌟 Fitur Utama
Aplikasi ini mencakup berbagai fitur menarik yang siap digunakan:

* **⚡ Real-time Webcam Translation**
  Deteksi gerakan tangan langsung melalui kamera web menggunakan AI untuk menerjemahkan abjad/angka SIBI menjadi teks secara instan.
* **📂 Media Upload Translation**
  Menerjemahkan isyarat dari unggahan file gambar (JPG, PNG) maupun video (MP4, AVI, MOV) secara otomatis.
* **✍️ Belajar Isyarat (Spelling Visualizer)**
  Masukkan kata atau kalimat, dan aplikasi akan menampilkan rangkaian visualisasi isyarat tangan per huruf agar pengguna bisa belajar mengeja kata.
* **🏆 Tantangan Kuis (Gamified Quiz)**
  Uji kemampuan isyarat Anda dalam kuis interaktif berdurasi 60 detik dengan deteksi langsung via kamera dan sistem skor otomatis dari AI.
* **📖 Galeri Referensi**
  Kamus visual lengkap yang menampilkan seluruh gerakan tangan abjad A–Z (tanpa J & Z) dan angka 0–9.

---

## 🛠️ Teknologi & Library yang Digunakan
Aplikasi ini dibangun menggunakan kombinasi teknologi AI dan Fullstack modern berikut:

### Frontend
* **React.js (Vite)** - Framework Single Page Application (SPA) yang cepat dan responsif.
* **React Router DOM** - Manajemen navigasi antar halaman.
* **Vanilla CSS** - Kustomisasi antarmuka dengan tema hangat (*warm & organic*) menggunakan Google Fonts (Lora & Plus Jakarta Sans).

### Backend & AI (Python)
* **Flask & Flask-CORS** - REST API ringan untuk melayani komunikasi frontend dan backend.
* **MediaPipe Hands** - Pendeteksian *landmark* tangan dan ekstraksi area isyarat secara presisi.
* **TensorFlow & Keras** - Pembuatan dan pelatihan model *deep learning* (MobileNetV2) dengan teknik *transfer learning* & *fine-tuning*.
* **OpenCV** - Pengolahan *frame* gambar dan video *feed* kamera.
* **NumPy** - Pemrosesan matriks dan array piksel gambar.

---

## 🚀 Cara Menjalankan Project
Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan lokal Anda:

### Prasyarat
* Pastikan Anda sudah menginstal Python 3.10 ke atas di perangkat Anda.
* Pastikan Node.js terinstal untuk menjalankan frontend React.

### Langkah Instalasi

1. **Clone repositori ini ke komputer lokal Anda:**
   ```bash
   git clone https://github.com/Fachrilfr/SIBI-Sign-Language-Detector.git
   ```
2. **Masuk ke direktori project:**
   ```bash
   cd SIBI-Sign-Language-Detector
   ```

3. **Jalankan Backend (Flask API):**
   * Aktifkan virtual environment (`venv`):
     * **PowerShell:** `.\venv\Scripts\Activate.ps1`
     * **CMD:** `venv\Scripts\activate.bat`
   * Jalankan server Flask:
     ```bash
     python app.py
     ```
   * *Server API akan berjalan di `http://127.0.0.1:5000`.*

4. **Jalankan Frontend (React + Vite):**
   * Buka tab terminal baru dan masuk ke folder `frontend`:
     ```bash
     cd frontend
     ```
   * Instal semua dependensi Node:
     ```bash
     npm install
     ```
   * Jalankan development server:
     ```bash
     npm run dev
     ```
   * *Aplikasi web dapat diakses di browser melalui alamat yang tertera di terminal (biasanya `http://localhost:5173`).*

---

## 📂 Struktur Folder Proyek

```text
SIBI-Sign-Language-Detector/
├── data/                       # Folder gambar dataset per kelas huruf/angka
├── uploads/                    # Folder penyimpanan sementara unggahan gambar/video
├── venv/                       # Python virtual environment
├── app.py                      # REST API Flask & logika inferensi AI (MobileNetV2)
├── capture_dataset.py          # Script pengambilan dataset tangan lewat webcam
├── cekdataset.py               # Script debug untuk memeriksa hasil crop gambar
├── labels.json                 # Pemetaan indeks ke kelas karakter (A-Y, 0-9)
├── mobilenet_sign_model.h5     # File model AI terlatih
├── requirements.txt            # Daftar dependensi library Python
├── .gitignore                  # Berkas untuk mengabaikan file venv, node_modules, dll.
└── frontend/                   # Folder aplikasi React
    ├── public/                 # Favicon dan aset statis yang bisa diakses langsung
    ├── src/                    # Source code React
    │   ├── assets/             # Aset gambar & stylesheet CSS
    │   │   └── static/         # Style utama (app.css, landing.css, style.css) & logo
    │   ├── pages/              # Halaman web utama
    │   │   ├── Landing.jsx     # Halaman landing awal
    │   │   └── MainApp.jsx     # Aplikasi dashboard, kuis, translator, & referensi
    │   ├── App.jsx             # Pengaturan router halaman
    │   └── main.jsx            # Entry point React
    ├── package.json            # Berkas konfigurasi dependencies Node.js
    └── vite.config.js          # Konfigurasi server Vite
```
