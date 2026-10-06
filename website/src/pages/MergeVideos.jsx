import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Merge, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || ''

export default function MergeVideos() {
  const [file1, setFile1] = useState(null)
  const [file2, setFile2] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop1 = useCallback((accepted) => {
    if (accepted[0]) { setFile1(accepted[0]); setStatus(null); reset() }
  }, [reset])
  
  const onDrop2 = useCallback((accepted) => {
    if (accepted[0]) { setFile2(accepted[0]); setStatus(null); reset() }
  }, [reset])

  const { getRootProps: getProps1, getInputProps: getInput1 } = useDropzone({
    onDrop: onDrop1, accept: { 'video/*': [] }, multiple: false
  })
  
  const { getRootProps: getProps2, getInputProps: getInput2 } = useDropzone({
    onDrop: onDrop2, accept: { 'video/*': [] }, multiple: false
  })

  const handleMerge = async () => {
    if (!file1 || !file2) return
    setLoading(true); setStatus(null); reset()
    try {
      const fd = new FormData()
      fd.append('file1', file1)
      fd.append('file2', file2)
      
      const { blob, headers } = await upload(`${API}/api/merge-videos`, fd)
      const filename = headers['x-filename'] || 'merged.mp4'
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
          <h1><span className="glow-text">Merge Two Videos</span></h1>
          <p>Join two videos together into a single continuous video file.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Video 1 Dropzone */}
            <div {...getProps1()} className="dropzone">
              <input {...getInput1()} />
              <div className="dropzone-icon"><Upload size={30} /></div>
              {file1 ? (
                <><p style={{ fontWeight: 600 }}>{file1.name}</p></>
              ) : (
                <p style={{ fontWeight: 600, fontSize: 14 }}>1. First Video</p>
              )}
            </div>

            {/* Video 2 Dropzone */}
            <div {...getProps2()} className="dropzone">
              <input {...getInput2()} />
              <div className="dropzone-icon"><Upload size={30} /></div>
              {file2 ? (
                <><p style={{ fontWeight: 600 }}>{file2.name}</p></>
              ) : (
                <p style={{ fontWeight: 600, fontSize: 14 }}>2. Second Video</p>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleMerge} disabled={loading || !file1 || !file2} style={{ width: '100%', marginTop: 20 }}>
            {loading ? <><span className="spinner" /> Merging…</> : <><Merge size={18} /> Merge Videos</>}
          </button>

          <ProgressBar phase={phase} progress={progress} />
          {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
        </motion.div>
      </div>
    </main>
  )
}
