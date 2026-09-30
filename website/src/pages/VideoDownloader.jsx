import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Play, Music, Video } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VideoDownloader() {
  const [url, setUrl] = useState('')
  const [quality, setQuality] = useState('720')
  const [format, setFormat] = useState('video')
  const [info, setInfo] = useState(null)
  const [status, setStatus] = useState(null) // {type, msg}
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const fetchInfo = async () => {
    if (!url.trim()) return
    setFetching(true)
    setInfo(null)
    setStatus(null)
    try {
      const fd = new FormData(); fd.append('url', url)
      const r = await fetch(`${API}/api/video-info`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail)
      setInfo(await r.json())
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setFetching(false)
    }
  }

  const handleDownload = async () => {
    if (!url.trim()) return
    setLoading(true)
    setStatus({ type: 'loading', msg: 'Downloading… this usually takes ~30 seconds.' })
    try {
      const downloadUrl = `${API}/api/download?url=${encodeURIComponent(url)}&quality=${quality}&format=${format}`;
      
      // Trigger download directly from the backend endpoint which will proxy the video
      window.location.href = downloadUrl;
      setStatus({ type: 'success', msg: `Download started!` });
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  const fmtDuration = (s) => {
    if (!s) return ''
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Video Downloader</span></h1>
          <p>Download videos from YouTube, TikTok, Instagram, Twitter, and 1000+ sites.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="form-group">
            <label>Video URL</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="input" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..." onKeyDown={e => e.key === 'Enter' && fetchInfo()} />
              <button className="btn btn-secondary" onClick={fetchInfo} disabled={fetching || !url.trim()} style={{ flexShrink: 0 }}>
                {fetching ? <span className="spinner" /> : <Play size={16} />}
                Preview
              </button>
            </div>
          </div>

          {info && (
            <motion.div className="video-info-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {info.thumbnail && <img src={info.thumbnail} alt={info.title} className="video-thumb" />}
              <div className="video-info-body">
                <div className="video-title">{info.title}</div>
                <div className="video-meta">
                  {info.uploader && <span>📺 {info.uploader}</span>}
                  {info.duration && <span>⏱ {fmtDuration(info.duration)}</span>}
                  {info.view_count && <span>👁 {Number(info.view_count).toLocaleString()} views</span>}
                </div>
              </div>
            </motion.div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Format</label>
              <select className="input" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="video">🎬 Video (MP4)</option>
                <option value="mp3">🎵 Audio Only (MP3)</option>
              </select>
            </div>
            {format === 'video' && (
              <div className="form-group">
                <label>Quality</label>
                <select className="input" value={quality} onChange={e => setQuality(e.target.value)}>
                  <option value="1080">1080p (Full HD)</option>
                  <option value="720">720p (HD)</option>
                  <option value="480">480p</option>
                  <option value="360">360p</option>
                  <option value="144">144p (Low)</option>
                </select>
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleDownload} disabled={loading || !url.trim()} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Download size={18} /> Download</>}
          </button>

          {status && (
            <div className={`status-box ${status.type}`}>
              {status.type === 'loading' && <span className="spinner" />}
              {status.msg}
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        .video-info-card { display:flex; gap:16px; padding:16px; background:var(--surface2); border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:20px; }
        .video-thumb { width:140px; height:82px; object-fit:cover; border-radius:8px; flex-shrink:0; }
        .video-info-body { flex:1; min-width:0; }
        .video-title { font-weight:600; font-size:14px; margin-bottom:8px; line-height:1.4; }
        .video-meta { display:flex; flex-wrap:wrap; gap:12px; font-size:13px; color:var(--text-muted); }
        @media(max-width:500px) { .video-info-card { flex-direction:column; } .video-thumb { width:100%; height:160px; } }
      `}</style>
    </main>
  )
}
