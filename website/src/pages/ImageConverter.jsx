import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Upload, Download, RefreshCw } from 'lucide-react'

export default function ImageConverter() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [format, setFormat] = useState('image/png')
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
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  const convertImage = async () => {
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
            setStatus({ type: 'error', msg: 'Conversion failed.' })
            setLoading(false)
            return
          }
          const url = URL.createObjectURL(blob)
          const ext = format.split('/')[1]
          setResult({
            url,
            size: blob.size,
            name: `converted_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`
          })
          setStatus({ type: 'success', msg: `Image converted to ${ext.toUpperCase()} successfully!` })
          setLoading(false)
        },
        format,
        // High quality by default for conversion to avoid degradation
        0.92
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
          <h1><span className="glow-text">Image Format Converter</span></h1>
          <p>Convert images between PNG, JPEG, and WebP formats right in your browser. Fully private and instant.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file ? (
              <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Original size: {(file.size / 1024).toFixed(1)} KB</p></>
            ) : (
              <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop an image file here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Any image format</p></>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label>Convert to:</label>
            <select className="input" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG / JPG</option>
              <option value="image/webp">WEBP</option>
            </select>
          </div>

          {result && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--surface2)', borderRadius: 10, textAlign: 'center' }}>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>Converted Size: {(result.size / 1024).toFixed(1)} KB</p>
              <img src={result.url} alt="Converted preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={convertImage} disabled={loading || !file} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Converting…</> : <><RefreshCw size={18} /> Convert Image</>}
            </button>
            {result && (
              <button className="btn btn-secondary" onClick={handleDownload}>
                <Download size={18} /> Download
              </button>
            )}
          </div>

          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
