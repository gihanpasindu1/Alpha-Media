import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import VideoDownloader from './pages/VideoDownloader'
import ClipTrimmer from './pages/ClipTrimmer'
import VideoToGif from './pages/VideoToGif'
import BackgroundRemover from './pages/BackgroundRemover'
import PdfToolkit from './pages/PdfToolkit'
import QrCode from './pages/QrCode'
import FaceBlur from './pages/FaceBlur'
import BpmDetector from './pages/BpmDetector'
import VocalReducer from './pages/VocalReducer'
import VideoCompressor from './pages/VideoCompressor'
import ColorPalette from './pages/ColorPalette'
import SubtitleExtractor from './pages/SubtitleExtractor'
import ImageCompressor from './pages/ImageCompressor'
import ImageConverter from './pages/ImageConverter'
import MemeGenerator from './pages/MemeGenerator'
import ImageToText from './pages/ImageToText'
import ScreenRecorder from './pages/ScreenRecorder'
import VideoToMp3 from './pages/VideoToMp3'
import VideoSpeedChanger from './pages/VideoSpeedChanger'
import RemoveWatermark from './pages/RemoveWatermark'
import AddSubtitles from './pages/AddSubtitles'
import MergeVideos from './pages/MergeVideos'
import Tools from './pages/Tools'
import AudioTrimmer from './pages/AudioTrimmer'
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
import Footer from './components/Footer'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<VideoDownloader />} />
          <Route path="/trim" element={<ClipTrimmer />} />
          <Route path="/gif" element={<VideoToGif />} />
          <Route path="/bg-remove" element={<BackgroundRemover />} />
          <Route path="/pdf" element={<PdfToolkit />} />
          <Route path="/qr" element={<QrCode />} />
          <Route path="/face-blur" element={<FaceBlur />} />
          <Route path="/bpm" element={<BpmDetector />} />
          <Route path="/vocal-reducer" element={<VocalReducer />} />
          <Route path="/compress-video" element={<VideoCompressor />} />
          <Route path="/palette" element={<ColorPalette />} />
          <Route path="/subtitles" element={<SubtitleExtractor />} />
          <Route path="/compress-image" element={<ImageCompressor />} />
          <Route path="/convert-image" element={<ImageConverter />} />
          <Route path="/meme" element={<MemeGenerator />} />
          <Route path="/ocr" element={<ImageToText />} />
          <Route path="/screen-record" element={<ScreenRecorder />} />
          <Route path="/video-to-mp3" element={<VideoToMp3 />} />
          <Route path="/video-speed" element={<VideoSpeedChanger />} />
          <Route path="/remove-watermark" element={<RemoveWatermark />} />
          <Route path="/add-subtitles" element={<AddSubtitles />} />
          <Route path="/merge-videos" element={<MergeVideos />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/audio-trim" element={<AudioTrimmer />} />
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

        </Routes>
      </div>
      <Footer />
    </div>
  )
}
