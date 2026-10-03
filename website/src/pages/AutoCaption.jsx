import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, MessageSquare, Upload, Download } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AutoCaption() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'video/*':[], 'audio/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/auto-caption`, fd)
      const text = await blob.text()
      setResult(text)
    } catch (e) { setError(e.message) }
  }

  const downloadSrt = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    a.click()
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Auto-Caption (SRT)</span></h1>
          <p>Extract speech from a video and generate a .srt subtitle file.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a short video or audio file (max 1 minute)"}</p>
          </div>
          
          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <MessageSquare size={18} /> Transcribe Audio
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>Generated SRT File:</h4>
                <button onClick={downloadSrt} className="btn btn-primary" style={{ padding: '6px 12px' }}><Download size={14} /> Download</button>
              </div>
              <pre style={{ background: '#1e1e1e', padding: 12, borderRadius: 8, fontSize: 13, height: 200, overflow: 'auto' }}>
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
