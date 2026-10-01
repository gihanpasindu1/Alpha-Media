import urllib.request, urllib.error, json

req = urllib.request.Request(
    'https://api.cobalt.tools', 
    data=json.dumps({'url': 'https://www.youtube.com/watch?v=bhKKR5He_Fo', 'videoQuality': '720'}).encode(), 
    headers={'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)
try:
    response = urllib.request.urlopen(req)
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
