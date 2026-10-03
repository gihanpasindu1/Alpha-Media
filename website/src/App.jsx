import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Tools from './pages/Tools'
import NotFound from './pages/NotFound'

import CodeToImage from './pages/CodeToImage'
import YtSummarizer from './pages/YtSummarizer'
import VoiceChanger from './pages/VoiceChanger'
import VideoReverser from './pages/VideoReverser'
import AudioVisualizer from './pages/AudioVisualizer'
import AutoCaption from './pages/AutoCaption'


const VideoDownloader = lazy(() => import('./pages/VideoDownloader'))
const ClipTrimmer = lazy(() => import('./pages/ClipTrimmer'))
const VideoToGif = lazy(() => import('./pages/VideoToGif'))
const BackgroundRemover = lazy(() => import('./pages/BackgroundRemover'))
const PdfToolkit = lazy(() => import('./pages/PdfToolkit'))
const QrCode = lazy(() => import('./pages/QrCode'))
const FaceBlur = lazy(() => import('./pages/FaceBlur'))
const BpmDetector = lazy(() => import('./pages/BpmDetector'))
const VocalReducer = lazy(() => import('./pages/VocalReducer'))
const VideoCompressor = lazy(() => import('./pages/VideoCompressor'))
const ColorPalette = lazy(() => import('./pages/ColorPalette'))
const SubtitleExtractor = lazy(() => import('./pages/SubtitleExtractor'))
const ImageCompressor = lazy(() => import('./pages/ImageCompressor'))
const ImageConverter = lazy(() => import('./pages/ImageConverter'))
const MemeGenerator = lazy(() => import('./pages/MemeGenerator'))
const ImageToText = lazy(() => import('./pages/ImageToText'))
const ScreenRecorder = lazy(() => import('./pages/ScreenRecorder'))
const VideoToMp3 = lazy(() => import('./pages/VideoToMp3'))
const VideoSpeedChanger = lazy(() => import('./pages/VideoSpeedChanger'))
const RemoveWatermark = lazy(() => import('./pages/RemoveWatermark'))
const AddSubtitles = lazy(() => import('./pages/AddSubtitles'))
const MergeVideos = lazy(() => import('./pages/MergeVideos'))
const AudioTrimmer = lazy(() => import('./pages/AudioTrimmer'))
const AudioMerger = lazy(() => import('./pages/AudioMerger'))
const NoiseRemover = lazy(() => import('./pages/NoiseRemover'))
const AudioConverter = lazy(() => import('./pages/AudioConverter'))
const TextToSpeech = lazy(() => import('./pages/TextToSpeech'))
const WordToPdf = lazy(() => import('./pages/WordToPdf'))
const ImageToPdf = lazy(() => import('./pages/ImageToPdf'))
const PdfCompressor = lazy(() => import('./pages/PdfCompressor'))
const PdfToImages = lazy(() => import('./pages/PdfToImages'))
const UrlShortener = lazy(() => import('./pages/UrlShortener'))
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'))
const JsonFormatter = lazy(() => import('./pages/JsonFormatter'))

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tool...</div>}>
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
            <Route path="*" element={<NotFound />} />
          
        <Route path="/code-to-image" element={<CodeToImage />} />
        <Route path="/yt-summarize" element={<YtSummarizer />} />
        <Route path="/voice-changer" element={<VoiceChanger />} />
        <Route path="/video-reverser" element={<VideoReverser />} />
        <Route path="/audio-visualizer" element={<AudioVisualizer />} />
        <Route path="/auto-caption" element={<AutoCaption />} />
        </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
