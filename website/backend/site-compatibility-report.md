# AlphaMedia Video Downloader — Site Compatibility Report
**Date:** 2026-10-08
**Method:** Each site tested with a real public video URL through the site's download API (`/api/download`). WORKS = video downloaded successfully. FAILS = error (reason noted). NO TEST URL = could not find a valid public video URL to test.

## Summary
- **WORKS: 19 / 100**
- **FAILS: 62 / 100**
- **NO TEST URL FOUND: 19 / 100**

## ✅ WORKS (19)

| # | Site | Note |
|---|------|------|
| 1 | YouTube | 20MB MP4 downloaded |
| 2 | TikTok | 3.1MB MP4 via TikTok daemon |
| 4 | Facebook | 13MB MP4 downloaded (verified 2026-10-08) |
| 6 | Reddit | 7.4MB downloaded |
| 7 | Pinterest | 902KB downloaded |
| 26 | Twitch | Extracts fine (clips/VODs) |
| 29 | Odysee | Works |
| 31 | Bilibili | Works |
| 32 | Youku | Works |
| 35 | Niconico | Works |
| 39 | BitChute | Works |
| 43 | Naver TV | Works |
| 45 | Streamable | Works |
| 47 | Imgur | Works (video/GIF) |
| 51 | iFunny | 695KB MP4 downloaded |
| 80 | Mixcloud | Audio extracts (use MP3 mode) |
| 82 | Bandcamp | Audio extracts (use MP3 mode) |
| 83 | Internet Archive | Works |
| 84 | Wikimedia Commons | Works |

## ❌ FAILS (63)

**Login required (5)** — site demands an account, can't fix without user logins:
- Instagram (#3), Vimeo (#24), Weverse (#91), Bigo Live (#94), JioHotstar (#63)

**IP / bot blocked (14)** — site blocks datacenter/proxy IPs:
- X/Twitter (#5), Threads (#11), Dailymotion (#25), Rumble (#28), Coub (#52), TED (#54), NBA.com (#71), NFL.com (#72), YouPorn (#76), XNXX (#77), SpankBang (#78), XVideos (#74), XHamster (#75), PornHub (#73, video deleted but site likely blocks too)

**Geo-blocked (11)** — needs a local IP from that country:
- BBC iPlayer (#55, UK), ITVX (#56, UK), ZDF (#58, Germany), ARD (#59, Germany), France TV (#60, France), CBC (#61, Canada), 9Now (#62, Australia), SonyLIV (#64, India), MX Player (#66, India), Eurosport (#70, Europe), Rutube (#41, Russia), Mango TV (#93, China)

**DRM protected (4)** — yt-dlp refuses, will never work:
- Channel 4 (#57), Zee5 (#65), Viki (#67), Crunchyroll (#68)

**Cloudflare anti-bot (3)** — needs `curl_cffi` impersonation (fixable):
- Pexels (#85), Pixabay (#86), 9GAG (#50)

**No yt-dlp extractor (11)** — unsupported, needs custom development:
- Coverr (#87), Videvo (#88), Kocowa (#92), Tango (#95), Lomotif (#96), Firework (#97), Roposo (#98), ShareChat (#99), Tenor (#48), Snapchat (#8, URL dead), Kwai (#20, URL format unsupported), Likee (#18, URL format unsupported)

**Broken extractor / site changed (7):**
- Audiomack (#81, JSON parse error), Tencent Video (#34, extractor broken), AfreecaTV (#38, rebranded to SOOP), DTube (#40, video gone), Aparat (#42, extractor issue), WorldStarHipHop (#89, site changed), Vevo (#90, site dead — content moved to YouTube)

**Dead test URLs (3)** — site may work with a valid URL:
- ESPN (#69), Flickr (#53, was a photo not video), Dailymotion (#25, also IP-blocked)

## ❓ NO TEST URL FOUND (19)
Could not find a real public video page URL after multiple searches. Many are app-only or login-walled:
LinkedIn (#9), Tumblr (#10), VK (#12), OK.ru (#13), Weibo (#14), Xiaohongshu (#15), Douyin (#16), Kuaishou (#17), Triller (#19), Moj (#21), Josh (#22), Chingari (#23), Kick (#27), iQIYI (#33), Medal.tv (#46), Giphy (#49), Trovo (#36, shut down Jun 2026), DLive (#37, shut down Apr 2026), KakaoTV (#44, shut down Jun 2026), MX TakaTak (#100, app shut down 2023)

## Key takeaways
1. **Only 18 of 100 work.** The biggest killers are IP blocks (Instagram, Facebook, X all block datacenter IPs) and login walls.
2. **The top sites users actually want** — YouTube, TikTok, Reddit, Pinterest, Twitch, Streamable, Imgur — all work.
3. **Quick wins:** installing `curl_cffi` in the venv would fix Pexels, Pixabay, 9GAG (Cloudflare bypass).
4. **Can't fix:** DRM sites (never), geo-blocked (need foreign IPs), login-walled (need user accounts), dead sites (Trovo, DLive, KakaoTV, MX TakaTak, Vevo).
5. **API concurrency warning:** the download endpoint blocks the uvicorn event loop during downloads. Two simultaneous downloads will hang the API. Should be fixed with a background task queue.
