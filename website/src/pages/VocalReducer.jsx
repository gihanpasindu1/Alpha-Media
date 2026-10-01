import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Mic2, Upload, Download } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VocalReducer() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f); setResult(null); setStatus(null); reset()
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'audio/*': [] }, multiple: false
  })

  const handleReduce = async () => {
    if (!file) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { blob, headers } = await upload(`${API}/api/vocal-reducer`, fd)
      const url = URL.createObjectURL(blob)
      setResult(url)
      const filename = headers['x-filename'] || 'karaoke_instrumental.wav'
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      setStatus({ type: 'success', msg: `Success! Downloaded as ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Vocal Reducer (Karaoke)</span></h1>
          <p>Remove center-panned vocals from stereo songs to create an instrumental/karaoke track instantly.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file ? (
              <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
            ) : (
              <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a stereo audio file here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>MP3, WAV, FLAC, etc.</p></>
            )}
          </div>
          
          {result && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--surface2)', borderRadius: 10, textAlign: 'center' }}>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>Instrumental Result</p>
              <audio controls src={result} style={{ width: '100%' }} />
            </div>
          )}

          <button className="btn btn-primary" onClick={handleReduce} disabled={loading || !file} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Mic2 size={18} /> Reduce Vocals</>}
          </button>

          <ProgressBar phase={phase} progress={progress} />
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
