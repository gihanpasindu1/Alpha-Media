import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { FileText, Upload, GitMerge, Scissors, Minimize2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

const API = import.meta.env.VITE_API_URL || 'https://api.alphamedia.bond'

function MergeTab() {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    setFiles(f => [...f, ...accepted]); setStatus(null)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': [] }, multiple: true })

  const handleMerge = async () => {
    if (files.length < 2) { setStatus({ type: 'error', msg: 'Please add at least 2 PDF files.' }); return }
    setLoading(true); setStatus({ type: 'loading', msg: 'Merging PDFs…' })
    try {
      const merged = await PDFDocument.create()
      for (const f of files) {
        const bytes = await f.arrayBuffer()
        const doc = await PDFDocument.load(bytes)
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      const bytes = await merged.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'merged.pdf'; a.click()
      setStatus({ type: 'success', msg: `Merged ${files.length} PDFs successfully!` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon"><Upload size={36} /></div>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Drop PDFs here</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Add multiple PDFs — they'll be merged in order</p>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 14 }}>
              <span>📄 {f.name}</span>
              <button onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-primary" onClick={handleMerge} disabled={loading || files.length < 2} style={{ width: '100%', marginTop: 16 }}>
        {loading ? <><span className="spinner" /> Merging…</> : <><GitMerge size={18} /> Merge {files.length} PDFs</>}
      </button>
      {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
    </div>
  )
}

function SplitTab() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => { setFile(accepted[0]); setStatus(null) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': [] }, multiple: false })

  const handleSplit = async () => {
    if (!file) return
    setLoading(true); setStatus({ type: 'loading', msg: 'Splitting PDF into pages…' })
    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes)
      const pageCount = doc.getPageCount()
      for (let i = 0; i < pageCount; i++) {
        const single = await PDFDocument.create()
        const [page] = await single.copyPages(doc, [i])
        single.addPage(page)
        const b = await single.save()
        const blob = new Blob([b], { type: 'application/pdf' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `page_${i + 1}.pdf`; a.click()
        await new Promise(r => setTimeout(r, 200))
      }
      setStatus({ type: 'success', msg: `Split into ${pageCount} individual PDFs!` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon"><Upload size={36} /></div>
        {file ? <p style={{ fontWeight: 600 }}>📄 {file.name}</p> : <><p style={{ fontWeight: 600, marginBottom: 6 }}>Drop a PDF to split</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Each page will be saved as a separate PDF</p></>}
      </div>
      <button className="btn btn-primary" onClick={handleSplit} disabled={loading || !file} style={{ width: '100%', marginTop: 16 }}>
        {loading ? <><span className="spinner" /> Splitting…</> : <><Scissors size={18} /> Split into Pages</>}
      </button>
      {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
    </div>
  )
}

function CompressTab() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => { setFile(accepted[0]); setStatus(null) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': [] }, multiple: false })

  const handleCompress = async () => {
    if (!file) return
    setLoading(true); setStatus({ type: 'loading', msg: 'Compressing PDF…' })
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch(`${API}/api/pdf/compress`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error((await r.json()).detail)
      const blob = await r.blob()
      const origSize = r.headers.get('X-Original-Size')
      const compSize = r.headers.get('X-Compressed-Size')
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'compressed.pdf'; a.click()
      const saved = origSize && compSize ? ` Saved ${(((origSize - compSize) / origSize) * 100).toFixed(1)}%` : ''
      setStatus({ type: 'success', msg: `PDF compressed!${saved}` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon"><Upload size={36} /></div>
        {file ? <p style={{ fontWeight: 600 }}>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p> : <><p style={{ fontWeight: 600, marginBottom: 6 }}>Drop a PDF to compress</p><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Reduce file size while keeping quality</p></>}
      </div>
      <button className="btn btn-primary" onClick={handleCompress} disabled={loading || !file} style={{ width: '100%', marginTop: 16 }}>
        {loading ? <><span className="spinner" /> Compressing…</> : <><Minimize2 size={18} /> Compress PDF</>}
      </button>
      {status && <div className={`status-box ${status.type}`}>{status.type === 'loading' && <span className="spinner" />}{status.msg}</div>}
    </div>
  )
}

const tabs = [
  { id: 'merge', label: '🔗 Merge', component: MergeTab },
  { id: 'split', label: '✂️ Split', component: SplitTab },
  { id: 'compress', label: '📦 Compress', component: CompressTab },
]

export default function PdfToolkit() {
  const [tab, setTab] = useState('merge')
  const Tab = tabs.find(t => t.id === tab).component

  return (
    <main className="tool-page">
      <div className="container">
        <motion.div className="tool-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1><span className="glow-text">PDF Toolkit</span></h1>
          <p>Merge multiple PDFs, split by page, or compress file size. All client-side, no upload needed for merge/split.</p>
        </motion.div>

        <motion.div className="tool-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '4px', background: 'var(--surface2)', borderRadius: 10 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, transition: 'var(--transition)',
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
