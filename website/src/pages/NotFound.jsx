import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="tool-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '60vh' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <AlertTriangle size={64} style={{ color: 'var(--accent)', marginBottom: '24px' }} />
        <h1><span className="glow-text">404 - Page Not Found</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '32px' }}>
          The tool or page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/tools" className="btn btn-primary">
          <ArrowLeft size={18} /> Browse All Tools
        </Link>
      </div>
    </main>
  )
}
