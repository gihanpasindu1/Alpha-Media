import { Link } from 'react-router-dom'
import { Download, Eye, Mic2, Film, Minimize2, QrCode, FileText, Smile, Brain, ArrowRight } from 'lucide-react'

const EXAMPLES = [
  {
    icon: Download,
    title: 'Save a playlist as MP3s',
    desc: 'Paste a YouTube playlist link, pick MP3, and take the whole playlist offline for the road.',
    to: '/download',
    color: '#f5a623',
  },
  {
    icon: Eye,
    title: 'Blur faces before you post',
    desc: 'Upload a video, and AI finds and blurs every face automatically. Safe to share anywhere.',
    to: '/face-blur',
    color: '#3ecf8e',
  },
  {
    icon: Mic2,
    title: 'Make any song karaoke-ready',
    desc: 'Strip the vocals out of a track in seconds and sing over the instrumental version.',
    to: '/vocal-reducer',
    color: '#a78bfa',
  },
  {
    icon: Film,
    title: 'Turn a funny clip into a GIF',
    desc: 'Cut the best 3 seconds of any video and export it as a high-quality GIF for chats.',
    to: '/gif',
    color: '#f5a623',
  },
  {
    icon: Minimize2,
    title: 'Shrink a video to send it',
    desc: 'That 200MB video won\u2019t send on WhatsApp? Compress it down without killing the quality.',
    to: '/compress-video',
    color: '#f5a623',
  },
  {
    icon: QrCode,
    title: 'Share WiFi with a QR code',
    desc: 'Generate a scannable QR for your WiFi, menu, or link — guests just point and connect.',
    to: '/qr',
    color: '#38bdf8',
  },
  {
    icon: FileText,
    title: 'Convert Word to PDF',
    desc: 'Drop in a DOCX and get a clean PDF back. No software installs, no watermarks.',
    to: '/word-to-pdf',
    color: '#e74c3c',
  },
  {
    icon: Smile,
    title: 'Make a meme in 10 seconds',
    desc: 'Upload any image, add top and bottom text, download your meme. That\u2019s the whole process.',
    to: '/meme',
    color: '#3ecf8e',
  },
  {
    icon: Brain,
    title: 'Summarize a long video with AI',
    desc: 'Don\u2019t have 40 minutes? Get the key points of any YouTube video as a quick summary.',
    to: '/yt-summarize',
    color: '#10b981',
  },
]

export default function Examples() {
  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 960 }}>
        <div className="tool-header">
          <h1><span className="glow-text">What can you do with it?</span></h1>
          <p>Real things people do with AlphaMedia every day — pick one and try it.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {EXAMPLES.map(({ icon: Icon, title, desc, to, color }) => (
            <Link key={title} to={to} style={{ textDecoration: 'none' }}>
              <div className="tool-card" style={{ textAlign: 'left', height: '100%' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  background: `${color}1a`, color,
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>{title}</h3>
                <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 15 }}>{desc}</p>
                <span style={{ color, fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Try it <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
