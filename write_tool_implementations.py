import os
from pathlib import Path

pages = {}

pages["TextToSpeech.jsx"] = """import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mic, Play } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function TextToSpeech() {
  const [text, setText] = useState('')
  const [lang, setLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleConvert = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang })
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      setResult(URL.createObjectURL(blob))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Tools
        </Link>
        <div className="tool-header">
          <h1><span className="glow-text">Text to Speech</span></h1>
          <p>Convert written text into natural spoken audio.</p>
        </div>
        <div className="tool-card">
          <textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Type or paste text here..." 
            style={{ width: '100%', height: 150, padding: 12, borderRadius: 8, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', marginBottom: 16 }}
          />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Language:</label>
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleConvert} disabled={loading || !text} style={{ width: '100%', justifyContent: 'center' }}>
            <Mic size={18} /> {loading ? 'Converting...' : 'Generate Speech'}
          </button>
          
          {error && <div style={{ marginTop: 16, color: 'var(--error)' }}>{error}</div>}
          
          {result && (
            <div style={{ marginTop: 24, background: 'var(--bg2)', padding: 20, borderRadius: 8 }}>
              <h3 style={{ marginBottom: 12 }}>Result:</h3>
              <audio controls src={result} style={{ width: '100%' }} />
              <a href={result} download="speech.mp3" className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Download MP3</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["AudioTrimmer.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Scissors, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AudioTrimmer() {
  const [file, setFile] = useState(null)
  const [startTime, setStartTime] = useState('00:00:00')
  const [endTime, setEndTime] = useState('00:00:10')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'audio/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('start_time', startTime)
    fd.append('end_time', endTime)
    try {
      const { blob } = await upload(`${API}/api/audio-trim`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Trimmer</span></h1>
          <p>Cut and trim audio files with precision.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label>Start Time (HH:MM:SS)</label>
              <input type="text" value={startTime} onChange={e=>setStartTime(e.target.value)} className="form-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label>End Time (HH:MM:SS)</label>
              <input type="text" value={endTime} onChange={e=>setEndTime(e.target.value)} className="form-input" />
            </div>
          </div>
          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Scissors size={18} /> Trim Audio
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download={`trimmed_${file.name}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["AudioMerger.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Plus, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AudioMerger() {
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    setFiles(prev => [...prev, ...acc])
    setResult(null); setError(null); reset();
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'audio/*':[]} })

  const handleProcess = async () => {
    if (files.length < 2) return setError("Need at least 2 files")
    setError(null)
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    try {
      const { blob } = await upload(`${API}/api/audio-merge`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Merger</span></h1>
          <p>Combine multiple audio tracks into one.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>Drag & drop multiple audio files here</p>
          </div>
          
          {files.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <h4>Files to merge ({files.length}):</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-muted)' }}>
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
              <button className="btn btn-secondary" onClick={() => setFiles([])} style={{ marginTop: 8 }}>Clear List</button>
            </div>
          )}

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={files.length < 2 || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            <Plus size={18} /> Merge Audio
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download="merged_audio.mp3" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download Merged File</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["NoiseRemover.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, VolumeX, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function NoiseRemover() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'audio/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/audio-noise-reduce`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Noise Remover</span></h1>
          <p>AI-powered background noise reduction.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          
          {phase && <div style={{marginTop:20}}><ProgressBar progress={progress} phase={phase} /></div>}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <VolumeX size={18} /> Remove Noise
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download={`clean_${file.name}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["AudioConverter.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, RefreshCw, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AudioConverter() {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('mp3')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'audio/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('format', format)
    try {
      const { blob } = await upload(`${API}/api/audio-convert`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Converter</span></h1>
          <p>Convert audio to MP3, WAV, OGG, and more.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Target Format</label>
            <select value={format} onChange={e=>setFormat(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
              <option value="m4a">M4A</option>
            </select>
          </div>
          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <RefreshCw size={18} /> Convert
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download={`converted.${format}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download {format.toUpperCase()}</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["WordToPdf.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, FileText, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function WordToPdf() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'.doc':[], '.docx':[], '.odt':[], '.rtf':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/word-to-pdf`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Word to PDF</span></h1>
          <p>Convert Word documents (DOCX) to PDF preserving styling.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a DOCX, DOC, or ODT file here"}</p>
          </div>
          
          {phase && <div style={{marginTop:20}}><ProgressBar progress={progress} phase={phase} /></div>}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <FileText size={18} /> Convert to PDF
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download="document.pdf" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download PDF</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["ImageToPdf.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ImageToPdf() {
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    setFiles(prev => [...prev, ...acc])
    setResult(null); setError(null); reset();
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*':[]} })

  const handleProcess = async () => {
    if (files.length === 0) return setError("Need at least 1 image")
    setError(null)
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    try {
      const { blob } = await upload(`${API}/api/image-to-pdf`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Image to PDF</span></h1>
          <p>Combine JPG or PNG images into a single PDF.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>Drag & drop images here</p>
          </div>
          
          {files.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <h4>Images ({files.length}):</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-muted)' }}>
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
              <button className="btn btn-secondary" onClick={() => setFiles([])} style={{ marginTop: 8 }}>Clear List</button>
            </div>
          )}

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={files.length === 0 || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            <ImageIcon size={18} /> Convert to PDF
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download="images.pdf" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download PDF</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["PdfCompressor.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Minimize2, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PdfCompressor() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'application/pdf':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/pdf-compress`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">PDF Compressor</span></h1>
          <p>Reduce the file size of your PDF documents drastically using Ghostscript.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a PDF file here"}</p>
          </div>
          
          {phase && <div style={{marginTop:20}}><ProgressBar progress={progress} phase={phase} /></div>}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <Minimize2 size={18} /> Compress PDF
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download={`compressed_${file.name}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download Compressed PDF</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["PdfToImages.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Image, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PdfToImages() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'application/pdf':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/pdf-to-images`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">PDF to Images</span></h1>
          <p>Extract every page of a PDF into high-res JPG images (ZIP).</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a PDF file here"}</p>
          </div>
          
          {phase && <div style={{marginTop:20}}><ProgressBar progress={progress} phase={phase} /></div>}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <Image size={18} /> Extract Images
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <a href={result} download={`${file.name.replace('.pdf','')}_images.zip`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download ZIP</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

base_dir = Path("website/src/pages")
for filename, content in pages.items():
    with open(base_dir / filename, "w", encoding="utf-8") as f:
        f.write(content)
print("Finished writing all tool implementations!")
