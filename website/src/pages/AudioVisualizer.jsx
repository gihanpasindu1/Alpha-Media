import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Activity, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AudioVisualizer() {
  const [file, setFile] = useState(null)
  const [color, setColor] = useState('cyan')
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
    fd.append('color', color)
    try {
      const { blob } = await upload(`${API}/api/audio-visualizer`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Visualizer</span></h1>
          <p>Turn MP3s into stunning waveform videos for YouTube/TikTok.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Waveform Color</label>
            <select value={color} onChange={e=>setColor(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="cyan">Cyan</option>
              <option value="magenta">Magenta</option>
              <option value="green">Neon Green</option>
              <option value="red">Red</option>
              <option value="white">White</option>
            </select>
          </div>

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Activity size={18} /> Generate Video
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <video controls src={result} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
              <a href={result} download="visualizer.mp4" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download MP4</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
