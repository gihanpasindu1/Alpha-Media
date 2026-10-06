import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { FastForward, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function VideoSpeedChanger() {
  const [file, setFile] = useState(null)
  const [speed, setSpeed] = useState(1.5)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setStatus(null); reset()
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, multiple: false
  })

  const handleChangeSpeed = async () => {
    if (!file) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('speed', speed)
      
      const { blob, headers } = await upload(`${API}/api/video-speed`, fd)
      const filename = headers['x-filename'] || 'speed_changed.mp4'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = filename; a.click()
      setStatus({ type: 'success', msg: `Success! Downloaded as ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Video Speed Changer</span></h1>
          <p>Speed up or slow down a video. Audio tempo will be adjusted to match.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a video file here</p></>
            }
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label>Select Speed: {speed}x</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {[0.5, 0.75, 1.25, 1.5, 2.0].map(s => (
                <button 
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${speed === s ? 'var(--accent)' : 'var(--border)'}`,
                    background: speed === s ? 'var(--accent)' : 'var(--surface2)',
                    color: speed === s ? '#fff' : 'var(--text)',
                    fontWeight: 600
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleChangeSpeed} disabled={loading || !file} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Processing…</> : <><FastForward size={18} /> Change Speed</>}
          </button>

          <ProgressBar phase={phase} progress={progress} />
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
