import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Mic2, Wand2, Minimize, Minimize2, Palette, Type,
  ArrowRight, Search, RefreshCw, Smile, Monitor, Headphones, FastForward,
  Eraser, PlusSquare, Merge, Video, ImageIcon, AudioLines, FileStack, Radio, X
} from 'lucide-react'

// ─── Tool Definitions ────────────────────────────────────────────────────────
export const allTools = [
  // Video
  { to: '/download',       icon: Download,    label: 'Video Downloader',       desc: 'Download from YouTube, TikTok, Instagram & more.',   color: '#f5a623', category: 'video' },
  { to: '/trim',           icon: Scissors,    label: 'Clip Trimmer',           desc: 'Cut a specific time range from any video.',          color: '#f5a623', category: 'video' },
  { to: '/gif',            icon: Film,        label: 'Video → GIF',            desc: 'Convert any video clip into a high-quality GIF.',    color: '#f5a623', category: 'video' },
  { to: '/compress-video', icon: Minimize,    label: 'Video Compressor',       desc: 'Reduce video file sizes without losing quality.',    color: '#f5a623', category: 'video' },
  { to: '/video-speed',    icon: FastForward, label: 'Video Speed Changer',    desc: 'Speed up or slow down any video. Audio adjusts too.', color: '#f5a623', category: 'video' },
  { to: '/video-to-mp3',   icon: Headphones,  label: 'Video to MP3',           desc: 'Extract high-quality audio from any video file.',    color: '#f5a623', category: 'video' },
  { to: '/remove-watermark',icon: Eraser,     label: 'Remove Watermark',       desc: 'Blur out logos or watermarks from a video region.',  color: '#f5a623', category: 'video' },
  { to: '/add-subtitles',  icon: PlusSquare,  label: 'Add Subtitles',          desc: 'Burn .srt subtitles directly into your video.',      color: '#f5a623', category: 'video' },
  { to: '/merge-videos',   icon: Merge,       label: 'Merge Videos',           desc: 'Join multiple videos into one continuous file.',     color: '#f5a623', category: 'video' },
  // Image
  { to: '/bg-remove',      icon: Image,       label: 'Background Remover',     desc: 'Remove image backgrounds with AI in your browser.',  color: '#3ecf8e', category: 'image' },
  { to: '/face-blur',      icon: Eye,         label: 'AI Face Blur',           desc: 'Auto-detect and blur faces in photos or videos.',    color: '#3ecf8e', category: 'image' },
  { to: '/palette',        icon: Palette,     label: 'Color Palette Extractor',desc: 'Get the 6 dominant colors from any picture.',       color: '#3ecf8e', category: 'image' },
  { to: '/compress-image', icon: Minimize2,   label: 'Image Compressor',       desc: 'Compress JPEG, PNG & WebP images in your browser.', color: '#3ecf8e', category: 'image' },
  { to: '/convert-image',  icon: RefreshCw,   label: 'Image Format Converter', desc: 'Convert images between PNG, JPEG, and WebP.',        color: '#3ecf8e', category: 'image' },
  { to: '/meme',           icon: Smile,       label: 'Meme Generator',         desc: 'Add caption text to any image to create memes.',    color: '#3ecf8e', category: 'image' },
  // Audio
  { to: '/vocal-reducer',  icon: Mic2,        label: 'Vocal Reducer',          desc: 'Remove vocals from any song to make it instrumental.', color: '#a78bfa', category: 'audio' },
  { to: '/bpm',            icon: Music,       label: 'BPM Detector',           desc: 'Upload a song and instantly detect beats per minute.', color: '#a78bfa', category: 'audio' },
  // Document & Utility
  { to: '/pdf',            icon: FileText,    label: 'PDF Toolkit',            desc: 'Merge, split, and compress PDF files.',              color: '#38bdf8', category: 'utility' },
  { to: '/qr',             icon: QrCode,      label: 'QR Code',                desc: 'Generate or decode QR codes instantly.',             color: '#38bdf8', category: 'utility' },
  { to: '/ocr',            icon: FileText,    label: 'Image to Text (OCR)',    desc: 'Extract text from screenshots and documents.',       color: '#38bdf8', category: 'utility' },
  { to: '/subtitles',      icon: Type,        label: 'Subtitle Extractor',     desc: 'Download captions from YouTube as .srt files.',      color: '#38bdf8', category: 'utility' },
  // Live
  { to: '/screen-record',  icon: Monitor,     label: 'Screen Recorder',        desc: 'Record your screen or tab directly in the browser.', color: '#f43f5e', category: 'live' },
]

