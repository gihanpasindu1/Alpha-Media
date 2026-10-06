"""Lightweight server monitor dashboard for the user's projects.

Exposes system stats (CPU/RAM/disk), service health for both AlphaMedia
and the AlphaRDP bridge, and recent error logs. Very low overhead —
just reads /proc and runs `systemctl is-active`.
"""
import os
import time
import subprocess
from pathlib import Path

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse

router = APIRouter()

# Simple shared-secret gate. Set MONITOR_TOKEN env var to change it.
MONITOR_TOKEN = os.environ.get("MONITOR_TOKEN", "alphamedia-monitor-2026")

# Services to watch: (label, unit name, project)
WATCHED = [
    ("AlphaMedia API", "alphamedia-api.service", "alphamedia"),
    ("AlphaMedia Tunnel (api.alphamedia.bond)", "alphamedia-tunnel.service", "alphamedia"),
    ("AlphaMedia Watchdog", "alphamedia-watchdog.timer", "alphamedia"),
    ("AlphaRDP Bridge", "vps-bridge.service", "alphardp"),
    ("AlphaRDP Tunnel (bridge.alphamedia.bond)", "cloudflared-bridge.service", "alphardp"),
    ("AlphaRDP Edge Forwarder", "cloudflared-edge-fwd.service", "alphardp"),
]

_boot_time = time.time()


def _read(path):
    try:
        return Path(path).read_text().strip()
    except Exception:
        return ""


def _cpu_percent():
    """CPU usage over a short 0.3s sample."""
    def snap():
        parts = _read("/proc/stat").split("\n")[0].split()[1:]
        nums = [int(x) for x in parts]
        return sum(nums), nums[3] + (nums[4] if len(nums) > 4 else 0)
    t1, i1 = snap()
    time.sleep(0.3)
    t2, i2 = snap()
    if t2 == t1:
        return 0.0
    return round(100.0 * (1 - (i2 - i1) / (t2 - t1)), 1)


def _mem():
    info = {}
    for line in _read("/proc/meminfo").split("\n"):
        p = line.split()
        if len(p) >= 2 and p[0].rstrip(":") in ("MemTotal", "MemAvailable"):
            info[p[0].rstrip(":")] = int(p[1])
    total = info.get("MemTotal", 1)
    avail = info.get("MemAvailable", 0)
    used = total - avail
    return {
        "total_mb": round(total / 1024),
        "used_mb": round(used / 1024),
        "pct": round(100.0 * used / total, 1),
    }


def _disk():
    st = os.statvfs("/home/hatch")
    total = st.f_blocks * st.f_frsize
    free = st.f_bavail * st.f_frsize
    used = total - free
    return {
        "total_gb": round(total / 1e9, 1),
        "used_gb": round(used / 1e9, 1),
        "pct": round(100.0 * used / total, 1),
    }


def _load():
    try:
        a, b, c = os.getloadavg()
        return [round(a, 2), round(b, 2), round(c, 2)]
    except Exception:
        return [0, 0, 0]


def _svc_state(unit):
    try:
        r = subprocess.run(
            ["systemctl", "is-active", unit],
            capture_output=True, text=True, timeout=5,
        )
        return r.stdout.strip() or "unknown"
    except Exception:
        return "unknown"


def _svc_since(unit):
    """When the service last started (best effort)."""
    try:
        r = subprocess.run(
            ["systemctl", "show", unit, "-p", "ActiveEnterTimestamp"],
            capture_output=True, text=True, timeout=5,
        )
        return r.stdout.strip().split("=", 1)[-1] or "—"
    except Exception:
        return "—"


_last_net = None  # (timestamp, rx_bytes, tx_bytes) for rate calculation


