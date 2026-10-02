import os
import re

tools_path = "website/src/pages/Tools.jsx"
sitemap_path = "website/public/sitemap.xml"

with open(tools_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract paths using regex
# Look for `{ to: '/something'`
paths = re.findall(r"to:\s*'(/[^']+)'", content)

# Remove duplicates just in case
paths = list(set(paths))

xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

# Core pages
core_pages = [
    ('/', 1.0),
    ('/tools', 0.9),
]

for path, priority in core_pages:
    xml += '  <url>\n'
    xml += f'    <loc>https://alphamedia.cyou{path}</loc>\n'
    xml += f'    <priority>{priority}</priority>\n'
    xml += '  </url>\n'

# Tool pages
for path in sorted(paths):
    # If path is just / it's covered by core
    if path == '/': continue
    xml += '  <url>\n'
    xml += f'    <loc>https://alphamedia.cyou{path}</loc>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'

xml += '</urlset>'

with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write(xml)

print(f"Generated sitemap with {len(paths) + len(core_pages) - 1} URLs")
