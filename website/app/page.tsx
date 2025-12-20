import Link from 'next/link'
import './page.css'

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Capture & Organize<br />
              Your Ideas Instantly
            </h1>
            <p className="hero-subtitle">
              An ADHD-friendly app for capturing, organizing, and finding ideas using voice recording, 
              text input, and AI-powered categorization.
            </p>
            <div className="hero-buttons">
              <a 
                href="https://apps.apple.com/app/focus-circle" 
                className="btn btn-primary btn-large"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download on App Store
              </a>
              <a 
                href="#features" 
                className="btn btn-secondary btn-large"
              >
                Learn More
              </a>
            </div>
            <div className="hero-badge">
              <span>✨ Coming Soon to iOS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section features-section">
        <div className="container">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">
            Powerful features designed to help you capture and organize your thoughts effortlessly.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3 className="feature-title">Voice Recording</h3>
              <p className="feature-description">
                Record your ideas instantly with automatic transcription. Perfect for capturing thoughts on the go.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3 className="feature-title">Text Input</h3>
              <p className="feature-description">
                Type ideas directly with a clean, distraction-free interface designed for focus.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Categorization</h3>
              <p className="feature-description">
                Automatic category suggestions using AI. Organize your ideas effortlessly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Semantic Search</h3>
              <p className="feature-description">
                Find ideas by meaning, not just keywords. Powered by advanced AI embeddings.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3 className="feature-title">To-Do List</h3>
              <p className="feature-description">
                Daily task management with automatic task migration. Never lose track of your tasks.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📁</div>
              <h3 className="feature-title">Custom Categories</h3>
              <p className="feature-description">
                Organize ideas into custom categories. Create your own organizational system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="section-title">Ready to Get Started?</h2>
            <p className="section-subtitle">
              Download Focus Circle today and start capturing your ideas effortlessly.
            </p>
            <div className="cta-buttons">
              <a 
                href="https://apps.apple.com/app/focus-circle" 
                className="btn btn-primary btn-large"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download on App Store
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4 className="footer-title">Focus Circle</h4>
              <p className="footer-text">
                Made with ❤️ by Professor Cat Limited<br />
                Hong Kong
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li><a href="mailto:support@focuscircle.app">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Professor Cat Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

