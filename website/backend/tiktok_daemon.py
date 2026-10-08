#!/usr/bin/env python3
"""Standalone TikTok download daemon for AlphaMedia.
Runs as a simple HTTP server (not uvicorn) on 127.0.0.1:8004.
The main API proxies TikTok downloads here because yt-dlp fails
inside the uvicorn process for unknown reasons.
"""
import json
import subprocess
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

BACKEND = Path(__file__).resolve().parent
WORKER = str(BACKEND / "yt_dlp_worker.py")
PY = str(BACKEND / "venv" / "bin" / "python3")

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        url = q.get("url", [""])[0]
        if not url:
            self.send_response(400); self.end_headers(); return
        import tempfile
        out_dir = Path(tempfile.mkdtemp())
        opts = {
            "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best",
            "outtmpl": str(out_dir / "%(title)s.%(ext)s"),
            "quiet": True, "no_warnings": True,
            "compat_opts": ["no-certifi"], "socket_timeout": 30,
            "merge_output_format": "mp4",
            "extractor_args": {"youtube": ["player_client=web"]},
        }
        cf = BACKEND.parent.parent / "cookies.txt"
        if cf.exists():
            opts["cookiefile"] = str(cf)
        opts_path = out_dir / "opts.json"
        opts_path.write_text(json.dumps({"ydl_opts": opts}))
        try:
            r = subprocess.run([PY, WORKER, str(opts_path), url],
                               capture_output=True, text=True, timeout=300)
            files = [f for f in out_dir.iterdir() if f.is_file() and f.name != "opts.json"]
            if r.returncode == 0 and files:
                data = files[0].read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "video/mp4")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_response(500)
                self.end_headers()
                self.wfile.write((r.stderr[:300] or "download failed").encode())
        except Exception as e:
            self.send_response(500); self.end_headers()
            self.wfile.write(str(e)[:200].encode())
        finally:
            import shutil
            shutil.rmtree(out_dir, ignore_errors=True)

    def log_message(self, *a):
        pass

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8004), Handler).serve_forever()
