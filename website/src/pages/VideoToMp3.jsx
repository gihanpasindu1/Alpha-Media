import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Headphones, Upload, Download } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function VideoToMp3() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setStatus(null); reset()
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, multiple: false
  })

  const handleConvert = async () => {
    if (!file) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData(); fd.append('file', file)
      const { blob, headers } = await upload(`${API}/api/video-to-mp3`, fd)
      const filename = headers['x-filename'] || 'audio.mp3'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = filename; a.click()
      setStatus({ type: 'success', msg: `Successfully converted and downloaded as ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Video to MP3</span></h1>
          <p>Extract high-quality audio from any video file instantly.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a video file here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>MP4, MOV, MKV, AVI, etc.</p></>
            }
          </div>

          <button className="btn btn-primary" onClick={handleConvert} disabled={loading || !file} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Converting…</> : <><Headphones size={18} /> Convert to MP3</>}
          </button>

          <ProgressBar phase={phase} progress={progress} />
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
