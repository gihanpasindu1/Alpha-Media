#!/usr/bin/env python3
"""yt-dlp worker subprocess for AlphaMedia API.

Runs yt-dlp in a FRESH Python process (not inside uvicorn) because something
in the uvicorn server process breaks yt-dlp's TikTok/YouTube webpage downloads
("Unexpected response from webpage request"), while identical code works fine
in a plain Python process. Root cause unknown; subprocess sidesteps it.

Usage: yt_dlp_worker.py <opts.json> <url>
  opts.json: {"ydl_opts": {...}, "out_dir": "/tmp/xyz"}
Exit 0 on success, 1 on failure (error JSON on stderr).
"""
import json
import sys

def main():
    opts_path, url = sys.argv[1], sys.argv[2]
    with open(opts_path) as f:
        cfg = json.load(f)
    ydl_opts = cfg["ydl_opts"]
    # compat_opts keys must be a set-like; JSON gives list -> convert
    co = ydl_opts.get("compat_opts")
    if isinstance(co, dict):
        ydl_opts["compat_opts"] = set(co.keys())
    elif isinstance(co, list):
        ydl_opts["compat_opts"] = set(co)

    import yt_dlp
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        sys.stderr.write(json.dumps({"error": str(e)[:500]}))
        sys.exit(1)

if __name__ == "__main__":
    main()
