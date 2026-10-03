import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon, Copy, Check } from 'lucide-react'
import * as htmlToImage from 'html-to-image'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

export default function CodeToImage() {
  const [code, setCode] = useState('// Paste your code here\nfunction helloWorld() {\n  console.log("Hello, world!");\n}')
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
