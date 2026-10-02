import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ImageToPdf() {
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    setFiles(prev => [...prev, ...acc])
    setResult(null); setError(null); reset();
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*':[]} })

  const handleProcess = async () => {
    if (files.length === 0) return setError("Need at least 1 image")
    setError(null)
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    try {
      const { blob } = await upload(`${API}/api/image-to-pdf`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Image to PDF</span></h1>
          <p>Combine JPG or PNG images into a single PDF.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>Drag & drop images here</p>
          </div>
          
          {files.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <h4>Images ({files.length}):</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-muted)' }}>
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
              <button className="btn btn-secondary" onClick={() => setFiles([])} style={{ marginTop: 8 }}>Clear List</button>
            </div>
          )}

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={files.length === 0 || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            <ImageIcon size={18} /> Convert to PDF
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download="images.pdf" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download PDF</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
