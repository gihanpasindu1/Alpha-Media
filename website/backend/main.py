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

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
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

import urllib.request
import urllib.parse
import json
import time as _time
import socket as _socket

def _pot_server_up(host="127.0.0.1", port=4416, timeout=1.0) -> bool:
    """Check whether the bgutil PO-token server is running. If not, we skip
    its extractor args so yt-dlp falls back to its other PO providers."""
    try:
        s = _socket.create_connection((host, port), timeout=timeout)
        s.close()
        return True
    except OSError:
        return False

def _yt_extractor_args() -> dict:
    args = {"youtube": ["player_client=web"]}
    if _pot_server_up():
        # bgutil-ytdlp-pot-provider auto-fetches PO tokens from the server on port 4416
        args["youtubepot-bgutil-httpserver"] = ["base_url=http://localhost:4416"]
    return args

def _yt_cookiefile():
    """Fresh cookies (from the Google sign-in) win; repo cookies.txt is fallback."""
    candidates = [
        os.environ.get("YTDLP_COOKIES"),
        Path(__file__).resolve().parent.parent.parent / "cookies.txt",
    ]
    for p in candidates:
        if p and Path(p).exists():
            return str(p)
    return None

def _yt_dlp_opts(**extra) -> dict:
    """Base yt-dlp options that work behind this machine's egress proxy:
    - no-certifi: use the system CA bundle (it trusts the egress proxy's CA)
    - socket_timeout: fail fast instead of hanging on tarpitted requests
    - cookiefile: attach YouTube login cookies when available
    """
    opts = {
        "compat_opts": {"no-certifi"},
        "socket_timeout": 30,
        "extractor_args": _yt_extractor_args(),
    }
    cf = _yt_cookiefile()
    if cf:
        opts["cookiefile"] = cf
    opts.update(extra)
    return opts

