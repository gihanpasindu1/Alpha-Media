import { Link } from 'react-router-dom'
import {
  Download, Sparkles, Wrench, BookOpen, Code2,
  ShieldCheck, CircleHelp, Mail, ChevronRight
} from 'lucide-react'
import './Docs.css'

const sections = [
  { id: 'what-is', label: 'What is AlphaMedia', icon: Sparkles },
  { id: 'downloader', label: 'Video Downloader', icon: Download },
  { id: 'tools', label: 'All Tools', icon: Wrench },
  { id: 'guides', label: 'Guides', icon: BookOpen },
  { id: 'api', label: 'Developers & API', icon: Code2 },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'faq', label: 'FAQ', icon: CircleHelp },
]

const faqs = [
  {
    q: 'Is AlphaMedia free?',
    a: 'Yes. Every tool on AlphaMedia is free to use, no account or sign-up required.',
  },
  {
    q: 'Which sites can I download videos from?',
    a: 'YouTube, TikTok, Instagram, Facebook, X (Twitter) and 100+ more sites are supported. Paste a link on the Video Downloader page and it will detect what is available.',
  },
  {
    q: 'Why did my download fail?',
    a: 'A few common reasons: the video is private, age-restricted or DRM-protected (for example Netflix-style streams can never be downloaded by any tool), or the site is temporarily blocking downloads. Wait a bit and try again — most failures are temporary.',
  },
  {
    q: 'What quality will I get?',
    a: 'Up to the best quality the site offers for that video. You can pick a smaller size if you want a faster download.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. Everything runs in your browser. Video downloads are processed on our servers; most other tools run entirely on your own device.',
  },
  {
    q: 'Are my files kept on your servers?',
    a: 'No. Files you upload or download are processed and then deleted. We do not keep copies of your media.',
  },
]

const guides = [
  {
    title: 'Download a YouTube video',
    steps: [
      'Copy the video URL from YouTube.',
      'Open the Video Downloader and paste the link.',
      'Pick a quality and format (MP4 video or MP3 audio).',
      'Hit download and save the file.',
    ],
  },
  {
    title: 'Save a TikTok without the watermark',
    steps: [
      'Copy the TikTok video link (Share → Copy link).',
      'Paste it into the Video Downloader.',
      'Choose the watermark-free MP4 option when offered.',
    ],
  },
  {
    title: 'Blur faces in a video',
    steps: [
      'Open AI Face Blur and upload your video.',
      'Faces are detected automatically — tap the ones to blur.',
      'Export the blurred video.',
    ],
  },
  {
    title: 'Turn text into speech',
    steps: [
      'Open Text to Speech and type or paste your text.',
      'Pick a voice and language.',
      'Generate and download the audio.',
    ],
  },
]