def _net_io():
    """Total bytes recv/sent across non-loopback interfaces, from /proc/net/dev."""
    rx = tx = 0
    ifaces = {}
    for line in _read("/proc/net/dev").split("\n"):
        if ":" not in line:
            continue
        name, rest = line.split(":", 1)
        name = name.strip()
        if name == "lo":
            continue
        parts = rest.split()
        if len(parts) < 10:
            continue
        r, s = int(parts[0]), int(parts[8])
        ifaces[name] = {"rx_bytes": r, "tx_bytes": s}
        rx += r
        tx += s
    return {"rx_bytes": rx, "tx_bytes": tx, "ifaces": ifaces}


def _net_conns():
    """Count of TCP connections (v4+v6) from /proc."""
    n = 0
    for path in ("/proc/net/tcp", "/proc/net/tcp6"):
        lines = [l for l in _read(path).split("\n") if l.strip()]
        n += max(0, len(lines) - 1)  # minus header
    return n


def _net():
    """Network totals + per-second rates (between stats calls) + connection count."""
    global _last_net
    io = _net_io()
    now = time.time()
    rx_rate = tx_rate = 0.0
    if _last_net:
        t0, r0, s0 = _last_net
        dt = max(now - t0, 0.001)
        rx_rate = max(0.0, (io["rx_bytes"] - r0) / dt)
        tx_rate = max(0.0, (io["tx_bytes"] - s0) / dt)
    _last_net = (now, io["rx_bytes"], io["tx_bytes"])
    return {
        "rx_bytes": io["rx_bytes"],
        "tx_bytes": io["tx_bytes"],
        "rx_rate": round(rx_rate, 1),
        "tx_rate": round(tx_rate, 1),
        "conns": _net_conns(),
        "ifaces": io["ifaces"],
    }


def _recent_errors(unit, n=8):
    """Last few error-ish journal lines for a unit."""
    try:
        r = subprocess.run(
            ["journalctl", "-u", unit, "-n", "60", "--no-pager", "-p", "err",
             "-o", "cat"],
            capture_output=True, text=True, timeout=8,
        )
        lines = [l for l in r.stdout.strip().split("\n") if l.strip()]
        return lines[-n:]
    except Exception:
        return []


def _check(token: str):
    if token != MONITOR_TOKEN:
        raise HTTPException(status_code=403, detail="bad token")


@router.get("/api/monitor/stats")
def stats(token: str = Query("")):
    _check(token)
    services = []
    for label, unit, project in WATCHED:
        state = _svc_state(unit)
        services.append({
            "label": label,
            "unit": unit,
            "project": project,
            "state": state,
            "ok": state == "active",
            "since": _svc_since(unit) if state == "active" else "—",
        })
    return JSONResponse({
        "cpu_pct": _cpu_percent(),
        "mem": _mem(),
        "disk": _disk(),
        "load": _load(),
        "cpu_count": os.cpu_count() or 1,
        "net": _net(),
        "uptime_s": int(time.time() - _boot_time),
        "services": services,
    })


@router.get("/api/monitor/errors")
def errors(token: str = Query(""), unit: str = Query("")):
    _check(token)
    allowed = {u for _, u, _ in WATCHED}
    if unit not in allowed:
        raise HTTPException(status_code=400, detail="unknown unit")
    return JSONResponse({"unit": unit, "errors": _recent_errors(unit)})


@router.get("/monitor", response_class=HTMLResponse)
def dashboard(token: str = Query("")):
    _check(token)
    return HTMLResponse(_PAGE, headers={"Cache-Control": "no-store, no-cache, must-revalidate"})