@app.get("/api/download")
async def download_video(
    url: str,
    quality: str = "720",
    format: str = "video",  # "video" | "mp3"
):
    from fastapi.responses import StreamingResponse
    import tempfile, pathlib

    out_dir = pathlib.Path(tempfile.mkdtemp())
    try:
        if format == "mp3":
            fmt = "bestaudio/best"
            pp = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
            merge = {}
        else:
            fmt = f"bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={quality}]+bestaudio/best[height<={quality}]"
            pp = []
            merge = {"merge_output_format": "mp4"}

        ydl_opts = _yt_dlp_opts(
            format=fmt,
            outtmpl=str(out_dir / "%(title)s.%(ext)s"),
            noplaylist=True,
            quiet=True,
            no_warnings=True,
            **merge,
        )
        if pp:
            ydl_opts["postprocessors"] = pp

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        files = list(out_dir.iterdir())
        if not files:
            raise HTTPException(500, "yt-dlp produced no output file.")

        out_file = files[0]
        ext = "mp3" if format == "mp3" else "mp4"
        safe_filename = urllib.parse.quote(out_file.name)
        media_type = "audio/mpeg" if format == "mp3" else "video/mp4"

        def stream_file():
            with open(out_file, "rb") as f:
                while True:
                    chunk = f.read(65536)
                    if not chunk:
                        break
                    yield chunk
            # cleanup after streaming
            try:
                import shutil
                shutil.rmtree(out_dir, ignore_errors=True)
            except Exception:
                pass

        return StreamingResponse(
            stream_file(),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename*=utf-8''{safe_filename}",
                "X-Filename": safe_filename,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        try:
            import shutil
            shutil.rmtree(out_dir, ignore_errors=True)
        except Exception:
            pass
        msg = str(e)
        # YouTube throttles datacenter IPs; surface a clear, actionable error.
        if "timed out" in msg.lower() or "sign in to confirm" in msg.lower() or "bot" in msg.lower():
            raise HTTPException(
                502,
                "YouTube refused the download from this server's network. "
                "This is fixed by signing a Google account in on the server (planned next step).",
            )
        raise HTTPException(500, msg)


# ─────────────────────────────── VIDEO INFO ─────────────────────────────────

@app.post("/api/video-info")
async def video_info(url: str = Form(...)):
    try:
        import urllib.request
        import json
        
        # Fast extraction using official YouTube OEmbed API
        oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
        req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        
        return {
            "title": data.get("title", "YouTube Video"),
            "thumbnail": data.get("thumbnail_url"),
            "uploader": data.get("author_name"),
            "duration": None
        }
    except Exception as e:
        raise HTTPException(500, f"Could not fetch video info. URL might be invalid. ({str(e)})")


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

        ydl_opts = _yt_dlp_opts(
            format=f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]/best",
            outtmpl=str(out_dir / "clip.%(ext)s"),
            noplaylist=True,
            quiet=True,
            merge_output_format="mp4",
            download_ranges=yt_dlp.utils.download_range_func(None, [(start_sec, end_sec)]),
            force_keyframes_at_cuts=True,
        )

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
    background_tasks: BackgroundTasks,
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

        background_tasks.add_task(cleanup, out_path)
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

        import urllib.request
        model_dir = Path("models")
        model_dir.mkdir(exist_ok=True)
        yunet_path = model_dir / "face_detection_yunet_2023mar.onnx"
        
        if not yunet_path.exists():
            urllib.request.urlretrieve("https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx", str(yunet_path))

        k = max(intensity | 1, 3)

        def blur_faces(img, detector, cached_faces=None):
            # cached_faces: reuse previously detected boxes to skip NN inference
            faces = cached_faces if cached_faces is not None else detector.detect(img)
            if faces[1] is not None:
                h, w = img.shape[:2]
                for face in faces[1]:
                    x, y, fw, fh = face[0:4].astype(int)
                    
                    # Add a slightly larger margin for the ellipse to cover the whole face
                    startX = max(0, x - int(fw * 0.15))
                    startY = max(0, y - int(fh * 0.15))
                    endX = min(w, x + fw + int(fw * 0.15))
                    endY = min(h, y + fh + int(fh * 0.15))
                    
                    if endX > startX and endY > startY:
                        roi = img[startY:endY, startX:endX]
                        roi_h, roi_w = roi.shape[:2]
                        
                        # Create an elliptical mask
                        mask = np.zeros((roi_h, roi_w), dtype=np.uint8)
                        center = (roi_w // 2, roi_h // 2)
                        axes = (roi_w // 2, roi_h // 2)
                        cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
                        
                        # Blur the ROI
                        blurred_roi = cv2.GaussianBlur(roi, (k*2+1, k*2+1), 0)
                        
                        # Blend using the mask (soft edge can be added by blurring the mask)
                        mask = cv2.GaussianBlur(mask, (15, 15), 0)
                        mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR) / 255.0
                        
                        roi_blended = roi * (1 - mask_3ch) + blurred_roi * mask_3ch
                        img[startY:endY, startX:endX] = roi_blended.astype(np.uint8)
            return img

        if not is_video:
            # Handle Image
            img = cv2.imread(str(in_path))
            if img is None: raise HTTPException(400, "Invalid image")
            
            h, w = img.shape[:2]
            detector = cv2.FaceDetectorYN.create(str(yunet_path), "", (w, h), score_threshold=0.5, nms_threshold=0.3)
            img = blur_faces(img, detector)
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
            detector = cv2.FaceDetectorYN.create(str(yunet_path), "", (width, height), score_threshold=0.5, nms_threshold=0.3)
            
            # Detect faces every 3rd frame, reuse boxes in between (~3x faster,
            # visually identical for normal head movement).
            DETECT_EVERY = 3
            cached = None
            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret: break
                if frame_idx % DETECT_EVERY == 0:
                    cached = detector.detect(frame)
                frame = blur_faces(frame, detector, cached_faces=cached)
                out.write(frame)
                frame_idx += 1
                
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
async def pdf_merge(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)):
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

        background_tasks.add_task(cleanup, out_path)
        return FileResponse(str(out_path), filename="merged.pdf", media_type="application/pdf")
    finally:
        cleanup(*paths)


