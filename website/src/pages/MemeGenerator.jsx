import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Smile, Upload, Download } from 'lucide-react'

export default function MemeGenerator() {
  const [file, setFile] = useState(null)
  const [topText, setTopText] = useState('TOP TEXT')
  const [bottomText, setBottomText] = useState('BOTTOM TEXT')
  const [fontSize, setFontSize] = useState(40)
  const canvasRef = useRef(null)
  const [image, setImage] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    const img = new Image()
    img.onload = () => setImage(img)
    img.src = URL.createObjectURL(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false
  })

  // Redraw canvas whenever text, size, or image changes
  useEffect(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas dimensions to match image
    canvas.width = image.width
    canvas.height = image.height

    // Draw background image
    ctx.drawImage(image, 0, 0)

    // Setup text style (Classic Meme Font: Impact)
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = canvas.width * 0.005 // Dynamic outline thickness
    ctx.textAlign = 'center'
    
    // Scale font size based on image width to keep it consistent
    const scaledFontSize = (fontSize / 400) * canvas.width
    ctx.font = `900 ${scaledFontSize}px Impact, sans-serif`

    // Draw Top Text
    if (topText) {
      ctx.textBaseline = 'top'
      ctx.fillText(topText.toUpperCase(), canvas.width / 2, 20)
      ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 20)
    }

    // Draw Bottom Text
    if (bottomText) {
      ctx.textBaseline = 'bottom'
      ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20)
      ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20)
    }
  }, [image, topText, bottomText, fontSize])

  const handleDownload = () => {
    if (!canvasRef.current || !file) return
    const a = document.createElement('a')
    a.download = `meme_${file.name}`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">Meme Generator</span></h1>
          <p>Add classic top and bottom text to any image to create memes instantly.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={image ? { display: 'none' } : {}}>
            <input {...getInputProps()} />
            <div className="dropzone-icon"><Upload size={40} /></div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Drop an image file here</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>JPG, PNG, WEBP</p>
          </div>

          {image && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Top Text</label>
                  <input type="text" className="input" value={topText} onChange={e => setTopText(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Bottom Text</label>
                  <input type="text" className="input" value={bottomText} onChange={e => setBottomText(e.target.value)} />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label>Font Size</label>
                <input type="range" min="10" max="100" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div style={{ width: '100%', overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)', background: '#111', display: 'flex', justifyContent: 'center' }}>
                <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}></canvas>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => { setFile(null); setImage(null) }} style={{ flex: 1 }}>
                  Change Image
                </button>
                <button className="btn btn-primary" onClick={handleDownload} style={{ flex: 2 }}>
                  <Download size={18} /> Download Meme
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
