import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Zap, ArrowRight, Sparkles,
  Mic2, Wand2, Minimize, Palette, Type
} from 'lucide-react'
import './Home.css'

const tools = [
  { to: '/download', icon: Download, label: 'Video Downloader', desc: 'Download from YouTube, TikTok, Instagram & more in any quality.', color: '#6378ff' },
  { to: '/trim', icon: Scissors, label: 'Clip Trimmer', desc: 'Cut a specific time range from any video file instantly.', color: '#a855f7' },
  { to: '/gif', icon: Film, label: 'Video → GIF', desc: 'Convert any video clip into a smooth, high-quality GIF.', color: '#ec4899' },
  { to: '/bg-remove', icon: Image, label: 'Background Remover', desc: 'Remove background from images instantly with AI in your browser.', color: '#22d3a5' },
  { to: '/pdf', icon: FileText, label: 'PDF Toolkit', desc: 'Merge, split, and compress PDF files with ease.', color: '#f59e0b' },
  { to: '/face-blur', icon: Eye, label: 'Face Blur', desc: 'Automatically detect and blur all faces in a photo for privacy.', color: '#ff6b6b' },
  { to: '/vocal-reducer', icon: Mic2, label: 'Vocal Reducer (Karaoke)', desc: 'Remove center-panned vocals from any song to make it instrumental.', color: '#10b981' },
  { to: '/cartoonify', icon: Wand2, label: 'Cartoonify Image', desc: 'Turn your photos into cool cartoon/comic sketches with AI.', color: '#eab308' },
  { to: '/compress-video', icon: Minimize, label: 'Video Compressor', desc: 'Drastically reduce video file sizes without losing quality.', color: '#6366f1' },
  { to: '/palette', icon: Palette, label: 'Color Palette Extractor', desc: 'Upload a picture and instantly get its 6 dominant colors.', color: '#ec4899' },
  { to: '/subtitles', icon: Type, label: 'Subtitle Extractor', desc: 'Download captions directly from YouTube videos as .srt files.', color: '#f97316' },
]

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
            <Link to="/download" className="btn btn-primary">
              <Zap size={18} /> Get Started
            </Link>
            <Link to="/qr" className="btn btn-secondary">
              Explore Tools <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="tools-section">
        <div className="container">
          <div className="section-header">
            <h2>8 Powerful Tools</h2>
            <p>Professional-grade multimedia processing, right in your browser</p>
          </div>
          <div className="tools-grid">
            {tools.map(({ to, icon: Icon, label, desc, color }, i) => (
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
        </div>
      </section>
    </main>
  )
}
