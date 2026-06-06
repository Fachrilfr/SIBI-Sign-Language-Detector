import os
import json
import cv2
import numpy as np
import mediapipe as mp
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from werkzeug.utils import secure_filename
import warnings
warnings.filterwarnings("ignore")

# ------------------- CONFIG -------------------
DATA_DIR = "data/"
IMG_SIZE = 224
MODEL_PATH = "mobilenet_sign_model.h5"
LABELS_PATH = "labels.json"          # FIX #1: Simpan label ke file agar konsisten
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "jpg", "jpeg", "png"}

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------- MEDIAPIPE HANDS -------------------
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands_detector = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ------------------- BUILD MODEL (MobileNetV2) -------------------
def build_mobilenet_model(num_classes):
    """
    FIX #2: Pakai MobileNetV2 pretrained ImageNet — jauh lebih akurat
    dari CNN scratch untuk 36 kelas gesture tangan yang mirip-mirip.
    """
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet"
    )
    # Freeze base dulu, nanti fine-tune setelah epoch awal
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.5)(x)
    output = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base_model.input, outputs=output)
    model.compile(optimizer=Adam(1e-3), loss="categorical_crossentropy", metrics=["accuracy"])
    return model, base_model

def build_and_train_model():
    global LABELS

    # FIX #3: Augmentasi lebih kaya agar model robust terhadap variasi pose
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        zoom_range=0.1,
        brightness_range=[0.8, 1.2],
        horizontal_flip=False   # Jangan flip — tangan kiri vs kanan beda artinya!
    )
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    train_gen = train_datagen.flow_from_directory(
        DATA_DIR, target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=32, class_mode="categorical", subset="training"
    )
    val_gen = val_datagen.flow_from_directory(
        DATA_DIR, target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=32, class_mode="categorical", subset="validation"
    )

    # FIX #1: Simpan label mapping ke JSON agar urutan SELALU konsisten
    LABELS = [None] * len(train_gen.class_indices)
    for label, idx in train_gen.class_indices.items():
        LABELS[idx] = label
    with open(LABELS_PATH, "w") as f:
        json.dump(LABELS, f)
    print(f"[INFO] Classes ({len(LABELS)}): {LABELS}")

    num_classes = len(LABELS)
    model, base_model = build_mobilenet_model(num_classes)

    # Phase 1: Latih head dulu (base frozen) — 10 epoch
    print("[INFO] Phase 1: Training head only...")
    model.fit(train_gen, epochs=10, validation_data=val_gen)

    # Phase 2: Fine-tune 50 layer terakhir base model
    print("[INFO] Phase 2: Fine-tuning top layers of MobileNetV2...")
    base_model.trainable = True
    for layer in base_model.layers[:-50]:
        layer.trainable = False
    model.compile(optimizer=Adam(1e-4), loss="categorical_crossentropy", metrics=["accuracy"])
    model.fit(train_gen, epochs=10, validation_data=val_gen)

    model.save(MODEL_PATH)
    print(f"[OK] Model saved to {MODEL_PATH}")
    return model

# ------------------- LOAD LABELS -------------------
def load_labels():
    """FIX #1: Load label dari JSON, bukan dari os.listdir() yang tidak konsisten"""
    if os.path.exists(LABELS_PATH):
        with open(LABELS_PATH, "r") as f:
            return json.load(f)
    # Fallback: sorted dari folder (hanya untuk training pertama kali)
    return sorted(os.listdir(DATA_DIR))

# ------------------- LOAD OR TRAIN -------------------
LABELS = load_labels()

if os.path.exists(MODEL_PATH):
    model = load_model(MODEL_PATH)
    print(f"[OK] Loaded model: {MODEL_PATH}")
    print(f"[INFO] Labels loaded: {LABELS}")
else:
    print("[INFO] Model tidak ditemukan, mulai training...")
    model = build_and_train_model()
    LABELS = load_labels()  # Reload setelah training agar terurut benar

# ------------------- HELPERS -------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_and_crop_hand(frame):
    """
    FIX #4: Crop tangan dengan padding proporsional.
    Kalau MediaPipe gagal detect, kembalikan frame asli (bukan None)
    agar model tetap bisa coba prediksi — jangan langsung return None.
    """
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands_detector.process(img_rgb)

    if not results.multi_hand_landmarks:
        return None  # Benar-benar tidak ada tangan

    h, w, _ = frame.shape
    for hand_landmarks in results.multi_hand_landmarks:
        x_coords = [lm.x * w for lm in hand_landmarks.landmark]
        y_coords = [lm.y * h for lm in hand_landmarks.landmark]

        # Padding 30% dari ukuran bounding box agar konteks tangan ikut
        bw = max(x_coords) - min(x_coords)
        bh = max(y_coords) - min(y_coords)
        pad_x = int(bw * 0.3) + 20
        pad_y = int(bh * 0.3) + 20

        x_min = max(0, int(min(x_coords)) - pad_x)
        x_max = min(w, int(max(x_coords)) + pad_x)
        y_min = max(0, int(min(y_coords)) - pad_y)
        y_max = min(h, int(max(y_coords)) + pad_y)

        cropped = frame[y_min:y_max, x_min:x_max]
        if cropped.size == 0:
            return None
        return cropped
    return None

def preprocess_frame(frame):
    """Resize + normalize sesuai MobileNetV2"""
    img = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def predict_frame(frame):
    cropped = detect_and_crop_hand(frame)
    if cropped is None:
        return "No Hand Detected", 0.0

    processed = preprocess_frame(cropped)
    preds = model.predict(processed, verbose=0)[0]

    class_index = int(np.argmax(preds))
    confidence = float(preds[class_index])

    # FIX #5: Threshold confidence — jangan tampilkan prediksi yang tidak yakin
    if confidence < 0.6:
        return "Uncertain", confidence

    label = LABELS[class_index] if class_index < len(LABELS) else "Unknown"
    return label, confidence

def extract_frames_and_predict(video_path, step=5):
    cap = cv2.VideoCapture(video_path)
    sequence = []
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % step == 0:
            label, conf = predict_frame(frame)
            if label not in ("No Hand Detected", "Uncertain"):
                sequence.append(label)
        frame_count += 1
    cap.release()

    # Collapse duplikat berurutan
    collapsed = []
    for char in sequence:
        if not collapsed or char != collapsed[-1]:
            collapsed.append(char)
    return " ".join(collapsed)

# ------------------- FLASK ROUTES -------------------

@app.route("/predict_image", methods=["POST"])
def predict_image():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Invalid image"}), 400
    label, conf = predict_frame(img)
    return jsonify({"prediction": label, "confidence": round(conf, 4)})

@app.route("/predict_video", methods=["POST"])
def predict_video():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    filename = secure_filename(file.filename)
    video_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(video_path)
    sequence = extract_frames_and_predict(video_path, step=5)
    return jsonify({"prediction": sequence})

# ------------------- LIVE WEBCAM FEED -------------------
def generate_frames():
    cap = cv2.VideoCapture(0)
    while True:
        success, frame = cap.read()
        if not success:
            break

        label, conf = predict_frame(frame)

        # Gambar kotak info
        color = (0, 255, 0) if label not in ("No Hand Detected", "Uncertain") else (0, 165, 255)
        display_text = f"{label} ({conf:.0%})" if conf > 0 else label
        cv2.rectangle(frame, (5, 5), (400, 50), (0, 0, 0), -1)
        cv2.putText(frame, display_text, (10, 38),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, color, 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route("/predict_live")
def predict_live():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# ------------------- MAIN -------------------
if __name__ == "__main__":
    app.run(debug=True)