/**
 * ProgressBar — shows upload % and phase label.
 *
 * Props:
 *   phase     'uploading' | 'processing' | 'done' | null
 *   progress  0-100
 */
export default function ProgressBar({ phase, progress }) {
  if (!phase || phase === 'done') return null

  const isUploading = phase === 'uploading'
  const label = isUploading
    ? `Uploading… ${progress}%`
    : 'Processing on server…'

  // Processing phase pulses back and forth (indeterminate)
  const barStyle = isUploading
    ? { width: `${progress}%`, transition: 'width 0.3s ease' }
    : { width: '100%', animation: 'progress-pulse 1.5s ease-in-out infinite' }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 13, color: 'var(--text-muted)', marginBottom: 6
      }}>
        <span>{label}</span>
        {isUploading && <span style={{ color: 'var(--accent)' }}>{progress}%</span>}
      </div>
      <div style={{
        height: 6, borderRadius: 999,
        background: 'var(--surface2)',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          height: '100%',
          borderRadius: 999,
          background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
          ...barStyle
        }} />
      </div>

      <style>{`
        @keyframes progress-pulse {
          0%   { opacity: 1; transform: scaleX(1); transform-origin: left; }
          50%  { opacity: 0.7; }
          100% { opacity: 1; transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  )
}
