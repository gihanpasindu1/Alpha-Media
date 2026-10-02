import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Cpu, Star } from 'lucide-react'
import './Home.css'
import { allTools } from './Tools'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.22,1,0.36,1] } })
}

const stats = [
  { value: '25+', label: 'Free Tools' },
  { value: '100%', label: 'Free Forever' },
  { value: '0', label: 'Sign-up Required' },
  { value: 'Fast', label: 'Cloud Processing' },
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="container hero-content">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-badge"
          >
            <span className="badge-dot" />
            All Systems Online · 25+ Tools Available
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
          >
            The Ultimate Free<br />
            <span className="glow-text">Multimedia Toolkit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hero-sub"
          >
            Download videos, trim clips, convert GIFs, remove backgrounds,
            extract subtitles, blur faces and more — all free, no sign-up required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="hero-actions"
          >
            <Link to="/tools" className="hero-btn-primary">
              Browse All Tools <ArrowRight size={16} />
            </Link>
            <a href="#tools-section" className="hero-btn-secondary">
              ↓ &nbsp;See what's inside
            </a>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="hero-stats"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="hero-stat">
                <span className="hero-stat-value">{value}</span>
                <span className="hero-stat-label">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="tools-section" id="tools-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">
              <Zap size={12} fill="currentColor" />
              Top Tools
            </div>
            <h2>Everything you need,<br /><span className="glow-text">in one place</span></h2>
            <p>Professional-grade multimedia processing, right in your browser</p>
          </div>

          <div className="tools-grid">
            {allTools.slice(0, 6).map(({ to, icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={to}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
              >
                <Link to={to} className="tool-tile">
                  <div className="tool-tile-icon" style={{ background: `${color}15`, color }}>
                    <Icon size={24} />
                  </div>
                  <div className="tool-tile-body">
                    <h3>{label}</h3>
                    <p>{desc}</p>
                  </div>
                  <ArrowRight size={16} className="tool-tile-arrow" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="tools-footer">
            <Link to="/tools" className="btn btn-secondary">
              View All {allTools.length} Tools <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Cloud-powered processing means results in seconds, not minutes.' },
              { icon: Shield, title: 'Privacy First', desc: 'Your files are processed and deleted immediately. We never store them.' },
              { icon: Cpu, title: 'AI Powered', desc: 'Advanced AI models for background removal, face blur, OCR and more.' },
              { icon: Star, title: 'Always Free', desc: 'No subscriptions, no paywalls, no credit card. Just tools that work.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                className="feature-card"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-30px' }}
                variants={fadeUp}
              >
                <div className="feature-icon">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
