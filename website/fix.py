import os, glob

pages_dir = 'c:/Users/Gihan Pasindu/Desktop/TGbot/website/src/pages'
for filepath in glob.glob(os.path.join(pages_dir, '*.jsx')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace(
        "const API = 'http://localhost:8000'", 
        "const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'"
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
print('Done updating API urls')
