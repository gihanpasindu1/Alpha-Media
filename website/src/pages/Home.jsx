import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Image, Video, Music, FileText } from 'lucide-react'
import './Home.css'

const categories = [
  {
    icon: Image,
    title: 'Image Editor',
    desc: 'Resize, crop, filters & export PNG/WebP',
    to: '/tools',
  },
  {
    icon: Video,
    title: 'Video Converter',
    desc: 'Convert MP4, MOV, WebM quickly & losslessly',
    to: '/tools',
  },
  {
    icon: Music,
    title: 'Audio Trimmer',
    desc: 'Trim, compress, and normalize audio',
    to: '/tools',
  },
  {
    icon: FileText,
    title: 'PDF Tools',
    desc: 'Merge, split, and compress PDFs',
    to: '/tools',
  },
]

export default function Home() {
  return (
    <main className="home-minimal">
      {/* Hero */}
      <section className="hm-hero">
        <div className="container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            The Ultimate Free Multimedia Toolkit
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="hm-sub"
          >
            Edit, convert, and create images, audio, video, and more — all free,
            open-source, and privacy-first. No account required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="hm-actions"
          >
            <Link to="/tools" className="hm-btn-primary">
              Start Creating <ArrowRight size={18} />
            </Link>
            <Link to="/tools" className="hm-btn-secondary">
              View Docs
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Category cards */}
      <section className="hm-categories">
        <div className="container">
          <div className="hm-grid">
            {categories.map(({ icon: Icon, title, desc, to }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}
              >
                <Link to={to} className="hm-card">
                  <div className="hm-card-icon">
                    <Icon size={36} strokeWidth={1.8} />
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="hm-footer-note">
            100% free &nbsp;·&nbsp; No watermark &nbsp;·&nbsp; Works in your browser &nbsp;·&nbsp; Open source on GitHub
          </p>
        </div>
      </section>
    </main>
  )
}
