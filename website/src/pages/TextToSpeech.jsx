import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mic, Play } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

export default function TextToSpeech() {
  const [text, setText] = useState('')
  const [lang, setLang] = useState('en-US-AriaNeural')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleConvert = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang })
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      setResult(URL.createObjectURL(blob))
    } catch (e) {
      setError(e.message)
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
          <h1><span className="glow-text">Text to Speech</span></h1>
          <p>Convert written text into natural spoken audio.</p>
        </div>
        <div className="tool-card">
          <textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Type or paste text here..." 
            style={{ width: '100%', height: 150, padding: 12, borderRadius: 8, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', marginBottom: 16 }}
          />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Voice (Natural AI):</label>
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <option value="en-US-AriaNeural">English - Aria (Female)</option>
              <option value="en-US-GuyNeural">English - Guy (Male)</option>
              <option value="en-US-JennyNeural">English - Jenny (Female)</option>
              <option value="en-US-ChristopherNeural">English - Christopher (Male)</option>
              <option value="en-GB-SoniaNeural">English (UK) - Sonia (Female)</option>
              <option value="en-GB-RyanNeural">English (UK) - Ryan (Male)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleConvert} disabled={loading || !text} style={{ width: '100%', justifyContent: 'center' }}>
            <Mic size={18} /> {loading ? 'Converting...' : 'Generate Speech'}
          </button>
          
          {error && <div style={{ marginTop: 16, color: 'var(--error)' }}>{error}</div>}
          
          {result && (
            <div style={{ marginTop: 24, background: 'var(--bg2)', padding: 20, borderRadius: 8 }}>
              <h3 style={{ marginBottom: 12 }}>Result:</h3>
              <audio controls src={result} style={{ width: '100%' }} />
              <a href={result} download="speech.mp3" className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Download MP3</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
