import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Scissors, Upload, Download, Link, Zap } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

// ── Tab 1: Trim directly from a URL (no full download!) ──────────────────────
function UrlTrimTab() {
  const [url, setUrl] = useState('')
  const [start, setStart] = useState('00:00:00')
  const [end, setEnd] = useState('00:00:30')
  const [quality, setQuality] = useState('720')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleTrim = async () => {
    if (!url.trim()) return
    setLoading(true)
    setStatus({ type: 'loading', msg: '⚡ Downloading only the selected clip range… (much faster than full download!)' })
    try {
      const fd = new FormData()
      fd.append('url', url)
      fd.append('start', start)
      fd.append('end', end)
      fd.append('quality', quality)
      const r = await fetch(`${API}/api/trim-url`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail)
      const blob = await r.blob()
      const filename = r.headers.get('x-filename') || 'clip.mp4'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      setStatus({ type: 'success', msg: `✅ Clip downloaded: ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        background: 'rgba(99,120,255,0.1)', borderRadius: 10, border: '1px solid rgba(99,120,255,0.25)',
        marginBottom: 20, fontSize: 14, color: '#a5b4fc'
      }}>
        <Zap size={16} />
        <span><strong>Smart mode:</strong> Only the selected time range is downloaded — not the full video!</span>
      </div>

      <div className="form-group">
        <label>Video URL (YouTube, TikTok, etc.)</label>
        <input
          className="input"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Time</label>
          <input className="input" value={start} onChange={e => setStart(e.target.value)} placeholder="00:00:00" />
        </div>
        <div className="form-group">
          <label>End Time</label>
          <input className="input" value={end} onChange={e => setEnd(e.target.value)} placeholder="00:00:30" />
        </div>
      </div>

      <div className="form-group">
        <label>Quality</label>
        <select className="input" value={quality} onChange={e => setQuality(e.target.value)}>
          <option value="1080">1080p</option>
          <option value="720">720p</option>
          <option value="480">480p</option>
          <option value="360">360p</option>
          <option value="144">144p</option>
        </select>
      </div>

      <button className="btn btn-primary" onClick={handleTrim} disabled={loading || !url.trim()} style={{ width: '100%' }}>
        {loading
          ? <><span className="spinner" /> Downloading clip…</>
          : <><Scissors size={18} /> Get Clip from URL</>
        }
      </button>

      {status && (
        <div className={`status-box ${status.type}`}>
          {status.type === 'loading' && <span className="spinner" />}
          {status.msg}
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Upload a file and trim it ─────────────────────────────────────────
function FileTrimTab() {
  const [file, setFile] = useState(null)
  const [start, setStart] = useState('00:00:00')
  const [end, setEnd] = useState('00:00:30')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, multiple: false
  })

  const handleTrim = async () => {
    if (!file) return
    setLoading(true)
    setStatus({ type: 'loading', msg: 'Trimming your video…' })
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('start', start)
      fd.append('end', end)
      const r = await fetch(`${API}/api/trim`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail)
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'trimmed.mp4'
      a.click()
      setStatus({ type: 'success', msg: 'Trimmed video downloaded!' })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon"><Upload size={40} /></div>
        {file ? (
          <>
            <p style={{ fontWeight: 600 }}>{file.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Drop your video file here</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>MP4, MKV, MOV, AVI</p>
          </>
        )}
      </div>

      {preview && (
        <div className="preview-container" style={{ marginTop: 16 }}>
          <video controls src={preview} style={{ maxHeight: 240, width: '100%', objectFit: 'contain', background: '#000' }} />
        </div>
      )}

      <div className="form-row" style={{ marginTop: 20 }}>
        <div className="form-group">
          <label>Start Time (HH:MM:SS)</label>
          <input className="input" value={start} onChange={e => setStart(e.target.value)} placeholder="00:00:00" />
        </div>
        <div className="form-group">
          <label>End Time (HH:MM:SS)</label>
          <input className="input" value={end} onChange={e => setEnd(e.target.value)} placeholder="00:00:30" />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleTrim} disabled={loading || !file} style={{ width: '100%' }}>
        {loading ? <><span className="spinner" /> Trimming…</> : <><Scissors size={18} /> Trim Video</>}
      </button>

      {status && (
        <div className={`status-box ${status.type}`}>
          {status.type === 'loading' && <span className="spinner" />}
          {status.msg}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'url', label: '🔗 Clip from URL', component: UrlTrimTab },
  { id: 'file', label: '📁 Trim Uploaded File', component: FileTrimTab },
]

export default function ClipTrimmer() {
  const [tab, setTab] = useState('url')
  const Tab = tabs.find(t => t.id === tab).component

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Clip Trimmer</span></h1>
          <p>Extract a specific time range from any video — paste a URL or upload your own file.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '4px', background: 'var(--surface2)', borderRadius: 10 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                background: tab === t.id ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)'
              }}>{t.label}</button>
            ))}
          </div>
          <Tab />
        </motion.div>
      </div>
    </main>
  )
}
