"""Generate Tax Tjommie PWA icons.
Run once: python scripts/make_icons.py
Writes assets/icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)

BG = (10, 10, 12, 255)        # --bg-app
TEAL = (20, 184, 166, 255)    # --teal
SURFACE = (20, 22, 26, 255)   # --bg-surface


def _draw_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Outer rounded-rect card (no-op on maskable — needs full bleed to the edges)
    if not maskable:
        r = int(size * 0.22)
        draw.rounded_rectangle((0, 0, size, size), radius=r, fill=SURFACE)

    # Central teal square with rounded corners
    inset = int(size * (0.18 if not maskable else 0.24))
    box = (inset, inset, size - inset, size - inset)
    draw.rounded_rectangle(box, radius=int(size * 0.14), fill=TEAL)

    # Draw "TT" monogram
    text = "TT"
    font_size = int(size * (0.42 if not maskable else 0.36))
    font = None
    for path in [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # Shift up slightly so visual centre looks right (font bbox includes descent)
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), text, fill=BG, font=font)
    return img


def main() -> None:
    for size in (192, 512):
        _draw_icon(size, maskable=False).save(OUT / f"icon-{size}.png", optimize=True)
        _draw_icon(size, maskable=True).save(OUT / f"icon-maskable-{size}.png", optimize=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
