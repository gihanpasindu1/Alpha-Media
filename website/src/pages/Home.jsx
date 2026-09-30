import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Zap, ArrowRight, Sparkles,
  Mic2, Wand2, Minimize, Palette, Type
} from 'lucide-react'
import './Home.css'

import { allTools } from './Tools'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } })
}

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="hero-badge"
          >
            <Sparkles size={14} />
            All-in-one Multimedia Toolkit
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Everything you need<br />
            <span className="glow-text">in one place</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hero-sub"
          >
            Download videos, trim clips, convert GIFs, remove backgrounds,<br />
            edit PDFs, and more — all free, all fast, all private.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="hero-actions"
          >
            <Link to="/tools" className="btn btn-primary">
              <Zap size={18} /> Get Started
            </Link>
            <a href="#top-tools" className="btn btn-secondary">
              Explore Tools <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="tools-section" id="top-tools">
        <div className="container">
          <div className="section-header">
            <h2>Our Top Tools</h2>
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
                  <div className="tool-tile-icon" style={{ background: `${color}20`, color }}>
                    <Icon size={26} />
                  </div>
                  <div className="tool-tile-body">
                    <h3>{label}</h3>
                    <p>{desc}</p>
                  </div>
                  <ArrowRight size={18} className="tool-tile-arrow" />
                </Link>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/tools" className="btn btn-secondary">
              View All 13 Tools <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
