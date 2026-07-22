"""Refactored 90s film — brand render toolkit (Pillow).

Everything cinematic in the film that isn't real product footage is drawn here at
true 1080p: the deep-green field, the Pathfinder compass, the Refactored keystone,
the wordmarks in the brand's own Newsreader, plus grade/vignette/grain.

Run engine: Codex runtime python 3.12 (has Pillow 12).
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parent
FONTS = ROOT / "fonts"

WIDTH, HEIGHT, FPS = 1920, 1080, 30
SS = 4  # supersample factor for vector marks

# Palette (brand)
DEEP = (11, 26, 21)        # #0B1A15 deep green base
DEEP2 = (7, 17, 14)        # #07110E darker
PAPER = (247, 245, 239)    # #F7F5EF
SPRUCE = (121, 200, 187)   # #79C8BB
AMBER = (217, 164, 65)     # #D9A441
MUTE = (150, 168, 160)     # muted paper for secondary text

HELV = "/System/Library/Fonts/HelveticaNeue.ttc"

# Static Newsreader instances (variable font renders as tofu in Pillow).
_NEWS_STATIC = {
    360: str(FONTS / "Newsreader-Light.ttf"),
    500: str(FONTS / "Newsreader-Medium.ttf"),
    600: str(FONTS / "Newsreader-Semibold.ttf"),
    680: str(FONTS / "Newsreader-Bold.ttf"),
}
NEWS_IT = str(FONTS / "Newsreader-ItalicMedium.ttf")


def news(size: int, weight: int = 500) -> ImageFont.FreeTypeFont:
    key = min(_NEWS_STATIC, key=lambda w: abs(w - weight))
    return ImageFont.truetype(_NEWS_STATIC[key], size)


def news_it(size: int, weight: int = 460) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(NEWS_IT, size)


def helv(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(HELV, size)


# ---------- easing ----------

def ease_in_out(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * math.cos(math.pi * t)


def ease_out(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) * (1 - t)


def clamp01(t: float) -> float:
    return max(0.0, min(1.0, t))


def seg(t: float, a: float, b: float) -> float:
    """Normalized 0..1 progress of t within [a,b]."""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return clamp01((t - a) / (b - a))


# ---------- background field ----------

_grain_cache: dict[int, Image.Image] = {}


def _contours(img: Image.Image) -> None:
    """Faint topographic lines echoing the product's landing hero."""
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(7):
        base_y = 150 + i * 130
        amp = 26 + i * 5
        pts = []
        for x in range(-20, WIDTH + 20, 24):
            y = base_y + amp * math.sin(x / 240.0 + i * 0.9)
            pts.append((x, y))
        d.line(pts, fill=(*PAPER, 9), width=2, joint="curve")


def field(vignette: float = 0.55, contour: bool = True) -> Image.Image:
    """Deep-green base frame with vertical gradient, contours and vignette."""
    img = Image.new("RGB", (WIDTH, HEIGHT), DEEP)
    top = Image.new("RGB", (1, HEIGHT))
    for y in range(HEIGHT):
        k = y / HEIGHT
        r = int(DEEP[0] + (DEEP2[0] - DEEP[0]) * k)
        g = int(DEEP[1] + (DEEP2[1] - DEEP[1]) * k)
        b = int(DEEP[2] + (DEEP2[2] - DEEP[2]) * k)
        top.putpixel((0, y), (r, g, b))
    img = top.resize((WIDTH, HEIGHT))
    if contour:
        _contours(img)
    if vignette > 0:
        apply_vignette(img, vignette)
    return img


def apply_vignette(img: Image.Image, strength: float = 0.55) -> None:
    mask = Image.new("L", (WIDTH, HEIGHT), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-WIDTH * 0.25, -HEIGHT * 0.35, WIDTH * 1.25, HEIGHT * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(220))
    dark = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    inv = Image.eval(mask, lambda v: int((255 - v) * strength))
    img.paste(Image.composite(dark, img.copy(), inv), (0, 0))


def grain(img: Image.Image, amount: int = 8) -> None:
    key = amount
    if key not in _grain_cache:
        import os
        noise = Image.frombytes("L", (WIDTH, HEIGHT), os.urandom(WIDTH * HEIGHT))
        _grain_cache[key] = noise
    noise = _grain_cache[key]
    tinted = ImageChops.add(img, noise.convert("RGB").point(lambda v: int(abs(v - 128) / 128 * amount)))
    img.paste(tinted, (0, 0))


# ---------- brand marks ----------

def _ring_tile(d_px: int, stroke_frac: float = 0.028) -> Image.Image:
    D = d_px * SS
    tile = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    dr = ImageDraw.Draw(tile)
    w = max(2, int(D * stroke_frac))
    pad = w // 2 + 2
    dr.ellipse((pad, pad, D - pad, D - pad), outline=(*PAPER, 218), width=w)
    return tile.resize((d_px, d_px), Image.Resampling.LANCZOS)


def _compass_inner(d_px: int) -> Image.Image:
    """4-point compass star sized to a 100-unit box mapped onto the ring."""
    D = d_px * SS

    def P(x, y):
        return (x / 100 * D, y / 100 * D)

    tile = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    dr = ImageDraw.Draw(tile)
    dr.polygon([P(50, 14), P(58, 50), P(50, 86), P(42, 50)], fill=(*PAPER, 255))
    dr.polygon([P(14, 50), P(50, 42), P(86, 50), P(50, 58)], fill=(*SPRUCE, 255))
    r = 5 / 100 * D
    cx = cy = D / 2
    dr.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*DEEP, 255), outline=(*PAPER, 255), width=max(2, int(D * 0.02)))
    return tile.resize((d_px, d_px), Image.Resampling.LANCZOS)


