import os
from pathlib import Path

# ==========================================
# 1. NEW FRONTEND COMPONENTS
# ==========================================
pages = {}

pages["CodeToImage.jsx"] = """import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon, Copy, Check } from 'lucide-react'
import * as htmlToImage from 'html-to-image'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

export default function CodeToImage() {
  const [code, setCode] = useState('// Paste your code here\\nfunction helloWorld() {\\n  console.log("Hello, world!");\\n}')
  const [language, setLanguage] = useState('javascript')
  const [theme, setTheme] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
  const [copied, setCopied] = useState(false)
  const nodeRef = useRef(null)

  useEffect(() => {
    Prism.highlightAll()
  }, [code, language])

  const handleDownload = async () => {
    if (!nodeRef.current) return
    try {
      const dataUrl = await htmlToImage.toPng(nodeRef.current, { quality: 1.0, pixelRatio: 3 })
      const link = document.createElement('a')
      link.download = 'code-snippet.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      alert('Failed to generate image')
    }
  }

  const handleCopy = async () => {
    if (!nodeRef.current) return
    try {
      const dataUrl = await htmlToImage.toBlob(nodeRef.current, { quality: 1.0, pixelRatio: 3 })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': dataUrl })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      alert('Failed to copy to clipboard')
    }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 900 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Code to Image</span></h1>
          <p>Turn your code snippets into beautiful, shareable images.</p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="tool-card" style={{ flex: '1 1 300px' }}>
            <label>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="form-input" style={{ width: '100%', marginBottom: 16 }}>
              <option value="javascript">JavaScript / JSX</option>
              <option value="python">Python</option>
              <option value="css">CSS</option>
              <option value="html">HTML</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
            </select>
            
            <label>Background Gradient</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                '#1a1a2e'
              ].map((g, i) => (
                <div key={i} onClick={() => setTheme(g)} style={{ width: 40, height: 40, background: g, borderRadius: 8, cursor: 'pointer', border: theme === g ? '2px solid white' : '2px solid transparent' }} />
              ))}
            </div>

            <textarea
              className="form-input"
              style={{ width: '100%', height: 250, fontFamily: 'monospace', resize: 'vertical' }}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste code here..."
            />
          </div>

          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* The Image Wrapper */}
            <div ref={nodeRef} style={{ background: theme, padding: 48, borderRadius: 16, display: 'inline-block', minWidth: '100%', boxSizing: 'border-box' }}>
              <div style={{ background: '#1e1e1e', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 8, padding: '16px 20px', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <pre style={{ margin: 0, padding: '20px', fontSize: 15, background: 'transparent' }}>
                  <code className={`language-${language}`}>{code}</code>
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 24, width: '100%' }}>
              <button className="btn btn-primary" onClick={handleDownload} style={{ flex: 1, justifyContent: 'center' }}>
                <ImageIcon size={18} /> Download PNG
              </button>
              <button className="btn btn-secondary" onClick={handleCopy} style={{ flex: 1, justifyContent: 'center' }}>
                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
"""

