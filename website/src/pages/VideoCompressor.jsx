import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Minimize, Upload } from 'lucide-react'

const API = 'http://localhost:8000'

export default function VideoCompressor() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, multiple: false
  })

  const handleCompress = async () => {
    if (!file) return
    setLoading(true); setStatus({ type: 'loading', msg: 'Compressing video... this might take a minute.' })
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch(`${API}/api/compress-video`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail || "Failed to process video")
      
      const blob = await r.blob()
      const filename = r.headers.get('x-filename') || 'compressed.mp4'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      
      setStatus({ type: 'success', msg: `Success! Downloaded as ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Video Compressor</span></h1>
          <p>Dramatically reduce the file size of your videos for easy sharing.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Original size: {(file.size / 1024 / 1024).toFixed(1)} MB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a video file here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>MP4, MOV, MKV, AVI</p></>
            }
          </div>

          <button className="btn btn-primary" onClick={handleCompress} disabled={loading || !file} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Compressing…</> : <><Minimize size={18} /> Compress Video</>}
          </button>

          {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