@app.post("/api/pdf/split")
async def pdf_split(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
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
        background_tasks.add_task(cleanup, zip_path)
        return FileResponse(str(zip_path), filename="split_pages.zip", media_type="application/zip")
    finally:
        cleanup(in_path, out_dir)


@app.post("/api/pdf/compress")
async def pdf_compress(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
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

        background_tasks.add_task(cleanup, out_path)
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
        ydl_opts = _yt_dlp_opts(
            skip_download=True,
            writeautomaticsub=True,
            writesubtitles=True,
            subtitlesformat="srt",
            outtmpl=str(out_dir / "%(title)s.%(ext)s"),
            quiet=True,
        )
        
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

# ─────────────────────────────── BACKGROUND REMOVER (REMBG) ─────────────────────────

from rembg import remove, new_session
# u2net (~170MB) instead of the 1GB default model: runs safely on small CPUs
# without risking an out-of-memory kill of the whole service.
_BG_SESSION = None

def _bg_session():
    global _BG_SESSION
    if _BG_SESSION is None:
        _BG_SESSION = new_session("u2net")
    return _BG_SESSION

@app.post("/api/bg-remove")
async def bg_remove(file: UploadFile = File(...)):
    in_path = temp_path(Path(file.filename).suffix or ".jpg")
    out_path = temp_path(".png")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        with open(in_path, 'rb') as i:
            with open(out_path, 'wb') as o:
                input_data = i.read()
                output_data = remove(input_data, session=_bg_session())
                o.write(output_data)
                
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="image/png",
            headers={
                "Content-Disposition": 'attachment; filename="bg_removed.png"',
                "X-Filename": "bg_removed.png"
            }
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── VIDEO TO MP3 ───────────────────────────────

@app.post("/api/video-to-mp3")
async def video_to_mp3(file: UploadFile = File(...)):
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    out_path = temp_path(".mp3")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        cmd = ["ffmpeg", "-y", "-i", str(in_path), "-q:a", "0", "-map", "a", str(out_path)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(500, f"Conversion failed: {result.stderr[-500:]}")
            
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content, media_type="audio/mpeg",
            headers={"Content-Disposition": 'attachment; filename="audio.mp3"', "X-Filename": "audio.mp3"}
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── VIDEO SPEED CHANGER ────────────────────────

@app.post("/api/video-speed")
async def video_speed(
    file: UploadFile = File(...),
    speed: float = Form(...)
):
    if speed <= 0 or speed > 4.0:
        raise HTTPException(400, "Speed must be between 0.1 and 4.0")
        
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    out_path = temp_path(".mp4")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        # Audio tempo filter (atempo) only supports 0.5 to 100.0, video (setpts) is inverse
        v_pts = 1.0 / speed
        a_tempo = speed
        
        # If speed < 0.5, we must chain atempo filters (e.g. 0.25 -> atempo=0.5,atempo=0.5)
        # For simplicity in this implementation, we will clamp audio tempo between 0.5 and 2.0 
        # or use multiple filters if outside the bounds.
        a_filter = f"atempo={a_tempo}"
        if a_tempo < 0.5:
            a_filter = f"atempo=0.5,atempo={a_tempo/0.5}"
        elif a_tempo > 2.0:
            a_filter = f"atempo=2.0,atempo={a_tempo/2.0}"
            
        cmd = [
            "ffmpeg", "-y", "-i", str(in_path),
            "-filter_complex", f"[0:v]setpts={v_pts}*PTS[v];[0:a]{a_filter}[a]",
            "-map", "[v]", "-map", "[a]",
            str(out_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # If audio fails (e.g. video has no audio), try just video
        if result.returncode != 0:
            cmd = ["ffmpeg", "-y", "-i", str(in_path), "-filter:v", f"setpts={v_pts}*PTS", str(out_path)]
            result2 = subprocess.run(cmd, capture_output=True, text=True)
            if result2.returncode != 0:
                raise HTTPException(500, f"Speed change failed: {result.stderr[-500:]}")

        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content, media_type="video/mp4",
            headers={"Content-Disposition": 'attachment; filename="speed_changed.mp4"', "X-Filename": "speed_changed.mp4"}
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── REMOVE WATERMARK ───────────────────────────

@app.post("/api/remove-watermark")
async def remove_watermark(
    file: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    w: int = Form(...),
    h: int = Form(...)
):
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    out_path = temp_path(".mp4")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
            
        cmd = [
            "ffmpeg", "-y", "-i", str(in_path),
            "-vf", f"delogo=x={x}:y={y}:w={w}:h={h}",
            "-c:a", "copy",
            str(out_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(500, f"Watermark removal failed: {result.stderr[-500:]}")
            
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content, media_type="video/mp4",
            headers={"Content-Disposition": 'attachment; filename="no_watermark.mp4"', "X-Filename": "no_watermark.mp4"}
        )
    finally:
        cleanup(in_path, out_path)

# ─────────────────────────────── ADD SUBTITLES ──────────────────────────────

@app.post("/api/add-subtitles")
async def add_subtitles(
    file: UploadFile = File(...),
    srt: UploadFile = File(...)
):
    in_path = temp_path(Path(file.filename).suffix or ".mp4")
    srt_path = temp_path(".srt")
    out_path = temp_path(".mp4")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())
        async with aiofiles.open(srt_path, "wb") as f:
            await f.write(await srt.read())
            
        # Fix paths for FFmpeg subtitles filter on Windows (needs escaped backslashes and colons)
        safe_srt = str(srt_path).replace('\\', '/').replace(':', '\\:')
            
        cmd = [
            "ffmpeg", "-y", "-i", str(in_path),
            "-vf", f"subtitles='{safe_srt}'",
            "-c:a", "copy",
            str(out_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(500, f"Subtitle burn-in failed: {result.stderr[-500:]}")
            
        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content, media_type="video/mp4",
            headers={"Content-Disposition": 'attachment; filename="subtitled.mp4"', "X-Filename": "subtitled.mp4"}
        )
    finally:
        cleanup(in_path, srt_path, out_path)

# ─────────────────────────────── MERGE TWO VIDEOS ───────────────────────────

@app.post("/api/merge-videos")
async def merge_videos(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    path1 = temp_path(Path(file1.filename).suffix or ".mp4")
    path2 = temp_path(Path(file2.filename).suffix or ".mp4")
    out_path = temp_path(".mp4")
    try:
        async with aiofiles.open(path1, "wb") as f:
            await f.write(await file1.read())
        async with aiofiles.open(path2, "wb") as f:
            await f.write(await file2.read())
            
        # Re-encode to ensure different codecs/resolutions merge perfectly
        cmd = [
            "ffmpeg", "-y",
            "-i", str(path1), "-i", str(path2),
            "-filter_complex", "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]",
            "-map", "[outv]", "-map", "[outa]",
            str(out_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Fallback if audio fails (e.g. one video has no audio)
        if result.returncode != 0:
            cmd_no_audio = [
                "ffmpeg", "-y",
                "-i", str(path1), "-i", str(path2),
                "-filter_complex", "[0:v][1:v]concat=n=2:v=1[outv]",
                "-map", "[outv]",
                str(out_path)
            ]
            result2 = subprocess.run(cmd_no_audio, capture_output=True, text=True)
            if result2.returncode != 0:
                raise HTTPException(500, f"Merge failed: {result.stderr[-500:]}")

        content = out_path.read_bytes()
        from fastapi.responses import Response
        return Response(
            content=content, media_type="video/mp4",
            headers={"Content-Disposition": 'attachment; filename="merged.mp4"', "X-Filename": "merged.mp4"}
        )
    finally:
        cleanup(path1, path2, out_path)

import new_tools
app.include_router(new_tools.router)

import monitor as monitor_mod
app.include_router(monitor_mod.router)

# ─────────────────────────────── SERVE BUILT FRONTEND ───────────────────────
# The Vite build (website/dist) is served from the same origin as the API, so
# the site works on any public URL with zero baked-in API host configuration.
from fastapi.staticfiles import StaticFiles
DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
if DIST_DIR.is_dir():
    _assets = DIST_DIR / "assets"
    if _assets.is_dir():
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        candidate = DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