export default function Docs() {
  return (
    <div className="docs-page">
      <div className="container docs-layout">
        <aside className="docs-nav">
          <div className="docs-nav-title">Documentation</div>
          {sections.map(({ id, label, icon: Icon }) => (
            <a key={id} href={`#${id}`} className="docs-nav-link">
              <Icon size={15} /> {label}
            </a>
          ))}
          <Link to="/tools" className="docs-nav-cta">
            Try the tools <ChevronRight size={14} />
          </Link>
        </aside>

        <article className="docs-content">
          <header className="docs-hero">
            <h1>Documentation</h1>
            <p>Everything you need to know about using AlphaMedia — free online tools for video, audio, images, PDFs and more. No account needed.</p>
          </header>

          <section id="what-is" className="docs-section">
            <h2>What is AlphaMedia</h2>
            <p>
              AlphaMedia is a collection of free online media tools that run right in your browser.
              Download videos, convert audio, edit images, work with PDFs, generate QR codes and more —
              without installing software or creating an account.
            </p>
            <p>
              Some tools process your files directly on your device, so they are fast and private.
              Tools that need heavy processing — like the video downloader, AI face blur
              or text-to-speech — run on our servers instead.
            </p>
          </section>

          <section id="downloader" className="docs-section">
            <h2>Video Downloader</h2>
            <p>Our most popular tool. Here is how it works:</p>
            <ol className="docs-steps">
              <li><strong>Paste a link</strong> — copy the URL of the video you want and paste it into the downloader.</li>
              <li><strong>Pick quality &amp; format</strong> — choose MP4 video (up to the best quality the site offers) or extract MP3 audio.</li>
              <li><strong>Download</strong> — your file is prepared and saved to your device.</li>
            </ol>
            <h3>Supported sites</h3>
            <p>
              YouTube, TikTok, Instagram, Facebook, X (Twitter) and 100+ more sites.
              If a site is supported, the downloader will list the available qualities automatically.
            </p>
            <h3>Limits</h3>
            <ul className="docs-list">
              <li>DRM-protected streams (like Netflix or Spotify) cannot be downloaded by any tool — this is a technical limitation, not a bug.</li>
              <li>Private, deleted or age-restricted videos may not be downloadable.</li>
              <li>Some sites temporarily block downloads; if a download fails, try again later.</li>
            </ul>
          </section>

          <section id="tools" className="docs-section">
            <h2>All Tools</h2>
            <p>AlphaMedia includes 40+ free tools across five categories:</p>
            <div className="docs-tool-grid">
              <div className="docs-tool-card">
                <h3>Video</h3>
                <p>Downloader, trimmer, GIF maker, compressor, speed changer, video-to-MP3, watermark remover, subtitle tools, merger and more.</p>
              </div>
              <div className="docs-tool-card">
                <h3>Audio</h3>
                <p>Trimmer, merger, converter, vocal remover, BPM detector, noise remover, voice changer and text-to-speech.</p>
              </div>
              <div className="docs-tool-card">
                <h3>Image</h3>
                <p>Background remover, AI face blur, compressor, format converter, meme generator, color palette extractor.</p>
              </div>
              <div className="docs-tool-card">
                <h3>Documents</h3>
                <p>PDF toolkit (merge, split, compress), image-to-PDF, Word-to-PDF, QR codes, OCR text extraction.</p>
              </div>
              <div className="docs-tool-card">
                <h3>Utilities</h3>
                <p>Password generator, JSON formatter, URL shortener, code-to-image and more.</p>
              </div>
            </div>
            <Link to="/tools" className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Browse all tools <ChevronRight size={16} />
            </Link>
          </section>

          <section id="guides" className="docs-section">
            <h2>Guides</h2>
            <div className="docs-guides">
              {guides.map((g) => (
                <div key={g.title} className="docs-guide-card">
                  <h3>{g.title}</h3>
                  <ol>
                    {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section id="api" className="docs-section">
            <h2>Developers &amp; API</h2>
            <p>
              AlphaMedia exposes a public HTTP API for the video downloader and conversion tools.
              The interactive API reference is available at{' '}
              <a href="https://api.alphamedia.bond/openapi.json" target="_blank" rel="noopener">
                api.alphamedia.bond/openapi.json
              </a>.
            </p>
            <pre className="docs-code">{`# Example: download a video's audio as MP3
curl "https://api.alphamedia.bond/api/download?url=https://www.youtube.com/watch?v=...&format=mp3" -o audio.mp3

# Query parameters: url (required), quality (default 720), format (video|mp3), playlist (true|false)`}</pre>
            <p className="docs-note">
              The API is free for reasonable use. If you build on it, please keep
              request rates sensible — heavy automated abuse degrades the service for everyone.
            </p>
          </section>

          <section id="privacy" className="docs-section">
            <h2>Privacy</h2>
            <ul className="docs-list">
              <li><strong>No account needed.</strong> We do not ask for your name, email or any personal details.</li>
              <li><strong>Many tools run in your browser.</strong> Your files never leave your device for tools like the image compressor, background remover, QR generator or password generator.</li>
              <li><strong>Server-processed files are deleted.</strong> Video downloads and other server-side jobs are removed after processing — we do not keep copies of your media.</li>
              <li><strong>No tracking profiles.</strong> We do not build advertising profiles from your usage.</li>
            </ul>
          </section>

          <section id="faq" className="docs-section">
            <h2>FAQ</h2>
            <div className="docs-faq">
              {faqs.map((f) => (
                <details key={f.q} className="docs-faq-item">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="docs-section docs-contact">
            <h2><Mail size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />Contact</h2>
            <p>
              Found a bug or have a tool request? Reach us through the contact options on the homepage —
              we read every message.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
