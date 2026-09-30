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
      </Routes>
    </>
  )
}