pages["YtSummarizer.jsx"] = """import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, Key, Copy, Check } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function YtSummarizer() {
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSaveKey = (val) => {
    setApiKey(val)
    localStorage.setItem('gemini_api_key', val)
  }

  const handleSummarize = async () => {
    if (!url || !apiKey) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API}/api/yt-summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, api_key: apiKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to summarize')
      setResult(data.summary)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 800 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">AI YouTube Summarizer</span></h1>
          <p>Instantly extract and summarize the contents of any YouTube video using Gemini AI.</p>
        </div>

        <div className="tool-card">
          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent)' }}>
              <Key size={16} /> Free Google Gemini API Key
            </label>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>To run the AI summarization for free, get your personal key from Google AI Studio and paste it below. It is stored securely in your browser.</p>
            <input type="password" value={apiKey} onChange={e => handleSaveKey(e.target.value)} className="form-input" placeholder="AIzaSy..." style={{ width: '100%' }} />
          </div>

          <label>YouTube Video URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="form-input" placeholder="https://youtube.com/watch?v=..." style={{ width: '100%', marginBottom: 20 }} />

          <button className="btn btn-primary" onClick={handleSummarize} disabled={!url || !apiKey || loading} style={{ width: '100%', justifyContent: 'center' }}>
            <Brain size={18} /> {loading ? 'Analyzing Video...' : 'Summarize Video'}
          </button>

          {error && <div className="status-box error" style={{ marginTop: 20 }}>{error}</div>}

          {result && (
            <div style={{ marginTop: 24, padding: 24, background: 'var(--bg2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: 'var(--accent)' }}>AI Summary</h3>
                <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: 15 }}>{result}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["VoiceChanger.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Mic, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VoiceChanger() {
  const [file, setFile] = useState(null)
  const [effect, setEffect] = useState('chipmunk')
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
    fd.append('effect', effect)
    try {
      const { blob } = await upload(`${API}/api/voice-change`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Voice Changer</span></h1>
          <p>Apply fun and cinematic effects to any audio file.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a voice recording here"}</p>
          </div>
          
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Voice Effect</label>
            <select value={effect} onChange={e=>setEffect(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="chipmunk">🐿️ Chipmunk (High Pitch)</option>
              <option value="vader">🤖 Deep Voice (Darth Vader)</option>
              <option value="echo">⛪ Cathedral Echo</option>
              <option value="telephone">☎️ Vintage Telephone</option>
              <option value="robot">🦾 Robot</option>
            </select>
          </div>

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Mic size={18} /> Apply Effect
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <audio controls src={result} style={{ width: '100%', marginBottom: 12 }} />
              <a href={result} download={`voice_${effect}.mp3`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["VideoReverser.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Repeat, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VideoReverser() {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('reverse')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'video/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('mode', mode) // 'reverse' or 'boomerang'
    try {
      const { blob } = await upload(`${API}/api/video-reverse`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Video Boomerang Maker</span></h1>
          <p>Reverse videos or create perfect TikTok loops.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a short video here (max 30s)"}</p>
          </div>
          
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Effect Type</label>
            <select value={mode} onChange={e=>setMode(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="reverse">⏪ Reverse Video (Backwards only)</option>
              <option value="boomerang">🔄 Boomerang (Forward then Backward)</option>
            </select>
          </div>

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Repeat size={18} /> Generate Video
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <video controls src={result} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
              <a href={result} download={`effect_${file.name}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download Video</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["AudioVisualizer.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, Activity, Upload } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AudioVisualizer() {
  const [file, setFile] = useState(null)
  const [color, setColor] = useState('cyan')
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
    fd.append('color', color)
    try {
      const { blob } = await upload(`${API}/api/audio-visualizer`, fd)
      setResult(URL.createObjectURL(blob))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Audio Visualizer</span></h1>
          <p>Turn MP3s into stunning waveform videos for YouTube/TikTok.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop an audio file here"}</p>
          </div>
          
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label>Waveform Color</label>
            <select value={color} onChange={e=>setColor(e.target.value)} className="form-input" style={{ width: '100%', marginTop: 8 }}>
              <option value="cyan">Cyan</option>
              <option value="magenta">Magenta</option>
              <option value="green">Neon Green</option>
              <option value="red">Red</option>
              <option value="white">White</option>
            </select>
          </div>

          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error">{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center' }}>
            <Activity size={18} /> Generate Video
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <video controls src={result} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
              <a href={result} download="visualizer.mp4" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download MP4</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
"""

