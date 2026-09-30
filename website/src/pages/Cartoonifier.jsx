import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Upload, Download } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Cartoonifier() {
  const [file, setFile] = useState(null)
  const [original, setOriginal] = useState(null)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setOriginal(URL.createObjectURL(f)); setResult(null); setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  const handleCartoonify = async () => {
    if (!file) return
    setLoading(true); setStatus({ type: 'loading', msg: 'Applying cartoon effect…' })
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch(`${API}/api/cartoonify`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail || "Failed to process image")
      
      const blob = await r.blob()
      setResult(URL.createObjectURL(blob))
      setStatus({ type: 'success', msg: 'Image cartoonified successfully!' })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a'); a.href = result; a.download = 'cartoonified.jpg'; a.click()
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Image Cartoonifier</span></h1>
          <p>Transform your photos into cool cartoon/comic sketches using edge detection.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a photo here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>JPG, PNG, WEBP</p></>
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
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Cartoonified</p>
                  <img src={result} alt="cartoon" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleCartoonify} disabled={loading || !file} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Processing…</> : <><ImageIcon size={18} /> Cartoonify</>}
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