const CATEGORIES = [
  { id: 'all',     label: 'All Tools',  icon: null },
  { id: 'video',   label: 'Video',      icon: Video },
  { id: 'image',   label: 'Image & AI', icon: ImageIcon },
  { id: 'audio',   label: 'Audio',      icon: AudioLines },
  { id: 'utility', label: 'Document',   icon: FileStack },
  { id: 'live',    label: 'Live',       icon: Radio },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.38, ease: [0.22,1,0.36,1] } })
}

export default function Tools() {
  const [query, setQuery]     = useState('')
  const [active, setActive]   = useState('all')

  const filtered = useMemo(() => {
    return allTools.filter(t => {
      const matchCat   = active === 'all' || t.category === active
      const q          = query.toLowerCase()
      const matchQuery = !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [query, active])

  const counts = useMemo(() => {
    const c = {}
    CATEGORIES.forEach(cat => {
      c[cat.id] = cat.id === 'all'
        ? allTools.length
        : allTools.filter(t => t.category === cat.id).length
    })
    return c
  }, [])

  return (
    <main className="tool-page">
      <div className="container">

        {/* Header */}
        <motion.div className="tools-page-header" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div>
            <h1>All Tools <span className="tools-count-badge">{allTools.length}</span></h1>
            <p>Professional-grade multimedia tools. Free, fast, no sign-up.</p>
          </div>

          {/* Search */}
          <div className="tools-search-wrap">
            <Search size={16} className="tools-search-icon" />
            <input
              type="text"
              className="tools-search-input"
              placeholder="Search tools…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="tools-search-clear" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          className="cat-tabs"
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay: 0.1 }}
        >
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`cat-tab ${active === id ? 'cat-tab-active' : ''}`}
              onClick={() => setActive(id)}
            >
              {Icon && <Icon size={14} />}
              {label}
              <span className="cat-count">{counts[id]}</span>
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              className="tools-empty"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            >
              <Search size={36} />
              <p>No tools found for "<strong>{query}</strong>"</p>
              <button className="btn btn-secondary" onClick={() => { setQuery(''); setActive('all') }}>
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={active + query}
              className="tools-grid-page"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration: 0.18 }}
            >
              {filtered.map(({ to, icon: Icon, label, desc, color }, i) => (
                <motion.div
                  key={to}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  <Link to={to} className="tool-card-item">
                    <div className="tool-card-icon" style={{ background: `${color}15`, color }}>
                      <Icon size={22} />
                    </div>
                    <div className="tool-card-body">
                      <h3>{label}</h3>
                      <p>{desc}</p>
                    </div>
                    <ArrowRight size={15} className="tool-card-arrow" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        .tools-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .tools-page-header h1 {
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text);
        }
        .tools-page-header p { color: var(--text-muted); font-size: 14px; margin-top: 6px; }
        .tools-count-badge {
          background: rgba(245,166,35,0.12);
          color: var(--accent);
          border: 1px solid rgba(245,166,35,0.25);
          font-size: 13px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          letter-spacing: 0;
        }

        /* Search */
        .tools-search-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .tools-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .tools-search-input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          padding: 10px 36px 10px 36px;
          outline: none;
          width: 240px;
          transition: var(--transition);
        }
        .tools-search-input:focus {
          border-color: rgba(245,166,35,0.4);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--surface3);
        }
        .tools-search-input::placeholder { color: var(--text-dim); }
        .tools-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 4px;
          border-radius: 4px;
        }
        .tools-search-clear:hover { color: var(--text); }

        /* Category Tabs */
        .cat-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .cat-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }
        .cat-tab:hover {
          color: var(--text);
          background: var(--surface2);
          border-color: rgba(255,255,255,0.15);
        }
        .cat-tab-active {
          background: rgba(245,166,35,0.1) !important;
          border-color: rgba(245,166,35,0.35) !important;
          color: var(--accent) !important;
        }
        .cat-count {
          background: rgba(255,255,255,0.08);
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        }
        .cat-tab-active .cat-count {
          background: rgba(245,166,35,0.15);
          color: var(--accent);
        }

        /* Tools Grid */
        .tools-grid-page {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .tool-card-item {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 24px 22px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          text-decoration: none;
          color: var(--text);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          min-height: 160px;
        }
        .tool-card-item::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
          opacity: 0;
          transition: var(--transition);
        }
        .tool-card-item:hover {
          background: var(--surface2);
          border-color: var(--border-hover);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        }
        .tool-card-item:hover::before { opacity: 1; }
        .tool-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tool-card-body { flex: 1; }
        .tool-card-body h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .tool-card-body p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .tool-card-arrow {
          color: var(--text-dim);
          align-self: flex-end;
          transition: var(--transition);
        }
        .tool-card-item:hover .tool-card-arrow {
          color: var(--accent);
          transform: translateX(3px) translateY(-3px);
        }

        /* Empty State */
        .tools-empty {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .tools-empty p { font-size: 15px; }

        @media (max-width: 600px) {
          .tools-grid-page { grid-template-columns: 1fr; }
          .tools-page-header { flex-direction: column; }
          .tools-search-input { width: 100%; }
          .tools-search-wrap { width: 100%; }
        }
      `}</style>
    </main>
  )
}import { Search, Play, Scissors, FastForward, Droplet, Minimize2, Palette, Wand2, Type, Merge, Upload, Eye, Music, Mic, FileText, QrCode, ScanText, Video, Settings, Shield, RefreshCw, VolumeX, Plus, Code, Link as LinkIcon } from 'lucide-react'eMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Mic2, Wand2, Minimize, Minimize2, Palette, Type,
  ArrowRight, Search, RefreshCw, Smile, Monitor, Headphones, FastForward,
  Eraser, PlusSquare, Merge, Video, ImageIcon, AudioLines, FileStack, Radio, X
} from 'lucide-react'

// ─── Tool Definitions ────────────────────────────────────────────────────────
export const allTools = [
  // Video
  { to: '/download',       icon: Download,    label: 'Video Downloader',       desc: 'Download from YouTube, TikTok, Instagram & more.',   color: '#f5a623', category: 'video' },
  { to: '/trim',           icon: Scissors,    label: 'Clip Trimmer',           desc: 'Cut a specific time range from any video.',          color: '#f5a623', category: 'video' },
  { to: '/gif',            icon: Film,        label: 'Video → GIF',            desc: 'Convert any video clip into a high-quality GIF.',    color: '#f5a623', category: 'video' },
  { to: '/compress-video', icon: Minimize,    label: 'Video Compressor',       desc: 'Reduce video file sizes without losing quality.',    color: '#f5a623', category: 'video' },
  { to: '/video-speed',    icon: FastForward, label: 'Video Speed Changer',    desc: 'Speed up or slow down any video. Audio adjusts too.', color: '#f5a623', category: 'video' },
  { to: '/video-to-mp3',   icon: Headphones,  label: 'Video to MP3',           desc: 'Extract high-quality audio from any video file.',    color: '#f5a623', category: 'video' },
  { to: '/remove-watermark',icon: Eraser,     label: 'Remove Watermark',       desc: 'Blur out logos or watermarks from a video region.',  color: '#f5a623', category: 'video' },
  { to: '/add-subtitles',  icon: PlusSquare,  label: 'Add Subtitles',          desc: 'Burn .srt subtitles directly into your video.',      color: '#f5a623', category: 'video' },
  { to: '/merge-videos',   icon: Merge,       label: 'Merge Videos',           desc: 'Join multiple videos into one continuous file.',     color: '#f5a623', category: 'video' },
  // Image
  { to: '/bg-remove',      icon: Image,       label: 'Background Remover',     desc: 'Remove image backgrounds with AI in your browser.',  color: '#3ecf8e', category: 'image' },
  { to: '/face-blur',      icon: Eye,         label: 'AI Face Blur',           desc: 'Auto-detect and blur faces in photos or videos.',    color: '#3ecf8e', category: 'image' },
  { to: '/palette',        icon: Palette,     label: 'Color Palette Extractor',desc: 'Get the 6 dominant colors from any picture.',       color: '#3ecf8e', category: 'image' },
  { to: '/compress-image', icon: Minimize2,   label: 'Image Compressor',       desc: 'Compress JPEG, PNG & WebP images in your browser.', color: '#3ecf8e', category: 'image' },
  { to: '/convert-image',  icon: RefreshCw,   label: 'Image Format Converter', desc: 'Convert images between PNG, JPEG, and WebP.',        color: '#3ecf8e', category: 'image' },
  { to: '/meme',           icon: Smile,       label: 'Meme Generator',         desc: 'Add caption text to any image to create memes.',    color: '#3ecf8e', category: 'image' },
  // Audio
  { to: '/vocal-reducer',  icon: Mic2,        label: 'Vocal Reducer',          desc: 'Remove vocals from any song to make it instrumental.', color: '#a78bfa', category: 'audio' },
  { to: '/bpm',            icon: Music,       label: 'BPM Detector',           desc: 'Upload a song and instantly detect beats per minute.', color: '#a78bfa', category: 'audio' },
  // Document & Utility
  { to: '/pdf',            icon: FileText,    label: 'PDF Toolkit',            desc: 'Merge, split, and compress PDF files.',              color: '#38bdf8', category: 'utility' },
  { to: '/qr',             icon: QrCode,      label: 'QR Code',                desc: 'Generate or decode QR codes instantly.',             color: '#38bdf8', category: 'utility' },
  { to: '/ocr',            icon: FileText,    label: 'Image to Text (OCR)',    desc: 'Extract text from screenshots and documents.',       color: '#38bdf8', category: 'utility' },
  { to: '/subtitles',      icon: Type,        label: 'Subtitle Extractor',     desc: 'Download captions from YouTube as .srt files.',      color: '#38bdf8', category: 'utility' },
  // Live
  { to: '/screen-record',  icon: Monitor,     label: 'Screen Recorder',        desc: 'Record your screen or tab directly in the browser.', color: '#f43f5e', category: 'live' },
]

const CATEGORIES = [
  { id: 'all',     label: 'All Tools',  icon: null },
  { id: 'video',   label: 'Video',      icon: Video },
  { id: 'image',   label: 'Image & AI', icon: ImageIcon },
  { id: 'audio',   label: 'Audio',      icon: AudioLines },
  { id: 'utility', label: 'Document',   icon: FileStack },
  { id: 'live',    label: 'Live',       icon: Radio },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.38, ease: [0.22,1,0.36,1] } })
}

export default function Tools() {
  const [query, setQuery]     = useState('')
  const [active, setActive]   = useState('all')

  const filtered = useMemo(() => {
    return allTools.filter(t => {
      const matchCat   = active === 'all' || t.category === active
      const q          = query.toLowerCase()
      const matchQuery = !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [query, active])

  const counts = useMemo(() => {
    const c = {}
    CATEGORIES.forEach(cat => {
      c[cat.id] = cat.id === 'all'
        ? allTools.length
        : allTools.filter(t => t.category === cat.id).length
    })
    return c
  }, [])

  return (
    <main className="tool-page">
      <div className="container">

        {/* Header */}
        <motion.div className="tools-page-header" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div>
            <h1>All Tools <span className="tools-count-badge">{allTools.length}</span></h1>
            <p>Professional-grade multimedia tools. Free, fast, no sign-up.</p>
          </div>

          {/* Search */}
          <div className="tools-search-wrap">
            <Search size={16} className="tools-search-icon" />
            <input
              type="text"
              className="tools-search-input"
              placeholder="Search tools…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="tools-search-clear" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          className="cat-tabs"
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay: 0.1 }}
        >
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`cat-tab ${active === id ? 'cat-tab-active' : ''}`}
              onClick={() => setActive(id)}
            >
              {Icon && <Icon size={14} />}
              {label}
              <span className="cat-count">{counts[id]}</span>
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              className="tools-empty"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            >
              <Search size={36} />
              <p>No tools found for "<strong>{query}</strong>"</p>
              <button className="btn btn-secondary" onClick={() => { setQuery(''); setActive('all') }}>
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={active + query}
              className="tools-grid-page"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration: 0.18 }}
            >
              {filtered.map(({ to, icon: Icon, label, desc, color }, i) => (
                <motion.div
                  key={to}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  <Link to={to} className="tool-card-item">
                    <div className="tool-card-icon" style={{ background: `${color}15`, color }}>
                      <Icon size={22} />
                    </div>
                    <div className="tool-card-body">
                      <h3>{label}</h3>
                      <p>{desc}</p>
                    </div>
                    <ArrowRight size={15} className="tool-card-arrow" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        .tools-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .tools-page-header h1 {
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text);
        }
        .tools-page-header p { color: var(--text-muted); font-size: 14px; margin-top: 6px; }
        .tools-count-badge {
          background: rgba(245,166,35,0.12);
          color: var(--accent);
          border: 1px solid rgba(245,166,35,0.25);
          font-size: 13px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          letter-spacing: 0;
        }

        /* Search */
        .tools-search-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .tools-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .tools-search-input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          padding: 10px 36px 10px 36px;
          outline: none;
          width: 240px;
          transition: var(--transition);
        }
        .tools-search-input:focus {
          border-color: rgba(245,166,35,0.4);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--surface3);
        }
        .tools-search-input::placeholder { color: var(--text-dim); }
        .tools-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 4px;
          border-radius: 4px;
        }
        .tools-search-clear:hover { color: var(--text); }

        /* Category Tabs */
        .cat-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .cat-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }
        .cat-tab:hover {
          color: var(--text);
          background: var(--surface2);
          border-color: rgba(255,255,255,0.15);
        }
        .cat-tab-active {
          background: rgba(245,166,35,0.1) !important;
          border-color: rgba(245,166,35,0.35) !important;
          color: var(--accent) !important;
        }
        .cat-count {
          background: rgba(255,255,255,0.08);
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        }
        .cat-tab-active .cat-count {
          background: rgba(245,166,35,0.15);
          color: var(--accent);
        }

        /* Tools Grid */
        .tools-grid-page {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .tool-card-item {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 24px 22px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          text-decoration: none;
          color: var(--text);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          min-height: 160px;
        }
        .tool-card-item::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
          opacity: 0;
          transition: var(--transition);
        }
        .tool-card-item:hover {
          background: var(--surface2);
          border-color: var(--border-hover);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        }
        .tool-card-item:hover::before { opacity: 1; }
        .tool-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tool-card-body { flex: 1; }
        .tool-card-body h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .tool-card-body p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .tool-card-arrow {
          color: var(--text-dim);
          align-self: flex-end;
          transition: var(--transition);
        }
        .tool-card-item:hover .tool-card-arrow {
          color: var(--accent);
          transform: translateX(3px) translateY(-3px);
        }

        /* Empty State */
        .tools-empty {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .tools-empty p { font-size: 15px; }

        @media (max-width: 600px) {
          .tools-grid-page { grid-template-columns: 1fr; }
          .tools-page-header { flex-direction: column; }
          .tools-search-input { width: 100%; }
          .tools-search-wrap { width: 100%; }
        }
      `}</style>
    </main>
  )
}