pages["AutoCaption.jsx"] = """import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, MessageSquare, Upload, Download } from 'lucide-react'
import { useXhrUpload } from '../hooks/useXhrUpload'
import ProgressBar from '../components/ProgressBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AutoCaption() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { upload, progress, phase, reset } = useXhrUpload()

  const onDrop = useCallback(acc => {
    if (acc[0]) { setFile(acc[0]); setResult(null); setError(null); reset(); }
  }, [reset])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'video/*':[], 'audio/*':[]} })

  const handleProcess = async () => {
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { blob } = await upload(`${API}/api/auto-caption`, fd)
      const text = await blob.text()
      setResult(text)
    } catch (e) { setError(e.message) }
  }

  const downloadSrt = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    a.click()
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}><ArrowLeft size={16}/> Back</Link>
        <div className="tool-header">
          <h1><span className="glow-text">Auto-Caption (SRT)</span></h1>
          <p>Extract speech from a video and generate a .srt subtitle file.</p>
        </div>
        <div className="tool-card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p>{file ? file.name : "Drag & drop a short video or audio file (max 1 minute)"}</p>
          </div>
          
          {phase && <ProgressBar progress={progress} phase={phase} />}
          {error && <div className="status-box error" style={{marginTop:20}}>{error}</div>}
          <button className="btn btn-primary" onClick={handleProcess} disabled={!file || phase === 'uploading' || phase === 'processing'} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
            <MessageSquare size={18} /> Transcribe Audio
          </button>
          
          {result && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>Generated SRT File:</h4>
                <button onClick={downloadSrt} className="btn btn-primary" style={{ padding: '6px 12px' }}><Download size={14} /> Download</button>
              </div>
              <pre style={{ background: '#1e1e1e', padding: 12, borderRadius: 8, fontSize: 13, height: 200, overflow: 'auto' }}>
                {result}
              </pre>
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

# Update Tools.jsx routing
tools_jsx_path = Path("website/src/pages/Tools.jsx")
with open(tools_jsx_path, "r", encoding="utf-8") as f:
    tools_jsx = f.read()

# Add new tools to Tools.jsx array
new_entries = """
  // WOW Tools
  { to: '/yt-summarize',    icon: Brain,       label: 'AI YouTube Summarizer',  desc: 'Extract and summarize YouTube videos with AI.', color: '#10b981', category: 'utility' },
  { to: '/code-to-image',   icon: Code,        label: 'Code to Image',          desc: 'Create beautiful shareable images of your code.', color: '#3b82f6', category: 'image' },
  { to: '/voice-changer',   icon: Mic,         label: 'Voice Changer',          desc: 'Apply cinematic and fun effects to your voice.', color: '#8b5cf6', category: 'audio' },
  { to: '/audio-visualizer',icon: Activity,    label: 'Audio Visualizer',       desc: 'Turn MP3s into stunning waveform videos.',       color: '#ec4899', category: 'video' },
  { to: '/video-reverser',  icon: Repeat,      label: 'Boomerang Maker',        desc: 'Reverse videos or create TikTok boomerangs.',    color: '#f59e0b', category: 'video' },
  { to: '/auto-caption',    icon: MessageSquare,label: 'Auto-Captioning',       desc: 'Transcribe videos automatically into SRT subtitles.', color: '#6366f1', category: 'utility' },
"""

if "/yt-summarize" not in tools_jsx:
    tools_jsx = tools_jsx.replace("export default function Tools()", new_entries + "\nexport default function Tools()")
    
    # ensure lucide-react imports exist
    import_str = "import { Brain, Repeat, Activity, MessageSquare } from 'lucide-react'"
    tools_jsx = import_str + "\n" + tools_jsx
    with open(tools_jsx_path, "w", encoding="utf-8") as f:
        f.write(tools_jsx)

# Update App.jsx routing
app_jsx_path = Path("website/src/App.jsx")
with open(app_jsx_path, "r", encoding="utf-8") as f:
    app_jsx = f.read()

imports_to_add = """
import CodeToImage from './pages/CodeToImage'
import YtSummarizer from './pages/YtSummarizer'
import VoiceChanger from './pages/VoiceChanger'
import VideoReverser from './pages/VideoReverser'
import AudioVisualizer from './pages/AudioVisualizer'
import AutoCaption from './pages/AutoCaption'
"""

routes_to_add = """
        <Route path="/code-to-image" element={<CodeToImage />} />
        <Route path="/yt-summarize" element={<YtSummarizer />} />
        <Route path="/voice-changer" element={<VoiceChanger />} />
        <Route path="/video-reverser" element={<VideoReverser />} />
        <Route path="/audio-visualizer" element={<AudioVisualizer />} />
        <Route path="/auto-caption" element={<AutoCaption />} />
"""

if "CodeToImage" not in app_jsx:
    app_jsx = app_jsx.replace("import NotFound from './pages/NotFound'", "import NotFound from './pages/NotFound'\n" + imports_to_add)
    app_jsx = app_jsx.replace("</Routes>", routes_to_add + "        </Routes>")
    with open(app_jsx_path, "w", encoding="utf-8") as f:
        f.write(app_jsx)

# Update backend new_tools.py
new_tools_py = Path("website/backend/new_tools.py")
backend_code = """
# ==========================================
# WOW FACTOR TOOLS
# ==========================================
from pydantic import BaseModel
class YtSumReq(BaseModel):
    url: str
    api_key: str

