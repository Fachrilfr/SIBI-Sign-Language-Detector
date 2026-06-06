import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../assets/static/app.css';
import logo from '../assets/static/Tanara.PNG';

// Only letters that exist in labels.json (no J, no Z)
const QUIZ_ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXY";

const EMOJI_MAP = {
  A:'🤟',B:'🤙',C:'👋',D:'☝️',E:'✊',F:'🖐️',G:'👉',
  H:'✌️',I:'🤞',J:'👆',K:'🖖',L:'👌',M:'🤏',N:'✋',
  O:'👊',P:'🫳',Q:'🫴',R:'🫵',S:'✊',T:'👍',U:'✌️',
  V:'🤞',W:'🖐️',X:'☝️',Y:'🤙',Z:'👋',
  '0':'0️⃣','1':'1️⃣','2':'2️⃣','3':'3️⃣','4':'4️⃣',
  '5':'5️⃣','6':'6️⃣','7':'7️⃣','8':'8️⃣','9':'9️⃣'
};

const getImagePath = (char) => {
  const c = char.toUpperCase();
  if (/[A-Z]/.test(c)) return `/src/assets/static/images/letters/${c}.jpg`;
  if (/[0-9]/.test(c)) return `/src/assets/static/images/numbers/${c}.jpg`;
  return null;
};

const PAGE_META = {
  dashboard: { title: 'Dashboard',        sub: 'Selamat datang di Tanara' },
  learn:     { title: 'Belajar Isyarat',  sub: 'Masukkan kata untuk melihat cara pengucapan' },
  quiz:      { title: 'Tantangan Kuis',   sub: 'Uji kemampuan isyarat Anda dalam 60 detik' },
  translate: { title: 'Translator',       sub: 'Deteksi bahasa isyarat via webcam atau upload' },
  reference: { title: 'Referensi',        sub: 'Semua gerakan huruf A–Z dan angka 0–9' },
  about:     { title: 'Tentang',          sub: 'Informasi aplikasi dan teknologi' }
};