_PAGE = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Server Monitor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0e14;--border:rgba(255,255,255,.08);--txt:#e9eff6;--mut:#8b949e;--grn:#34d399;--amb:#fbbf24;--red:#f87171;--blu:#60a5fa}
*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,sans-serif;margin:0;padding:28px 22px;min-height:100vh;color:var(--txt);
background:radial-gradient(1100px 550px at 15% -10%,rgba(52,211,153,.06),transparent),radial-gradient(900px 480px at 90% -5%,rgba(96,165,250,.08),transparent),var(--bg)}
.wrap{max-width:1180px;margin:0 auto}
header{display:flex;align-items:center;gap:12px}
.live{width:10px;height:10px;border-radius:50%;background:var(--grn);box-shadow:0 0 14px var(--grn);animation:pulse 2s infinite;flex:none}
@keyframes pulse{50%{opacity:.45}}
h1{font-size:22px;margin:0;font-weight:800;letter-spacing:-.4px}
.badge{font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--grn);border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.1);padding:3px 10px;border-radius:99px}
.sub{color:var(--mut);font-size:13px;margin:6px 0 24px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-bottom:16px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:14px;margin-bottom:16px}
.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:0 10px 28px rgba(0,0,0,.28)}
.card h3{margin:0 0 12px;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1.4px;font-weight:600}
.gauge{display:flex;flex-direction:column;align-items:center}
.gauge svg circle.val{transition:stroke-dashoffset .8s ease,stroke .4s}
.glabel{margin-top:10px;font-size:13px;font-weight:700;letter-spacing:.4px}
.gsub{color:var(--mut);font-size:12px;margin-top:4px;font-variant-numeric:tabular-nums}
.big{font-size:30px;font-weight:800;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
canvas.chart{width:100%;height:130px;display:block;margin-top:4px}
.legend{display:flex;gap:16px;align-items:center;margin-top:10px;font-size:12px;color:var(--mut);flex-wrap:wrap}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}
.legend .nums{margin-left:auto;font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:var(--mut);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.8px;padding:10px;border-bottom:1px solid var(--border)}
td{padding:11px 10px;border-bottom:1px solid rgba(255,255,255,.05)}
tr:last-child td{border-bottom:0}
.pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 12px;border-radius:99px;letter-spacing:.3px}
.pill.ok{background:rgba(52,211,153,.13);color:var(--grn);border:1px solid rgba(52,211,153,.32)}
.pill.bad{background:rgba(248,113,113,.12);color:var(--red);border:1px solid rgba(248,113,113,.32)}
.tag{font-size:11px;padding:2px 10px;border-radius:20px;background:rgba(255,255,255,.07);color:#aeb9c7;margin-left:10px;font-weight:500}
pre{background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:12px;padding:14px;font-size:12px;max-height:230px;overflow:auto;white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace}
button{background:rgba(255,255,255,.08);color:var(--txt);border:1px solid var(--border);border-radius:8px;padding:7px 14px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;transition:background .2s}
button:hover{background:rgba(255,255,255,.14)}
.row{display:flex;gap:10px;align-items:center;margin-bottom:14px}
select{background:#141a25;color:var(--txt);border:1px solid var(--border);border-radius:8px;padding:7px 10px;font-family:inherit;font-size:12px}
.updated{color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums}
.section{margin-bottom:16px}
.dim{color:var(--mut);font-size:12px}
.sub2{color:var(--mut);font-size:12px;margin-top:8px;font-variant-numeric:tabular-nums}
.loadrow{display:flex;gap:22px;margin-top:24px}
.loadv{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.loadl{color:var(--mut);font-size:10px;margin-top:3px;text-transform:uppercase;letter-spacing:1px}
</style></head><body><div class="wrap">
<header><span class="live"></span><h1>Server Monitor</h1><span class="badge">LIVE</span></header>
<div class="sub">AlphaMedia + AlphaRDP bridge · auto-refreshes every 10s · <span class="updated" id="upd"></span></div>
<div class="grid">
<div class="card"><h3>CPU</h3><div class="gauge">
<svg viewBox="0 0 120 120" width="124" height="124"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/><circle id="cpuarc" class="val" cx="60" cy="60" r="52" fill="none" stroke="#34d399" stroke-width="12" stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="326.73" transform="rotate(-90 60 60)"/><text id="cpupct" x="60" y="68" text-anchor="middle" fill="#e9eff6" font-size="23" font-weight="800">–</text></svg>
<div class="gsub" id="cpusub">usage</div></div></div>
<div class="card"><h3>Memory</h3><div class="gauge">
<svg viewBox="0 0 120 120" width="124" height="124"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/><circle id="memarc" class="val" cx="60" cy="60" r="52" fill="none" stroke="#34d399" stroke-width="12" stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="326.73" transform="rotate(-90 60 60)"/><text id="mempct" x="60" y="68" text-anchor="middle" fill="#e9eff6" font-size="23" font-weight="800">–</text></svg>
<div class="gsub" id="memsub">–</div></div></div>
<div class="card"><h3>Disk</h3><div class="gauge">
<svg viewBox="0 0 120 120" width="124" height="124"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/><circle id="diskarc" class="val" cx="60" cy="60" r="52" fill="none" stroke="#34d399" stroke-width="12" stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="326.73" transform="rotate(-90 60 60)"/><text id="diskpct" x="60" y="68" text-anchor="middle" fill="#e9eff6" font-size="23" font-weight="800">–</text></svg>
<div class="gsub" id="disksub">–</div></div></div>
<div class="card"><h3>CPU load average</h3>
<div class="loadrow"><div><div class="loadv" id="load1">–</div><div class="loadl">last 1 min</div></div><div><div class="loadv" id="load2">–</div><div class="loadl">last 5 min</div></div><div><div class="loadv" id="load3">–</div><div class="loadl">last 15 min</div></div></div>
<div class="sub2" id="loadmsg" style="margin-top:12px"></div>
<div class="sub2" id="uptime"></div><div class="sub2" id="netconns" style="margin-top:10px"></div></div>
</div>
<div class="grid2">
<div class="card"><h3>CPU history · last 10 min</h3><canvas class="chart" id="cpuchart" width="900" height="260"></canvas></div>
<div class="card"><h3>Network throughput</h3><canvas class="chart" id="netchart" width="900" height="260"></canvas>
<div class="legend"><span><i style="background:#60a5fa"></i>download</span><span><i style="background:#34d399"></i>upload</span><span class="nums" id="nettotal"></span></div></div>
</div>
<div class="card section"><h3>Services</h3><table><thead><tr><th>Service</th><th>Project</th><th>Status</th><th>Since</th></tr></thead><tbody id="svcs"></tbody></table></div>
<div class="card"><h3>Recent errors</h3>
<div class="row"><select id="unit"></select><button onclick="loadErr()">Refresh</button></div>
<pre id="errs">pick a service…</pre></div>
</div><script>
const T=new URLSearchParams(location.search).get('token')||'';
const q='?token='+encodeURIComponent(T);
const hist={cpu:[],rx:[],tx:[]};
function push(a,v){a.push(v);if(a.length>60)a.shift();}
function chart(id,series){const c=document.getElementById(id);if(!c)return;const x=c.getContext('2d');const w=c.width,h=c.height,pad=10;
x.clearRect(0,0,w,h);x.strokeStyle='rgba(255,255,255,.07)';x.lineWidth=1;
for(let i=1;i<4;i++){const y=pad+i*(h-2*pad)/4;x.beginPath();x.moveTo(pad,y);x.lineTo(w-pad,y);x.stroke();}
let mx=1;series.forEach(s=>{s.data.forEach(v=>{if(v>mx)mx=v;});});
series.forEach(s=>{const d=s.data;if(d.length<2)return;x.beginPath();
d.forEach((v,i)=>{const px=pad+i/59*(w-2*pad);const py=h-pad-(v/mx)*(h-2*pad);if(i)x.lineTo(px,py);else x.moveTo(px,py);});
x.strokeStyle=s.color;x.lineWidth=2.5;x.lineJoin='round';x.stroke();
x.lineTo(w-pad,h-pad);x.lineTo(pad,h-pad);x.closePath();
const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,s.color+'3d');g.addColorStop(1,s.color+'00');x.fillStyle=g;x.fill();});}
function setGauge(arc,txt,p){const C=326.73;const a=document.getElementById(arc);a.style.strokeDashoffset=C*(1-Math.min(100,p)/100);a.style.stroke=p>90?'#f87171':p>70?'#fbbf24':'#34d399';document.getElementById(txt).textContent=Math.round(p)+'%';}
function fmtB(b){if(b>=1e9)return (b/1e9).toFixed(2)+' GB';if(b>=1e6)return (b/1e6).toFixed(2)+' MB';if(b>=1e3)return (b/1e3).toFixed(1)+' KB';return Math.round(b)+' B';}
function fmtR(r){return fmtB(r)+'/s';}
async function tick(){
 try{const r=await fetch('/api/monitor/stats'+q);const d=await r.json();
 setGauge('cpuarc','cpupct',d.cpu_pct);push(hist.cpu,d.cpu_pct);chart('cpuchart',[{data:hist.cpu,color:'#34d399'}]);
 setGauge('memarc','mempct',d.mem.pct);document.getElementById('memsub').textContent=d.mem.used_mb+' / '+d.mem.total_mb+' MB';
 setGauge('diskarc','diskpct',d.disk.pct);document.getElementById('disksub').textContent=d.disk.used_gb+' / '+d.disk.total_gb+' GB';
 document.getElementById('load1').textContent=d.load[0].toFixed(2);
 document.getElementById('load2').textContent=d.load[1].toFixed(2);
 document.getElementById('load3').textContent=d.load[2].toFixed(2);
 const perCore=d.load[0]/d.cpu_count;
 document.getElementById('loadmsg').textContent=perCore>1?'⚠️ overloaded — CPU can\'t keep up':perCore>0.7?'getting busy':'all good — CPU is relaxed';
 document.getElementById('loadmsg').style.color=perCore>1?'#f87171':perCore>0.7?'#fbbf24':'#34d399';
 const u=Math.floor(d.uptime_s/3600);document.getElementById('uptime').textContent='monitor uptime '+u+'h';
 document.getElementById('netconns').textContent=d.net.conns+' active connections';
 push(hist.rx,d.net.rx_rate);push(hist.tx,d.net.tx_rate);
 chart('netchart',[{data:hist.rx,color:'#60a5fa'},{data:hist.tx,color:'#34d399'}]);
 document.getElementById('nettotal').textContent='↓ '+fmtR(d.net.rx_rate)+' · ↑ '+fmtR(d.net.tx_rate)+' · total ↓ '+fmtB(d.net.rx_bytes)+' · ↑ '+fmtB(d.net.tx_bytes);
 const tb=document.getElementById('svcs');tb.innerHTML='';
 const sel=document.getElementById('unit');
 if(!sel.options.length){d.services.forEach(s=>{const o=document.createElement('option');o.value=s.unit;o.textContent=s.label;sel.appendChild(o);});}
 d.services.forEach(s=>{const tr=document.createElement('tr');
  tr.innerHTML='<td>'+s.label+'</td><td><span class="tag" style="margin-left:0">'+s.project+'</span></td><td><span class="pill '+(s.ok?'ok':'bad')+'">'+s.state+'</span></td><td class="dim">'+s.since+'</td>';
  tb.appendChild(tr);});
 document.getElementById('upd').textContent='updated '+new Date().toLocaleTimeString();
 }catch(e){document.getElementById('upd').textContent='fetch failed: '+e;document.getElementById('upd').style.color='#f87171';console.error('monitor fetch failed',e);}
}
async function loadErr(){const u=document.getElementById('unit').value;
 const r=await fetch('/api/monitor/errors'+q+'&unit='+encodeURIComponent(u));const d=await r.json();
 document.getElementById('errs').textContent=d.errors.length?d.errors.join('\\n'):'no recent errors 🎉';}
tick();setInterval(tick,10000);
</script></body></html>
"""
