/* ============================================================
   SignLearn — app.js
   Menangani: navigasi, fitur belajar, translator, referensi
   ============================================================ */

// ── Peta emoji fallback (jika foto belum ada) ─────────────────
const EMOJI_MAP = {
  A:'🤟',B:'🤙',C:'👋',D:'☝️',E:'✊',F:'🖐️',G:'👉',
  H:'✌️',I:'🤞',J:'👆',K:'🖖',L:'👌',M:'🤏',N:'✋',
  O:'👊',P:'🫳',Q:'🫴',R:'🫵',S:'✊',T:'👍',U:'✌️',
  V:'🤞',W:'🖐️',X:'☝️',Y:'🤙',Z:'👋',
  '0':'0️⃣','1':'1️⃣','2':'2️⃣','3':'3️⃣','4':'4️⃣',
  '5':'5️⃣','6':'6️⃣','7':'7️⃣','8':'8️⃣','9':'9️⃣'
};

// Path foto isyarat — ganti jika folder berbeda
// Konvensi: /static/images/letters/A.jpg, /static/images/numbers/0.jpg
function getImagePath(char) {
  const c = char.toUpperCase();
  if (/[A-Z]/.test(c)) return `/static/images/letters/${c}.jpg`;
  if (/[0-9]/.test(c)) return `/static/images/numbers/${c}.jpg`;
  return null;
}

// Buat elemen gambar dengan fallback ke emoji
function makeSignCard(char) {
  const c = char.toUpperCase();
  const wrapper = document.createElement('div');
  wrapper.className = 'sign-card-wrap';

  const imgPath = getImagePath(c);
  if (imgPath) {
    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = `Isyarat ${c}`;
    img.onerror = () => {
      // Foto tidak ditemukan → tampilkan emoji
      wrapper.innerHTML = `<div class="sign-placeholder">${EMOJI_MAP[c] || c}</div>`;
    };
    wrapper.appendChild(img);
  } else {
    wrapper.innerHTML = `<div class="sign-placeholder">${EMOJI_MAP[c] || c}</div>`;
  }
  return wrapper;
}

// ── NAVIGASI ──────────────────────────────────────────────────
const PAGE_META = {
  dashboard: { title: 'Dashboard',        sub: 'Selamat datang di SignLearn' },
  learn:     { title: 'Belajar Isyarat',  sub: 'Masukkan kata untuk melihat cara pengucapan' },
  translate: { title: 'Translator',       sub: 'Deteksi bahasa isyarat via webcam atau upload' },
  reference: { title: 'Referensi',        sub: 'Semua gerakan huruf A–Z dan angka 0–9' },
  about:     { title: 'Tentang',          sub: 'Informasi aplikasi dan teknologi' }
};

function switchPage(key, navEl) {
  // Sembunyikan semua page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Tampilkan page yang dipilih
  const pg = document.getElementById(`pg-${key}`);
  if (pg) pg.classList.add('active');

  // Aktifkan nav item
  if (navEl) {
    navEl.classList.add('active');
  } else {
    const found = document.querySelector(`[data-page="${key}"]`);
    if (found) found.classList.add('active');
  }

  // Update topbar
  const meta = PAGE_META[key] || {};
  document.getElementById('topTitle').textContent = meta.title || key;
  document.getElementById('topSub').textContent = meta.sub || '';

  // Matikan webcam saat keluar dari translator
  if (key !== 'translate') stopWebcam();
}

// Pasang listener ke semua nav-item
document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    switchPage(el.dataset.page, el);
  });
});

// ── DASHBOARD PREVIEW ─────────────────────────────────────────
function buildDashPreview() {
  const strip = document.getElementById('dashPreview');
  if (!strip) return;
  'ABCDEF'.split('').forEach(c => {
    const tile = document.createElement('div');
    tile.className = 'char-tile';

    const imgPath = getImagePath(c);
    if (imgPath) {
      const img = document.createElement('img');
      img.src = imgPath;
      img.alt = c;
      img.onerror = () => {
        tile.innerHTML = `<div class="tile-placeholder">${EMOJI_MAP[c] || c}</div><span class="tile-label">${c}</span>`;
      };
      tile.appendChild(img);
      const lbl = document.createElement('span');
      lbl.className = 'tile-label';
      lbl.textContent = c;
      tile.appendChild(lbl);
    } else {
      tile.innerHTML = `<div class="tile-placeholder">${EMOJI_MAP[c]||c}</div><span class="tile-label">${c}</span>`;
    }
    strip.appendChild(tile);
  });
}
buildDashPreview();

