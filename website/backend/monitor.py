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
    return HTMLResponse(_PAGE)


_PAGE = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Server Monitor</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0b0f17;color:#e6edf3;margin:0;padding:20px}
h1{font-size:20px;margin:0 0 4px}.sub{color:#8b949e;font-size:13px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px}
.card{background:#161b26;border:1px solid #2a3345;border-radius:10px;padding:14px}
.card h3{margin:0 0 8px;font-size:13px;color:#8b949e;text-transform:uppercase;letter-spacing:.5px}
.big{font-size:28px;font-weight:700}.bar{height:8px;background:#2a3345;border-radius:4px;margin-top:8px;overflow:hidden}
.bar>div{height:100%;border-radius:4px;background:#34d399}.bar.warn>div{background:#fbbf24}.bar.bad>div{background:#f87171}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;color:#8b949e;font-weight:600;padding:8px;border-bottom:1px solid #2a3345}
td{padding:8px;border-bottom:1px solid #1c2330}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px}
.ok{background:#34d399}.bad{background:#f87171}.warn{background:#fbbf24}
.tag{font-size:11px;padding:2px 8px;border-radius:20px;background:#2a3345;color:#aeb9c7;margin-left:8px}
pre{background:#0d1117;border:1px solid #2a3345;border-radius:8px;padding:12px;font-size:12px;max-height:220px;overflow:auto;white-space:pre-wrap}
button{background:#2a3345;color:#e6edf3;border:0;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px}
button:hover{background:#3a465e}.row{display:flex;gap:10px;align-items:center;margin-bottom:12px}
select{background:#161b26;color:#e6edf3;border:1px solid #2a3345;border-radius:6px;padding:6px}
.updated{color:#8b949e;font-size:12px}
</style></head><body>
<h1>🖥️ Server Monitor</h1>
<div class="sub">AlphaMedia + AlphaRDP bridge · auto-refreshes every 10s · <span class="updated" id="upd"></span></div>
<div class="grid">
<div class="card"><h3>CPU</h3><div class="big" id="cpu">–</div><div class="bar" id="cpubar"><div style="width:0%"></div></div></div>
<div class="card"><h3>Memory</h3><div class="big" id="mem">–</div><div class="bar" id="membar"><div style="width:0%"></div></div></div>
<div class="card"><h3>Disk</h3><div class="big" id="disk">–</div><div class="bar" id="diskbar"><div style="width:0%"></div></div></div>
<div class="card"><h3>Load avg</h3><div class="big" id="load" style="font-size:20px">–</div><div style="color:#8b949e;font-size:12px;margin-top:6px" id="uptime"></div></div>
</div>
<div class="card" style="margin-bottom:18px"><h3>Services</h3><table><thead><tr><th>Service</th><th>Project</th><th>Status</th><th>Since</th></tr></thead><tbody id="svcs"></tbody></table></div>
<div class="card"><h3>Recent errors</h3>
<div class="row"><select id="unit"></select><button onclick="loadErr()">Refresh</button></div>
<pre id="errs">pick a service…</pre></div>
<script>
const T=new URLSearchParams(location.search).get('token')||'';
const q='?token='+encodeURIComponent(T);
function bar(id,p){const e=document.getElementById(id);e.firstElementChild.style.width=Math.min(100,p)+'%';e.className='bar'+(p>90?' bad':p>70?' warn':'');}
async function tick(){
 try{const r=await fetch('/api/monitor/stats'+q);const d=await r.json();
 document.getElementById('cpu').textContent=d.cpu_pct+'%';bar('cpubar',d.cpu_pct);
 document.getElementById('mem').textContent=d.mem.pct+'% · '+d.mem.used_mb+'/'+d.mem.total_mb+' MB';bar('membar',d.mem.pct);
 document.getElementById('disk').textContent=d.disk.pct+'% · '+d.disk.used_gb+'/'+d.disk.total_gb+' GB';bar('diskbar',d.disk.pct);
 document.getElementById('load').textContent=d.load.join('  ');
 const u=Math.floor(d.uptime_s/3600);document.getElementById('uptime').textContent='monitor uptime '+u+'h';
 const tb=document.getElementById('svcs');tb.innerHTML='';
 const sel=document.getElementById('unit');
 if(!sel.options.length){d.services.forEach(s=>{const o=document.createElement('option');o.value=s.unit;o.textContent=s.label;sel.appendChild(o);});}
 d.services.forEach(s=>{const tr=document.createElement('tr');
  tr.innerHTML='<td><span class="dot '+(s.ok?'ok':'bad')+'"></span>'+s.label+'</td><td><span class="tag">'+s.project+'</span></td><td>'+s.state+'</td><td style="color:#8b949e;font-size:12px">'+s.since+'</td>';
  tb.appendChild(tr);});
 document.getElementById('upd').textContent='updated '+new Date().toLocaleTimeString();
 }catch(e){document.getElementById('upd').textContent='fetch failed: '+e;}
}
async function loadErr(){const u=document.getElementById('unit').value;
 const r=await fetch('/api/monitor/errors'+q+'&unit='+encodeURIComponent(u));const d=await r.json();
 document.getElementById('errs').textContent=d.errors.length?d.errors.join('\\n'):'no recent errors 🎉';}
tick();setInterval(tick,10000);
</script></body></html>
"""
