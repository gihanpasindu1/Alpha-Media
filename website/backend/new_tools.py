import os
import uuid
import subprocess
import shutil
import sqlite3
import random
import string
import zipfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, RedirectResponse, Response
from typing import List

router = APIRouter()
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# --- DB FOR URL SHORTENER ---
DB_PATH = DATA_DIR / "urls.db"
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS urls 
                 (short_id TEXT PRIMARY KEY, original_url TEXT, clicks INTEGER DEFAULT 0)''')
    conn.commit()
    conn.close()

init_db()

def cleanup_files(*paths):
    for p in paths:
        try:
            if p and Path(p).exists():
                Path(p).unlink()
        except Exception:
            pass

# ==========================================
# AUDIO TOOLS
# ==========================================

@router.post("/api/audio-trim")
async def audio_trim(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start_time: str = Form(...),
    end_time: str = Form(...)
):
    req_id = str(uuid.uuid4())
    in_ext = Path(file.filename).suffix or '.mp3'
    in_path = DATA_DIR / f"in_{req_id}{in_ext}"
    out_path = DATA_DIR / f"out_{req_id}{in_ext}"

    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    cmd = [
        "ffmpeg", "-y", "-i", str(in_path),
        "-ss", start_time, "-to", end_time,
        "-c", "copy", str(out_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        cleanup_files(in_path, out_path)
        raise HTTPException(500, f"FFmpeg failed: {res.stderr[-500:]}")
    
    background_tasks.add_task(cleanup_files, in_path, out_path)
    return FileResponse(out_path, filename=f"trimmed_{file.filename}")

@router.post("/api/audio-merge")
async def audio_merge(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    if len(files) < 2:
        raise HTTPException(400, "Need at least 2 files")
    
    req_id = str(uuid.uuid4())
    in_paths = []
    list_path = DATA_DIR / f"list_{req_id}.txt"
    out_path = DATA_DIR / f"out_{req_id}.mp3"
    
    try:
        with open(list_path, "w", encoding="utf-8") as f_list:
            for i, file in enumerate(files):
                ext = Path(file.filename).suffix or '.mp3'
                p = DATA_DIR / f"in_{req_id}_{i}{ext}"
                in_paths.append(p)
                with open(p, "wb") as f:
                    shutil.copyfileobj(file.file, f)
                # Escape for ffmpeg concat demuxer
                f_list.write(f"file '{p.name}'\n")
        
        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_path),
            "-c:a", "libmp3lame", "-q:a", "2",
            str(out_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise HTTPException(500, f"FFmpeg merge failed: {res.stderr[-500:]}")
            
    except Exception as e:
        cleanup_files(list_path, out_path, *in_paths)
        raise e
        
    background_tasks.add_task(cleanup_files, list_path, out_path, *in_paths)
    return FileResponse(out_path, filename="merged_audio.mp3")

@router.post("/api/audio-noise-reduce")
async def audio_noise_reduce(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    # This requires converting to wav, processing with noisereduce, and converting back
    import soundfile as sf
    import noisereduce as nr
    import numpy as np

    req_id = str(uuid.uuid4())
    in_ext = Path(file.filename).suffix or '.mp3'
    in_path = DATA_DIR / f"in_{req_id}{in_ext}"
    wav_path = DATA_DIR / f"temp_{req_id}.wav"
    out_wav_path = DATA_DIR / f"out_{req_id}.wav"
    final_path = DATA_DIR / f"clean_{req_id}{in_ext}"

    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        # 1. Convert to wav
        subprocess.run(["ffmpeg", "-y", "-i", str(in_path), str(wav_path)], check=True, capture_output=True)
        
        # 2. Reduce noise
        data, rate = sf.read(str(wav_path))
        reduced_noise = nr.reduce_noise(y=data, sr=rate)
        sf.write(str(out_wav_path), reduced_noise, rate)
        
        # 3. Convert back to original format
        subprocess.run(["ffmpeg", "-y", "-i", str(out_wav_path), str(final_path)], check=True, capture_output=True)
        
    except Exception as e:
        cleanup_files(in_path, wav_path, out_wav_path, final_path)
        raise HTTPException(500, f"Noise reduction failed: {str(e)}")
        
    background_tasks.add_task(cleanup_files, in_path, wav_path, out_wav_path, final_path)
    return FileResponse(final_path, filename=f"clean_{file.filename}")

@router.post("/api/audio-convert")
async def audio_convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    format: str = Form(...) # 'mp3', 'wav', 'ogg', 'm4a'
):
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_{req_id}.tmp"
    out_path = DATA_DIR / f"out_{req_id}.{format}"

    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    cmd = ["ffmpeg", "-y", "-i", str(in_path), str(out_path)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if res.returncode != 0:
        cleanup_files(in_path, out_path)
        raise HTTPException(500, f"Conversion failed: {res.stderr[-500:]}")
        
    background_tasks.add_task(cleanup_files, in_path, out_path)
    orig_name = Path(file.filename).stem
    return FileResponse(out_path, filename=f"{orig_name}.{format}")

from pydantic import BaseModel
class TTSRequest(BaseModel):
    text: str
    lang: str = "en"

@router.post("/api/tts")
async def text_to_speech(
    req: TTSRequest,
    background_tasks: BackgroundTasks
):
    import edge_tts
    req_id = str(uuid.uuid4())
    out_path = DATA_DIR / f"tts_{req_id}.mp3"
    
    try:
        communicate = edge_tts.Communicate(req.text, req.lang)
        await communicate.save(str(out_path))
    except Exception as e:
        raise HTTPException(500, str(e))
        
    background_tasks.add_task(cleanup_files, out_path)
    return FileResponse(out_path, filename="speech.mp3")

# ==========================================
# DOCUMENT TOOLS
# ==========================================

@router.post("/api/word-to-pdf")
async def word_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    req_id = str(uuid.uuid4())
    in_ext = Path(file.filename).suffix
    if in_ext not in ['.doc', '.docx', '.odt', '.rtf']:
        raise HTTPException(400, "Must be a document format (.doc, .docx, .odt)")
        
    in_path = DATA_DIR / f"doc_{req_id}{in_ext}"
    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    out_dir = DATA_DIR / f"outdir_{req_id}"
    out_dir.mkdir(exist_ok=True)
    
    cmd = ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir", str(out_dir), str(in_path)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if res.returncode != 0:
        cleanup_files(in_path)
        shutil.rmtree(out_dir, ignore_errors=True)
        raise HTTPException(500, f"Conversion failed. Make sure LibreOffice is installed. {res.stderr[-500:]}")
        
    out_file = list(out_dir.glob("*.pdf"))[0]
    final_path = DATA_DIR / f"final_{req_id}.pdf"
    shutil.move(str(out_file), str(final_path))
    
    def cleanup():
        cleanup_files(in_path, final_path)
        shutil.rmtree(out_dir, ignore_errors=True)
        
    background_tasks.add_task(cleanup)
    orig_name = Path(file.filename).stem
    return FileResponse(final_path, filename=f"{orig_name}.pdf")

@router.post("/api/image-to-pdf")
async def image_to_pdf(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    from PIL import Image
    req_id = str(uuid.uuid4())
    out_path = DATA_DIR / f"out_{req_id}.pdf"
    temp_paths = []
    
    try:
        images = []
        for i, file in enumerate(files):
            p = DATA_DIR / f"img_{req_id}_{i}{Path(file.filename).suffix}"
            temp_paths.append(p)
            with open(p, "wb") as f:
                shutil.copyfileobj(file.file, f)
            
            img = Image.open(p)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            images.append(img)
            
        if not images:
            raise HTTPException(400, "No valid images")
            
        images[0].save(
            out_path, "PDF", resolution=100.0, save_all=True, append_images=images[1:]
        )
    except Exception as e:
        cleanup_files(out_path, *temp_paths)
        raise HTTPException(500, str(e))
        
    background_tasks.add_task(cleanup_files, out_path, *temp_paths)
    return FileResponse(out_path, filename="images.pdf")

@router.post("/api/pdf-compress")
async def pdf_compress(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_{req_id}.pdf"
    out_path = DATA_DIR / f"out_{req_id}.pdf"
    
    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    cmd = [
        "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/screen", "-dNOPAUSE", "-dQUIET", "-dBATCH",
        f"-sOutputFile={out_path}", str(in_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        cleanup_files(in_path, out_path)
        raise HTTPException(500, f"Compression failed: {res.stderr[-500:]}")
        
    background_tasks.add_task(cleanup_files, in_path, out_path)
    return FileResponse(out_path, filename=f"compressed_{file.filename}")

@router.post("/api/pdf-to-images")
async def pdf_to_images(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    from pdf2image import convert_from_path
    req_id = str(uuid.uuid4())
    in_path = DATA_DIR / f"in_{req_id}.pdf"
    zip_path = DATA_DIR / f"out_{req_id}.zip"
    img_dir = DATA_DIR / f"imgs_{req_id}"
    
    with open(in_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    try:
        img_dir.mkdir(exist_ok=True)
        images = convert_from_path(str(in_path), dpi=200)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for i, img in enumerate(images):
                img_path = img_dir / f"page_{i+1}.jpg"
                img.save(img_path, 'JPEG')
                zipf.write(img_path, f"page_{i+1}.jpg")
                
    except Exception as e:
        cleanup_files(in_path, zip_path)
        shutil.rmtree(img_dir, ignore_errors=True)
        raise HTTPException(500, f"Conversion failed: {str(e)}")
        
    def cleanup():
        cleanup_files(in_path, zip_path)
        shutil.rmtree(img_dir, ignore_errors=True)
        
    background_tasks.add_task(cleanup)
    orig_name = Path(file.filename).stem
    return FileResponse(zip_path, filename=f"{orig_name}_images.zip")

# ==========================================
# UTILITY TOOLS (URL Shortener)
# ==========================================

class URLReq(BaseModel):
    url: str

@router.post("/api/url/shorten")
async def shorten_url(req: URLReq):
    if not req.url.startswith("http"):
        req.url = "http://" + req.url
        
    short_id = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO urls (short_id, original_url) VALUES (?, ?)", (short_id, req.url))
    conn.commit()
    conn.close()
    
    return {"short_id": short_id, "original_url": req.url}

@router.get("/s/{short_id}")
async def redirect_url(short_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT original_url FROM urls WHERE short_id = ?", (short_id,))
    row = c.fetchone()
    if row:
        c.execute("UPDATE urls SET clicks = clicks + 1 WHERE short_id = ?", (short_id,))
        conn.commit()
        conn.close()
        return RedirectResponse(url=row[0])
    
    conn.close()
    raise HTTPException(404, "URL not found")