// ── BELAJAR ───────────────────────────────────────────────────
function renderLearn() {
  const input = document.getElementById('learnInput');
  const raw = input.value.trim();
  if (!raw) return;

  // Filter: hanya A-Z dan 0-9, pisah spasi menjadi marker
  const tokens = []; // [{type:'char',val} | {type:'space'}]
  for (const ch of raw.toUpperCase()) {
    if (/[A-Z0-9]/.test(ch)) {
      tokens.push({ type: 'char', val: ch });
    } else if (ch === ' ' && tokens.length && tokens[tokens.length-1].type !== 'space') {
      tokens.push({ type: 'space' });
    }
  }
  // Hapus space di akhir
  while (tokens.length && tokens[tokens.length-1].type === 'space') tokens.pop();
  if (!tokens.length) {
    alert('Tidak ada karakter valid yang dapat ditampilkan.');
    return;
  }

  const charCount = tokens.filter(t => t.type === 'char').length;

  // Update info
  document.getElementById('learnWordDisplay').textContent = raw.toUpperCase();
  document.getElementById('learnCharCount').textContent = `${charCount} karakter`;

  // Bangun urutan isyarat
  const seq = document.getElementById('signSequence');
  seq.innerHTML = '';

  tokens.forEach((token, i) => {
    if (token.type === 'space') {
      // Penanda spasi
      const spaceMark = document.createElement('div');
      spaceMark.className = 'sign-space-marker';
      spaceMark.innerHTML = `<div class="space-line"></div><span class="space-lbl">spasi</span>`;
      seq.appendChild(spaceMark);
      return;
    }

    // Sign item
    const item = document.createElement('div');
    item.className = 'sign-item';
    item.style.animationDelay = `${i * 0.05}s`;

    const card = makeSignCard(token.val);
    const label = document.createElement('div');
    label.className = 'sign-char-label';
    label.textContent = token.val;

    item.appendChild(card);
    item.appendChild(label);
    seq.appendChild(item);

    // Panah antar karakter (bukan setelah spasi atau elemen terakhir)
    const nextToken = tokens[i + 1];
    if (nextToken && nextToken.type === 'char') {
      const arrow = document.createElement('div');
      arrow.className = 'sign-arrow';
      arrow.textContent = '›';
      seq.appendChild(arrow);
    }
  });

  // Tampilkan output
  document.getElementById('learnOutput').classList.remove('hidden');
  document.getElementById('learnEmpty').classList.add('hidden');
}

function clearLearn() {
  document.getElementById('learnInput').value = '';
  document.getElementById('learnOutput').classList.add('hidden');
  document.getElementById('learnEmpty').classList.remove('hidden');
  document.getElementById('signSequence').innerHTML = '';
}

// Enter key di input
document.getElementById('learnInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') renderLearn();
});

// ── REFERENSI ─────────────────────────────────────────────────
function buildReference() {
  const grid = document.getElementById('refGrid');
  if (!grid) return;

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numbers = '0123456789'.split('');
  const all = [
    ...letters.map(c => ({ char: c, type: 'letter' })),
    ...numbers.map(c => ({ char: c, type: 'number' }))
  ];

  all.forEach(({ char, type }) => {
    const tile = document.createElement('div');
    tile.className = `ref-tile ${type}`;
    tile.dataset.type = type;

    const imgBox = document.createElement('div');
    imgBox.className = 'ref-tile-img';

    const imgPath = getImagePath(char);
    if (imgPath) {
      const img = document.createElement('img');
      img.src = imgPath;
      img.alt = `Isyarat ${char}`;
      img.onerror = () => { imgBox.textContent = EMOJI_MAP[char] || char; };
      imgBox.appendChild(img);
    } else {
      imgBox.textContent = EMOJI_MAP[char] || char;
    }

    const lbl = document.createElement('div');
    lbl.className = 'ref-tile-label';
    lbl.textContent = char;

    tile.appendChild(imgBox);
    tile.appendChild(lbl);
    grid.appendChild(tile);
  });
}
buildReference();

