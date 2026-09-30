import os
import uuid
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import librosa
import yt_dlp
from pypdf import PdfReader, PdfWriter
from PIL import Image
import io

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import aiofiles
import uvicorn

app = FastAPI(title="Alpha Media API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Filename", "X-Original-Size", "X-Compressed-Size"],
)

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

def temp_path(ext: str = "") -> Path:
    return TEMP_DIR / f"{uuid.uuid4().hex}{ext}"

def cleanup(*paths):
    for p in paths:
        try:
            if Path(p).is_dir():
                shutil.rmtree(p)
            elif Path(p).exists():
                os.remove(p)
        except Exception:
            pass


# ─────────────────────────────── VIDEO DOWNLOADER ───────────────────────────

@app.post("/api/download")
async def download_video(
    url: str = Form(...),
    quality: str = Form("720"),
    format: str = Form("video"),  # "video" | "mp3"
):
    out_dir = temp_path()
    out_dir.mkdir(parents=True)
    try:
        if format == "mp3":
            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": str(out_dir / "%(title)s.%(ext)s"),
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                }],
                "noplaylist": True,
                "quiet": True,
                "cookiefile": "cookies.txt",
                "extractor_args": {"youtube": {"player_client": ["web"], "po_token": ["web+auto"]}},
            }
        else:
            ydl_opts = {
                "format": f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]/best",
                "outtmpl": str(out_dir / "%(title)s.%(ext)s"),
                "noplaylist": True,
                "quiet": True,
                "cookiefile": "cookies.txt",
                "merge_output_format": "mp4",
                "extractor_args": {"youtube": {"player_client": ["web"], "po_token": ["web+auto"]}},
            }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

        files = list(out_dir.iterdir())
        if not files:
            raise HTTPException(500, "Download produced no file")

        out_file = files[0]
        suffix = out_file.suffix or (".mp3" if format == "mp3" else ".mp4")
        safe_name = f"alpha_media_download{suffix}"

        from fastapi.responses import Response
        content = out_file.read_bytes()
        cleanup(out_dir)
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}"',
                "X-Filename": safe_name,
            },
        )
    except Exception as e:
        cleanup(out_dir)
        raise HTTPException(500, str(e))


# ─────────────────────────────── VIDEO INFO ─────────────────────────────────

