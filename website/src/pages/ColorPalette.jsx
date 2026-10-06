import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Palette, Upload, Copy } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

export default function ColorPalette() {
  const [file, setFile] = useState(null)
  const [original, setOriginal] = useState(null)
  const [colors, setColors] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setOriginal(URL.createObjectURL(f)); setColors([]); setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  const handleExtract = async () => {
    if (!file) return
    setLoading(true); setStatus({ type: 'loading', msg: 'Extracting colors…' })
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch(`${API}/api/palette`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail || "Failed to process image")
      
      const data = await r.json()
      setColors(data.colors)
      setStatus(null)
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Color Palette Extractor</span></h1>
          <p>Extract the 6 dominant colors from any image to use in your designs.</p>
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

          {original && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <img src={original} alt="original" style={{ maxHeight: 300, maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
            </div>
          )}

          {colors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 24 }}>
              {colors.map((hex, i) => (
                <div 
                  key={i} 
                  onClick={() => copyHex(hex)}
                  style={{ 
                    cursor: 'pointer',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ height: 100, background: hex, width: '100%' }} />
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    {copied === hex ? <span style={{ color: 'var(--success)' }}>Copied!</span> : <><Copy size={14} style={{ color: 'var(--text-muted)' }} /> {hex.toUpperCase()}</>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleExtract} disabled={loading || !file} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Extracting…</> : <><Palette size={18} /> Extract Colors</>}
          </button>

          {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
