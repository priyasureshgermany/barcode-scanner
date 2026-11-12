"""The icon: a barcode inside viewfinder corners, on a teal-to-indigo tile.

Drawn at four times the size and scaled down so the edges are smooth. The
maskable version keeps everything inside the centre safe zone.

Run with `python tools/make-icons.py` from the repo root to regenerate icons/.
"""
from PIL import Image, ImageDraw
import os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
BG_A = (0, 120, 130)
BG_B = (40, 30, 110)
INK = (255, 255, 255)
LASER = (255, 80, 90)


def tile(size, scale_content, rounded):
    S = size * 4
    grad = Image.new("RGB", (S, S))
    px = grad.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S)
            px[x, y] = tuple(int(BG_A[i] + (BG_B[i] - BG_A[i]) * t) for i in range(3))
    img = grad.convert("RGBA")
    if rounded:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        img.putalpha(mask)
    d = ImageDraw.Draw(img)
    c = S / 2
    half = S * 0.34 * scale_content
    w = max(4, int(S * 0.035 * scale_content))
    L = half * 0.42
    # viewfinder corners
    for sx in (-1, 1):
        for sy in (-1, 1):
            x0, y0 = c + sx * half, c + sy * half
            d.line([(x0, y0), (x0 - sx * L, y0)], fill=INK, width=w)
            d.line([(x0, y0), (x0, y0 - sy * L)], fill=INK, width=w)
            r = w / 2
            d.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=INK)
    # bars
    pattern = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2]
    unit = (half * 1.3) / sum(pattern)
    x = c - half * 0.65
    top, bot = c - half * 0.55, c + half * 0.55
    for i, p in enumerate(pattern):
        wbar = p * unit
        if i % 2 == 0:
            d.rectangle([x, top, x + wbar - 1, bot], fill=INK)
        x += wbar
    # laser line
    lw = max(3, int(S * 0.018 * scale_content))
    d.rectangle([c - half * 0.85, c - lw / 2, c + half * 0.85, c + lw / 2], fill=LASER)
    return img.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
tile(192, 1.0, True).save(os.path.join(OUT, "icon-192.png"))
tile(512, 1.0, True).save(os.path.join(OUT, "icon-512.png"))
tile(512, 0.72, False).save(os.path.join(OUT, "icon-maskable-512.png"))
tile(180, 1.0, False).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))
print("icons written to", OUT)
