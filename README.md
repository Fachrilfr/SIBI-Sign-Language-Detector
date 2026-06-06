# Tanara — Teman Bicara (SIBI Sign Language to Text)

<img width="1919" height="990" alt="image" src="https://github.com/user-attachments/assets/c05968c1-ec75-4056-91c1-d24c55c187bf" />

💡 Tanara is an AI-powered web application designed to act as a "speaking friend" (*teman bicara*) by translating Indonesian Sign Language (SIBI) fingerspelling and numbers into text in real-time.

---

## 🇬🇧 English Version

### Tech Used
TensorFlow, Keras, MediaPipe, OpenCV, Python, Flask, React.js, Vite, Vanilla CSS

### Purpose
Communication is a fundamental human right, yet individuals in the deaf and hard-of-hearing community face significant communication barriers in their daily lives. SIBI (*Sistem Isyarat Bahasa Indonesia*) is the standard system used for spelling words, but it remains unfamiliar to the general public. Tanara (*Teman Bicara*) was created to bridge this communication gap. By leveraging computer vision and deep learning, Tanara acts as an interactive companion that translates SIBI fingerspelling and numbers into readable text in real-time, making learning and understanding sign language accessible and engaging for everyone.

### Development Process
As a solo project, I handled the end-to-end full-stack and AI development of Tanara. I integrated MediaPipe Hands to crop active hand regions and trained a MobileNetV2 model in TensorFlow/Keras to classify 36 SIBI gestures (A–Y and 0–9). Next, I built a Flask backend API to handle media uploads and run real-time inference, alongside a React + Vite frontend styled with a warm, organic palette using Vanilla CSS to host the translator, dictionary, and quiz engine.

### Outcome
This project resulted in a fully functional web application for real-time SIBI sign language translation and learning. The system is capable of recognizing sign gestures directly from a live webcam feed as well as processing image and video uploads. Key features include an interactive learning visualizer that converts typed text into a sequence of corresponding hand sign cards, and a gamified quiz game with a 60-second timer that tests users' signing accuracy against the AI with instant real-time feedback.

---

## 🇮🇩 Versi Indonesia

### Tech Used
TensorFlow, Keras, MediaPipe, OpenCV, Python, Flask, React.js, Vite, Vanilla CSS

### Purpose
Komunikasi adalah hak mendasar bagi semua orang, namun komunitas Tuli dan Teman Dengar sering kali menghadapi hambatan komunikasi yang besar dalam kehidupan sehari-hari. SIBI (Sistem Isyarat Bahasa Indonesia) adalah salah satu sistem isyarat yang digunakan untuk mengeja kata, tetapi masih asing bagi masyarakat luas. Tanara (Teman Bicara) diciptakan untuk menjembatani jurang komunikasi tersebut. Dengan memanfaatkan *computer vision* dan *deep learning*, Tanara hadir sebagai "teman bicara" yang menerjemahkan isyarat huruf dan angka SIBI menjadi teks secara langsung, membuat bahasa isyarat menjadi lebih interaktif dan mudah dipelajari oleh siapa saja.

### Development Process
Sebagai proyek solo, saya menangani seluruh pengembangan *full-stack* dan AI untuk Tanara. Saya mengintegrasikan MediaPipe Hands untuk mendeteksi *landmark* tangan dan memotong area tangan yang aktif secara otomatis. Untuk klasifikasi *gesture*, saya melatih model *deep learning* berbasis arsitektur MobileNetV2 dengan teknik *transfer learning* dan *fine-tuning* di TensorFlow/Keras untuk mengenali 36 kelas isyarat SIBI (A–Y dan 0–9). Saya membangun *backend* API Flask untuk menangani unggahan media dan inferensi *real-time*, sekaligus mengembangkan *frontend* menggunakan React.js dan Vite dengan desain bertema hangat (*warm & organic*) menggunakan Vanilla CSS untuk menyajikan fitur penerjemah, kamus visual, serta sistem kuis latihan.

### Outcome
Proyek ini menghasilkan aplikasi web fungsional untuk penerjemahan dan pembelajaran bahasa isyarat SIBI secara *real-time*. Sistem ini mampu mendeteksi gerakan isyarat secara langsung melalui kamera *webcam* serta memproses unggahan foto maupun video. Aplikasi ini juga dilengkapi dengan modul belajar interaktif yang mengubah teks ketikan menjadi rangkaian kartu isyarat abjad yang sesuai, serta kuis interaktif berdurasi 60 detik di mana pengguna dapat menguji ketepatan gerakan tangan mereka di depan kamera dengan penilaian otomatis dari AI.