def _keystone_inner(d_px: int) -> Image.Image:
    """Arch with piers and a spruce keystone, sized to the 100-unit box."""
    D = d_px * SS

    def P(x, y):
        return (x / 100 * D, y / 100 * D)

    tile = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    dr = ImageDraw.Draw(tile)
    # piers
    dr.rounded_rectangle([P(22, 49)[0], P(22, 49)[1], P(34, 76)[0], P(34, 76)[1]],
                         radius=int(D * 0.02), fill=(*PAPER, 255))
    dr.rounded_rectangle([P(66, 49)[0], P(66, 49)[1], P(78, 76)[0], P(78, 76)[1]],
                         radius=int(D * 0.02), fill=(*PAPER, 255))
    # arch band (semicircle) via pieslice stroke
    aw = int(D * 0.11)
    bbox = [P(28, 28)[0], P(28, 28)[1], P(72, 72)[0], P(72, 72)[1]]
    dr.arc(bbox, start=180, end=360, fill=(*PAPER, 255), width=aw)
    # keystone wedge
    dr.polygon([P(37, 18), P(63, 18), P(56.5, 45), P(43.5, 45)], fill=(*SPRUCE, 255))
    return tile.resize((d_px, d_px), Image.Resampling.LANCZOS)


def paste_center(base: Image.Image, tile: Image.Image, cx: int, cy: int, opacity: float = 1.0,
                 rot: float = 0.0, scale: float = 1.0) -> None:
    if opacity <= 0:
        return
    t = tile
    if scale != 1.0:
        nw = max(1, int(t.width * scale))
        t = t.resize((nw, nw), Image.Resampling.LANCZOS)
    if rot:
        t = t.rotate(rot, resample=Image.BICUBIC, expand=True)
    if opacity < 1.0:
        a = t.getchannel("A").point(lambda v: int(v * opacity))
        t = t.copy()
        t.putalpha(a)
    base.paste(t, (int(cx - t.width / 2), int(cy - t.height / 2)), t)


def pathfinder_mark(base: Image.Image, cx: int, cy: int, d_px: int, opacity: float = 1.0) -> None:
    paste_center(base, _ring_tile(d_px), cx, cy, opacity)
    paste_center(base, _compass_inner(d_px), cx, cy, opacity)


def refactored_mark(base: Image.Image, cx: int, cy: int, d_px: int, opacity: float = 1.0) -> None:
    paste_center(base, _ring_tile(d_px), cx, cy, opacity)
    paste_center(base, _keystone_inner(d_px), cx, cy, opacity)


def morph_mark(base: Image.Image, cx: int, cy: int, d_px: int, t: float) -> None:
    """t in 0..1: compass -> keystone. Ring constant; inner restructures."""
    paste_center(base, _ring_tile(d_px), cx, cy, 1.0)
    comp_op = 1.0 - clamp01((t - 0.30) / 0.20)
    comp_rot = -150 * ease_in_out(seg(t, 0.28, 0.55))
    if comp_op > 0:
        paste_center(base, _compass_inner(d_px), cx, cy, comp_op, rot=comp_rot)
    key_p = seg(t, 0.42, 0.62)
    if key_p > 0:
        key_op = ease_out(key_p)
        key_scale = 0.82 + 0.18 * ease_out(key_p)
        key_rot = -8 * (1 - ease_out(key_p))
        paste_center(base, _keystone_inner(d_px), cx, cy, key_op, rot=key_rot, scale=key_scale)


# ---------- text ----------

def center_text(img: Image.Image, y: int, text: str, font: ImageFont.FreeTypeFont, fill,
                opacity: float = 1.0, tracking: int = 0) -> int:
    d = ImageDraw.Draw(img, "RGBA")
    a = int(255 * clamp01(opacity))
    col = (*fill, a)
    if tracking:
        total = 0
        for ch in text:
            total += d.textlength(ch, font=font) + tracking
        total -= tracking
        x = (WIDTH - total) / 2
        for ch in text:
            d.text((x, y), ch, font=font, fill=col)
            x += d.textlength(ch, font=font) + tracking
        return int(total)
    w = d.textlength(text, font=font)
    d.text(((WIDTH - w) / 2, y), text, font=font, fill=col)
    return int(w)


def eyebrow(img: Image.Image, y: int, text: str, color=SPRUCE, opacity: float = 1.0, size: int = 26):
    center_text(img, y, text.upper(), helv(size), color, opacity, tracking=int(size * 0.42))


if __name__ == "__main__":
    # self-test: render three stills to verify fonts + marks
    out = ROOT / "assets"
    out.mkdir(exist_ok=True)

    f = field()
    pathfinder_mark(f, WIDTH // 2, 430, 190)
    center_text(f, 560, "Pathfinder", news(96, 480), PAPER)
    grain(f)
    f.save(out / "test_pathfinder.png")

    f = field()
    refactored_mark(f, WIDTH // 2, 415, 190)
    center_text(f, 545, "Refactored", news(96, 480), PAPER)
    eyebrow(f, 680, "Mission follows mastery", SPRUCE, size=24)
    grain(f)
    f.save(out / "test_refactored.png")

    f = field()
    center_text(f, 300, "Reentry isn't a paperwork problem.", news(78, 440), PAPER)
    center_text(f, 400, "It's a sequencing problem.", news(78, 500), SPRUCE)
    grain(f)
    f.save(out / "test_title.png")
    print("wrote test stills to", out)
