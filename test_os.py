import urllib.request, json
try:
    req = urllib.request.Request(
        'https://p.oceansaver.in/ajax/download.php?copyright=0&format=720&url=https://www.youtube.com/watch?v=bhKKR5He_Fo', 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    response = urllib.request.urlopen(req)
    print(response.read().decode())
except Exception as e:
    print("Error:", e)