@app.post("/api/video-info")
async def video_info(url: str = Form(...)):
    try:
        ydl_opts = {
            "quiet": True, 
            "no_warnings": True, 
            "extract_flat": False, 
            "noplaylist": True,
            "cookiefile": "cookies.txt",
            "extractor_args": {"youtube": ["client=ANDROID_TESTSUITE,IOS"]}
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        return {
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "duration": info.get("duration"),
            "uploader": info.get("uploader"),
            "view_count": info.get("view_count"),
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ─────────────────────────────── CLIP TRIMMER ───────────────────────────────

@app.post("/api/trim")
async def trim_video(
    file: UploadFile = File(...),
    start: str = Form(...),  # HH:MM:SS or seconds
    end: str = Form(...),
):
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    out_path = temp_path(".mp4")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        cmd = [
            "ffmpeg", "-y",
            "-i", str(in_path),
            "-ss", str(start),
            "-to", str(end),
            "-c:v", "libx264", "-c:a", "aac",
            str(out_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(500, result.stderr[-500:])

        content = out_path.read_bytes()
        cleanup(out_path)
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="video/mp4",
            headers={"Content-Disposition": 'attachment; filename="trimmed.mp4"', "X-Filename": "trimmed.mp4"},
        )
    finally:
        cleanup(in_path)


@app.post("/api/trim-url")
async def trim_video_from_url(
    url: str = Form(...),
    start: str = Form(...),   # seconds as float or HH:MM:SS string
    end: str = Form(...),
    quality: str = Form("720"),
):
    """Download ONLY the specified time range from a URL using yt-dlp download_ranges.
    This never downloads the full video — only the requested clip."""
    out_dir = temp_path()
    out_dir.mkdir(parents=True)
    try:
        def parse_time(t: str) -> float:
            """Convert HH:MM:SS or plain seconds string to float seconds."""
            t = t.strip()
            if ":" in t:
                parts = t.split(":")
                if len(parts) == 3:
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
                elif len(parts) == 2:
                    return int(parts[0]) * 60 + float(parts[1])
            return float(t)

        start_sec = parse_time(start)
        end_sec = parse_time(end)

        if end_sec <= start_sec:
            raise HTTPException(400, "End time must be after start time.")

        ydl_opts = {
            "format": f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]/best",
            "outtmpl": str(out_dir / "clip.%(ext)s"),
            "noplaylist": True,
            "quiet": True,
            "merge_output_format": "mp4",
            "download_ranges": yt_dlp.utils.download_range_func(None, [(start_sec, end_sec)]),
            "force_keyframes_at_cuts": True,
            "extractor_args": {"youtube": ["client=ANDROID_TESTSUITE,IOS"]},
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        files = list(out_dir.iterdir())
        if not files:
            raise HTTPException(500, "No clip was produced. Check URL and time range.")

        out_file = files[0]
        suffix = out_file.suffix or ".mp4"
        safe_name = f"clip_{int(start_sec)}s-{int(end_sec)}s{suffix}"
        content = out_file.read_bytes()
        cleanup(out_dir)

        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}"',
                "X-Filename": safe_name,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        cleanup(out_dir)
        raise HTTPException(500, str(e))



# ─────────────────────────────── VIDEO TO GIF ───────────────────────────────

@app.post("/api/gif")
async def video_to_gif(
    file: UploadFile = File(...),
    fps: int = Form(10),
    width: int = Form(480),
):
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    palette_path = temp_path(".png")
    out_path = temp_path(".gif")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        # Generate palette for high-quality GIF
        subprocess.run([
            "ffmpeg", "-y", "-i", str(in_path),
            "-vf", f"fps={fps},scale={width}:-1:flags=lanczos,palettegen",
            str(palette_path),
        ], capture_output=True)

        result = subprocess.run([
            "ffmpeg", "-y",
            "-i", str(in_path), "-i", str(palette_path),
            "-filter_complex", f"fps={fps},scale={width}:-1:flags=lanczos[x];[x][1:v]paletteuse",
            str(out_path),
        ], capture_output=True, text=True)

        if result.returncode != 0:
            raise HTTPException(500, result.stderr[-500:])

        return FileResponse(str(out_path), filename="output.gif", media_type="image/gif")
    finally:
        cleanup(in_path, palette_path)


# ─────────────────────────────── FACE BLUR ──────────────────────────────────

@app.post("/api/face-blur")
async def face_blur(
    file: UploadFile = File(...),
    intensity: int = Form(30),
):
    suffix = Path(file.filename).suffix.lower()
    is_video = suffix in [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    in_path = temp_path(suffix if suffix else (".mp4" if is_video else ".jpg"))
    out_path = temp_path(suffix if suffix else (".mp4" if is_video else ".jpg"))
    final_video_path = temp_path(".mp4")
    
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        k = max(intensity | 1, 3)

        if not is_video:
            # Handle Image
            img = cv2.imread(str(in_path))
            if img is None: raise HTTPException(400, "Invalid image")
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = cascade.detectMultiScale(gray, 1.1, 4)
            for (x, y, w, h) in faces:
                roi = img[y:y+h, x:x+w]
                img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (k*2+1, k*2+1), 0)
            cv2.imwrite(str(out_path), img)
            
            content = out_path.read_bytes()
            from fastapi.responses import Response
            return Response(
                content=content, media_type="image/jpeg",
                headers={"Content-Disposition": 'attachment; filename="face_blurred.jpg"', "X-Filename": "face_blurred.jpg"}
            )
        else:
            # Handle Video
            cap = cv2.VideoCapture(str(in_path))
            if not cap.isOpened(): raise HTTPException(400, "Could not open video")
            
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            
            out = cv2.VideoWriter(str(out_path), fourcc, fps, (width, height))
            
            while True:
                ret, frame = cap.read()
                if not ret: break
                
                # To speed up, we can downscale for detection, but let's keep it simple
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                # minSize to ignore tiny false positives
                faces = cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
                for (x, y, w, h) in faces:
                    roi = frame[y:y+h, x:x+w]
                    frame[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (k*2+1, k*2+1), 0)
                out.write(frame)
                
            cap.release()
            out.release()
            
            # Combine blurred video with original audio using ffmpeg
            cmd = [
                "ffmpeg", "-y",
                "-i", str(out_path),
                "-i", str(in_path),
                "-c:v", "libx264", "-preset", "fast", "-crf", "26",
                "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0?",
                str(final_video_path)
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                # If audio merging fails (e.g., no audio), fallback to just the video
                if out_path.exists():
                    content = out_path.read_bytes()
                else:
                    raise HTTPException(500, "Video processing failed")
            else:
                content = final_video_path.read_bytes()
                
            from fastapi.responses import Response
            return Response(
                content=content, media_type="video/mp4",
                headers={"Content-Disposition": 'attachment; filename="face_blurred.mp4"', "X-Filename": "face_blurred.mp4"}
            )
            
    finally:
        cleanup(in_path, out_path, final_video_path)


# ─────────────────────────────── BPM DETECTOR ───────────────────────────────

@app.post("/api/bpm")
async def detect_bpm(file: UploadFile = File(...)):
    in_path = temp_path(Path(file.filename).suffix or ".mp3")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        y, sr = librosa.load(str(in_path), sr=None, mono=True, duration=60)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(round(float(tempo[0]) if hasattr(tempo, "__len__") else float(tempo), 2))

        return {"bpm": bpm}
    finally:
        cleanup(in_path)


# ─────────────────────────────── PDF TOOLKIT ────────────────────────────────

@app.post("/api/pdf/merge")
async def pdf_merge(files: list[UploadFile] = File(...)):
    paths = []
    out_path = temp_path(".pdf")
    try:
        writer = PdfWriter()
        for f in files:
            p = temp_path(".pdf")
            paths.append(p)
            async with aiofiles.open(p, "wb") as fh:
                await fh.write(await f.read())
            reader = PdfReader(str(p))
            for page in reader.pages:
                writer.add_page(page)

        with open(out_path, "wb") as fh:
            writer.write(fh)

        return FileResponse(str(out_path), filename="merged.pdf", media_type="application/pdf")
    finally:
        cleanup(*paths)


@app.post("/api/pdf/split")
async def pdf_split(file: UploadFile = File(...)):
    in_path = temp_path(".pdf")
    out_dir = temp_path()
    out_dir.mkdir()
    zip_path = temp_path(".zip")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        reader = PdfReader(str(in_path))
        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            page_path = out_dir / f"page_{i+1}.pdf"
            with open(page_path, "wb") as fh:
                writer.write(fh)

        shutil.make_archive(str(zip_path.with_suffix("")), "zip", str(out_dir))
        return FileResponse(str(zip_path), filename="split_pages.zip", media_type="application/zip")
    finally:
        cleanup(in_path, out_dir)


@app.post("/api/pdf/compress")
async def pdf_compress(file: UploadFile = File(...)):
    in_path = temp_path(".pdf")
    out_path = temp_path(".pdf")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        reader = PdfReader(str(in_path))
        writer = PdfWriter()
        writer.append_pages_from_reader(reader)
        writer.add_metadata(reader.metadata)

        for page in writer.pages:
            page.compress_content_streams()

        with open(out_path, "wb") as fh:
            writer.write(fh)

        original_size = in_path.stat().st_size
        compressed_size = out_path.stat().st_size

        return FileResponse(
            str(out_path),
            filename="compressed.pdf",
            media_type="application/pdf",
            headers={
                "X-Original-Size": str(original_size),
                "X-Compressed-Size": str(compressed_size),
            },
        )
    finally:
        cleanup(in_path)

# ─────────────────────────────── VOCAL REDUCER (KARAOKE) ────────────────────

import soundfile as sf

@app.post("/api/vocal-reducer")
async def vocal_reducer(file: UploadFile = File(...)):
    """Simple phase cancellation to remove center-panned vocals. Very lightweight!"""
    in_path = temp_path(Path(file.filename).suffix or ".mp3")
    out_path = temp_path(".wav")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        y, sr = librosa.load(str(in_path), sr=None, mono=False)
        if y.ndim == 1 or y.shape[0] < 2:
            raise HTTPException(400, "Audio must be stereo to reduce vocals.")
            
        # Left minus right channel removes center-panned audio (usually vocals)
        instrumental = y[0] - y[1]
        
        # Save as wav
        sf.write(str(out_path), instrumental, sr)
        
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="audio/wav",
            headers={
                "Content-Disposition": 'attachment; filename="karaoke_instrumental.wav"',
                "X-Filename": "karaoke_instrumental.wav"
            }
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── IMAGE CARTOONIFIER ─────────────────────────

@app.post("/api/cartoonify")
async def cartoonify(file: UploadFile = File(...)):
    in_path = temp_path(Path(file.filename).suffix or ".jpg")
    out_path = temp_path(".jpg")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        img = cv2.imread(str(in_path))
        if img is None:
            raise HTTPException(400, "Invalid image")
            
        # 1. Edge detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)
        edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
        
        # 2. Color quantization using bilateral filter
        color = cv2.bilateralFilter(img, 9, 300, 300)
        
        # 3. Combine
        cartoon = cv2.bitwise_and(color, color, mask=edges)
        
        cv2.imwrite(str(out_path), cartoon)
        
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="image/jpeg",
            headers={
                "Content-Disposition": 'attachment; filename="cartoonified.jpg"',
                "X-Filename": "cartoonified.jpg"
            }
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── VIDEO COMPRESSOR ───────────────────────────

@app.post("/api/compress-video")
async def compress_video(file: UploadFile = File(...)):
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    out_path = temp_path(".mp4")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        # Compress using ffmpeg with CRF 28 (very compressed but decent quality) and fast preset
        cmd = [
            "ffmpeg", "-y",
            "-i", str(in_path),
            "-vcodec", "libx264",
            "-crf", "28",
            "-preset", "veryfast",
            "-acodec", "aac",
            str(out_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(500, result.stderr[-500:])
            
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="video/mp4",
            headers={
                "Content-Disposition": 'attachment; filename="compressed.mp4"',
                "X-Filename": "compressed.mp4"
            }
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── COLOR PALETTE EXTRACTOR ────────────────────

@app.post("/api/palette")
async def extract_palette(file: UploadFile = File(...)):
    in_path = temp_path(Path(file.filename).suffix or ".jpg")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        img = Image.open(str(in_path))
        img = img.convert("RGB")
        img = img.resize((150, 150)) # resize for speed
        
        # Quantize to 6 colors
        q_img = img.quantize(colors=6, method=2) # 2 = Fast Octree
        palette = q_img.getpalette()[:18] # 6 colors * 3 (RGB)
        
        colors = []
        for i in range(0, 18, 3):
            r, g, b = palette[i], palette[i+1], palette[i+2]
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            colors.append(hex_color)
            
        return {"colors": colors}
    finally:
        cleanup(in_path)

# ─────────────────────────────── SUBTITLE EXTRACTOR ─────────────────────────

@app.post("/api/subtitles")
async def extract_subtitles(url: str = Form(...)):
    out_dir = temp_path()
    out_dir.mkdir(parents=True)
    try:
        ydl_opts = {
            "skip_download": True,
            "writeautomaticsub": True,
            "writesubtitles": True,
            "subtitlesformat": "srt",
            "outtmpl": str(out_dir / "%(title)s.%(ext)s"),
            "quiet": True,
            "cookiefile": "cookies.txt",
            "extractor_args": {"youtube": ["client=ANDROID_TESTSUITE,IOS"]},
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        files = list(out_dir.iterdir())
        if not files:
            raise HTTPException(404, "No subtitles found for this video.")
            
        # find the subtitle file
        sub_file = None
        for f in files:
            if f.suffix in [".srt", ".vtt"]:
                sub_file = f
                break
                
        if not sub_file:
            raise HTTPException(404, "Subtitle downloaded but format is not srt/vtt.")
            
        content = sub_file.read_bytes()
        safe_name = f"subtitles_{sub_file.stem}.srt"
        
        cleanup(out_dir)
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="text/plain; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}"',
                "X-Filename": safe_name
            }
        )
    except Exception as e:
        cleanup(out_dir)
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
