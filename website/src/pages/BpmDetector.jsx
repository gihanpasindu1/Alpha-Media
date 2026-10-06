import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Music, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

function getBpmCategory(bpm) {
  if (bpm < 60) return { label: 'Very Slow', color: '#6378ff' }
  if (bpm < 90) return { label: 'Slow / Ballad', color: '#22d3a5' }
  if (bpm < 120) return { label: 'Moderate', color: '#f59e0b' }
  if (bpm < 140) return { label: 'Upbeat', color: '#ec4899' }
  if (bpm < 160) return { label: 'Fast', color: '#ff6b6b' }
  return { label: 'Very Fast', color: '#ff3333' }
}

export default function BpmDetector() {
  const [file, setFile] = useState(null)
  const [bpm, setBpm] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f); setBpm(null); setStatus(null); reset()
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'audio/*': [], 'video/mp4': [] }, multiple: false
  })

  const handleDetect = async () => {
    if (!file) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData(); fd.append('file', file)
      // BPM returns JSON not blob — use fetch but track upload with XHR approach
      const xhr = new XMLHttpRequest()
      const data = await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) { const p = Math.round(e.loaded/e.total*100); reset(); } }
        xhr.onload = () => xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(JSON.parse(xhr.responseText).detail))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', `${API}/api/bpm`)
        xhr.send(fd)
      })
      setBpm(data.bpm)
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  const category = bpm ? getBpmCategory(bpm) : null

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">BPM Detector</span></h1>
          <p>Upload any song or audio file and instantly detect its beats per minute (tempo).</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            {file
              ? <><p style={{ fontWeight: 600 }}>🎵 {file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p></>
              : <><p style={{ fontWeight: 600, marginBottom: 8 }}>Drop an audio file here</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>MP3, WAV, OGG, FLAC, M4A</p></>
            }
          </div>

          {bpm && category && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '40px 20px', margin: '20px 0', background: 'var(--surface2)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 80, fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: category.color, lineHeight: 1, textShadow: `0 0 40px ${category.color}60` }}>
                {bpm}
              </div>
              <div style={{ fontSize: 22, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>BPM</div>
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 99, background: `${category.color}20`, color: category.color, fontWeight: 700, fontSize: 15, border: `1px solid ${category.color}40` }}>
                🎵 {category.label}
              </div>

              {/* Beat visualizer */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 24 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 40, borderRadius: 4, background: category.color, opacity: 0.3 + (i % 3) * 0.25,
                    animation: `pulse ${(60 / bpm).toFixed(2)}s ${i * (60 / bpm / 8).toFixed(2)}s ease-in-out infinite alternate`
                  }} />
                ))}
              </div>
            </motion.div>
          )}

          <button className="btn btn-primary" onClick={handleDetect} disabled={loading || !file} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" /> Analyzing…</> : <><Music size={18} /> Detect BPM</>}
          </button>

          <ProgressBar phase={phase} progress={progress} />
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          from { transform: scaleY(0.4); opacity: 0.4; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </main>
  )
}
