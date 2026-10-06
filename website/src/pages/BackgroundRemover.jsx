import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Image, Upload, Download, Wand2, Zap, Shield } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function BackgroundRemover() {
  const [file, setFile] = useState(null)
  const [original, setOriginal] = useState(null)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('browser') // 'browser' or 'server'
  
  // For server mode progress
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f)
    setOriginal(URL.createObjectURL(f))
    setResult(null)
    setStatus(null)
    reset()
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  const handleRemove = async () => {
    if (!file) return
    setLoading(true)
    setStatus(null)
    reset()
    
    try {
      if (mode === 'browser') {
        setStatus({ type: 'loading', msg: 'Removing background with AI in browser… (first time may take ~10s to load model)' })
        const { removeBackground } = await import('@imgly/background-removal')
        const resultBlob = await removeBackground(file)
        const url = URL.createObjectURL(resultBlob)
        setResult(url)
        setStatus({ type: 'success', msg: 'Background removed locally! Click download below.' })
      } else {
        // Server mode using rembg
        const fd = new FormData()
        fd.append('file', file)
        const { blob } = await upload(`${API}/api/bg-remove`, fd)
        const url = URL.createObjectURL(blob)
        setResult(url)
        setStatus({ type: 'success', msg: 'Background removed with high accuracy AI!' })
      }
    } catch (e) {
      setStatus({ type: 'error', msg: `Error: ${e.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result; a.download = 'no-background.png'; a.click()
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Background Remover</span></h1>
          <p>Remove backgrounds with AI. Choose fast local processing or high-accuracy server models.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024).toFixed(0)} KB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop an image here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>PNG, JPG, WEBP</p></>
            }
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div 
              onClick={() => setMode('browser')}
              style={{ 
                padding: 16, borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${mode === 'browser' ? 'var(--accent)' : 'var(--border)'}`,
                background: mode === 'browser' ? 'var(--surface2)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 12
              }}
            >
              <div style={{ padding: 8, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: 8 }}>
                <Shield size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15 }}>Fast & Private</h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Runs in browser. Great for simple subjects.</p>
              </div>
            </div>

            <div 
              onClick={() => setMode('server')}
              style={{ 
                padding: 16, borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${mode === 'server' ? 'var(--accent)' : 'var(--border)'}`,
                background: mode === 'server' ? 'var(--surface2)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 12
              }}
            >
              <div style={{ padding: 8, background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', borderRadius: 8 }}>
                <Zap size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15 }}>High Accuracy</h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Uses heavy U2-Net AI on server for complex edges.</p>
              </div>
            </div>
          </div>

          {(original || result) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              {original && (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Original</p>
                  <img src={original} alt="original" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
                </div>
              )}
              {result && (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Result</p>
                  <div style={{ background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 0 0/20px 20px', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <img src={result} alt="result" style={{ width: '100%', display: 'block' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleRemove} disabled={loading || !file} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Processing…</> : <><Wand2 size={18} /> Remove Background</>}
            </button>
            {result && (
              <button className="btn btn-secondary" onClick={handleDownload}>
                <Download size={18} /> Download PNG
              </button>
            )}
          </div>

          {mode === 'server' && phase && (
            <ProgressBar phase={phase} progress={progress} />
          )}

          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
