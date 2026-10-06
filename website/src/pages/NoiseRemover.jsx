import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, VolumeX, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function NoiseRemover() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'audio/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/audio-noise-reduce`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Noise Remover</span></h1>
          <p>AI-powered background noise reduction.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          
          {phase && <div style={{marginTop:20}}><ProgressBar progress={progress} phase={phase} /></div>}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <VolumeX size={18} /> Remove Noise
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download={`clean_${file.name}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
