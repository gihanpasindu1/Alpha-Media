import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, RefreshCw, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function AudioConverter() {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('mp3')
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
    fd.append('format', format)
    try {
      const { blob } = await upload(`${API}/api/audio-convert`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Converter</span></h1>
          <p>Convert audio to MP3, WAV, OGG, and more.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Target Format</label>
            <select value={format} onChange={e=>setFormat(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
              <option value="m4a">M4A</option>
            </select>
          </div>
          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <RefreshCw size={18} /> Convert
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download={`converted.${format}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download {format.toUpperCase()}</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
