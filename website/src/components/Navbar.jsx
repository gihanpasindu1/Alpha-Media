import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Menu, X
} from 'lucide-react'
import './Navbar.css'

const links = [
  { to: '/download', label: 'Downloader', icon: Download },
  { to: '/trim', label: 'Clip Trim', icon: Scissors },
  { to: '/gif', label: 'Video→GIF', icon: Film },
  { to: '/bg-remove', label: 'BG Remove', icon: Image },
  { to: '/pdf', label: 'PDF Tools', icon: FileText },
  { to: '/qr', label: 'QR Code', icon: QrCode },
  { to: '/face-blur', label: 'Face Blur', icon: Eye },
  { to: '/bpm', label: 'BPM', icon: Music },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><Zap size={18} /></div>
          <span>Alpha<strong>Media</strong></span>
        </Link>

        <nav className="navbar-links">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="hamburger" onClick={() => setOpen(o => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
