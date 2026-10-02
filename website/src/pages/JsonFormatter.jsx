import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Code, Copy, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const formatJson = () => {
    try {
      if (!input.trim()) {
        setError('Please enter some JSON first')
        setOutput('')
        return
      }
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError('')
    } catch (e) {
      setError(e.message)
      setOutput('')
    }
  }

  const minifyJson = () => {
    try {
      if (!input.trim()) return
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError(e.message)
      setOutput('')
    }
  }

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output)
      alert("Copied to clipboard!")
    }
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 900 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Tools
        </Link>
        
        <div className="tool-header">
          <h1><span className="glow-text">JSON Formatter</span></h1>
          <p>Format, validate, and beautify your JSON data.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        
        {!error && output && (
          <div style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> Valid JSON
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="tool-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Input</h3>
              <button onClick={() => setInput('')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '13px' }}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"paste": "your JSON here"}'
              style={{ flex: 1, minHeight: '400px', width: '100%', padding: '12px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'monospace', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={formatJson} style={{ flex: 1, justifyContent: 'center' }}>
                Format
              </button>
              <button className="btn btn-secondary" onClick={minifyJson} style={{ flex: 1, justifyContent: 'center' }}>
                Minify
              </button>
            </div>
          </div>

          <div className="tool-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Output</h3>
              <button onClick={copyToClipboard} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '13px' }}>
                <Copy size={14} /> Copy
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              placeholder='Output will appear here...'
              style={{ flex: 1, minHeight: '400px', width: '100%', padding: '12px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
