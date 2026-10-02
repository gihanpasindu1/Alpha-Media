import os

# --- PATCH App.jsx ---
app_path = "website/src/App.jsx"
with open(app_path, "r") as f:
    app_code = f.read()

imports = """import AudioTrimmer from './pages/AudioTrimmer'
import AudioMerger from './pages/AudioMerger'
import NoiseRemover from './pages/NoiseRemover'
import AudioConverter from './pages/AudioConverter'
import TextToSpeech from './pages/TextToSpeech'
import WordToPdf from './pages/WordToPdf'
import ImageToPdf from './pages/ImageToPdf'
import PdfCompressor from './pages/PdfCompressor'
import PdfToImages from './pages/PdfToImages'
import UrlShortener from './pages/UrlShortener'
import PasswordGenerator from './pages/PasswordGenerator'
import JsonFormatter from './pages/JsonFormatter'
"""

routes = """          <Route path="/audio-trim" element={<AudioTrimmer />} />
          <Route path="/audio-merge" element={<AudioMerger />} />
          <Route path="/noise-remover" element={<NoiseRemover />} />
          <Route path="/audio-convert" element={<AudioConverter />} />
          <Route path="/tts" element={<TextToSpeech />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/pdf-compress" element={<PdfCompressor />} />
          <Route path="/pdf-to-images" element={<PdfToImages />} />
          <Route path="/url-shortener" element={<UrlShortener />} />
          <Route path="/password-generator" element={<PasswordGenerator />} />
          <Route path="/json-formatter" element={<JsonFormatter />} />
"""

if "import AudioTrimmer" not in app_code:
    app_code = app_code.replace("import Footer from './components/Footer'", imports + "import Footer from './components/Footer'")
    app_code = app_code.replace("          <Route path=\"/tools\" element={<Tools />} />", "          <Route path=\"/tools\" element={<Tools />} />\n" + routes)
    
    with open(app_path, "w") as f:
        f.write(app_code)


# --- PATCH Tools.jsx ---
tools_path = "website/src/pages/Tools.jsx"
with open(tools_path, "r") as f:
    tools_code = f.read()

new_tools_array = """
  // Audio
  { to: '/audio-trim',      icon: Scissors,    label: 'Audio Trimmer',          desc: 'Cut and trim audio files with precision.',       color: '#f5a623', category: 'audio' },
  { to: '/audio-merge',     icon: Plus,        label: 'Audio Merger',           desc: 'Combine multiple audio tracks into one.',        color: '#f5a623', category: 'audio' },
  { to: '/noise-remover',   icon: VolumeX,     label: 'Noise Remover',          desc: 'AI-powered background noise reduction.',         color: '#f5a623', category: 'audio' },
  { to: '/audio-convert',   icon: RefreshCw,   label: 'Audio Converter',        desc: 'Convert audio to MP3, WAV, OGG, and more.',      color: '#f5a623', category: 'audio' },
  { to: '/tts',             icon: Mic,         label: 'Text to Speech',         desc: 'Convert written text into natural spoken audio.',color: '#f5a623', category: 'audio' },

  // Document
  { to: '/word-to-pdf',     icon: FileText,    label: 'Word to PDF',            desc: 'Convert Word documents (DOCX) to PDF format.',   color: '#e74c3c', category: 'document' },
  { to: '/image-to-pdf',    icon: Image,       label: 'Image to PDF',           desc: 'Combine JPG or PNG images into a single PDF.',   color: '#e74c3c', category: 'document' },
  { to: '/pdf-compress',    icon: Minimize2,   label: 'PDF Compressor',         desc: 'Reduce the file size of your PDF documents.',    color: '#e74c3c', category: 'document' },
  { to: '/pdf-to-images',   icon: Image,       label: 'PDF to Images',          desc: 'Extract all pages of a PDF into JPG images.',    color: '#e74c3c', category: 'document' },

  // Utility
  { to: '/url-shortener',   icon: LinkIcon,    label: 'URL Shortener',          desc: 'Create short, manageable links from long URLs.', color: '#3498db', category: 'utility' },
  { to: '/password-generator',icon: Shield,    label: 'Password Generator',     desc: 'Generate strong, random, and secure passwords.', color: '#3498db', category: 'utility' },
  { to: '/json-formatter',  icon: Code,        label: 'JSON Formatter',         desc: 'Format, validate, and beautify your JSON data.', color: '#3498db', category: 'utility' },
"""

if "{ to: '/audio-trim'" not in tools_code:
    # We need to add the 'utility' category tab
    if "category: 'utility'" not in tools_code:
        cat_tabs = """        <button className={`cat-tab ${filter === 'document' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('document')}>
          <FileText size={16} /> Document <span className="cat-count">{counts.document || 0}</span>
        </button>
        <button className={`cat-tab ${filter === 'utility' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('utility')}>
          <Settings size={16} /> Utility <span className="cat-count">{counts.utility || 0}</span>
        </button>"""
        tools_code = tools_code.replace("""        <button className={`cat-tab ${filter === 'document' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('document')}>
          <FileText size={16} /> Document <span className="cat-count">{counts.document || 0}</span>
        </button>""", cat_tabs)

    # We need to add the new tools
    # Let's insert them right before the closing bracket of allTools
    tools_code = tools_code.replace("];", new_tools_array + "\n];")
    
    # We also need to add missing imports for lucide icons
    icon_imports = "import { Search, Play, Scissors, FastForward, Droplet, Minimize2, Palette, Wand2, Type, Merge, Upload, Eye, Music, Mic, FileText, QrCode, ScanText, Video, Settings, Shield, RefreshCw, VolumeX, Plus, Code, Link as LinkIcon } from 'lucide-react'"
    import_start = tools_code.find("import { Search")
    import_end = tools_code.find(" } from 'lucide-react'") + len(" } from 'lucide-react'")
    tools_code = tools_code[:import_start] + icon_imports + tools_code[import_end:]

    with open(tools_path, "w") as f:
        f.write(tools_code)

print("Patching complete.")
