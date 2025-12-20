'use client';

import { useEffect } from 'react';
import './page.css';

export default function Home() {
  useEffect(() => {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href') || '');
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main>
      {/* Navigation */}
      <nav>
        <div className="nav-container">
          <div className="logo">Focus Circle</div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
            <li><a href="/privacy-policy">Privacy</a></li>
          </ul>
          <button className="mobile-menu-btn">☰</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Stay Focused.<br />Get More Done.</h1>
          <p className="subheadline">Eliminate distractions and reclaim hours of deep work every week</p>
          <div className="cta-buttons">
            <a href="https://apps.apple.com/app/focus-circle" className="btn btn-primary">Start Free</a>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section fade-in">
        <h2 className="section-title">Stop losing 3+ hours daily to distractions</h2>
        <div className="problem-section">
          <div className="comparison">
            <div className="comparison-item before">
              <div className="comparison-title">Before Focus Circle</div>
              <ul className="comparison-list">
                <li>47 unread messages</li>
                <li>Scattered ideas across 5 apps</li>
                <li>Overwhelmed by endless notifications</li>
                <li>Can&apos;t find that important note</li>
                <li>Tasks scattered everywhere</li>
              </ul>
            </div>
            <div className="comparison-item after">
              <div className="comparison-title">With Focus Circle</div>
              <ul className="comparison-list">
                <li>Organized categories</li>
                <li>Quick voice-to-text capture</li>
                <li>AI-powered search finds anything</li>
                <li>Today&apos;s focus tasks at a glance</li>
                <li>Calm, distraction-free interface</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section fade-in">
        <h2 className="section-title">Everything you need to stay focused</h2>
        <p className="section-subtitle">Powerful features designed to help you capture and organize your thoughts effortlessly</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3 className="feature-title">Record Your Ideas</h3>
            <p className="feature-description">Capture thoughts instantly with voice recording. Automatic transcription means you never lose an idea, even when you&apos;re on the go.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📁</div>
            <h3 className="feature-title">Smart Organization</h3>
            <p className="feature-description">AI-powered categorization automatically organizes your ideas into visual tags. No more hunting through endless notes.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3 className="feature-title">Today&apos;s Focus Tasks</h3>
            <p className="feature-description">See exactly what matters today. Automatic task migration ensures nothing falls through the cracks.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3 className="feature-title">AI Search Engine</h3>
            <p className="feature-description">Find ideas by meaning, not keywords. Our semantic search understands what you&apos;re looking for, even if you can&apos;t remember the exact words.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="section fade-in">
        <h2 className="section-title">Loved by students and professionals</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">&quot;Focus Circle has completely transformed how I capture and organize ideas. The voice recording feature is a game-changer for my busy schedule.&quot;</p>
            <div className="testimonial-author">Sarah Chen</div>
            <div className="testimonial-role">Graduate Student, Stanford</div>
          </div>

          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">&quot;Finally, an app that understands how my brain works. The AI categorization saves me hours every week. Highly recommend!&quot;</p>
            <div className="testimonial-author">Michael Park</div>
            <div className="testimonial-role">Product Manager, Tech Startup</div>
          </div>

          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">&quot;The semantic search is incredible. I can find any idea instantly, even if I only remember part of what I wrote. This app is a lifesaver.&quot;</p>
            <div className="testimonial-author">Emily Rodriguez</div>
            <div className="testimonial-role">Freelance Writer</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section fade-in">
        <h2 className="section-title">Ready to reclaim your focus?</h2>
        <p className="section-subtitle">Join 1000+ students and professionals who are getting more done with Focus Circle</p>
        <a href="https://apps.apple.com/app/focus-circle" className="btn btn-primary">Download on App Store</a>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h4>Focus Circle</h4>
            <p style={{ color: 'var(--text-muted)' }}>Made with ❤️ by Professor Cat Limited<br />Hong Kong</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="/privacy-policy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="LinkedIn">💼</a>
              <a href="#" aria-label="Instagram">📷</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Professor Cat Limited. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
