import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Mic2, Wand2, Minimize, Minimize2, Palette, Type, ArrowRight, Search, RefreshCw, Smile
} from 'lucide-react'

export const allTools = [
  { to: '/download', icon: Download, label: 'Video Downloader', desc: 'Download from YouTube, TikTok, Instagram & more in any quality.', color: '#6378ff' },
  { to: '/trim', icon: Scissors, label: 'Clip Trimmer', desc: 'Cut a specific time range from any video file instantly.', color: '#a855f7' },
  { to: '/gif', icon: Film, label: 'Video → GIF', desc: 'Convert any video clip into a smooth, high-quality GIF.', color: '#ec4899' },
  { to: '/compress-video', icon: Minimize, label: 'Video Compressor', desc: 'Drastically reduce video file sizes without losing quality.', color: '#6366f1' },
  { to: '/vocal-reducer', icon: Mic2, label: 'Vocal Reducer (Karaoke)', desc: 'Remove center-panned vocals from any song to make it instrumental.', color: '#10b981' },
  { to: '/bpm', icon: Music, label: 'BPM Detector', desc: 'Upload a song and instantly detect its beats per minute.', color: '#34d399' },
  { to: '/bg-remove', icon: Image, label: 'Background Remover', desc: 'Remove background from images instantly with AI in your browser.', color: '#22d3a5' },
  { to: '/cartoonify', icon: Wand2, label: 'Cartoonify Image', desc: 'Turn your photos into cool cartoon/comic sketches with AI.', color: '#eab308' },
  { to: '/face-blur', icon: Eye, label: 'Face Blur', desc: 'Automatically detect and blur all faces in a photo for privacy.', color: '#ff6b6b' },
  { to: '/palette', icon: Palette, label: 'Color Palette Extractor', desc: 'Upload a picture and instantly get its 6 dominant colors.', color: '#ec4899' },
  { to: '/pdf', icon: FileText, label: 'PDF Toolkit', desc: 'Merge, split, and compress PDF files with ease.', color: '#f59e0b' },
  { to: '/qr', icon: QrCode, label: 'QR Code', desc: 'Generate beautiful QR codes or scan and decode any QR instantly.', color: '#06b6d4' },
  { to: '/compress-image', icon: Minimize2, label: 'Image Compressor', desc: 'Compress JPEG, PNG & WebP images instantly in your browser.', color: '#0ea5e9' },
  { to: '/convert-image', icon: RefreshCw, label: 'Image Format Converter', desc: 'Convert images between PNG, JPEG, and WebP instantly.', color: '#8b5cf6' },
  { to: '/meme', icon: Smile, label: 'Meme Generator', desc: 'Add classic top and bottom text to any image to create memes instantly.', color: '#ef4444' },
  { to: '/ocr', icon: FileText, label: 'Image to Text (OCR)', desc: 'Extract text from any image (screenshots, documents) using AI.', color: '#14b8a6' },
  { to: '/subtitles', icon: Type, label: 'Subtitle Extractor', desc: 'Download captions directly from YouTube videos as .srt files.', color: '#f97316' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5 } })
}

export default function Tools() {
  const [query, setQuery] = useState('')

  const filteredTools = allTools.filter(tool => 
    tool.label.toLowerCase().includes(query.toLowerCase()) || 
    tool.desc.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <h1><span className="glow-text">All Tools</span></h1>
          <p style={{ margin: '0 auto', marginBottom: 30 }}>Choose from our collection of 13 professional multimedia tools.</p>
          
          <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto' }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search for a tool (e.g. compress, video, pdf)..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 46, borderRadius: 30, background: 'var(--surface2)', border: '1px solid var(--border)' }}
            />
          </div>
        </motion.div>

        {filteredTools.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' }}>
            <p>No tools found matching "{query}"</p>
          </div>
        ) : (
          <div className="tools-grid" style={{ marginTop: 40 }}>
            {filteredTools.map(({ to, icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={to}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Link to={to} className="tool-tile">
                  <div className="tool-tile-icon" style={{ background: `${color}20`, color }}>
                    <Icon size={26} />
                  </div>
                  <div className="tool-tile-body">
                    <h3>{label}</h3>
                    <p>{desc}</p>
                  </div>
                  <ArrowRight size={18} className="tool-tile-arrow" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
