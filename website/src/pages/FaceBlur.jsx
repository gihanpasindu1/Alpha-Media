import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Eye, Upload, Download } from 'lucide-react'

const API = 'http://localhost:8000'

export default function FaceBlur() {
  const [file, setFile] = useState(null)
  const [original, setOriginal] = useState(null)
  const [result, setResult] = useState(null)
  const [intensity, setIntensity] = useState(30)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setOriginal(URL.createObjectURL(f)); setResult(null); setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  const handleBlur = async () => {
    if (!file) return
    setLoading(true); setStatus({ type: 'loading', msg: 'Detecting and blurring faces…' })
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('intensity', intensity)
      const r = await fetch(`${API}/api/face-blur`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail)
      const blob = await r.blob()
      setResult(URL.createObjectURL(blob))
      setStatus({ type: 'success', msg: 'Faces blurred successfully!' })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a'); a.href = result; a.download = 'face_blurred.jpg'; a.click()
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Face Blur</span></h1>
          <p>Automatically detect and blur all faces in a photo for privacy. Powered by OpenCV.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024).toFixed(0)} KB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a photo here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All faces will be automatically detected and blurred</p></>
            }
          </div>

          {(original || result) && (
            <div style={{ display: 'grid', gridTemplateColumns: original && result ? '1fr 1fr' : '1fr', gap: 16, marginTop: 20 }}>
              {original && (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Original</p>
                  <img src={original} alt="original" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
                </div>
              )}
              {result && (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Result</p>
                  <img src={result} alt="blurred" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: 20 }}>
            <label>Blur Intensity: {intensity}</label>
            <input type="range" min="5" max="60" value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Light blur</span><span>Heavy blur</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleBlur} disabled={loading || !file} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Processing…</> : <><Eye size={18} /> Blur Faces</>}
            </button>
            {result && (
              <button className="btn btn-secondary" onClick={handleDownload}>
                <Download size={18} /> Download
              </button>
            )}
          </div>

          {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
