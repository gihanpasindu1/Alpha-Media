import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Film, Upload } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

export default function VideoToGif() {
  const [file, setFile] = useState(null)
  const [fps, setFps] = useState(10)
  const [width, setWidth] = useState(480)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [gifUrl, setGifUrl] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f)); setGifUrl(null); setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, multiple: false
  })

  const handleConvert = async () => {
    if (!file) return
    setLoading(true); setGifUrl(null)
    setStatus({ type: 'loading', msg: 'Converting to GIF… this may take a moment.' })
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('fps', fps); fd.append('width', width)
      const r = await fetch(`${API}/api/gif`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail)
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      setGifUrl(url)
      const a = document.createElement('a'); a.href = url; a.download = 'output.gif'; a.click()
      setStatus({ type: 'success', msg: 'GIF created and downloaded!' })
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
          <h1><span className="glow-text">Video → GIF</span></h1>
          <p>Convert any video clip into a smooth, high-quality GIF with custom FPS and size.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop your video here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tip: keep the clip short (under 30s) for best results</p></>
            }
          </div>

          {preview && !gifUrl && (
            <div className="preview-container" style={{ marginTop: 16 }}>
              <video controls src={preview} style={{ maxHeight: 220, width: '100%', objectFit: 'contain', background: '#000' }} />
            </div>
          )}

          {gifUrl && (
            <div className="preview-container" style={{ marginTop: 16 }}>
              <img src={gifUrl} alt="Generated GIF" style={{ width: '100%', maxHeight: 350, objectFit: 'contain', background: '#000' }} />
            </div>
          )}

          <div className="form-row" style={{ marginTop: 20 }}>
            <div className="form-group">
              <label>Frame Rate (FPS): {fps}</label>
              <input type="range" min="5" max="30" value={fps} onChange={e => setFps(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}><span>5 (small size)</span><span>30 (high quality)</span></div>
            </div>
            <div className="form-group">
              <label>Width: {width}px</label>
              <input type="range" min="240" max="800" step="40" value={width} onChange={e => setWidth(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}><span>240px</span><span>800px</span></div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleConvert} disabled={loading || !file} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" /> Converting…</> : <><Film size={18} /> Convert to GIF</>}
          </button>

          {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
