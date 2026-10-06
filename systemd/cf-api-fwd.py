#!/usr/bin/env python3
"""Forwards the sinkholed Cloudflare API IP through the egress proxy.
Listens on 198.18.230.156:443, and for each connection, establishes a
CONNECT tunnel through the proxy to api.trycloudflare.com:443.
Reads fresh proxy credentials from the environment at startup.
"""
import socket, threading, os, base64, sys

LISTEN_IP = "198.18.230.156"
LISTEN_PORT = 443
TARGET_HOST = "api.trycloudflare.com"
TARGET_PORT = 443

def get_proxy():
    for var in ("https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY"):
        val = os.environ.get(var)
        if val:
            # parse http://user:pass@host:port
            val = val.split("://", 1)[1]
            auth, hostport = val.split("@", 1)
            host, port = hostport.split(":", 1)
            return host, int(port), auth
    raise RuntimeError("no proxy in environment")

PROXY_HOST, PROXY_PORT, PROXY_AUTH = get_proxy()
AUTH_B64 = base64.b64encode(PROXY_AUTH.encode()).decode()

def relay(a, b):
    try:
        while True:
            data = a.recv(65536)
            if not data:
                break
            b.sendall(data)
    except Exception:
        pass

def handle(client):
    try:
        # Connect to proxy
        p = socket.create_connection((PROXY_HOST, PROXY_PORT), timeout=15)
        # Send CONNECT
        req = (f"CONNECT {TARGET_HOST}:{TARGET_PORT} HTTP/1.1\r\n"
               f"Host: {TARGET_HOST}:{TARGET_PORT}\r\n"
               f"Proxy-Authorization: Basic {AUTH_B64}\r\n"
               f"Proxy-Connection: Keep-Alive\r\n\r\n")
        p.sendall(req.encode())
        # Read response
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = p.recv(4096)
            if not chunk:
                raise RuntimeError("proxy closed connection")
            resp += chunk
        if b" 200 " not in resp.split(b"\r\n", 1)[0]:
            print(f"proxy rejected: {resp.split(chr(13).encode())[0]}", flush=True)
            client.close()
            p.close()
            return
        # Relay
        t1 = threading.Thread(target=relay, args=(client, p), daemon=True)
        t2 = threading.Thread(target=relay, args=(p, client), daemon=True)
        t1.start(); t2.start()
        t1.join(); t2.join()
    except Exception as e:
        print(f"handle error: {e}", flush=True)
    finally:
        try: client.close()
        except Exception: pass

def main():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((LISTEN_IP, LISTEN_PORT))
    srv.listen(50)
    print(f"forwarding {LISTEN_IP}:{LISTEN_PORT} -> proxy -> {TARGET_HOST}:{TARGET_PORT}", flush=True)
    while True:
        client, _ = srv.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()

if __name__ == "__main__":
    main()
