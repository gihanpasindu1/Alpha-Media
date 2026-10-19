import { Link } from 'react-router-dom'
import { Zap, UserX, ShieldCheck, Layers, Smartphone, Gauge } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: '100% Free, Forever',
    desc: 'Every single tool is free. No tiers, no credits, no "pro" paywall hiding the good stuff.',
    color: '#f5a623',
  },
  {
    icon: UserX,
    title: 'No Sign-Up, No Tracking',
    desc: 'Open a tool and use it. No accounts, no emails, no personal data collected to get started.',
    color: '#3ecf8e',
  },
  {
    icon: ShieldCheck,
    title: 'Private by Design',
    desc: 'Many tools run entirely in your browser — your files never leave your device. What you upload stays yours.',
    color: '#38bdf8',
  },
  {
    icon: Layers,
    title: '40+ Tools, One Tab',
    desc: 'Video, audio, image, documents and everyday utilities — a whole toolbox without installing anything.',
    color: '#a78bfa',
  },
  {
    icon: Gauge,
    title: 'Fast & Lightweight',
    desc: 'No bloated pages, no popups, no waiting rooms. Tools load fast and get straight to work.',
    color: '#f43f5e',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    desc: 'Phone, tablet, laptop, desktop — if it has a browser, AlphaMedia works on it.',
    color: '#10b981',
  },
]

export default function Features() {
  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 960 }}>
        <div className="tool-header">
          <h1><span className="glow-text">Why AlphaMedia?</span></h1>
          <p>A free toolbox built to respect your time, your privacy, and your wallet.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="tool-card" style={{ textAlign: 'left' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                background: `${color}1a`, color,
              }}>
                <Icon size={24} />
              </div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>{title}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/tools" className="btn btn-primary" style={{ marginRight: 12 }}>
            Browse all tools
          </Link>
          <Link to="/examples" className="btn btn-secondary">
            See examples
          </Link>
        </div>
      </div>
    </main>
  )
}
