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
import Cartoonifier from './pages/Cartoonifier'
import VideoCompressor from './pages/VideoCompressor'
import ColorPalette from './pages/ColorPalette'
import SubtitleExtractor from './pages/SubtitleExtractor'
import ImageCompressor from './pages/ImageCompressor'
import ImageConverter from './pages/ImageConverter'
import MemeGenerator from './pages/MemeGenerator'
import ImageToText from './pages/ImageToText'
import Tools from './pages/Tools'

export default function App() {
  return (
    <>
      <Navbar />
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
        <Route path="/cartoonify" element={<Cartoonifier />} />
        <Route path="/compress-video" element={<VideoCompressor />} />
        <Route path="/palette" element={<ColorPalette />} />
        <Route path="/subtitles" element={<SubtitleExtractor />} />
        <Route path="/compress-image" element={<ImageCompressor />} />
        <Route path="/convert-image" element={<ImageConverter />} />
        <Route path="/meme" element={<MemeGenerator />} />
        <Route path="/ocr" element={<ImageToText />} />
        <Route path="/tools" element={<Tools />} />
      </Routes>
    </>
  )
}
