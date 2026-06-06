import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../assets/static/landing.css';
import logo from '../assets/static/Tanara.PNG';

export default function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-body">
      {/* NAVIGASI */}
      <nav>
        <Link to="/" className="nav-brand">
          <div className="nav-brand-mark">
            <img src={logo} alt="Logo Tanara" />
          </div>
          <span className="nav-brand-name">Tanara</span>
        </Link>

        <ul className="nav-links">
          <li><a href="#beranda">Beranda</a></li>
          <li><a href="#tentang">Tentang Kami</a></li>
          <li><a href="#cara-pakai">Cara Pakai</a></li>
        </ul>

        <Link to="/app" className="nav-cta">Mulai →</Link>
      </nav>

      {/* HERO */}
      <div className="hero-wrapper" id="beranda">
        <section className="hero">
          <div className="hero-content-center">
            
            <h1>Cara baru belajar &<br />memahami isyarat</h1>
            
            <p className="hero-desc">
              Tanara hadir sebagai teman bicara — membantu kamu memahami
              dan mempelajari Sistem Isyarat Bahasa Indonesia (SIBI) dengan
              cara yang termudah, tercepat, dan terasa manusiawi.
            </p>
            
            <div className="hero-actions-center">
              <Link to="/app" className="btn-primary">Mulai Belajar</Link>
              <a href="#cara-pakai" className="btn-ghost">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                Cara Pakai
              </a>
            </div>
            

          </div>
        </section>
      </div>



      {/* ABOUT & FITUR */}
      <section className="about-section" id="tentang">
        <div className="about-header text-center reveal">
          <span className="about-eyebrow">TENTANG KAMI</span>
          <h2 className="about-title">Identitas, Filosofi,<br />dan Nilai Tanara</h2>
        </div>
        
        <div className="about-widget-container">
          {/* Top Green Box (Features) */}
          <div className="about-features-box reveal" style={{ transitionDelay: '.1s' }}>
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <span className="feature-text">Deteksi Langsung</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📖</span>
              <span className="feature-text">Belajar Isyarat</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">Real-time AI</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span className="feature-text">Referensi Lengkap</span>
            </div>
          </div>
          
          {/* Bottom White Box (Vision/Mission) */}
          <div className="about-content-box reveal" style={{ transitionDelay: '.2s' }}>
            <div className="about-col">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Filosofi
              </h3>
              <p>
                Tanara lahir dari keyakinan bahwa komunikasi adalah hak semua orang. Nama ini berasal dari kata <strong>tangan</strong> dan <strong>bicara</strong> — dua hal yang menjadi jembatan antara dunia yang berbeda.
              </p>
            </div>
            
            <div className="about-divider-vertical"></div>
            
            <div className="about-col">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Tujuan
              </h3>
              <p>
                Dengan teknologi AI yang memahami gerakan tangan secara real-time, Tanara tidak hanya menerjemahkan — ia menemanimu belajar, berlatih, dan akhirnya berbicara dengan cara yang baru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CARA PAKAI */}
      <section className="howto" id="cara-pakai">
        <div className="howto-header reveal">
          <span className="howto-eyebrow">Cara pakai</span>
          <h2 className="howto-title">Empat langkah mudah</h2>
        </div>
        <div className="howto-steps">
          <div className="howto-step reveal">
            <div className="step-dot">1</div>
            <h3 className="step-title">Buka Tanara</h3>
            <p className="step-desc">Klik "Mulai belajar" dan masuk ke halaman utama aplikasi.</p>
          </div>
          <div className="howto-step reveal" style={{ transitionDelay: '.08s' }}>
            <div className="step-dot">2</div>
            <h3 className="step-title">Pilih fitur</h3>
            <p className="step-desc">Belajar isyarat, gunakan kamera langsung, atau buka referensi.</p>
          </div>
          <div className="howto-step reveal" style={{ transitionDelay: '.16s' }}>
            <div className="step-dot">3</div>
            <h3 className="step-title">Ketik atau gerakkan</h3>
            <p className="step-desc">Masukkan teks untuk belajar, atau tunjukkan tangan ke kamera.</p>
          </div>
          <div className="howto-step reveal" style={{ transitionDelay: '.24s' }}>
            <div className="step-dot">4</div>
            <h3 className="step-title">Praktikkan</h3>
            <p className="step-desc">Ulangi, pelajari, dan jadikan isyarat bagian dari cara bicaramu.</p>
          </div>
        </div>
      </section>



      {/* FOOTER */}
      <footer>
        <div className="footer-brand">Tan<span>ara</span></div>
        <p>Tanara · Sistem Isyarat Bahasa Indonesia (SIBI)</p>
        <p>Dibangun dengan ❤ dan dua tangan</p>
      </footer>
    </div>
  );
}
