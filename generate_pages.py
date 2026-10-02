import os
from pathlib import Path

pages = [
    ("AudioTrimmer", "Audio Trimmer", "Cut and trim audio files."),
    ("AudioMerger", "Audio Merger", "Merge multiple audio files together."),
    ("NoiseRemover", "Noise Remover", "Remove background noise from audio."),
    ("AudioConverter", "Audio Format Converter", "Convert audio between MP3, WAV, OGG, M4A."),
    ("TextToSpeech", "Text to Speech", "Convert text into high-quality speech."),
    ("WordToPdf", "Word to PDF", "Convert Word documents to PDF preserving styling."),
    ("ImageToPdf", "Image to PDF", "Convert and combine multiple images into a PDF."),
    ("PdfCompressor", "PDF Compressor", "Reduce PDF file sizes dramatically."),
    ("PdfToImages", "PDF to Images", "Convert every page of a PDF into high-res images."),
    ("UrlShortener", "URL Shortener", "Shorten long URLs into clean links."),
    ("PasswordGenerator", "Password Generator", "Generate secure random passwords offline."),
    ("JsonFormatter", "JSON Formatter", "Format, validate, and beautify JSON data.")
]

template = """import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload, Settings, Shield, RefreshCw } from 'lucide-react'

export default function {component_name}() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)

  return (
    <main className="tool-page">
      <div className="container">
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Tools
        </Link>
        
        <div className="tool-header">
          <h1><span className="glow-text">{title}</span></h1>
          <p>{desc}</p>
        </div>

        <div className="tool-card">
          <h2><Upload size={18} /> Upload File</h2>
          <div className="dropzone">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} id="file-upload" />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div className="dropzone-icon"><Upload size={32} /></div>
              <h3>{'{file ? file.name : "Click to browse or drag file here"}'}</h3>
            </label>
          </div>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary">Process File</button>
          </div>
        </div>
      </div>
    </main>
  )
}
"""

base_dir = Path("website/src/pages")

for comp, title, desc in pages:
    p = base_dir / f"{comp}.jsx"
    if not p.exists():
        with open(p, "w", encoding="utf-8") as f:
            f.write(template.replace("{component_name}", comp).replace("{title}", title).replace("{desc}", desc))
print("Done")
