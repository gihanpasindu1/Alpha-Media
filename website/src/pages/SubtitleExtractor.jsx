import { useState } from 'react'
import { motion } from 'framer-motion'
import { Type, Download } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function SubtitleExtractor() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleExtract = async () => {
    if (!url.trim()) return
    setLoading(true)
    setStatus({ type: 'loading', msg: 'Searching and extracting subtitles...' })
    try {
      const fd = new FormData()
      fd.append('url', url)
      const r = await fetch(`${API}/api/subtitles`, { method: 'POST', body: fd })
      
      if (!r.ok) {
        const errorData = await r.json()
        throw new Error(errorData.detail || "Failed to extract subtitles")
      }
      
      const blob = await r.blob()
      const filename = r.headers.get('x-filename') || 'subtitles.srt'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      
      setStatus({ type: 'success', msg: `Success! Downloaded ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Subtitle Extractor</span></h1>
          <p>Extract auto-generated or official subtitles/captions from YouTube videos.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="form-group">
            <label>YouTube Video URL</label>
            <input 
              className="input" 
              value={url} 
              onChange={e => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..." 
              onKeyDown={e => e.key === 'Enter' && handleExtract()} 
            />
          </div>

          <button className="btn btn-primary" onClick={handleExtract} disabled={loading || !url.trim()} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Extracting…</> : <><Type size={18} /> Extract Subtitles (.srt)</>}
          </button>

          {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
