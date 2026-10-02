import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Copy, RefreshCw } from 'lucide-react'

export default function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState('')

  const generate = () => {
    let charset = ''
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (useNumbers) charset += '0123456789'
    if (useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-='
    
    if (charset === '') return setPassword('Please select at least one character type')
    
    let res = ''
    for (let i = 0; i < length; i++) {
      res += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setPassword(res)
  }

  const copyToClipboard = () => {
    if (!password || password.startsWith('Please')) return
    navigator.clipboard.writeText(password)
    alert("Copied to clipboard!")
  }

  return (
    <main className="tool-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/tools" className="btn btn-secondary" style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Tools
        </Link>
        
        <div className="tool-header">
          <h1><span className="glow-text">Password Generator</span></h1>
          <p>Generate strong, secure passwords instantly.</p>
        </div>

        <div className="tool-card">
          <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontFamily: 'monospace', wordBreak: 'break-all', color: password ? 'var(--text)' : 'var(--text-muted)' }}>
              {password || 'Click Generate'}
            </span>
            <button onClick={copyToClipboard} className="btn btn-secondary" title="Copy" style={{ padding: '8px' }}>
              <Copy size={18} />
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>Password Length: {length}</label>
            <input type="range" min="6" max="64" value={length} onChange={(e) => setLength(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} /> Uppercase (A-Z)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} /> Lowercase (a-z)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} /> Numbers (0-9)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} /> Symbols (!@#$...)
            </label>
          </div>
          
          <button className="btn btn-primary" onClick={generate} style={{ width: '100%', justifyContent: 'center' }}>
            <RefreshCw size={16} /> Generate Password
          </button>
        </div>
      </div>
    </main>
  )
}
