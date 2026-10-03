import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-left">
          <Link to="/" className="footer-logo">
            <img src="/logo.png" alt="AlphaMedia" height="38" />
          </Link>
          <p className="footer-desc">
            The Ultimate Free Multimedia Toolkit. Professional-grade processing right in your browser.
          </p>
        </div>
        
        <div className="footer-links">
          <div className="footer-col">
            <h4>Tools</h4>
            <Link to="/download">Video Downloader</Link>
            <Link to="/bg-remove">Background Remover</Link>
            <Link to="/pdf">PDF Toolkit</Link>
            <Link to="/tools">All Tools</Link>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/password-generator">Password Generator</Link>
            <Link to="/json-formatter">JSON Formatter</Link>
            <Link to="/url-shortener">URL Shortener</Link>
            <a href="mailto:contact@alphamedia.bond">Contact Us</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom container">
        <p>© {currentYear} Alpha developers. All rights reserved.</p>
      </div>
    </footer>
  )
}
