import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QrCode as QrIcon, Download, Camera, Upload } from 'lucide-react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

function GenerateTab() {
  const [text, setText] = useState('https://alphamedia.cyou')
  const [color, setColor] = useState('#6378ff')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [size, setSize] = useState(300)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!text.trim()) return
    QRCode.toDataURL(text, {
      width: size, margin: 2,
      color: { dark: color, light: bgColor }
    }).then(setDataUrl).catch(() => {})
  }, [text, color, bgColor, size])

  const download = () => {
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'qrcode.png'; a.click()
  }

  return (
    <div>
      <div className="form-group">
        <label>Text or URL</label>
        <textarea className="input" value={text} onChange={e => setText(e.target.value)}
          placeholder="Enter text, URL, phone number..." rows={3} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 14 }} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>QR Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', padding: '2px 4px' }} />
        </div>
        <div className="form-group">
          <label>Background</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', padding: '2px 4px' }} />
        </div>
        <div className="form-group">
          <label>Size: {size}px</label>
          <input type="range" min="150" max="600" step="50" value={size} onChange={e => setSize(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 12 }} />
        </div>
      </div>

      {dataUrl && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 16, boxShadow: '0 0 40px rgba(99,120,255,0.2)' }}>
            <img src={dataUrl} alt="QR Code" style={{ width: Math.min(size, 280), height: Math.min(size, 280), display: 'block' }} />
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={download} disabled={!dataUrl} style={{ width: '100%' }}>
        <Download size={18} /> Download QR Code
      </button>
    </div>
  )
}

function ScanTab() {
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState(null)
  const inputRef = useRef()

  const handleImage = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) { setResult(code.data); setStatus(null) }
        else { setResult(null); setStatus({ type: 'error', msg: 'No QR code found in this image. Try a clearer photo.' }) }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface2)', borderRadius: '12px', border: '2px dashed var(--border)', cursor: 'pointer' }}
        onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleImage(e.target.files[0])} />
        <div style={{ color: 'var(--accent)', marginBottom: 12 }}><Upload size={40} /></div>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Upload image with QR code</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>PNG, JPG, WEBP — instantly decoded in your browser</p>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20, padding: 20, background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>✅ QR Code Decoded:</p>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 15 }}>{result}</p>
          {result.startsWith('http') && (
            <a href={result} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ marginTop: 12, fontSize: 13 }}>
              Open Link →
            </a>
          )}
        </motion.div>
      )}
      {status && <div className={`status-box ${status.type}`}>{status.msg}</div>}
    </div>
  )
}

const tabs = [
  { id: 'generate', label: '⚡ Generate', component: GenerateTab },
  { id: 'scan', label: '📷 Scan', component: ScanTab },
]

export default function QrCode() {
  const [tab, setTab] = useState('generate')
  const Tab = tabs.find(t => t.id === tab).component

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">QR Code</span></h1>
          <p>Generate custom QR codes with colors, or scan and decode any QR image instantly. All in your browser.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '4px', background: 'var(--surface2)', borderRadius: 10 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                background: tab === t.id ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)'
              }}>{t.label}</button>
            ))}
          </div>
          <Tab />
        </motion.div>
      </div>
    </main>
  )
}
