import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { FileText, Upload, PlusSquare } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

export default function AddSubtitles() {
  const [videoFile, setVideoFile] = useState(null)
  const [srtFile, setSrtFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDropVideo = useCallback((accepted) => {
    if (accepted[0]) { setVideoFile(accepted[0]); setStatus(null); reset() }
  }, [reset])
  
  const onDropSrt = useCallback((accepted) => {
    if (accepted[0]) { setSrtFile(accepted[0]); setStatus(null); reset() }
  }, [reset])

  const { getRootProps: getVideoProps, getInputProps: getVideoInput } = useDropzone({
    onDrop: onDropVideo, accept: { 'video/*': [] }, multiple: false
  })
  
  const { getRootProps: getSrtProps, getInputProps: getSrtInput } = useDropzone({
    onDrop: onDropSrt, accept: { 'application/x-subrip': ['.srt'], 'text/plain': ['.srt'] }, multiple: false
  })

  const handleAddSubtitles = async () => {
    if (!videoFile || !srtFile) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData()
      fd.append('file', videoFile)
      fd.append('srt', srtFile)
      
      const { blob, headers } = await upload(`${API}/api/add-subtitles`, fd)
      const filename = headers['x-filename'] || 'subtitled.mp4'
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
          <h1><span className="glow-text">Add Subtitles to Video</span></h1>
          <p>Hardcode/burn an .srt subtitle file directly into your video.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Video Dropzone */}
            <div {...getVideoProps()} className="dropzone">
              <input {...getVideoInput()} />
              <div className="dropzone-icon"><Upload size={30} /></div>
              {videoFile ? (
                <><p style={{ fontWeight: 600 }}>{videoFile.name}</p></>
              ) : (
                <p style={{ fontWeight: 600, fontSize: 14 }}>1. Drop Video Here</p>
              )}
            </div>

            {/* SRT Dropzone */}
            <div {...getSrtProps()} className="dropzone">
              <input {...getSrtInput()} />
              <div className="dropzone-icon"><FileText size={30} /></div>
              {srtFile ? (
                <><p style={{ fontWeight: 600 }}>{srtFile.name}</p></>
              ) : (
                <p style={{ fontWeight: 600, fontSize: 14 }}>2. Drop .srt File Here</p>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleAddSubtitles} disabled={loading || !videoFile || !srtFile} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Burning Subtitles…</> : <><PlusSquare size={18} /> Add Subtitles</>}
          </button>

          <ProgressBar phase={phase} progress={progress} />
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
