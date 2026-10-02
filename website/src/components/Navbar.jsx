import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Menu, X, Grid3X3, ChevronRight } from 'lucide-react'
import './Navbar.css'

const links = [
  { to: '/tools', label: 'All Tools', icon: Grid3X3 },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Zap size={16} fill="currentColor" />
          </div>
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

        <div className="navbar-right">
          <Link to="/tools" className="btn-cta">
            Get Started <ChevronRight size={14} />
          </Link>
          <button className="hamburger" onClick={() => setOpen(o => !o)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
            <Link to="/tools" className="mobile-cta" onClick={() => setOpen(false)}>
              Get Started →
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
