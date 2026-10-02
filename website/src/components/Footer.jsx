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
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom container">
        <p>&copy; {currentYear} Alpha developers. All rights reserved.</p>
      </div>
    </footer>
  )
}
