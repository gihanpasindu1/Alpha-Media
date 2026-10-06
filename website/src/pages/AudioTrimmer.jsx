import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Scissors, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function AudioTrimmer() {
  const [file, setFile] = useState(null)
  const [startTime, setStartTime] = useState('00:00:00')
  const [endTime, setEndTime] = useState('00:00:10')
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
    fd.append('start_time', startTime)
    fd.append('end_time', endTime)
    try {
      const { blob } = await upload(`${API}/api/audio-trim`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Trimmer</span></h1>
          <p>Cut and trim audio files with precision.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label>Start Time (HH:MM:SS)</label>
              <input type="text" value={startTime} onChange={e=>setStartTime(e.target.value)} className="form-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label>End Time (HH:MM:SS)</label>
              <input type="text" value={endTime} onChange={e=>setEndTime(e.target.value)} className="form-input" />
            </div>
          </div>
          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Scissors size={18} /> Trim Audio
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download={`trimmed_${file.name}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
