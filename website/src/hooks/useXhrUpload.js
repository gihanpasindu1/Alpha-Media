/**
 * useXhrUpload — wraps XMLHttpRequest so we get real upload-progress events.
 *
 * Usage:
 *   const { upload, progress, phase } = useXhrUpload()
 *
 *   const { blob, headers } = await upload(url, formData)
 *
 * `progress`  0-100  (number)
 * `phase`     'uploading' | 'processing' | 'done' | null
 */
import { useState, useCallback } from 'react'

export function useXhrUpload() {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(null) // 'uploading' | 'processing' | 'done'

  const upload = useCallback((url, formData, method = 'POST') => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress (0 → 100 while sending the file)
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(pct)
          setPhase(pct < 100 ? 'uploading' : 'processing')
        }
      })

      xhr.upload.addEventListener('load', () => {
        setProgress(100)
        setPhase('processing')
      })

      xhr.addEventListener('load', () => {
        setPhase('done')
        if (xhr.status >= 200 && xhr.status < 300) {
          // Parse response headers into a Map-like object
          const headers = {}
          xhr.getAllResponseHeaders()
            .split('\r\n')
            .filter(Boolean)
            .forEach((line) => {
              const [key, ...vals] = line.split(': ')
              headers[key.toLowerCase()] = vals.join(': ')
            })
          resolve({ blob: xhr.response, headers })
        } else {
          // Parse error detail from Blob response
          if (xhr.response instanceof Blob) {
            xhr.response.text().then(text => {
              try {
                const err = JSON.parse(text)
                reject(new Error(err.detail || `Server error ${xhr.status}: ${text}`))
              } catch {
                reject(new Error(`Server error ${xhr.status}: ${text}`))
              }
            }).catch(() => reject(new Error(`Server error ${xhr.status}`)))
          } else {
            reject(new Error(`Server error ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

      xhr.open(method, url)
      xhr.responseType = 'blob'
      xhr.send(formData)
    })
  }, [])

  const reset = useCallback(() => {
    setProgress(0)
    setPhase(null)
  }, [])

  return { upload, progress, phase, reset }
}
