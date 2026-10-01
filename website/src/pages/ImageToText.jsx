import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { FileText, Upload, Copy, Check } from 'lucide-react'
import Tesseract from 'tesseract.js'
import ProgressBar from '../components/ProgressBar'

export default function ImageToText() {
  const [file, setFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(null)
  const [copied, setCopied] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setImagePreview(URL.createObjectURL(f))
    setText('')
    setStatus(null)
    setPhase(null)
    setProgress(0)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    setStatus(null)
    setPhase('uploading') // We hijack 'uploading' phase just to show the progress bar moving

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )
      setText(result.data.text)
      setStatus({ type: 'success', msg: 'Text extracted successfully!' })
    } catch (e) {
      setStatus({ type: 'error', msg: `Failed to extract text: ${e.message}` })
    } finally {
      setLoading(false)
      setPhase('done')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Image to Text (OCR)</span></h1>
          <p>Extract text from any image (screenshots, scanned documents, signs) purely in your browser.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={imagePreview ? { display: 'none' } : {}}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Drop an image file here</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>JPG, PNG, WEBP with readable text</p>
          </div>

          {imagePreview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: text ? '1fr 1fr' : '1fr', gap: 20 }}>
                {/* Image Preview */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Image Preview</span>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12, minHeight: 0 }} onClick={() => { setFile(null); setImagePreview(null); setText('') }}>
                      Change Image
                    </button>
                  </div>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                </div>
                
                {/* Extracted Text */}
                {text && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Extracted Text</span>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12, minHeight: 0 }} onClick={handleCopy}>
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                    <textarea 
                      className="input" 
                      style={{ flex: 1, minHeight: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                      value={text}
                      onChange={e => setText(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {!text && (
                <button className="btn btn-primary" onClick={handleExtract} disabled={loading}>
                  {loading ? <><span className="spinner" /> Analyzing Image…</> : <><FileText size={18} /> Extract Text</>}
                </button>
              )}

              {/* Progress bar logic specifically mapped for Tesseract OCR */}
              {phase === 'uploading' && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Running OCR model in browser...</span>
                    <span style={{ color: 'var(--accent)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--accent), #a78bfa)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
