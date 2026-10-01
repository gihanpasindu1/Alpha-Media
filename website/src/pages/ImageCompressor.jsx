import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Minimize, Upload, Image as ImageIcon } from 'lucide-react'

export default function ImageCompressor() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [quality, setQuality] = useState(0.7)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }, multiple: false
  })

  const compressImage = async () => {
    if (!file) return
    setLoading(true)
    setStatus(null)

    try {
      const bmp = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bmp.width
      canvas.height = bmp.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bmp, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setStatus({ type: 'error', msg: 'Compression failed.' })
            setLoading(false)
            return
          }
          const url = URL.createObjectURL(blob)
          setResult({
            url,
            size: blob.size,
            name: `compressed_${file.name.replace(/\.[^/.]+$/, "")}.jpg`
          })
          setStatus({ type: 'success', msg: 'Image compressed successfully!' })
          setLoading(false)
        },
        'image/jpeg',
        quality
      )
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    a.click()
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Image Compressor</span></h1>
          <p>Compress JPEG, PNG, and WebP images instantly in your browser. No files are uploaded to our servers.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file ? (
              <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Original size: {(file.size / 1024).toFixed(1)} KB</p></>
            ) : (
              <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop an image file here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>JPG, PNG, WEBP</p></>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label>Quality: {Math.round(quality * 100)}%</label>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05" 
              value={quality} 
              onChange={(e) => setQuality(parseFloat(e.target.value))} 
              style={{ width: '100%' }} 
            />
          </div>

          {result && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--surface2)', borderRadius: 10, textAlign: 'center' }}>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>Compressed Size: {(result.size / 1024).toFixed(1)} KB</p>
              <p style={{ color: 'var(--success)', fontSize: 14, marginBottom: 10 }}>Saved {((file.size - result.size) / file.size * 100).toFixed(1)}%</p>
              <img src={result.url} alt="Compressed preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={compressImage} disabled={loading || !file} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Compressing…</> : <><Minimize size={18} /> Compress Image</>}
            </button>
            {result && (
              <button className="btn btn-secondary" onClick={handleDownload}>
                Download Image
              </button>
            )}
          </div>

          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
