import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Scissors, Upload, Download } from 'lucide-react'

const API = 'http://localhost:8000'

export default function ClipTrimmer() {
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
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trimmed.mp4'; a.click()
      setStatus({ type: 'success', msg: 'Trimmed video downloaded!' })
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
          <h1><span className="glow-text">Clip Trimmer</span></h1>
          <p>Upload a video and cut out exactly the portion you want. Fast, free, and local.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file ? (
              <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
            ) : (
              <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop your video here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>or click to browse — MP4, MKV, MOV, AVI</p></>
            )}
          </div>

          {preview && (
            <div className="preview-container" style={{ marginTop: 16 }}>
              <video controls src={preview} style={{ maxHeight: 260, width: '100%', objectFit: 'contain', background: '#000' }} />
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

          {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
