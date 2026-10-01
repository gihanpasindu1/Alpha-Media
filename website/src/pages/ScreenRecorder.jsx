import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Monitor, StopCircle, Download, Play, Video } from 'lucide-react'

export default function ScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const videoPreviewRef = useRef(null)

  const startRecording = async () => {
    setError(null)
    setVideoUrl(null)
    try {
      // Prompt user to select screen to record (and optionally audio)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true
      })
      
      // Update preview with live stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }

      // Initialize recorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' }
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        chunksRef.current = [] // reset
        
        // Stop all tracks to turn off the sharing indicator
        stream.getTracks().forEach(track => track.stop())
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null
        }
      }

      // If user stops sharing via browser's built-in UI
      stream.getVideoTracks()[0].onended = () => {
        stopRecording()
      }

      recorder.start()
      setIsRecording(true)
    } catch (e) {
      setError('Could not start recording. Permission denied or browser not supported.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleDownload = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `screen_record_${Date.now()}.webm`
    a.click()
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Screen Recorder</span></h1>
          <p>Record your screen, a window, or a tab instantly. 100% private, no backend needed.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          
          <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {videoUrl ? (
              <video src={videoUrl} controls style={{ width: '100%', height: '100%' }} />
            ) : (
              <video ref={videoPreviewRef} muted style={{ width: '100%', height: '100%', display: isRecording ? 'block' : 'none' }} />
            )}
            {!videoUrl && !isRecording && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                <Monitor size={48} style={{ opacity: 0.5, marginBottom: 10 }} />
                <p>Click "Start Recording" to begin</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {!isRecording ? (
              <button className="btn btn-primary" onClick={startRecording} style={{ flex: 1 }}>
                <Video size={18} /> Start Recording
              </button>
            ) : (
              <button className="btn btn-primary" onClick={stopRecording} style={{ flex: 1, background: 'var(--error)' }}>
                <StopCircle size={18} /> Stop Recording
              </button>
            )}
            
            {videoUrl && !isRecording && (
              <button className="btn btn-secondary" onClick={handleDownload} style={{ flex: 1 }}>
                <Download size={18} /> Download Recording
              </button>
            )}
          </div>

          {error && <div className="status-box error" style={{ marginTop: 20 }}>{error}</div>}
        </motion.div>
      </div>
    </main>
  )
}
