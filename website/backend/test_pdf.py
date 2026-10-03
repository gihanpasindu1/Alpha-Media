from pdf2image import convert_from_path
import sys

try:
    # Just checking if it imports cleanly and runs without popping errors
    print("pdf2image loaded successfully!")
    # Create a dummy pdf using pypdf
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    with open("test.pdf", "wb") as f:
        writer.write(f)
    print("Dummy PDF created")
    
    images = convert_from_path("test.pdf", dpi=200)
    print("Converted successfully:", len(images), "pages")
except Exception as e:
    import traceback
    traceback.print_exc()
