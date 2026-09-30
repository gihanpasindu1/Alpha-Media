import sys
import yt_dlp

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    quality = sys.argv[2] if len(sys.argv) > 2 else "1080" # Default to 1080p
    print(f"Testing with URL: {url} at {quality}p quality")
    
    ydl_opts = {
        'format': f'bestvideo[height<={quality}]+bestaudio/best[height<={quality}]/best',
        'outtmpl': 'downloads/%(title)s.%(ext)s',
    }
    
    print("Starting download...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    print("Download finished! Check the 'downloads' folder.")
