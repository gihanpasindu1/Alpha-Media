import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Eraser, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function RemoveWatermark() {
  const [file, setFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { upload, progress, phase, reset } = useXhrUpload()

  // Box coordinates (percentages of video width/height to make it responsive)
  const [box, setBox] = useState({ x: 5, y: 5, w: 20, h: 10 })
  const videoRef = useRef(null)
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 })

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]; if (!f) return
    setFile(f)
    setVideoUrl(URL.createObjectURL(f))
    setStatus(null)
    reset()
  }, [reset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, multiple: false
  })

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setVideoDims({
          w: videoRef.current.videoWidth,
          h: videoRef.current.videoHeight
        })
      }
    }
  }, [videoUrl])

  const handleRemoveWatermark = async () => {
    if (!file || !videoDims.w) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData()
      fd.append('file', file)
      
      // Convert percentages to absolute pixels for FFmpeg
      const absX = Math.round((box.x / 100) * videoDims.w)
      const absY = Math.round((box.y / 100) * videoDims.h)
      const absW = Math.round((box.w / 100) * videoDims.w)
      const absH = Math.round((box.h / 100) * videoDims.h)
      
      fd.append('x', Math.max(1, absX))
      fd.append('y', Math.max(1, absY))
      fd.append('w', Math.max(1, absW))
      fd.append('h', Math.max(1, absH))

      const { blob, headers } = await upload(`${API}/api/remove-watermark`, fd)
      const filename = headers['x-filename'] || 'no_watermark.mp4'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = filename; a.click()
      setStatus({ type: 'success', msg: `Success! Downloaded as ${filename}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Remove Watermark</span></h1>
          <p>Blur out a specific region of a video to hide logos or watermarks.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={file ? { display: 'none' } : {}}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Drop a video file here</p>
          </div>

          {videoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ position: 'relative', width: '100%', borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid var(--border)' }}>
                <video ref={videoRef} src={videoUrl} controls style={{ width: '100%', display: 'block' }} />
                
                {/* Visual Box overlay */}
                <div style={{
                  position: 'absolute',
                  top: `${box.y}%`, left: `${box.x}%`,
                  width: `${box.w}%`, height: `${box.h}%`,
                  border: '2px dashed #ec4899',
                  background: 'rgba(236, 72, 153, 0.3)',
                  backdropFilter: 'blur(5px)',
                  pointerEvents: 'none'
                }}>
                  <div style={{ background: '#ec4899', color: '#fff', fontSize: 10, padding: '2px 4px', position: 'absolute', top: -20, left: -2 }}>
                    Watermark Area
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 12 }}>Adjust Blur Region</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Position X (Left to Right)</label>
                    <input type="range" min="0" max="99" value={box.x} onChange={e => setBox({...box, x: Number(e.target.value)})} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Position Y (Top to Bottom)</label>
                    <input type="range" min="0" max="99" value={box.y} onChange={e => setBox({...box, y: Number(e.target.value)})} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Width</label>
                    <input type="range" min="1" max="100" value={box.w} onChange={e => setBox({...box, w: Number(e.target.value)})} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Height</label>
                    <input type="range" min="1" max="100" value={box.h} onChange={e => setBox({...box, h: Number(e.target.value)})} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => { setFile(null); setVideoUrl(null) }} style={{ flex: 1 }}>
                  Change Video
                </button>
                <button className="btn btn-primary" onClick={handleRemoveWatermark} disabled={loading} style={{ flex: 2 }}>
                  {loading ? <><span className="spinner" /> Processing…</> : <><Eraser size={18} /> Remove Watermark</>}
                </button>
              </div>

              <ProgressBar phase={phase} progress={progress} />
              {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
