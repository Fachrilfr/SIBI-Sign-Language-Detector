let useWebcam = false;
let lastPrediction = "";
let webcamStream = null;   // ← baru
let liveInterval = null;   // ← baru

const uploadTab = document.getElementById("uploadTab");
const liveTab = document.getElementById("liveTab");
const uploadSection = document.getElementById("uploadSection");
const liveSection = document.getElementById("liveSection");
const dropZone = document.getElementById("dropZone");
const mediaUpload = document.getElementById("mediaUpload");
const preview = document.getElementById("preview");
const webcam = document.getElementById("webcam");
const predictBtn = document.getElementById("predictBtn");
const loader = document.getElementById("loader");
const resultBox = document.getElementById("result");

// ===== Tabs =====
uploadTab.addEventListener("click", () => {
  useWebcam = false;
  stopWebcam();   // ← matikan kamera saat pindah tab
  uploadSection.classList.remove("hidden");
  liveSection.classList.add("hidden");
  uploadTab.classList.add("active");
  liveTab.classList.remove("active");
});

liveTab.addEventListener("click", () => {
  useWebcam = true;
  uploadSection.classList.add("hidden");
  liveSection.classList.remove("hidden");
  liveTab.classList.add("active");
  uploadTab.classList.remove("active");
  startWebcam();
});

// ===== Drag & Drop + Click Upload =====
dropZone.addEventListener("click", () => mediaUpload.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.background = "#e0f2fe";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.background = "#f9fafb";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.background = "#f9fafb";
  handleMedia(e.dataTransfer.files[0]);
});

mediaUpload.addEventListener("change", function () {
  handleMedia(this.files[0]);
});

// ===== Handle Image or Video =====
function handleMedia(file) {
  if (!file) return;
  preview.innerHTML = "";
  const url = URL.createObjectURL(file);
  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    preview.appendChild(img);
  } else if (file.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    preview.appendChild(video);
  }
}

// ===== Webcam =====
async function startWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });  // ← simpan ke variabel
    webcam.srcObject = webcamStream;
  } catch (err) {
    alert("⚠️ Webcam access denied!");
  }
}

// ===== Stop Webcam — matikan hardware kamera =====
function stopWebcam() {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = null;
  }
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());  // lampu kamera ikut mati
    webcamStream = null;
    webcam.srcObject = null;
  }
  useWebcam = false;
}

// ===== Predict =====
predictBtn.addEventListener("click", async () => {
  loader.classList.remove("hidden");
  lastPrediction = "";

  try {
    if (useWebcam) {
      loader.classList.add("hidden");
      startLivePrediction();
      return;
    }

    const file = mediaUpload.files[0];
    if (!file) {
      alert("Please upload a file first!");
      loader.classList.add("hidden");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    const endpoint = file.type.startsWith("image/") ? "/predict_image" : "/predict_video";

    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json();
    typeText(data.prediction);

  } catch (err) {
    console.error(err);
    alert("Error contacting server!");
  }

  loader.classList.add("hidden");
});

// ===== Live webcam prediction loop =====
function startLivePrediction() {
  if (liveInterval) clearInterval(liveInterval);  // hindari interval ganda

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  liveInterval = setInterval(async () => {   // ← simpan ke liveInterval
    if (!useWebcam) return clearInterval(liveInterval);

    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    ctx.drawImage(webcam, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const response = await fetch("/predict_image", { method: "POST", body: formData });
      const result = await response.json();
      typeText(result.prediction);
    } catch (err) {
      console.error(err);
    }
  }, 500);
}

// ===== Update text =====
function typeText(text) {
  if (text === lastPrediction) return;
  lastPrediction = text;
  resultBox.innerText = text;
}