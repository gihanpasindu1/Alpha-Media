import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload, Settings, Shield, RefreshCw } from 'lucide-react'

export default function ImageToPdf() {
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
          <h1><span className="glow-text">Image to PDF</span></h1>
          <p>Convert and combine multiple images into a PDF.</p>
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
