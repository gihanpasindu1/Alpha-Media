import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Link as LinkIcon, Copy } from 'lucide-react'

export default function UrlShortener() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [shortUrl, setShortUrl] = useState('')
  const [error, setError] = useState('')

  const handleShorten = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setShortUrl('')

    try {
      const res = await fetch('/api/url/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      if (!res.ok) {
        throw new Error('Failed to shorten URL')
      }

      const data = await res.json()
      // Construct full URL pointing to our backend redirect route
      const fullShortUrl = `${window.location.origin}/s/${data.short_id}`
      setShortUrl(fullShortUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Tools
        </Link>
        
        <div className="tool-header">
          <h1><span className="glow-text">URL Shortener</span></h1>
          <p>Create short, manageable links from long URLs.</p>
        </div>

        <div className="tool-card">
          <form onSubmit={handleShorten}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>Enter Long URL</label>
            <input 
              type="url" 
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/path..."
              style={{ width: '100%', padding: '12px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '20px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              <LinkIcon size={16} /> {loading ? 'Shortening...' : 'Shorten URL'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '20px', color: '#e74c3c' }}>{error}</div>
          )}

          {shortUrl && (
            <div style={{ marginTop: '24px', background: 'rgba(46, 204, 113, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
              <h3 style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '16px' }}>Your Short URL:</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={shortUrl} 
                  style={{ flex: 1, padding: '10px', background: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '15px' }}
                />
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(shortUrl)
                    alert('Copied!')
                  }}
                >
                  <Copy size={16} /> Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
