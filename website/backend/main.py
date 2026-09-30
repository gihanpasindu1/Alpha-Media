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
            }
        else:
            ydl_opts = {
                "format": f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]/best",
                "outtmpl": str(out_dir / "%(title)s.%(ext)s"),
                "noplaylist": True,
                "quiet": True,
                "merge_output_format": "mp4",
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
        ydl_opts = {"quiet": True, "no_warnings": True, "extract_flat": False, "noplaylist": True}
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

        return FileResponse(str(out_path), filename="trimmed.mp4", media_type="video/mp4")
    finally:
        cleanup(in_path)


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
    in_path = temp_path(Path(file.filename).suffix or ".jpg")
    out_path = temp_path(".jpg")
    try:
        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        img = cv2.imread(str(in_path))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = cascade.detectMultiScale(gray, 1.1, 4)

        for (x, y, w, h) in faces:
            roi = img[y:y+h, x:x+w]
            k = max(intensity | 1, 3)
            img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (k*2+1, k*2+1), 0)

        cv2.imwrite(str(out_path), img)
        return FileResponse(str(out_path), filename="face_blurred.jpg", media_type="image/jpeg")
    finally:
        cleanup(in_path)


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