export default function MainApp() {
  const [activePage, setActivePage] = useState('dashboard');
  
  // Learn state
  const [learnInput, setLearnInput] = useState('');
  const [learnTokens, setLearnTokens] = useState([]);
  
  // Translator state
  const [translateTab, setTranslateTab] = useState('upload');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [translateResult, setTranslateResult] = useState('—');
  const videoRef = useRef(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const webcamIntervalRef = useRef(null);
  const webcamStreamRef = useRef(null);

  // Reference state
  const [refFilter, setRefFilter] = useState('all');

  // Quiz state
  const [quizStatus, setQuizStatus] = useState('idle'); // idle, playing, gameover
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState(60);
  const [quizTarget, setQuizTarget] = useState('A');
  const [quizFeedback, setQuizFeedback] = useState('');
  const [quizAiResult, setQuizAiResult] = useState('—'); // what AI currently sees
  
  const quizTimerRef = useRef(null);
  const quizScoreRef = useRef(0);
  const quizTargetRef = useRef('A');
  const quizLockRef = useRef(false);
  const activePageRef = useRef(activePage);
  const quizStatusRef = useRef(quizStatus);

  useEffect(() => { activePageRef.current = activePage; }, [activePage]);
  useEffect(() => { quizStatusRef.current = quizStatus; }, [quizStatus]);

  // Navigate & cleanup
  const handlePageChange = (page) => {
    setActivePage(page);
    if (page !== 'translate' && page !== 'quiz') {
      stopWebcam();
    }
    if (page !== 'quiz') {
      endQuiz();
    }
  };

  // --- QUIZ LOGIC ---
  const startQuiz = async () => {
    try {
      await startWebcam();
      // Set ref immediately so interval can read it right away (state is async)
      quizStatusRef.current = 'playing';
      setQuizStatus('playing');
      setQuizScore(0);
      quizScoreRef.current = 0;
      setQuizTimeLeft(60);
      quizLockRef.current = false;
      setQuizAiResult('—');
      nextQuizTarget();
      
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      quizTimerRef.current = setInterval(() => {
        setQuizTimeLeft(prev => {
          if (prev <= 1) {
            endQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch(err) {
      alert('Gagal memulai kuis karena kamera tidak aktif.');
    }
  };

  const endQuiz = (showGameOver = false) => {
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    if (activePageRef.current !== 'translate' && !showGameOver) stopWebcam();
    if (showGameOver) {
      setQuizStatus('gameover');
      stopWebcam();
    } else {
      setQuizStatus('idle');
      setQuizScore(0);
      setQuizTimeLeft(60);
    }
  };

  const nextQuizTarget = () => {
    let nextChar = QUIZ_ALPHABET[Math.floor(Math.random() * QUIZ_ALPHABET.length)];
    while (nextChar === quizTargetRef.current) {
      nextChar = QUIZ_ALPHABET[Math.floor(Math.random() * QUIZ_ALPHABET.length)];
    }
    setQuizTarget(nextChar);
    quizTargetRef.current = nextChar;
    setQuizFeedback('');
  };

  // --- LEARN LOGIC ---
  const handleLearn = () => {
    const raw = learnInput.trim();
    if (!raw) return setLearnTokens([]);

    const tokens = [];
    for (const ch of raw.toUpperCase()) {
      if (/[A-Z0-9]/.test(ch)) {
        tokens.push({ type: 'char', val: ch });
      } else if (ch === ' ' && tokens.length && tokens[tokens.length-1].type !== 'space') {
        tokens.push({ type: 'space' });
      }
    }
    while (tokens.length && tokens[tokens.length-1].type === 'space') tokens.pop();
    
    if (!tokens.length) {
      alert('Tidak ada karakter valid yang dapat ditampilkan.');
      return;
    }
    setLearnTokens(tokens);
  };

  // --- TRANSLATE LOGIC ---
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
  };

  const handlePredict = async () => {
    if (!mediaFile) {
      alert('Pilih file terlebih dahulu!');
      return;
    }
    setIsPredicting(true);
    setTranslateResult('---');

    const form = new FormData();
    form.append('file', mediaFile);
    const endpoint = mediaFile.type.startsWith('image/') ? '/api/predict_image' : '/api/predict_video';

    try {
      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = await res.json();
      setTranslateResult(data.prediction ?? data.error ?? 'Error');
    } catch {
      setTranslateResult('Gagal menghubungi server.');
    } finally {
      setIsPredicting(false);
    }
  };

  const startWebcam = async () => {
    if (webcamStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(stream);
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      webcamIntervalRef.current = setInterval(sendFrame, 800);
    } catch (err) {
      alert('Kamera tidak bisa diakses: ' + err.message);
    }
  };

  const stopWebcam = () => {
    if (webcamIntervalRef.current) {
      clearInterval(webcamIntervalRef.current);
      webcamIntervalRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
      setWebcamStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  const sendFrame = () => {
    if (!videoRef.current || !webcamStreamRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth  || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      try {
        const res  = await fetch('/api/predict_image', { method: 'POST', body: form });
        const data = await res.json();
        const pred = data.prediction || '';
        const conf = data.confidence ?? 0;

        // Show live AI reading in translate page
        if (pred && pred !== 'No Hand Detected' && pred !== 'Uncertain') {
          setTranslateResult(pred + ` (${Math.round(conf * 100)}%)`);
        } else {
          setTranslateResult(pred || '—');
        }

        // Update what AI sees in quiz panel (always, for user feedback)
        if (activePageRef.current === 'quiz') {
          setQuizAiResult(pred || '—');
        }

        // Quiz scoring check
        if (
          activePageRef.current === 'quiz' &&
          quizStatusRef.current === 'playing' &&
          !quizLockRef.current &&
          pred &&
          pred !== 'No Hand Detected' &&
          pred !== 'Uncertain'
        ) {
          // Normalize both to uppercase for comparison
          if (pred.toUpperCase() === quizTargetRef.current.toUpperCase() && conf >= 0.5) {
            quizScoreRef.current += 10;
            setQuizScore(quizScoreRef.current);
            setQuizFeedback('✅ Benar! +10');
            quizLockRef.current = true;
            setTimeout(() => {
              nextQuizTarget();
              quizLockRef.current = false;
            }, 1200);
          }
        }
      } catch (err) {
        console.error('Frame error:', err);
      }
    }, 'image/jpeg', 0.85);
  };

  useEffect(() => {
    return () => {
      stopWebcam(); // cleanup on unmount
    };
  }, []);

  // Ensure video element gets the stream when it mounts (e.g., when switching to 'playing' state)
  useEffect(() => {
    if (videoRef.current && webcamStream && videoRef.current.srcObject !== webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  });

  return (
    <div className="shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="brand">
            <div className="brand-mark">
              <img src={logo} alt="Logo Tanara" />
            </div>
            <span className="brand-name">Tan<em>ara</em></span>
          </Link>

          <nav className="sidenav">
            {['dashboard', 'learn', 'quiz', 'translate', 'reference'].map(key => (
              <a
                key={key}
                href="#"
                className={`nav-item ${activePage === key ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handlePageChange(key); }}
              >
                {key === 'dashboard' && <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>}
                {key === 'learn' && <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13V5l6-3 6 3v8"/><path d="M8 13V9"/><path d="M5 7l3-1.5L11 7"/></svg>}
                {key === 'quiz' && <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="12" height="8" rx="2"/><path d="M4.5 8h2M5.5 7v2M11.5 8h.01M9.5 8h.01"/></svg>}
                {key === 'translate' && <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h8M6 2v2M3 4c0 3 2 5 4 6"/><path d="M7 4c0 3 2.5 5.5 5 6"/><circle cx="12" cy="12" r="3"/><path d="M12 10.5v1.5l1 1"/></svg>}
                {key === 'reference' && <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5.5h6M5 10.5h4"/></svg>}
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </a>
            ))}
            <div className="nav-divider"></div>
            <a
              href="#"
              className={`nav-item ${activePage === 'about' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handlePageChange('about'); }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v5M8 5v.5"/></svg>
              Tentang
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <Link to="/" className="nav-item" style={{ fontSize: '0.78rem', color: 'var(--mist)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3H3v10h7M6 8h8M11 5l3 3-3 3"/></svg>
            Kembali ke Beranda
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main">
        <header className="topbar">
          <div>
            <div className="page-title">{PAGE_META[activePage]?.title}</div>
            <div className="page-sub">{PAGE_META[activePage]?.sub}</div>
          </div>
        </header>

        {/* DASHBOARD */}
        {activePage === 'dashboard' && (
          <section className="page active">
            <div className="dash-welcome">
              <h2>Halo, <em>teman Tanara</em> </h2>
              <p>Mau belajar isyarat hari ini, atau coba deteksi langsung lewat kamera?</p>
            </div>
            
            <div className="metrics-row">
              <div className="metric-card"><div className="metric-label">Total Karakter</div><div className="metric-val">36</div></div>
              <div className="metric-card"><div className="metric-label">Huruf A–Z</div><div className="metric-val clay">26</div></div>
              <div className="metric-card"><div className="metric-label">Angka 0–9</div><div className="metric-val">10</div></div>
              <div className="metric-card"><div className="metric-label">Akurasi Model</div><div className="metric-val clay">~95%</div></div>
            </div>

            <div className="dash-cards">
              <div className="dash-card featured" onClick={() => handlePageChange('learn')}>
                <div className="dash-card-index">01</div>
                <div className="dash-card-title">Belajar Isyarat</div>
                <p className="dash-card-desc">Ketik kata atau kalimat, lihat urutan gerakan isyarat per karakter dengan foto nyata.</p>
                <div className="dash-card-arrow">→</div>
              </div>
              <div className="dash-card" onClick={() => handlePageChange('translate')}>
                <div className="dash-card-index">02</div>
                <div className="dash-card-title">Translator Kamera</div>
                <p className="dash-card-desc">Tunjukkan isyarat ke webcam, Tanara kenali dan terjemahkan secara langsung.</p>
                <div className="dash-card-arrow">→</div>
              </div>
              <div className="dash-card" onClick={() => handlePageChange('reference')}>
                <div className="dash-card-index">03</div>
                <div className="dash-card-title">Referensi Lengkap</div>
                <p className="dash-card-desc">Semua karakter A–Z dan 0–9 dalam satu galeri visual yang mudah dijelajahi.</p>
                <div className="dash-card-arrow">→</div>
              </div>
            </div>

            <div className="dash-preview">
              <span className="section-label">Pratinjau — Huruf A hingga F</span>
              <div className="char-strip">
                {'ABCDEF'.split('').map(c => (
                  <div className="char-tile" key={c}>
                    {getImagePath(c) ? (
                      <img src={getImagePath(c)} alt={c} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                    ) : null}
                    <div className="tile-placeholder" style={{display: getImagePath(c) ? 'none' : 'block'}}>{EMOJI_MAP[c]}</div>
                    <span className="tile-label">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* LEARN */}
        {activePage === 'learn' && (
          <section className="page active">
            <div className="learn-box">
              <label className="input-label">Ketik kata atau kalimat</label>
              <div className="input-row">
                <input type="text" className="text-input" placeholder="Contoh: Halo..." maxLength="120"
                       value={learnInput} onChange={e => setLearnInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleLearn()} />
                <button className="btn-primary" onClick={handleLearn}>Tampilkan →</button>
                <button className="btn-ghost" onClick={() => {setLearnInput(''); setLearnTokens([]);}}>Bersihkan</button>
              </div>
              <p className="input-hint">Spasi diperlihatkan sebagai pemisah · tanda baca dilewati otomatis</p>
            </div>

            {learnTokens.length > 0 ? (
              <div id="learnOutput">
                <div className="learn-word-info">
                  <span className="learn-word">{learnInput.toUpperCase()}</span>
                  <span className="learn-count">{learnTokens.filter(t => t.type==='char').length} karakter</span>
                </div>
                <div className="sign-sequence">
                  {learnTokens.map((token, i) => {
                    if (token.type === 'space') {
                      return (
                        <div key={`space-${i}`} className="sign-space-marker">
                          <div className="space-line"></div><span className="space-lbl">spasi</span>
                        </div>
                      );
                    }
                    const nextToken = learnTokens[i + 1];
                    const hasArrow = nextToken && nextToken.type === 'char';
                    return (
                      <React.Fragment key={`${token.val}-${i}`}>
                        <div className="sign-item" style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="sign-card-wrap">
                            {getImagePath(token.val) ? (
                              <img src={getImagePath(token.val)} alt={token.val} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block';}} />
                            ) : null}
                            <div className="sign-placeholder" style={{display: getImagePath(token.val)?'none':'block'}}>{EMOJI_MAP[token.val]}</div>
                          </div>
                          <div className="sign-char-label">{token.val}</div>
                        </div>
                        {hasArrow && <div className="sign-arrow">›</div>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✍️</div>
                <p>Ketik kata di atas untuk mulai belajar</p>
              </div>
            )}
          </section>
        )}

        {/* QUIZ */}
        {activePage === 'quiz' && (
          <section className="page active">
            {quizStatus === 'idle' && (
              <div className="quiz-idle">
                <div className="quiz-icon">🏆</div>
                <h2>Siap Menguji Kemampuanmu?</h2>
                <p>Selesaikan tantangan selama 60 detik. Tunjukkan isyarat huruf yang diminta ke kamera secepat dan setepat mungkin.</p>
                <button className="btn-primary" onClick={startQuiz}>Mulai Kuis</button>
              </div>
            )}

            {quizStatus === 'playing' && (
              <div className="quiz-playing">
                <div className="quiz-header">
                  <div className="quiz-timer">Waktu Tersisa: <span>{quizTimeLeft}s</span></div>
                  <div className="quiz-score">Skor: <span>{quizScore}</span></div>
                </div>
                
                <div className="quiz-layout">
                  <div className="quiz-target-card">
                    <div className="quiz-target-label">Tunjukkan Isyarat:</div>
                    <div className="quiz-target-char">{quizTarget}</div>
                    <div className={`quiz-feedback ${quizFeedback ? 'show' : ''}`}>{quizFeedback || '\u00a0'}</div>
                    <div className="quiz-ai-reading">
                      <span className="quiz-ai-label">AI Mendeteksi:</span>
                      <span className={`quiz-ai-value ${quizAiResult === quizTarget ? 'match' : ''}`}>{quizAiResult}</span>
                    </div>
                  </div>
                  
                  <div className="quiz-webcam">
                    <div className="webcam-wrapper">
                      <video ref={videoRef} autoPlay playsInline muted className="webcam-feed"></video>
                      {!webcamStream && <div className="webcam-overlay">Memuat kamera...</div>}
                    </div>
                  </div>
                </div>
                <button className="btn-ghost btn-danger" style={{ alignSelf: 'flex-start' }} onClick={() => endQuiz(true)}>Berhenti Bermain</button>
              </div>
            )}


            {quizStatus === 'gameover' && (
              <div className="quiz-gameover">
                <div className="quiz-icon">🎉</div>
                <h2>Waktu Habis!</h2>
                <p>Skor akhirmu adalah:</p>
                <div className="quiz-final-score">{quizScore}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" onClick={startQuiz}>Main Lagi</button>
                  <button className="btn-ghost" onClick={() => handlePageChange('dashboard')}>Kembali</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TRANSLATE */}
        {activePage === 'translate' && (
          <section className="page active">
            <div className="translator-layout">
              <div className="tabs">
                <button className={`tab ${translateTab === 'upload' ? 'active' : ''}`} onClick={() => setTranslateTab('upload')}>Unggah File</button>
                <button className={`tab ${translateTab === 'live' ? 'active' : ''}`} onClick={() => setTranslateTab('live')}>Kamera Langsung</button>
              </div>

              {translateTab === 'upload' ? (
                <div className="tab-content active">
                  <div className="drop-zone" onClick={() => document.getElementById('mediaUpload').click()}>
                    <div className="drop-icon">📂</div>
                    <p className="drop-title">Seret & lepas, atau klik untuk pilih</p>
                    <p className="drop-hint">Gambar (JPG, PNG) atau video (MP4, AVI, MOV)</p>
                    <input type="file" id="mediaUpload" accept="video/*, image/*" hidden onChange={handleMediaUpload} />
                  </div>
                  {mediaUrl && (
                    <div className="media-preview">
                      {mediaFile.type.startsWith('image/') ? <img src={mediaUrl} style={{maxWidth:'100%'}}/> : <video src={mediaUrl} controls style={{maxWidth:'100%'}}/>}
                    </div>
                  )}
                  <button className="btn-primary" style={{marginTop:'1rem'}} onClick={handlePredict} disabled={isPredicting}>
                    {isPredicting ? 'Memproses...' : 'Terjemahkan →'}
                  </button>
                </div>
              ) : (
                <div className="tab-content active">
                  <div className="webcam-wrapper">
                    <video ref={videoRef} autoPlay playsInline muted className="webcam-feed"></video>
                    {!webcamStream && <div className="webcam-overlay">Kamera belum aktif</div>}
                  </div>
                  <div className="webcam-controls">
                    <button className="btn-primary" onClick={startWebcam} disabled={!!webcamStream}>Mulai Kamera</button>
                    <button className="btn-ghost btn-danger" onClick={stopWebcam} disabled={!webcamStream}>Matikan Kamera</button>
                  </div>
                </div>
              )}

              {isPredicting && <div className="loader">⏳ Memproses...</div>}

              <div className="result-box">
                <div className="result-label">Hasil Terjemahan</div>
                <div className="result-text">{translateResult}</div>
              </div>
            </div>
          </section>
        )}

        {/* REFERENCE */}
        {activePage === 'reference' && (
          <section className="page active">
            <div className="ref-filter">
              <button className={`filter-btn ${refFilter === 'all' ? 'active' : ''}`} onClick={() => setRefFilter('all')}>Semua</button>
              <button className={`filter-btn ${refFilter === 'letter' ? 'active' : ''}`} onClick={() => setRefFilter('letter')}>Huruf A–Z</button>
              <button className={`filter-btn ${refFilter === 'number' ? 'active' : ''}`} onClick={() => setRefFilter('number')}>Angka 0–9</button>
            </div>
            <div className="ref-grid">
              {['ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '0123456789'.split('')].flatMap((arr, i) => 
                arr.map(char => ({ char, type: i === 0 ? 'letter' : 'number' }))
              ).map(({char, type}) => (
                <div key={char} className={`ref-tile ${type} ${refFilter !== 'all' && refFilter !== type ? 'hidden' : ''}`}>
                  <div className="ref-tile-img">
                    {getImagePath(char) ? (
                      <img src={getImagePath(char)} alt={char} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block';}} />
                    ) : null}
                    <span style={{display: getImagePath(char)?'none':'block'}}>{EMOJI_MAP[char] || char}</span>
                  </div>
                  <div className="ref-tile-label">{char}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ABOUT */}
        {activePage === 'about' && (
          <section className="page active">
            <div className="about-layout">
              <h2 className="about-headline">Teknologi untuk<br/><em>semua suara</em></h2>
              <p className="about-intro">
                Tanara dibangun atas keyakinan bahwa komunikasi adalah hak semua orang.
                Namanya lahir dari dua kata — <strong>tangan</strong> dan <strong>bicara</strong> —
                yang menjadi jembatan antara dua dunia.
              </p>

              <div className="about-cards">
                <div className="about-card">
                  <div className="about-card-label">Model AI</div><div className="about-card-title">MobileNetV2</div>
                  <p>Transfer learning dari ImageNet, fine-tuning untuk 36 kelas gesture SIBI.</p>
                </div>
                <div className="about-card">
                  <div className="about-card-label">Deteksi Tangan</div><div className="about-card-title">MediaPipe Hands</div>
                  <p>Mendeteksi tangan sekaligus dan menggabungkan area crop menjadi satu region.</p>
                </div>
                <div className="about-card">
                  <div className="about-card-label">Frontend</div><div className="about-card-title">React + Vite</div>
                  <p>Single Page Application yang cepat dan responsif dengan performa maksimal.</p>
                </div>
                <div className="about-card">
                  <div className="about-card-label">Backend</div><div className="about-card-title">Flask API</div>
                  <p>REST API ringan dengan endpoint prediksi gambar dan video dari browser.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
