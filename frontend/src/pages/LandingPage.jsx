import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI-Powered Analysis',
    desc: 'Extract insights, summaries, and key entities from any document in seconds using state-of-the-art language models.'
  },
  {
    icon: '🔍',
    title: 'Semantic Search',
    desc: 'Ask questions in plain English and get precise answers sourced directly from your uploaded documents.'
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    desc: 'Your documents are encrypted at rest and in transit — never used for model training.'
  },
  {
    icon: '⚡',
    title: 'Instant Processing',
    desc: 'PDFs, Word docs, text files — processed and ready to chat in seconds regardless of file size.'
  }
]

const STEPS = [
  {
    icon: '📤',
    title: 'Upload Your Document',
    desc: 'Drop any PDF or Word file. DocuMind reads and indexes it in seconds.'
  },
  {
    icon: '💬',
    title: 'Ask in Plain English',
    desc: 'No more Ctrl+F or scrolling. Just type your question naturally.'
  },
  {
    icon: '✨',
    title: 'Get Instant Answers',
    desc: 'AI finds the exact answer with source references from your document.'
  }
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon">🧠</div>
          DocuMind
        </Link>
        <div className="navbar-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard →</Link>
          ) : (
            <Link to="/auth" className="btn btn-primary">Go to Dashboard →</Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-badge">
          <span>•</span> AI-native document intelligence
        </div>
        <h1>
          Your documents,{' '}
          <span className="gradient-text">finally<br />intelligent.</span>
        </h1>
        <p className="hero-desc">
          Upload any document and have a conversation with it. DocuMind extracts knowledge,
          answers questions, and surfaces insights your team would have missed.
        </p>
        <div className="hero-actions">
          <Link to="/auth" className="btn btn-primary btn-lg">Start for Free</Link>
          <a href="#how" className="btn btn-secondary btn-lg">See How It Works →</a>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <h2>Everything you need to unlock your documents</h2>
        <p>Built for legal teams, researchers, finance professionals, and anyone who works with complex documents daily.</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works" id="how">
        <h2>How it works</h2>
        <p>From upload to insight in three steps.</p>
        <div className="steps">
          {STEPS.map((s, i) => (
            <>
              <div key={i} className="step">
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div key={`arrow-${i}`} className="step-arrow">›</div>
              )}
            </>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="cta-banner">
        <h2>Ready to unlock your documents?</h2>
        <p>Join thousands of professionals who already use DocuMind daily.</p>
        <Link to="/auth" className="btn btn-primary btn-lg">Get Started for Free</Link>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <div className="logo-icon">🧠</div>
          DocuMind
        </div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Security</a>
          <a href="#">Blog</a>
        </div>
        <p className="footer-copy">© 2026 DocuMind, Inc.</p>
      </footer>
    </div>
  )
}