function filterRef(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.ref-tile').forEach(tile => {
    if (type === 'all') {
      tile.classList.remove('hidden');
    } else {
      tile.classList.toggle('hidden', tile.dataset.type !== type);
    }
  });
}

// ── TRANSLATOR TABS ───────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${target}`)?.classList.add('active');
    if (target !== 'live') stopWebcam();
  });
});

// ── UPLOAD / PREDICT ──────────────────────────────────────────
const dropZone    = document.getElementById('dropZone');
const mediaUpload = document.getElementById('mediaUpload');
const preview     = document.getElementById('preview');
const predictBtn  = document.getElementById('predictBtn');
const loader      = document.getElementById('loader');
const resultEl    = document.getElementById('result');

dropZone?.addEventListener('click', () => mediaUpload?.click());
dropZone?.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--accent)';
});
dropZone?.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '';
});
dropZone?.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.style.borderColor = '';
  if (e.dataTransfer.files[0]) handleMedia(e.dataTransfer.files[0]);
});
mediaUpload?.addEventListener('change', function () {
  if (this.files[0]) handleMedia(this.files[0]);
});

function handleMedia(file) {
  if (!file || !preview) return;
  preview.innerHTML = '';
  const url = URL.createObjectURL(file);
  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = url; img.style.maxWidth = '100%';
    preview.appendChild(img);
  } else if (file.type.startsWith('video/')) {
    const vid = document.createElement('video');
    vid.src = url; vid.controls = true; vid.style.maxWidth = '100%';
    preview.appendChild(vid);
  }
}

predictBtn?.addEventListener('click', async () => {
  const file = mediaUpload?.files[0];
  if (!file) { alert('Pilih file terlebih dahulu!'); return; }
  loader?.classList.remove('hidden');
  if (resultEl) resultEl.textContent = '---';

  const form = new FormData();
  form.append('file', file);
  const endpoint = file.type.startsWith('image/') ? '/predict_image' : '/predict_video';

  try {
    const res = await fetch(endpoint, { method: 'POST', body: form });
    const data = await res.json();
    if (resultEl) resultEl.textContent = data.prediction ?? data.error ?? 'Error';
  } catch {
    if (resultEl) resultEl.textContent = 'Gagal menghubungi server.';
  } finally {
    loader?.classList.add('hidden');
  }
});

// ── WEBCAM ────────────────────────────────────────────────────
let webcamStream  = null;
let liveInterval  = null;
const webcamEl    = document.getElementById('webcam');
const overlayEl   = document.getElementById('webcamOverlay');

function startWebcam() {
  if (webcamStream) return;
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      webcamStream = stream;
      if (webcamEl) webcamEl.srcObject = stream;
      if (overlayEl) overlayEl.style.display = 'none';
      document.getElementById('startWebcamBtn').disabled = true;
      document.getElementById('stopWebcamBtn').disabled = false;

      // Kirim frame ke /predict_image setiap 800ms
      liveInterval = setInterval(sendFrame, 800);
    })
    .catch(err => {
      alert('Kamera tidak bisa diakses: ' + err.message);
    });
}

function stopWebcam() {
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
    if (webcamEl) webcamEl.srcObject = null;
    if (overlayEl) overlayEl.style.display = '';
  }
  const startBtn = document.getElementById('startWebcamBtn');
  const stopBtn  = document.getElementById('stopWebcamBtn');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn)  stopBtn.disabled  = true;
}

async function sendFrame() {
  if (!webcamEl || !webcamStream) return;
  const canvas = document.createElement('canvas');
  canvas.width  = webcamEl.videoWidth  || 640;
  canvas.height = webcamEl.videoHeight || 480;
  canvas.getContext('2d').drawImage(webcamEl, 0, 0);

  canvas.toBlob(async blob => {
    if (!blob) return;
    const form = new FormData();
    form.append('file', blob, 'frame.jpg');
    try {
      const res  = await fetch('/predict_image', { method: 'POST', body: form });
      const data = await res.json();
      if (resultEl && data.prediction) {
        const conf = data.confidence ? ` (${Math.round(data.confidence * 100)}%)` : '';
        resultEl.textContent = data.prediction + conf;
      }
    } catch { /* abaikan error satu frame */ }
  }, 'image/jpeg', 0.85);
}