@router.post("/api/yt-summarize")
async def yt_summarize(req: YtSumReq):
    from youtube_transcript_api import YouTubeTranscriptApi
    import google.generativeai as genai
    import urllib.parse
    
    try:
        if "v=" in req.url:
            video_id = urllib.parse.parse_qs(urllib.parse.urlparse(req.url).query).get("v", [None])[0]
        else:
            video_id = req.url.split("/")[-1].split("?")[0]
            
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        full_text = " ".join([t['text'] for t in transcript])
        
        genai.configure(api_key=req.api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Please summarize the following YouTube video transcript in a highly engaging, structured format. Provide a 3-sentence overview, followed by 3-5 key bullet points. Transcript: {full_text[:30000]}"
        
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@router.post("/api/voice-change")
async def voice_change(background_tasks: BackgroundTasks, file: UploadFile = File(...), effect: str = Form(...)):
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_voice_{req_id}_{file.filename}"
    out_path = DATA_DIR / f"out_voice_{req_id}.mp3"
    
    with open(in_path, "wb") as f:
        f.write(await file.read())
        
    filters = {
        "chipmunk": "asetrate=44100*1.5,aresample=44100",
        "vader": "asetrate=44100*0.7,aresample=44100",
        "echo": "aecho=0.8:0.9:1000:0.3",
        "telephone": "highpass=f=200,lowpass=f=3000",
        "robot": "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75"
    }
    af = filters.get(effect, "anull")
    
    cmd = ["ffmpeg", "-y", "-i", str(in_path), "-filter:a", af, str(out_path)]
    process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await process.communicate()
    
    background_tasks.add_task(cleanup_files, in_path, out_path)
    return FileResponse(out_path, filename=f"effect_{effect}.mp3")

@router.post("/api/video-reverse")
async def video_reverse(background_tasks: BackgroundTasks, file: UploadFile = File(...), mode: str = Form(...)):
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_rev_{req_id}.mp4"
    out_path = DATA_DIR / f"out_rev_{req_id}.mp4"
    
    with open(in_path, "wb") as f:
        f.write(await file.read())
        
    if mode == "reverse":
        cmd = ["ffmpeg", "-y", "-i", str(in_path), "-vf", "reverse", "-af", "areverse", str(out_path)]
    else:
        # Boomerang
        cmd = ["ffmpeg", "-y", "-i", str(in_path), "-filter_complex", "[0:v]reverse[r];[0:v][r]concat=n=2:v=1:a=0[outv]", "-map", "[outv]", str(out_path)]
        
    process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await process.communicate()
    
    background_tasks.add_task(cleanup_files, in_path, out_path)
    return FileResponse(out_path, filename="boomerang.mp4")

@router.post("/api/audio-visualizer")
async def audio_visualizer(background_tasks: BackgroundTasks, file: UploadFile = File(...), color: str = Form(...)):
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_vis_{req_id}_{file.filename}"
    out_path = DATA_DIR / f"out_vis_{req_id}.mp4"
    
    with open(in_path, "wb") as f:
        f.write(await file.read())
        
    # Generate 1280x720 video with waveform
    cmd = [
        "ffmpeg", "-y", "-i", str(in_path),
        "-filter_complex", f"[0:a]showwaves=s=1280x720:mode=cline:colors={color}[v]",
        "-map", "[v]", "-map", "0:a",
        "-c:v", "libx264", "-c:a", "aac", "-shortest",
        str(out_path)
    ]
    process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await process.communicate()
    
    background_tasks.add_task(cleanup_files, in_path, out_path)
    return FileResponse(out_path, filename="visualizer.mp4")

@router.post("/api/auto-caption")
async def auto_caption(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    import speech_recognition as sr
    import pydub
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_cap_{req_id}_{file.filename}"
    wav_path = DATA_DIR / f"temp_{req_id}.wav"
    
    with open(in_path, "wb") as f:
        f.write(await file.read())
        
    # Convert input to wav first
    cmd = ["ffmpeg", "-y", "-i", str(in_path), "-ar", "16000", "-ac", "1", str(wav_path)]
    process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await process.communicate()
    
    try:
        r = sr.Recognizer()
        with sr.AudioFile(str(wav_path)) as source:
            # We chunk it to 30s to not exceed Google's free limit per request
            audio_data = r.record(source, duration=30) 
            text = r.recognize_google(audio_data)
            
        srt_content = f"1\\n00:00:00,000 --> 00:00:30,000\\n{text}\\n"
        
        background_tasks.add_task(cleanup_files, in_path, wav_path)
        return Response(content=srt_content, media_type="text/plain")
    except Exception as e:
        background_tasks.add_task(cleanup_files, in_path, wav_path)
        raise HTTPException(500, detail=f"Failed to transcribe (API limit or error): {str(e)}")
"""

with open(new_tools_py, "a", encoding="utf-8") as f:
    f.write(backend_code)

print("Finished implementation!")
