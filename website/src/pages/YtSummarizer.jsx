import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, Key, Copy, Check } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function YtSummarizer() {
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSaveKey = (val) => {
    setApiKey(val)
    localStorage.setItem('gemini_api_key', val)
  }

  const handleSummarize = async () => {
    if (!url || !apiKey) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API}/api/yt-summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, api_key: apiKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to summarize')
      setResult(data.summary)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 800 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">AI YouTube Summarizer</span></h1>
          <p>Instantly extract and summarize the contents of any YouTube video using Gemini AI.</p>
        </div>

        <div className="tool-card">
          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent)' }}>
              <Key size={16} /> Free Google Gemini API Key
            </label>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>To run the AI summarization for free, get your personal key from Google AI Studio and paste it below. It is stored securely in your browser.</p>
            <input type="password" value={apiKey} onChange={e => handleSaveKey(e.target.value)} className="form-input" placeholder="AIzaSy..." style={{ width: '100%' }} />
          </div>

          <label>YouTube Video URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="form-input" placeholder="https://youtube.com/watch?v=..." style={{ width: '100%', marginBottom: 20 }} />

          <button className="btn btn-primary" onClick={handleSummarize} disabled={!url || !apiKey || loading} style={{ width: '100%', justifyContent: 'center' }}>
            <Brain size={18} /> {loading ? 'Analyzing Video...' : 'Summarize Video'}
          </button>

          {error && <div className="status-box error" style={{ marginTop: 20 }}>{error}</div>}

          {result && (
            <div style={{ marginTop: 24, padding: 24, background: 'var(--bg2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: 'var(--accent)' }}>AI Summary</h3>
                <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: 15 }}>{result}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
