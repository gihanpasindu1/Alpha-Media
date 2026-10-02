import os

tools_path = "website/src/pages/Tools.jsx"
with open(tools_path, "r") as f:
    content = f.read()

# 1. Fix arrow
content = content.replace("Video → GIF", "Video to GIF")

# 2. Add imports
import_start = content.find("import {\n")
import_end = content.find("} from 'lucide-react'") + len("} from 'lucide-react'")

new_imports = """import {
  Download, Scissors, Film, Image, FileText,
  QrCode, Eye, Music, Mic2, Wand2, Minimize, Minimize2, Palette, Type,
  ArrowRight, Search, RefreshCw, Smile, Monitor, Headphones, FastForward,
  Eraser, PlusSquare, Merge, Video, ImageIcon, AudioLines, FileStack, Radio, X,
  Settings, Shield, VolumeX, Plus, Code, Link as LinkIcon, Mic
} from 'lucide-react'"""
content = content[:import_start] + new_imports + content[import_end:]

# 3. Add tools to array
new_tools = """
  // New Audio
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
]"""
content = content.replace("]\n\nconst CATEGORIES", new_tools + "\n\nconst CATEGORIES")

# 4. Add filter tabs
old_tabs = """        <button className={`cat-tab ${filter === 'utility' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('utility')}>
          <FileText size={16} /> Document <span className="cat-count">{counts.utility || 0}</span>
        </button>"""
new_tabs = """        <button className={`cat-tab ${filter === 'document' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('document')}>
          <FileText size={16} /> Document <span className="cat-count">{counts.document || 0}</span>
        </button>
        <button className={`cat-tab ${filter === 'utility' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('utility')}>
          <Settings size={16} /> Utility <span className="cat-count">{counts.utility || 0}</span>
        </button>"""
if "Document" not in content and "Utility" not in content:
    content = content.replace(old_tabs, new_tabs) # wait, old tabs didn't have utility.

# Let's just find the exact block and replace it using string split.
search_str = """        <button className={`cat-tab ${filter === 'audio' ? 'cat-tab-active' : ''}`} onClick={() => setFilter('audio')}>
          <AudioLines size={16} /> Audio <span className="cat-count">{counts.audio || 0}</span>
        </button>"""
if search_str in content:
    content = content.replace(search_str, search_str + "\n" + new_tabs)

with open(tools_path, "w") as f:
    f.write(content)
print("Updated successfully")
