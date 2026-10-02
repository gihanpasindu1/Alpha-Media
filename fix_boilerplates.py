import os
import glob

pages_dir = "website/src/pages"
for filepath in glob.glob(os.path.join(pages_dir, "*.jsx")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    old_str = """{'{file ? file.name : "Click to browse or drag file here"}'}"""
    new_str = """{file ? file.name : "Click to browse or drag file here"}"""
    
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {filepath}")
