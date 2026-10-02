import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AudioMerger() {
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    setFiles(prev => [...prev, ...acc])
    setResult(null); setError(null); reset();
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'audio/*':[]} })

  const handleProcess = async () => {
    if (files.length < 2) return setError("Need at least 2 files")
    setError(null)
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    try {
      const { blob } = await upload(`${API}/api/audio-merge`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Merger</span></h1>
          <p>Combine multiple audio tracks into one.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>Drag & drop multiple audio files here</p>
          </div>
          
          {files.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <h4>Files to merge ({files.length}):</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-muted)' }}>
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
              <button className="btn btn-secondary" onClick={() => setFiles([])} style={{ marginTop: 8 }}>Clear List</button>
            </div>
          )}

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={files.length < 2 || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            <Plus size={18} /> Merge Audio
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download="merged_audio.mp3" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download Merged File</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
