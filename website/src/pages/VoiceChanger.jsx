import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Mic, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || ''

export default function VoiceChanger() {
  const [file, setFile] = useState(null)
  const [effect, setEffect] = useState('chipmunk')
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
    fd.append('effect', effect)
    try {
      const { blob } = await upload(`${API}/api/voice-change`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Voice Changer</span></h1>
          <p>Apply fun and cinematic effects to any audio file.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a voice recording here"}</p>
          </div>
          
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Voice Effect</label>
            <select value={effect} onChange={e=>setEffect(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="chipmunk">🐿️ Chipmunk (High Pitch)</option>
              <option value="vader">🤖 Deep Voice (Darth Vader)</option>
              <option value="echo">⛪ Cathedral Echo</option>
              <option value="telephone">☎️ Vintage Telephone</option>
              <option value="robot">🦾 Robot</option>
            </select>
          </div>

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Mic size={18} /> Apply Effect
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download={`voice_${effect}.mp3`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
