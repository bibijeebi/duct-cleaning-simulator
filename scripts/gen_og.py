#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["openai>=1.50.0", "pillow>=10.0.0"]
# ///
"""Generate a 1200x630 Open Graph hero image for duct-cleaning-simulator.xyz."""
import base64
import os
from pathlib import Path
from openai import OpenAI
from PIL import Image

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
OUT = Path("/home/claude/gpt55_output/duct-sim/public")
OUT.mkdir(parents=True, exist_ok=True)

# gpt-image-2 supports 1024x1024, 1536x1024, 1024x1536. No 1200x630 direct.
# Generate 1536x1024 then crop/resize to 1200x630.
prompt = (
    "Cinematic video game hero art for a first-person commercial HVAC duct cleaning "
    "training simulator called DUCT CLEANING SIMULATOR. Stylized realistic low-poly "
    "3D render in the aesthetic of PowerWash Simulator and Lawn Mowing Simulator. "
    "Wide cinematic composition. "
    "Center-right: gloved hands holding a black flexible duct-cleaning agitation wand "
    "with a rotating black bristle brush, feeding it into a circular access hole cut "
    "into galvanized sheet metal trunk ductwork visible above a pulled acoustic "
    "ceiling tile. Dust particles suspended in mid-air catching cinematic light. "
    "Center-left: the back of a white commercial service van with its rear doors open, "
    "'CAROLINA QUALITY AIR' decal in bold safety yellow on the side panel, yellow "
    "HEPA negative air machine on wheels visible inside the van, coiled silver flex "
    "duct, tool cases. "
    "Background: dimly lit commercial office hallway with drop ceiling grid, beige "
    "walls, a 'SAFETY FIRST' poster mounted on the wall. Fluorescent light fixtures "
    "glowing above. Subtle blue-gray atmospheric haze suggesting ductwork dust. "
    "Large bold bottom-left title text 'DUCT CLEANING SIMULATOR' in safety yellow "
    "sans-serif. Smaller subtitle below: 'A Training Sim for Real Techs'. "
    "Professional indie game cover art quality, OSHA manual meets AAA game render. "
    "Photorealistic but stylized. Cinematic lighting with rim highlights on the van "
    "and wand. Color palette: muted beige office interior, safety yellow accents, "
    "galvanized silver ductwork, cool blue atmospheric fill."
)

print("generating OG image...")
resp = client.images.generate(model="gpt-image-2", prompt=prompt, size="1536x1024", n=1)
raw_path = OUT / "og-raw.png"
raw_path.write_bytes(base64.b64decode(resp.data[0].b64_json))
print(f"raw saved: {raw_path.stat().st_size // 1024} KB")

# Resize to exact Open Graph spec: 1200x630
img = Image.open(raw_path)
# crop to 1200:630 ratio (1.905:1) from center
target_w, target_h = 1200, 630
src_w, src_h = img.size  # 1536, 1024
src_ratio = src_w / src_h  # 1.5
dst_ratio = target_w / target_h  # 1.9

if src_ratio < dst_ratio:
    # source is taller relative, crop height
    new_h = int(src_w / dst_ratio)
    top = (src_h - new_h) // 2
    img = img.crop((0, top, src_w, top + new_h))
else:
    new_w = int(src_h * dst_ratio)
    left = (src_w - new_w) // 2
    img = img.crop((left, 0, left + new_w, src_h))

img = img.resize((target_w, target_h), Image.LANCZOS)
png_path = OUT / "og-image.png"
img.save(png_path, "PNG", optimize=True)
print(f"og-image.png: {png_path.stat().st_size // 1024} KB at {img.size}")

# Also make webp alternative (smaller for Twitter card)
webp_path = OUT / "og-image.webp"
img.save(webp_path, "WEBP", quality=88, method=6)
print(f"og-image.webp: {webp_path.stat().st_size // 1024} KB")

# Also make a square 1024 version for favicon/apple-touch
square = Image.open(raw_path).resize((512, 512), Image.LANCZOS)
square.save(OUT / "favicon-512.png", "PNG", optimize=True)

# Generate a 180 for apple-touch-icon
square180 = Image.open(raw_path).resize((180, 180), Image.LANCZOS)
square180.save(OUT / "apple-touch-icon.png", "PNG", optimize=True)

# Generate 32x32 favicon
square32 = Image.open(raw_path).resize((32, 32), Image.LANCZOS)
square32.save(OUT / "favicon-32.png", "PNG", optimize=True)

raw_path.unlink()
print("done")
