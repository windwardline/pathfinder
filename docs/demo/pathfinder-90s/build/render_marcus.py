"""Pathfinder — 'Marcus' 90s film. Hand-drawn ink-and-wash on paper.

Line boil at 8 fps, washes cached at 8 fps and half-res for speed, real product
captures presented inside wobbly hand-drawn frames. No captions.
"""
from __future__ import annotations

import json
import math
import os
import random
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

ROOT = Path(__file__).parent
WIDTH, HEIGHT, FPS = 1920, 1080, 30
PAPER_BG = (243, 238, 226)
INK = (24, 38, 32)
PENCIL = (150, 146, 134)
WALL = (64, 92, 79)
AMB = (231, 166, 66)
AMB_SOFT = (238, 187, 96)
SPR = (109, 168, 152)
GROUND = (214, 203, 180)
SHADOW = (120, 124, 108)

BEATS = json.loads((ROOT / "audio" / "beatmap-marcus.json").read_text())["beats"]

NEWS = str(ROOT / "fonts" / "Newsreader-Medium.ttf")
NEWS_SB = str(ROOT / "fonts" / "Newsreader-Semibold.ttf")
GMONO = str(ROOT / "fonts" / "GeistMono-Regular.ttf")

TODAY = Image.open("/Users/peacock/Projects/pathfinder/.playwright-mcp/09-today-dark.png").convert("RGB")
HISTORY = Image.open(ROOT.parent.parent / "captures" / "route-history-authentic-dark.png").convert("RGB")
SEGDIR = ROOT / "segments"
N_SEG = 146

# ---------------- easing ----------------

def clamp01(x): return max(0.0, min(1.0, x))
def seg_(t, a, b): return clamp01((t - a) / (b - a)) if b > a else (1.0 if t >= b else 0.0)
def ease(t): return 0.5 - 0.5 * math.cos(math.pi * clamp01(t))
def ease_out(t): t = clamp01(t); return 1 - (1 - t) ** 2

# ---------------- paper ----------------

def _paper() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER_BG)
    n = Image.frombytes("L", (WIDTH, HEIGHT), os.urandom(WIDTH * HEIGHT)).filter(ImageFilter.GaussianBlur(1))
    img = Image.composite(Image.new("RGB", (WIDTH, HEIGHT), (230, 224, 208)), img, n.point(lambda v: int(max(0, v - 200))))
    return img

PAPER = _paper()

def _warm_vignette() -> Image.Image:
    m = Image.new("L", (WIDTH, HEIGHT), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((-WIDTH * 0.3, -HEIGHT * 0.4, WIDTH * 1.3, HEIGHT * 1.4), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(200))
    inv = Image.eval(m, lambda v: int((255 - v) * 0.30))
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (96, 78, 50, 0))
    layer.putalpha(inv)
    return layer

VIGNETTE = _warm_vignette()

# ---------------- ink toolkit ----------------

def boil_of(t: float) -> int:
    return int(t * 8)

def stroke(d: ImageDraw.ImageDraw, pts, width=5, jitter=2.6, passes=2, seed=1, boil=0,
           color=INK, alpha=235):
    r = random.Random((seed * 31 + boil) & 0x7FFFFFFF)
    for p in range(passes):
        jp = [(x + r.uniform(-jitter, jitter), y + r.uniform(-jitter, jitter)) for (x, y) in pts]
        d.line(jp, fill=(*color, max(0, alpha - p * 60)), width=max(2, int(width + r.uniform(-1, 1))), joint="curve")

def pline(x0, y0, x1, y1, n=12):
    return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]

def circle_pts(cx, cy, r, n=16, a0=0.0, a1=2 * math.pi):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cy + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]

def sign(d, cx, cy, text, boil, size=30, seed=990, pad=22, alpha=235):
    """Hand-lettered sign board: wobbly ink rect + spaced mono capitals."""
    f = ImageFont.truetype(GMONO, size)
    txt = " ".join(text.upper())
    tw = d.textlength(txt, font=f)
    w, h = tw + pad * 2, size + pad
    d.rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), fill=(*PAPER_BG, 235))
    stroke(d, [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2),
               (cx - w / 2, cy + h / 2), (cx - w / 2, cy - h / 2)], width=4, jitter=2.2, seed=seed, boil=boil, alpha=alpha)
    d.text((cx - tw / 2, cy - size * 0.62), txt, font=f, fill=(*INK, alpha))

# washes: computed at quarter res, cached by (key, boil)
_WASH_CACHE: dict = {}

def wash_layer(key: str, boil: int, painters) -> Image.Image:
    """painters: list of (shape_fn(draw,W,H), color, alpha, blur). Returns RGB image full res."""
    ck = (key, boil)
    if ck in _WASH_CACHE:
        return _WASH_CACHE[ck]
    if len(_WASH_CACHE) > 60:
        _WASH_CACHE.clear()
    w4, h4 = WIDTH // 2, HEIGHT // 2
    img = PAPER.resize((w4, h4))
    r = random.Random(boil * 7 + hash(key) % 1000)
    for shape_fn, color, alpha, blur in painters:
        m = Image.new("L", (w4, h4), 0)
        shape_fn(ImageDraw.Draw(m), w4, h4)
        m = m.filter(ImageFilter.GaussianBlur(max(2, blur // 2)))
        sp = Image.frombytes("L", (w4, h4), os.urandom(w4 * h4)).filter(ImageFilter.GaussianBlur(3))
        m = ImageChops.multiply(m, sp.point(lambda v: 190 + (v - 128) // 3))
        m = m.point(lambda v: int(v * alpha))
        img = Image.composite(Image.new("RGB", (w4, h4), color), img, m)
    out = img.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
    _WASH_CACHE[ck] = out
    return out

# ---------------- Marcus figure ----------------

def hatch(d, x0, y0, x1, y1, boil, spacing=26, seed=880, alpha=26, slope=0.18, width=2):
    """Sketchy parallel hatching inside a rect — texture for walls/ground."""
    r = random.Random(seed)
    y = y0 + r.uniform(0, spacing)
    i = 0
    while y < y1:
        yy1 = y + (x1 - x0) * slope * r.uniform(0.7, 1.0)
        if yy1 < y1 + spacing:
            stroke(d, pline(x0, y, x1, min(y1, yy1), n=6), width=width, jitter=1.6,
                   passes=1, seed=seed + i, boil=boil, alpha=alpha)
        y += spacing * r.uniform(0.85, 1.25)
        i += 1

def blotch(d, x0, y0, x1, y1, boil, n=5, color=(200, 190, 168), seed=770, amax=26):
    """Translucent irregular blobs — watercolor variance inside a region."""
    r = random.Random(seed)
    for i in range(n):
        cx, cy = r.uniform(x0, x1), r.uniform(y0, y1)
        rw, rh = r.uniform(40, 130), r.uniform(26, 80)
        d.ellipse((cx - rw, cy - rh, cx + rw, cy + rh), fill=(*color, r.randint(10, amax)))

def route_path(d, pts, progress, boil, seed=660, alpha=150, width=4, dash=26, gap=18):
    """Dashed map-route line drawn progressively — the film's nod to the name."""
    if progress <= 0: return
    segs = []
    total = 0.0
    for a, b2 in zip(pts, pts[1:]):
        ln = math.hypot(b2[0] - a[0], b2[1] - a[1])
        segs.append((a, b2, ln)); total += ln
    lim = total * clamp01(progress)
    run = 0.0
    for a, b2, ln in segs:
        if run > lim: break
        ux, uy = (b2[0] - a[0]) / ln, (b2[1] - a[1]) / ln
        s = 0.0
        while s < ln and run + s < lim:
            e = min(s + dash, ln, lim - run + s if False else s + dash)
            stroke(d, [(a[0] + ux * s, a[1] + uy * s), (a[0] + ux * min(e, ln), a[1] + uy * min(e, ln))],
                   width=width, jitter=1.4, passes=1, seed=seed + int(s), boil=boil, color=(70, 128, 112), alpha=alpha)
            s += dash + gap
        run += ln

def draw_marcus(d, fx, fy, Hh, boil, seed=60, walk_phase=None, box=True, sit=False,
                phone=False, alpha=235, flip=False):
    """Ink figure v2 — hips, knees, elbows, body bob. fx,fy = feet anchor
    (standing/walking) or seat surface (sit=True)."""
    hr = Hh / 7.2
    sgn = -1 if flip else 1
    ph = walk_phase
    bob = abs(math.sin((ph or 0) * 2 * math.pi)) * 0.022 * Hh if ph is not None else 0
    def S(pts, wd=None, sd=0, a=None):
        stroke(d, pts, width=wd or max(4, int(hr * 0.16)), jitter=2.3, seed=seed + sd,
               boil=boil, alpha=a or alpha)
    if sit:
        seatY = fy
        hipY = seatY - 0.05 * Hh
        shY = seatY - 0.52 * Hh
        floorY = seatY + 0.34 * Hh
        # hips block ON the seat
        # torso
        S(pline(fx - sgn * 0.10 * Hh, shY, fx - sgn * 0.08 * Hh, hipY), sd=3)
        S(pline(fx + sgn * 0.12 * Hh, shY + 0.01 * Hh, fx + sgn * 0.10 * Hh, hipY), sd=4)
        S(pline(fx - sgn * 0.10 * Hh, shY, fx + sgn * 0.12 * Hh, shY + 0.01 * Hh), sd=5)
        S(pline(fx - sgn * 0.08 * Hh, hipY, fx + sgn * 0.10 * Hh, hipY), sd=23)
        # thighs forward -> knees -> shins down -> feet on floor
        for k, off in ((0, 0.0), (1, 0.045)):
            kx = fx + sgn * (0.24 + off) * Hh
            S([(fx + sgn * 0.02 * Hh, hipY), (kx, hipY + 0.02 * Hh)], sd=1 + k)
            S([(kx, hipY + 0.02 * Hh), (kx + sgn * 0.01 * Hh, floorY)], sd=14 + k)
            d.ellipse((kx + sgn * 0.01 * Hh - 11, floorY - 6, kx + sgn * 0.01 * Hh + 15, floorY + 8), fill=(*INK, alpha))
    else:
        hipY = fy - bob - 0.34 * Hh
        shY = fy - bob - 0.78 * Hh
        # torso trapezoid
        S(pline(fx - sgn * 0.115 * Hh, shY, fx - sgn * 0.085 * Hh, hipY), sd=3)
        S(pline(fx + sgn * 0.125 * Hh, shY + 0.01 * Hh, fx + sgn * 0.095 * Hh, hipY), sd=4)
        S(pline(fx - sgn * 0.115 * Hh, shY, fx + sgn * 0.125 * Hh, shY + 0.01 * Hh), sd=5)
        S(pline(fx - sgn * 0.085 * Hh, hipY, fx + sgn * 0.095 * Hh, hipY), sd=23)
        # hips — the body's bottom
        hipBase = hipY + 0.07 * Hh
        if ph is not None:
            # two-segment legs with knees; front-swinging foot lifts
            for leg, (poff, sdd) in enumerate(((0.0, 1), (math.pi, 2))):
                s = math.sin(ph * 2 * math.pi + poff)
                hipP = (fx - sgn * 0.03 * Hh + sgn * leg * 0.06 * Hh, hipBase)
                footX = fx + sgn * s * 0.17 * Hh
                lift = max(0.0, s) * 0.055 * Hh
                footY = fy - lift
                bend = 0.045 * Hh * (0.35 + 0.65 * abs(s))
                knee = ((hipP[0] + footX) / 2 + sgn * bend, (hipP[1] + footY) / 2 + 0.01 * Hh)
                S([hipP, knee], sd=sdd); S([knee, (footX, footY)], sd=sdd + 14)
                d.ellipse((footX - 11, footY - 7, footX + 15, footY + 8), fill=(*INK, alpha))
        else:
            for leg, dx in ((0, -0.055), (1, 0.055)):
                hipP = (fx + dx * Hh, hipBase)
                knee = (fx + dx * 1.25 * Hh, (hipBase + fy) / 2 + 0.01 * Hh)
                foot = (fx + dx * 1.5 * Hh, fy)
                S([hipP, knee], sd=1 + leg); S([knee, foot], sd=15 + leg)
                d.ellipse((foot[0] - 11, fy - 7, foot[0] + 15, fy + 8), fill=(*INK, alpha))
    # arms / props (anchored to shoulder line shY)
    if box:
        bx = fx + sgn * 0.05 * Hh
        byy = shY + 0.12 * Hh
        S(pline(fx - sgn * 0.10 * Hh, shY + 0.10 * Hh, fx + sgn * 0.17 * Hh, shY + 0.20 * Hh), sd=6)
        x2 = bx + sgn * 0.30 * Hh
        d.rectangle((min(bx, x2), byy, max(bx, x2), byy + 0.20 * Hh), fill=(214, 152, 66, 200))
        blotch(d, min(bx, x2), byy, max(bx, x2), byy + 0.20 * Hh, boil, n=3, color=(180, 120, 48), seed=seed + 40, amax=40)
        stroke(d, [(bx, byy), (x2, byy), (x2, byy + 0.20 * Hh), (bx, byy + 0.20 * Hh), (bx, byy)],
               width=5, jitter=2.0, seed=seed + 7, boil=boil, alpha=alpha)
    elif phone:
        S(pline(fx - sgn * 0.10 * Hh, shY + 0.14 * Hh, fx + sgn * 0.13 * Hh, shY + 0.24 * Hh), sd=6)
        px = fx + sgn * 0.13 * Hh; py = shY + 0.26 * Hh
        x1 = px + sgn * 0.11 * Hh
        d.rounded_rectangle((min(px, x1), py - 0.09 * Hh, max(px, x1), py + 0.09 * Hh), radius=8, fill=(*SPR, 225))
        stroke(d, [(px, py - 0.09 * Hh), (x1, py - 0.09 * Hh), (x1, py + 0.09 * Hh),
                   (px, py + 0.09 * Hh), (px, py - 0.09 * Hh)], width=4, jitter=1.6, seed=seed + 7, boil=boil, alpha=alpha)
    else:
        sw = math.sin((ph or 0) * 2 * math.pi) * 0.09 * Hh if ph is not None else 0.0
        for arm, (side, sdd) in enumerate(((-1, 6), (1, 16))):
            sh = (fx + sgn * side * 0.115 * Hh, shY + 0.02 * Hh)
            elb = (sh[0] + sgn * side * 0.02 * Hh + side * sw * 0.5, shY + 0.18 * Hh)
            hand = (elb[0] + side * sw, shY + 0.33 * Hh)
            S([sh, elb], sd=sdd); S([elb, hand], sd=sdd + 1)
    # head (rides the bob)
    hx = fx + sgn * 0.02 * Hh; hy = shY - hr - 2
    stroke(d, circle_pts(hx, hy, hr, 14), width=6, jitter=2.4, seed=seed + 8, boil=boil, alpha=alpha)
    r = random.Random(seed + boil)
    scr = [(hx - sgn * hr * 0.85 + sgn * i * hr * 0.15, hy - hr * 0.62 + r.uniform(-1, 1) * hr * 0.22) for i in range(12)]
    stroke(d, scr, width=5, jitter=1.8, passes=1, seed=seed + 9, boil=boil, alpha=alpha)
    ex = hx + sgn * hr * 0.34
    d.ellipse((ex, hy - hr * 0.10, ex + 7, hy - hr * 0.10 + 7), fill=(*INK, 255))
    stroke(d, [(hx + sgn * hr * 0.26, hy + hr * 0.44), (hx + sgn * hr * 0.52, hy + hr * 0.52), (hx + sgn * hr * 0.74, hy + hr * 0.42)],
           width=3, jitter=1.1, passes=1, seed=seed + 10, boil=boil, alpha=alpha)

# ---------------- UI cut-ins ----------------

def ui_frame(src: Image.Image, t: float, boil: int, zoom0=1.0, zoom1=1.06, p=0.0,
             rect=None) -> Image.Image:
    """Real capture inside a wobbly hand-drawn frame on paper."""
    img = PAPER.copy()
    d = ImageDraw.Draw(img, "RGBA")
    fw, fh = 1560, 878
    fx0, fy0 = (WIDTH - fw) // 2, (HEIGHT - fh) // 2 - 14
    if rect:
        x, y, w = rect
        z = zoom0 + (zoom1 - zoom0) * p
        w = w / z
        h = w * fh / fw
        x = max(0, min(src.width - w, x + (src.width * 0 + 0)))
        y = max(0, min(src.height - h, y))
        crop = src.crop((int(x), int(y), int(x + w), int(y + h)))
    else:
        z = zoom0 + (zoom1 - zoom0) * p
        w = src.width / z; h = w * fh / fw
        x = (src.width - w) / 2; y = min(src.height - h, (src.height - h) / 2)
        crop = src.crop((int(x), int(y), int(x + w), int(y + h)))
    shot = crop.resize((fw, fh), Image.Resampling.BILINEAR)
    # soft wash shadow behind
    sh = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle((fx0 + 18, fy0 + 26, fx0 + fw + 26, fy0 + fh + 34), fill=(90, 90, 80, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    img.paste(sh, (0, 0), sh)
    img.paste(shot, (fx0, fy0))
    # hand-drawn border, double stroke
    pts = [(fx0, fy0), (fx0 + fw, fy0), (fx0 + fw, fy0 + fh), (fx0, fy0 + fh), (fx0, fy0)]
    stroke(d, pts, width=7, jitter=3.2, seed=901, boil=boil)
    stroke(d, [(px + 6, py + 6) for px, py in pts], width=3, jitter=2.4, passes=1, seed=902, boil=boil, alpha=120)
    return img

def _seg_frame(idx: int) -> Image.Image:
    return Image.open(SEGDIR / f"reroute-{idx + 1:03d}.png").convert("RGB")

CAP2 = ROOT / "captures2" / "frames"
N_CAP2 = 679
_cap_cache: dict = {}

def cap_frame(idx: int) -> Image.Image:
    idx = max(1, min(N_CAP2, idx))
    if idx not in _cap_cache:
        if len(_cap_cache) > 40: _cap_cache.clear()
        _cap_cache[idx] = Image.open(CAP2 / f"cap-{idx:04d}.png").convert("RGB")
    return _cap_cache[idx]

def _piecewise_src(t, spans):
    """spans: list of (film_a, film_b, src_a, src_b) in seconds -> src second."""
    for fa, fb, sa, sb in spans:
        if t <= fb:
            u = seg_(t, fa, fb)
            return sa + (sb - sa) * u
    return spans[-1][3]

# ---------------- scenes ----------------

def sc_gates(t: float) -> Image.Image:
    b = boil_of(t)
    horizon = HEIGHT * 0.72
    sun_up = ease(seg_(t, 0, 6.0)) * 26
    img = wash_layer("gates", b, [
        (lambda d, w, h: d.ellipse((w * 0.55, h * 0.72 - h * 0.34, w * 1.05, h * 0.72 + h * 0.20), fill=255), AMB_SOFT, 0.42, 70),
        (lambda d, w, h: d.ellipse((w * 0.72, h * 0.72 - w * 0.055 - sun_up / 2, w * 0.80, h * 0.72 + w * 0.025 - sun_up / 2), fill=255), AMB, 0.85, 12),
        (lambda d, w, h: d.rectangle((0, h * 0.16, w * 0.285, h * 0.72), fill=255), WALL, 0.66, 10),
        (lambda d, w, h: d.rectangle((w * 0.365, h * 0.16, w * 0.38, h * 0.72), fill=255), WALL, 0.66, 10),
        (lambda d, w, h: d.rectangle((0, h * 0.16, w * 0.38, h * 0.34), fill=255), WALL, 0.5, 12),
        (lambda d, w, h: d.polygon([(w * 0.365, h * 0.40), (w * 0.55, h * 0.72), (w * 0.365, h * 0.72)], fill=255), (240, 196, 110), 0.45, 22),
        (lambda d, w, h: d.rectangle((0, h * 0.72, w, h), fill=255), GROUND, 0.5, 34),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    DOOR_L, DOOR_R, WALL_R = WIDTH * 0.285, WIDTH * 0.365, WIDTH * 0.38
    stroke(d, pline(0, HEIGHT * 0.17, WALL_R, HEIGHT * 0.17), width=7, jitter=3.5, seed=31, boil=b)
    stroke(d, pline(WALL_R, HEIGHT * 0.17, WALL_R, horizon), width=7, jitter=3.5, seed=32, boil=b)
    # razor wire coils along the wall top
    for i in range(11):
        wx = WIDTH * 0.017 + i * WIDTH * 0.036
        stroke(d, circle_pts(wx, HEIGHT * 0.155, 22, 10), width=3, jitter=1.8, passes=1, seed=200 + i, boil=b, alpha=190)
    # guard tower (left)
    stroke(d, pline(WIDTH * 0.055, HEIGHT * 0.17, WIDTH * 0.055, HEIGHT * 0.055), width=5, jitter=2.6, seed=212, boil=b)
    stroke(d, pline(WIDTH * 0.115, HEIGHT * 0.17, WIDTH * 0.115, HEIGHT * 0.055), width=5, jitter=2.6, seed=213, boil=b)
    stroke(d, [(WIDTH * 0.035, HEIGHT * 0.055), (WIDTH * 0.135, HEIGHT * 0.055), (WIDTH * 0.135, HEIGHT * 0.115),
               (WIDTH * 0.035, HEIGHT * 0.115), (WIDTH * 0.035, HEIGHT * 0.055)], width=5, jitter=2.4, seed=214, boil=b)
    stroke(d, [(WIDTH * 0.03, HEIGHT * 0.055), (WIDTH * 0.085, HEIGHT * 0.018), (WIDTH * 0.14, HEIGHT * 0.055)],
           width=5, jitter=2.4, seed=215, boil=b)
    d.rectangle((WIDTH * 0.062, HEIGHT * 0.068, WIDTH * 0.088, HEIGHT * 0.102), fill=(238, 200, 116, 130))
    # small barred windows on the wall
    for i, wx in enumerate((0.10, 0.19)):
        x0, y0 = WIDTH * wx, HEIGHT * 0.26
        stroke(d, [(x0, y0), (x0 + 74, y0), (x0 + 74, y0 + 56), (x0, y0 + 56), (x0, y0)], width=4, jitter=2.0, seed=220 + i, boil=b, alpha=180)
        for j in range(1, 3):
            stroke(d, pline(x0 + 74 * j / 3, y0, x0 + 74 * j / 3, y0 + 56), width=3, jitter=1.4, passes=1, seed=225 + i * 3 + j, boil=b, alpha=160)
    stroke(d, pline(DOOR_L, HEIGHT * 0.40, DOOR_L, horizon), width=5, jitter=3, seed=33, boil=b)
    stroke(d, pline(DOOR_R, HEIGHT * 0.40, DOOR_R, horizon), width=5, jitter=3, seed=34, boil=b)
    stroke(d, pline(DOOR_L, HEIGHT * 0.40, DOOR_R, HEIGHT * 0.40), width=5, jitter=3, seed=35, boil=b)
    sign(d, WIDTH * 0.135, HEIGHT * 0.40, "CORRECTIONAL FACILITY", b, size=18, seed=230)
    # texture: block hatching on the wall face, tonal blotches on the ground
    hatch(d, WIDTH * 0.01, HEIGHT * 0.34, WIDTH * 0.27, HEIGHT * 0.70, b, spacing=34, seed=240, alpha=20)
    blotch(d, 0, horizon, WIDTH, HEIGHT, b, n=7, color=(196, 186, 162), seed=245, amax=22)
    # perimeter fence receding to the left of the wall base
    for i in range(4):
        px_ = WIDTH * 0.395 + i * 26
        stroke(d, pline(px_, horizon - 46 + i * 8, px_, horizon), width=3, jitter=1.6, passes=1, seed=250 + i, boil=b, alpha=120)
    stroke(d, pline(WIDTH * 0.395, horizon - 46, WIDTH * 0.395 + 78, horizon - 22), width=3, jitter=1.6, passes=1, seed=254, boil=b, alpha=110)
    stroke(d, pline(0, horizon, WIDTH, horizon), width=6, jitter=3, seed=51, boil=b)
    for gx_, gsd in ((0.62, 270), (0.79, 271), (0.905, 272)):
        for k in range(3):
            stroke(d, [(WIDTH * gx_ + k * 7 - 7, horizon + 6), (WIDTH * gx_ + k * 9 - 12, horizon - 16 - k * 4)],
                   width=2, jitter=1.4, passes=1, seed=gsd + k, boil=b, alpha=110)
    stroke(d, pline(WIDTH * 0.955, horizon, WIDTH * 0.955, HEIGHT * 0.30), width=3, jitter=1.8, passes=1, seed=273, boil=b, alpha=90)
    stroke(d, pline(WIDTH * 0.925, HEIGHT * 0.33, WIDTH * 0.985, HEIGHT * 0.33), width=3, jitter=1.6, passes=1, seed=274, boil=b, alpha=90)
    # birds drift
    for i, (bx, by) in enumerate([(0.60, 0.22), (0.655, 0.185), (0.70, 0.24)]):
        bx = bx * WIDTH + t * 6; by = by * HEIGHT + math.sin(t * 1.3 + i) * 6
        stroke(d, [(bx - 16, by), (bx, by - 9), (bx + 16, by)], width=3, jitter=1.5, passes=1, seed=80 + i, boil=b, alpha=170)
    # Marcus walks out — the route line begins under his feet
    prog = ease(seg_(t, 0.6, 5.8))
    fx = WIDTH * (0.42 + 0.13 * prog)
    route_path(d, [(WIDTH * 0.345, horizon + 26), (fx, horizon + 26)], seg_(t, 1.0, 5.8), b, seed=260, alpha=120)
    wp = (t * 1.1) % 1.0
    d.ellipse((fx - 90, horizon - 8, fx + 60, horizon + 12), fill=(*SHADOW, 70))
    draw_marcus(d, fx, horizon, HEIGHT * 0.30, b, walk_phase=wp, box=True)
    return img

def sc_van(t: float) -> Image.Image:
    b = boil_of(t)
    horizon = HEIGHT * 0.70
    img = wash_layer("van", b, [
        (lambda d, w, h: d.rectangle((0, 0, w, h * 0.55), fill=255), (238, 205, 150), 0.5, 60),
        (lambda d, w, h: d.rectangle((0, h * 0.55, w, h * 0.70), fill=255), (240, 200, 116), 0.34, 40),
        (lambda d, w, h: d.rectangle((0, h * 0.70, w, h), fill=255), GROUND, 0.62, 34),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    stroke(d, pline(0, horizon, WIDTH, horizon), width=6, jitter=3, seed=151, boil=b)
    # skyline drifting left (parallax)
    off = -(t * 90) % (WIDTH * 1.4)
    r = random.Random(5)
    x = -off
    for i in range(16):
        bw = 90 + r.random() * 150
        bh = 60 + r.random() * 210
        if -200 < x < WIDTH + 100:
            stroke(d, [(x, horizon - 4), (x, horizon - bh), (x + bw, horizon - bh), (x + bw, horizon - 4)],
                   width=4, jitter=2.6, seed=160 + i, boil=b, alpha=150)
            if i % 2 == 0:
                d.rectangle((x + bw * 0.25, horizon - bh * 0.6, x + bw * 0.25 + 12, horizon - bh * 0.6 + 16),
                            fill=(238, 200, 116, 90))
        x += bw + 40
    # street furniture scrolls with the world (it is not on the bus)
    loop_w = WIDTH * 1.4
    drift = (t * 90) % loop_w
    def wx(base):
        return (base * WIDTH - drift) % loop_w - 160
    sx = wx(0.55)
    if -140 < sx < WIDTH + 140:
        stroke(d, pline(sx, horizon, sx, horizon - 190), width=4, jitter=1.8, passes=1, seed=196, boil=b, alpha=150)
        sign(d, sx, horizon - 214, "BUS", b, size=16, seed=197, pad=10)
        stroke(d, pline(sx + 44, horizon - 44, sx + 118, horizon - 44), width=4, jitter=1.8, passes=1, seed=198, boil=b, alpha=150)
        for bo in (56, 106):
            stroke(d, pline(sx + bo, horizon - 44, sx + bo, horizon), width=3, jitter=1.6, passes=1, seed=199, boil=b, alpha=150)
    lx = wx(1.18)
    if -140 < lx < WIDTH + 140:
        stroke(d, pline(lx, horizon, lx, HEIGHT * 0.24), width=4, jitter=1.8, passes=1, seed=200, boil=b, alpha=140)
        stroke(d, [(lx, HEIGHT * 0.24), (lx - 36, HEIGHT * 0.26)], width=4, jitter=1.6, passes=1, seed=201, boil=b, alpha=140)
        d.ellipse((lx - 38 - 11, HEIGHT * 0.262 - 11, lx - 38 + 11, HEIGHT * 0.262 + 11), fill=(238, 200, 116, 150))
    for cx_, cy_, cw_ in ((0.30, 0.14, 90), (0.55, 0.10, 120), (0.76, 0.17, 70)):
        stroke(d, [(WIDTH * cx_ - cw_, HEIGHT * cy_), (WIDTH * cx_ + cw_, HEIGHT * cy_)], width=5, jitter=2.6, passes=1, seed=202 + int(cx_ * 100), boil=b, alpha=60)
    # CITY BUS: long body, window row, door, flat front facing travel (right)
    vx = WIDTH * 0.22; vy = horizon - 4 + math.sin(t * 9) * 3
    bw, bh = 780, 250
    d.rectangle((vx, vy - 20 - bh, vx + bw, vy - 20), fill=(216, 226, 218, 215))
    stroke(d, [(vx, vy - 20), (vx + bw, vy - 20), (vx + bw, vy - 20 - bh), (vx, vy - 20 - bh), (vx, vy - 20)],
           width=6, jitter=2.6, seed=170, boil=b)
    top = vy - 20 - bh
    # windshield at the front (right = direction of travel)
    stroke(d, [(vx + bw - 14, top + 20), (vx + bw - 14, top + 105), (vx + bw - 80, top + 105),
               (vx + bw - 80, top + 20), (vx + bw - 14, top + 20)],
           width=4, jitter=1.8, passes=1, seed=171, boil=b, alpha=170)
    # door behind the front wheel
    stroke(d, [(vx + bw - 100, vy - 24), (vx + bw - 100, top + 70), (vx + bw - 172, top + 70),
               (vx + bw - 172, vy - 24)], width=4, jitter=1.8, passes=1, seed=178, boil=b, alpha=170)
    # passenger windows, Marcus in the second
    for i in range(4):
        wx0 = vx + 44 + i * 138
        d.rectangle((wx0 + 3, top + 37, wx0 + 103, top + 113), fill=(238, 216, 168, 60))
        stroke(d, [(wx0, top + 34), (wx0 + 106, top + 34), (wx0 + 106, top + 116),
                   (wx0, top + 116), (wx0, top + 34)], width=4, jitter=1.8, passes=1,
               seed=180 + i, boil=b, alpha=160)
    bobb = math.sin(t * 9 + 1) * 2
    d.ellipse((vx + 44 + 138 + 32, top + 56 + bobb, vx + 44 + 138 + 76, top + 100 + bobb), fill=(*INK, 140))
    # destination strip mounted on the body, front top
    sign(d, vx + bw - 215, top + 20, "12  DOWNTOWN", b, size=15, seed=195, pad=12)
    # wheels with rotating spokes
    for i, wx in enumerate((vx + 140, vx + bw - 150)):
        stroke(d, circle_pts(wx, vy - 10, 38, 12), width=5, jitter=2.2, seed=172 + i, boil=b)
        ang = t * 10 + i
        stroke(d, [(wx - 26 * math.cos(ang), vy - 10 - 26 * math.sin(ang)), (wx + 26 * math.cos(ang), vy - 10 + 26 * math.sin(ang))],
               width=3, jitter=1.4, passes=1, seed=175 + i, boil=b, alpha=170)
    return img

TANGLE_WORDS = ["STATE ID", "JOB", "ADDRESS", "BANK", "SUPERVISION", "HOUSING"]
TANGLE_POS = [(560, 330), (1370, 300), (420, 640), (1500, 620), (960, 220), (1210, 760)]
TANGLE_EDGES = [(0, 1), (2, 0), (1, 2), (0, 3), (4, 1), (2, 5), (1, 3), (4, 5), (5, 3)]

def sc_tangle(t: float) -> Image.Image:
    b = boil_of(t)
    img = wash_layer("tangle", b, [
        (lambda d, w, h: d.ellipse((w * 0.2, h * 0.15, w * 0.8, h * 0.85), fill=255), (232, 222, 196), 0.35, 70),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    t0 = 10.3
    T_WARN, T_BREAK = 14.0, 15.1   # "Nobody hands you the order" -> it all comes apart
    fmono = ImageFont.truetype(GMONO, 30)
    warn = seg_(t, T_WARN, T_BREAK)
    for i, e in enumerate(TANGLE_EDGES):
        p = ease(seg_(t, t0 + 0.9 + i * 0.35, t0 + 1.9 + i * 0.35))
        if p <= 0: continue
        snap = seg_(t, T_BREAK + i * 0.06, T_BREAK + 0.55 + i * 0.06)
        a_edge = 150 * p * (1 - snap)
        if a_edge <= 3: continue
        col = INK
        if 0 < warn < 1 and (i % 2 == int(t * 10) % 2): col = (196, 120, 40)
        p0, p2 = TANGLE_POS[e[0]], TANGLE_POS[e[1]]
        r = random.Random(i)
        ctrl = ((p0[0] + p2[0]) / 2 + r.uniform(-180, 180), (p0[1] + p2[1]) / 2 + r.uniform(-150, 150))
        sagy = snap * 260
        n = max(2, int(20 * p))
        pts = []
        for k in range(n + 1):
            u = k / 20
            mt = 1 - u
            sag = math.sin(u * math.pi) * sagy
            pts.append((mt * mt * p0[0] + 2 * mt * u * ctrl[0] + u * u * p2[0],
                        mt * mt * p0[1] + 2 * mt * u * ctrl[1] + u * u * p2[1] + sag))
        jit = 2.2 + warn * 3.5
        stroke(d, pts, width=4, jitter=jit, passes=1, seed=300 + i, boil=b, color=col, alpha=int(a_edge))
    for i, wtxt in enumerate(TANGLE_WORDS):
        p = ease(seg_(t, t0 + i * 0.45, t0 + 0.8 + i * 0.45))
        if p <= 0: continue
        fall = seg_(t, T_BREAK + 0.15 + (i % 4) * 0.12, T_BREAK + 1.9 + (i % 4) * 0.12)
        dy = (fall ** 2) * HEIGHT * 1.05
        drift = math.sin(i * 2.1) * 90 * fall
        a = int(235 * p * (1 - seg_(t, T_BREAK + 1.0 + (i % 4) * 0.12, T_BREAK + 1.9 + (i % 4) * 0.12)))
        if a <= 3: continue
        cx, cy = TANGLE_POS[i][0] + drift, TANGLE_POS[i][1] + dy
        jx = jy = 0
        if 0 < warn < 1:
            jx = math.sin(t * 47 + i * 3) * 6 * warn; jy = math.cos(t * 41 + i) * 6 * warn
        tw = d.textlength(" ".join(wtxt), font=fmono)
        w2, h2 = tw + 50, 56
        pill_fill = (222, 236, 230, min(240, a)) if i == 0 else (*PAPER_BG, min(240, a))
        d.rounded_rectangle((cx - w2 / 2 + jx, cy - h2 / 2 + jy, cx + w2 / 2 + jx, cy + h2 / 2 + jy),
                            radius=8, fill=pill_fill)
        stroke(d, [(cx - w2 / 2 + jx, cy - h2 / 2 + jy), (cx + w2 / 2 + jx, cy - h2 / 2 + jy),
                   (cx + w2 / 2 + jx, cy + h2 / 2 + jy), (cx - w2 / 2 + jx, cy + h2 / 2 + jy),
                   (cx - w2 / 2 + jx, cy - h2 / 2 + jy)], width=4, jitter=2.4, seed=340 + i, boil=b, alpha=a)
        d.text((cx - tw / 2 + jx, cy - 17 + jy), " ".join(wtxt), font=fmono, fill=(*INK, a))
    # debris settles at the bottom — the aftermath, not a blank page
    deb = seg_(t, T_BREAK + 1.2, T_BREAK + 2.0)
    if deb > 0:
        for i in range(6):
            dxx = WIDTH * (0.30 + i * 0.075) + (i % 3) * 18
            dyy = HEIGHT * 0.885 + (i % 2) * 14
            stroke(d, pline(dxx, dyy, dxx + 46 - (i % 3) * 9, dyy + 3), width=3, jitter=1.8, passes=1,
                   seed=360 + i, boil=b, alpha=int(120 * deb))
    return img

def sc_bedroom(t: float) -> Image.Image:
    b = boil_of(t)
    glow = 0.5 + 0.5 * math.sin(t * 2.2)
    img = wash_layer("bedroom", b, [
        (lambda d, w, h: d.rectangle((0, 0, w, h), fill=255), (222, 210, 186), 0.35, 60),
        (lambda d, w, h: d.rectangle((w * 0.10, h * 0.20, w * 0.42, h * 0.62), fill=255), (200, 196, 176), 0.4, 30),
        (lambda d, w, h: d.ellipse((w * 0.52, h * 0.38, w * 0.72, h * 0.62), fill=255), (168, 208, 196), 0.30 + glow * 0.12, 40),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    horizon = HEIGHT * 0.74
    # baseboard + wall texture
    stroke(d, pline(0, horizon - 26, WIDTH, horizon - 26), width=3, jitter=1.8, passes=1, seed=399, boil=b, alpha=90)
    hatch(d, WIDTH * 0.02, HEIGHT * 0.10, WIDTH * 0.11, horizon - 30, b, spacing=40, seed=398, alpha=16)
    # window with curtains
    wx0, wy0, wx1, wy1 = WIDTH * 0.12, HEIGHT * 0.20, WIDTH * 0.38, HEIGHT * 0.58
    stroke(d, [(wx0, wy0), (wx1, wy0), (wx1, wy1), (wx0, wy1), (wx0, wy0)], width=5, jitter=2.8, seed=401, boil=b)
    stroke(d, pline((wx0 + wx1) / 2, wy0, (wx0 + wx1) / 2, wy1), width=4, jitter=2.2, passes=1, seed=402, boil=b, alpha=150)
    stroke(d, pline(wx0, (wy0 + wy1) / 2, wx1, (wy0 + wy1) / 2), width=4, jitter=2.2, passes=1, seed=403, boil=b, alpha=150)
    for cs, sd_ in ((wx0 - 26, 407), (wx1 + 26, 408)):
        stroke(d, [(cs, wy0 - 22), (cs + 10, (wy0 + wy1) / 2), (cs, wy1 + 26)], width=4, jitter=2.6, passes=1, seed=sd_, boil=b, alpha=140)
    stroke(d, pline(wx0 - 34, wy0 - 24, wx1 + 34, wy0 - 24), width=4, jitter=2.0, passes=1, seed=409, boil=b, alpha=160)
    # the world outside: morning sky and a leafy branch
    d.rectangle((wx0 + 4, wy0 + 4, wx1 - 4, wy1 - 4), fill=(238, 220, 176, 60))
    stroke(d, [(wx0 + 4, wy0 + 66), (wx0 + 90, wy0 + 96), (wx0 + 180, wy0 + 88)], width=4, jitter=2.2, passes=1, seed=422, boil=b, alpha=150)
    for lf in range(5):
        lx_ = wx0 + 40 + lf * 34
        stroke(d, circle_pts(lx_, wy0 + 74 + (lf % 2) * 16, 13, 8), width=3, jitter=1.6, passes=1, seed=423 + lf, boil=b, alpha=130)
    stroke(d, [(wx1 - 70, wy0 + 40), (wx1 - 58, wy0 + 32), (wx1 - 46, wy0 + 40)], width=2, jitter=1.2, passes=1, seed=428, boil=b, alpha=120)
    # bed: frame, mattress, blanket wash, pillow, legs
    bx0, bx1 = WIDTH * 0.46, WIDTH * 0.88
    btop = horizon - 96
    d.rectangle((bx0, btop, bx1, horizon - 6), fill=(208, 196, 168, 120))
    blotch(d, bx0, btop, bx1, horizon - 6, b, n=4, color=(184, 168, 136), seed=411, amax=30)
    stroke(d, [(bx0, horizon - 6), (bx0, btop), (bx1, btop), (bx1, horizon - 6)], width=5, jitter=2.8, seed=404, boil=b)
    stroke(d, pline(bx0, btop, bx1, btop), width=6, jitter=2.6, seed=405, boil=b)
    stroke(d, pline(bx0 + 20, btop + 34, bx1 - 20, btop + 30), width=3, jitter=2.2, passes=1, seed=412, boil=b, alpha=110)
    d.rounded_rectangle((bx1 - 150, btop - 26, bx1 - 40, btop + 6), radius=12, fill=(*PAPER_BG, 235))
    stroke(d, [(bx1 - 150, btop - 26), (bx1 - 40, btop - 26), (bx1 - 40, btop + 6), (bx1 - 150, btop + 6), (bx1 - 150, btop - 26)],
           width=4, jitter=2.0, seed=413, boil=b, alpha=190)
    for lx in (bx0 + 14, bx1 - 14):
        stroke(d, pline(lx, horizon - 6, lx, horizon), width=5, jitter=1.8, passes=1, seed=414, boil=b)
    # nightstand + lamp
    ns0, ns1 = WIDTH * 0.335, WIDTH * 0.435
    stroke(d, [(ns0, horizon), (ns0, horizon - 64), (ns1, horizon - 64), (ns1, horizon)], width=4, jitter=2.4, seed=415, boil=b, alpha=190)
    stroke(d, pline((ns0 + ns1) / 2, horizon - 64, (ns0 + ns1) / 2, horizon - 96), width=4, jitter=1.8, passes=1, seed=416, boil=b, alpha=190)
    d.polygon([((ns0 + ns1) / 2 - 30, horizon - 96), ((ns0 + ns1) / 2 + 30, horizon - 96), ((ns0 + ns1) / 2 + 18, horizon - 128),
               ((ns0 + ns1) / 2 - 18, horizon - 128)], fill=(238, 200, 116, 110))
    d.ellipse(((ns0 + ns1) / 2 - 52, horizon - 110, (ns0 + ns1) / 2 + 52, horizon - 58), fill=(238, 216, 168, 36))
    stroke(d, [((ns0 + ns1) / 2 - 30, horizon - 96), ((ns0 + ns1) / 2 + 30, horizon - 96), ((ns0 + ns1) / 2 + 18, horizon - 128),
               ((ns0 + ns1) / 2 - 18, horizon - 128), ((ns0 + ns1) / 2 - 30, horizon - 96)], width=4, jitter=2.0, seed=417, boil=b, alpha=190)
    stroke(d, [(WIDTH * 0.435, HEIGHT * 0.24), (WIDTH * 0.515, HEIGHT * 0.24), (WIDTH * 0.515, HEIGHT * 0.36),
               (WIDTH * 0.435, HEIGHT * 0.36), (WIDTH * 0.435, HEIGHT * 0.24)], width=4, jitter=2.0, passes=1, seed=419, boil=b, alpha=150)
    d.rectangle((WIDTH * 0.4385, HEIGHT * 0.2435, WIDTH * 0.5115, HEIGHT * 0.3565), fill=(214, 206, 176, 90))
    d.ellipse((WIDTH * 0.487, HEIGHT * 0.256, WIDTH * 0.503, HEIGHT * 0.284), fill=(226, 178, 92, 190))
    stroke(d, [(WIDTH * 0.452, HEIGHT * 0.315), (WIDTH * 0.472, HEIGHT * 0.285), (WIDTH * 0.497, HEIGHT * 0.32)],
           width=3, jitter=1.4, passes=1, seed=420, boil=b, color=(88, 124, 106), alpha=190)
    stroke(d, [(WIDTH * 0.44, HEIGHT * 0.332), (WIDTH * 0.462, HEIGHT * 0.308), (WIDTH * 0.482, HEIGHT * 0.334)],
           width=3, jitter=1.4, passes=1, seed=429, boil=b, color=(88, 124, 106), alpha=160)
    for bk in range(3):
        stroke(d, pline(ns0 + 16 + bk * 12, horizon - 64, ns0 + 16 + bk * 12, horizon - 86 - bk * 3),
               width=4, jitter=1.2, passes=1, seed=421 + bk, boil=b, alpha=160)
    # rug
    d.ellipse((WIDTH * 0.52, horizon + 8, WIDTH * 0.78, horizon + 46), fill=(198, 186, 158, 60))
    stroke(d, pline(0, horizon, WIDTH, horizon), width=6, jitter=3, seed=406, boil=b)
    # marcus seated ON the bed edge, feet to the floor, phone glowing
    draw_marcus(d, WIDTH * 0.60, btop, HEIGHT * 0.26, b, sit=True, box=False, phone=True)
    return img

def sc_dmv(t: float) -> Image.Image:
    b = boil_of(t)
    img = wash_layer("dmv", b, [
        (lambda d, w, h: d.rectangle((0, 0, w, h * 0.45), fill=255), (222, 216, 196), 0.3, 60),
        (lambda d, w, h: d.rectangle((w * 0.1, h * 0.52, w * 0.9, h * 0.68), fill=255), (188, 178, 152), 0.45, 24),
        (lambda d, w, h: d.ellipse((w * 0.42, h * 0.30, w * 0.60, h * 0.55), fill=255), AMB_SOFT, 0.30, 40),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    horizon = HEIGHT * 0.82
    counter_y = HEIGHT * 0.58
    # a real office: floor tiles, ceiling lights, clock, waiting chairs + one waiter
    for i in range(5):
        ty = horizon + 14 + i * 3
        stroke(d, pline(WIDTH * (0.06 + i * 0.05), ty, WIDTH * (0.94 - i * 0.05), ty), width=2,
               jitter=1.4, passes=1, seed=570 + i, boil=b, alpha=40)
    d.rectangle((0, HEIGHT * 0.315, WIDTH, HEIGHT * 0.345), fill=(206, 220, 212, 55))
    for lx in (0.30, 0.62):
        d.polygon([(WIDTH * lx - 60, HEIGHT * 0.08), (WIDTH * lx + 60, HEIGHT * 0.08),
                   (WIDTH * lx + 130, HEIGHT * 0.36), (WIDTH * lx - 130, HEIGHT * 0.36)], fill=(238, 216, 160, 22))
        stroke(d, [(WIDTH * lx - 70, HEIGHT * 0.075), (WIDTH * lx + 70, HEIGHT * 0.075)], width=5, jitter=1.8, passes=1, seed=575, boil=b, alpha=130)
        stroke(d, pline(WIDTH * lx, HEIGHT * 0.02, WIDTH * lx, HEIGHT * 0.07), width=3, jitter=1.4, passes=1, seed=576, boil=b, alpha=110)
    stroke(d, circle_pts(WIDTH * 0.12, HEIGHT * 0.16, 34, 14), width=4, jitter=1.8, seed=577, boil=b, alpha=170)
    stroke(d, pline(WIDTH * 0.12, HEIGHT * 0.16, WIDTH * 0.12, HEIGHT * 0.135), width=3, jitter=1.0, passes=1, seed=578, boil=b, alpha=170)
    stroke(d, pline(WIDTH * 0.12, HEIGHT * 0.16, WIDTH * 0.135, HEIGHT * 0.165), width=3, jitter=1.0, passes=1, seed=579, boil=b, alpha=170)
    for ci in range(3):
        cx0 = WIDTH * (0.065 + ci * 0.062)
        stroke(d, [(cx0, horizon - 8), (cx0, horizon - 74), (cx0 + 66, horizon - 74), (cx0 + 66, horizon - 8)],
               width=4, jitter=2.2, passes=1, seed=580 + ci, boil=b, alpha=150)
        stroke(d, pline(cx0, horizon - 74, cx0, horizon - 128), width=4, jitter=2.0, passes=1, seed=584 + ci, boil=b, alpha=150)
    draw_marcus(d, WIDTH * 0.128, horizon - 74, HEIGHT * 0.20, b, sit=True, box=False, phone=False, seed=590, alpha=170)
    # queue stanchions with sagging rope
    for sx in (0.585, 0.70):
        stroke(d, pline(WIDTH * sx, horizon, WIDTH * sx, horizon - 108), width=4, jitter=1.8, passes=1, seed=595, boil=b, alpha=170)
        d.ellipse((WIDTH * sx - 9, horizon - 118, WIDTH * sx + 9, horizon - 100), fill=(*INK, 170))
    stroke(d, [(WIDTH * 0.585, horizon - 104), (WIDTH * 0.6425, horizon - 88), (WIDTH * 0.70, horizon - 104)],
           width=3, jitter=1.6, passes=1, seed=596, boil=b, alpha=150)
    # clerk first (will be occluded by the counter), standing behind it
    draw_marcus(d, WIDTH * 0.42, counter_y + HEIGHT * 0.10, HEIGHT * 0.24, b, walk_phase=None,
                box=False, phone=False, seed=520, flip=True, alpha=210)
    # counter box occludes clerk's legs
    d.rectangle((WIDTH * 0.28, counter_y, WIDTH * 0.56, horizon), fill=(*PAPER_BG, 255))
    d.rectangle((WIDTH * 0.28, counter_y, WIDTH * 0.56, horizon), fill=(188, 178, 152, 120))
    stroke(d, [(WIDTH * 0.28, counter_y), (WIDTH * 0.56, counter_y), (WIDTH * 0.56, horizon),
               (WIDTH * 0.28, horizon), (WIDTH * 0.28, counter_y)], width=6, jitter=2.8, seed=501, boil=b)
    # the ID card slides from clerk to Marcus above the counter
    p = ease(seg_(t, BEATS["04-stateid"]["start"] + 1.0, BEATS["04-stateid"]["start"] + 2.6))
    cardx = WIDTH * (0.40 + 0.17 * p)
    cardy = counter_y - HEIGHT * 0.085
    d.rounded_rectangle((cardx, cardy, cardx + 120, cardy + 76), radius=8, fill=(226, 178, 92, 235))
    stroke(d, [(cardx, cardy), (cardx + 120, cardy), (cardx + 120, cardy + 76), (cardx, cardy + 76), (cardx, cardy)],
           width=4, jitter=1.8, seed=530, boil=b)
    d.ellipse((cardx + 12, cardy + 14, cardx + 40, cardy + 42), fill=(*PAPER_BG, 230))
    stroke(d, pline(cardx + 52, cardy + 24, cardx + 104, cardy + 24), width=3, jitter=1.2, passes=1, seed=531, boil=b, alpha=160)
    stroke(d, pline(cardx + 52, cardy + 44, cardx + 96, cardy + 44), width=3, jitter=1.2, passes=1, seed=532, boil=b, alpha=160)
    # marcus in front of the counter, receiving
    draw_marcus(d, WIDTH * 0.66, horizon, HEIGHT * 0.28, b, walk_phase=None, box=False, phone=False, seed=540)
    stroke(d, pline(0, horizon, WIDTH, horizon), width=6, jitter=3, seed=503, boil=b)
    # signage: this is unmistakably the DMV
    sign(d, WIDTH * 0.42, HEIGHT * 0.20, "D M V", b, size=54, seed=560, pad=30)
    sign(d, WIDTH * 0.75, HEIGHT * 0.24, "NOW SERVING  B47", b, size=22, seed=561)
    return img

def sc_montage(t: float) -> Image.Image:
    """Three quick vignettes: work / keys / early-evening — montage runs 47.2-57.4."""
    if t < 51.6:
        return _mv_work(t, 47.2)
    return _mv_keys(t, 51.6)

def _mv_work(t, t0):
    b = boil_of(t)
    img = wash_layer("work", b, [
        (lambda d, w, h: d.rectangle((0, 0, w, h * 0.5), fill=255), (226, 214, 184), 0.32, 60),
        (lambda d, w, h: d.rectangle((w * 0.55, h * 0.28, w * 0.85, h * 0.72), fill=255), (196, 200, 184), 0.4, 26),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    horizon = HEIGHT * 0.78
    stroke(d, pline(0, horizon, WIDTH, horizon), width=6, jitter=3, seed=601, boil=b)
    # shelves with boxes
    for i in range(3):
        y = HEIGHT * (0.34 + i * 0.15)
        stroke(d, pline(WIDTH * 0.56, y, WIDTH * 0.84, y), width=5, jitter=2.6, seed=610 + i, boil=b)
        for j in range(3):
            x = WIDTH * (0.58 + j * 0.085)
            d.rectangle((x, y - 44, x + 64, y - 4), fill=(214, 152, 66, 170))
            stroke(d, [(x, y - 44), (x + 64, y - 44), (x + 64, y - 4), (x, y - 4), (x, y - 44)],
                   width=3, jitter=1.6, passes=1, seed=620 + i * 3 + j, boil=b, alpha=150)
    # a real warehouse: hanging lights, safety line, hand truck, far rack, floor texture
    for lx in (0.22, 0.46):
        d.polygon([(WIDTH * lx - 46, HEIGHT * 0.13), (WIDTH * lx + 46, HEIGHT * 0.13),
                   (WIDTH * lx + 116, HEIGHT * 0.46), (WIDTH * lx - 116, HEIGHT * 0.46)], fill=(238, 216, 160, 24))
        stroke(d, pline(WIDTH * lx, 0, WIDTH * lx, HEIGHT * 0.09), width=3, jitter=1.4, passes=1, seed=660, boil=b, alpha=110)
        stroke(d, [(WIDTH * lx - 46, HEIGHT * 0.09), (WIDTH * lx + 46, HEIGHT * 0.09), (WIDTH * lx + 30, HEIGHT * 0.13),
                   (WIDTH * lx - 30, HEIGHT * 0.13), (WIDTH * lx - 46, HEIGHT * 0.09)], width=4, jitter=1.8, passes=1, seed=661, boil=b, alpha=140)
    stroke(d, pline(WIDTH * 0.05, horizon + 34, WIDTH * 0.95, horizon + 30), width=4, jitter=2.0, passes=1, seed=662, boil=b, color=(196, 150, 70), alpha=120)
    for i in range(2):
        y = HEIGHT * (0.40 + i * 0.13)
        stroke(d, pline(WIDTH * 0.055, y, WIDTH * 0.185, y), width=3, jitter=1.8, passes=1, seed=664 + i, boil=b, alpha=100)
    hatch(d, 0, horizon, WIDTH, HEIGHT, b, spacing=44, seed=668, alpha=14)
    stroke(d, circle_pts(WIDTH * 0.405, HEIGHT * 0.115, 30, 14), width=4, jitter=1.6, seed=673, boil=b, alpha=160)
    stroke(d, pline(WIDTH * 0.405, HEIGHT * 0.115, WIDTH * 0.405, HEIGHT * 0.093), width=3, jitter=1.0, passes=1, seed=674, boil=b, alpha=160)
    d.rectangle((WIDTH * 0.083, HEIGHT * 0.145, WIDTH * 0.297, HEIGHT * 0.295), fill=(240, 216, 160, 70))
    stroke(d, [(WIDTH * 0.12, HEIGHT * 0.185), (WIDTH * 0.185, HEIGHT * 0.185)], width=4, jitter=2.2, passes=1, seed=676, boil=b, alpha=90)
    for tt in range(3):
        tx_ = WIDTH * (0.105 + tt * 0.062)
        for c_ in range(3):
            stroke(d, circle_pts(tx_ + c_ * 16 - 16, HEIGHT * 0.276 - (c_ % 2) * 12, 15, 8),
                   width=3, jitter=1.6, passes=1, seed=690 + tt * 3 + c_, boil=b, alpha=120)
    for pl in range(2):
        stroke(d, pline(WIDTH * 0.86, horizon - 12 - pl * 14, WIDTH * 0.965, horizon - 12 - pl * 14), width=4, jitter=1.6, passes=1, seed=675 + pl, boil=b, alpha=150)
    for pv in (0.865, 0.91, 0.955):
        stroke(d, pline(WIDTH * pv, horizon - 26, WIDTH * pv, horizon), width=3, jitter=1.4, passes=1, seed=678, boil=b, alpha=140)
    # hand truck waiting by the shelves
    htx = WIDTH * 0.52
    stroke(d, pline(htx, horizon - 10, htx + 54, horizon - 120), width=4, jitter=2.0, passes=1, seed=670, boil=b, alpha=180)
    stroke(d, pline(htx - 2, horizon - 12, htx + 40, horizon - 8), width=4, jitter=1.8, passes=1, seed=671, boil=b, alpha=180)
    stroke(d, circle_pts(htx + 6, horizon - 4, 14, 10), width=3, jitter=1.4, seed=672, boil=b, alpha=180)
    # marcus carrying box toward shelf, walking — in a hi-vis vest
    prog = ease(seg_(t, t0, t0 + 5.0))
    fx = WIDTH * (0.24 + 0.22 * prog)
    Hh = HEIGHT * 0.28
    draw_marcus(d, fx, horizon, Hh, b, walk_phase=(t * 1.3) % 1.0, box=True, seed=640)
    # amber wash vest over the torso (watercolor over ink)
    d.rounded_rectangle((fx - 0.14 * Hh, horizon - 0.78 * Hh, fx + 0.14 * Hh, horizon - 0.40 * Hh),
                        radius=10, fill=(226, 178, 92, 110))
    for hx_ in (WIDTH * 0.70 - 150, WIDTH * 0.70 + 150):
        stroke(d, pline(hx_, HEIGHT * 0.055, hx_, HEIGHT * 0.215), width=3, jitter=1.4, passes=1, seed=656, boil=b, alpha=130)
    sign(d, WIDTH * 0.70, HEIGHT * 0.24, "SHIPPING & RECEIVING", b, size=22, seed=655)
    # sun through high window
    stroke(d, [(WIDTH * 0.08, HEIGHT * 0.14), (WIDTH * 0.30, HEIGHT * 0.14), (WIDTH * 0.30, HEIGHT * 0.30),
               (WIDTH * 0.08, HEIGHT * 0.30), (WIDTH * 0.08, HEIGHT * 0.14)], width=4, jitter=2.4, seed=650, boil=b, alpha=150)
    return img

def _mv_keys(t, t0):
    b = boil_of(t)
    glow = ease(seg_(t, t0 + 2.4, t0 + 3.4))
    horizon = HEIGHT * 0.86
    Hm = HEIGHT * 0.30                       # Marcus height = the scene's yardstick
    d_top = horizon - Hm * 1.22              # door ~1.2x his height
    DL, DR = WIDTH * 0.462, WIDTH * 0.552
    img = wash_layer("keys", b, [
        (lambda d, w, h: d.rectangle((w * 0.05, h * 0.115, w * 0.95, h * 0.86), fill=255), (206, 196, 172), 0.4, 30),
        (lambda d, w, h: d.rectangle((w * 0.462, h * 0.50, w * 0.552, h * 0.86), fill=255), (240, 200, 116), 0.30 + 0.34 * glow, 22),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    # roofline + building face edges
    stroke(d, pline(WIDTH * 0.03, HEIGHT * 0.115, WIDTH * 0.97, HEIGHT * 0.115), width=5, jitter=2.4, seed=749, boil=b, alpha=180)
    stroke(d, pline(WIDTH * 0.05, HEIGHT * 0.115, WIDTH * 0.05, horizon), width=4, jitter=2.2, passes=1, seed=745, boil=b, alpha=130)
    stroke(d, pline(WIDTH * 0.95, HEIGHT * 0.115, WIDTH * 0.95, horizon), width=4, jitter=2.2, passes=1, seed=746, boil=b, alpha=130)
    # neighbor's door (3A) down the walk, same scale
    NA_L, NA_R = WIDTH * 0.115, WIDTH * 0.205
    stroke(d, [(NA_L, d_top), (NA_R, d_top), (NA_R, horizon), (NA_L, horizon), (NA_L, d_top)], width=5, jitter=2.4, seed=703, boil=b, alpha=190)
    sign(d, (NA_L + NA_R) / 2, d_top + 34, "3A", b, size=18, seed=704, pad=10)
    stroke(d, pline(WIDTH * 0.10, horizon + 30, WIDTH * 0.225, horizon + 30), width=4, jitter=2.2, seed=705, boil=b, alpha=140)
    # windows at human scale, two floors
    for (rx, ry) in ((0.345, 0.50), (0.615, 0.50), (0.345, 0.66), (0.615, 0.66),
                     (0.075, 0.26), (0.21, 0.26), (0.345, 0.26), (0.48, 0.26), (0.615, 0.26), (0.75, 0.26), (0.865, 0.26),
                     (0.75, 0.50), (0.865, 0.50), (0.75, 0.66)):
        wx0, wy0 = WIDTH * rx, HEIGHT * ry
        stroke(d, [(wx0, wy0), (wx0 + 96, wy0), (wx0 + 96, wy0 + 120), (wx0, wy0 + 120), (wx0, wy0)],
               width=3, jitter=1.6, passes=1, seed=int(700 + rx * 100 + ry * 10), boil=b, alpha=150)
    d.rectangle((WIDTH * 0.615 + 4, HEIGHT * 0.50 + 4, WIDTH * 0.615 + 92, HEIGHT * 0.50 + 116), fill=(238, 216, 168, 80))
    d.rectangle((WIDTH * 0.865 + 4, HEIGHT * 0.26 + 4, WIDTH * 0.865 + 92, HEIGHT * 0.26 + 116), fill=(238, 216, 168, 55))
    # the door, hinged right, opening inward at a human speed
    stroke(d, [(DL, d_top), (DR, d_top), (DR, horizon), (DL, horizon), (DL, d_top)], width=5, jitter=2.4, seed=701, boil=b)
    ang = 0.10 + 0.46 * glow
    panel_x = DR - (DR - DL) * math.cos(ang * 1.9)
    stroke(d, [(DR, d_top + 4), (panel_x, d_top + 10), (panel_x, horizon - 8), (DR, horizon)],
           width=4, jitter=2.0, passes=1, seed=702, boil=b, alpha=190)
    sign(d, (DL + DR) / 2, d_top + 34, "3B", b, size=18, seed=751, pad=10)
    # stoop steps sized to the door
    stroke(d, pline(WIDTH * 0.44, horizon + 30, WIDTH * 0.575, horizon + 30), width=5, jitter=2.4, seed=752, boil=b)
    stroke(d, pline(WIDTH * 0.425, horizon + 58, WIDTH * 0.59, horizon + 58), width=5, jitter=2.4, seed=753, boil=b)
    # street: curb, lamp, and the building name on a pole by the walk
    stroke(d, pline(0, horizon + 52, WIDTH, horizon + 48), width=4, jitter=2.2, passes=1, seed=760, boil=b, alpha=120)
    stroke(d, pline(WIDTH * 0.90, horizon, WIDTH * 0.90, HEIGHT * 0.22), width=4, jitter=2.0, passes=1, seed=761, boil=b, alpha=160)
    stroke(d, [(WIDTH * 0.90, HEIGHT * 0.22), (WIDTH * 0.86, HEIGHT * 0.24)], width=4, jitter=1.8, passes=1, seed=762, boil=b, alpha=160)
    d.ellipse((WIDTH * 0.857 - 13, HEIGHT * 0.243 - 13, WIDTH * 0.857 + 13, HEIGHT * 0.243 + 13), fill=(238, 200, 116, 190))
    stroke(d, circle_pts(WIDTH * 0.857, HEIGHT * 0.243, 14, 10), width=3, jitter=1.2, passes=1, seed=764, boil=b, alpha=170)
    stroke(d, pline(WIDTH * 0.80, horizon, WIDTH * 0.80, horizon - 176), width=4, jitter=1.8, passes=1, seed=765, boil=b, alpha=170)
    for wi_, word in enumerate(("MAPLE", "COURT", "APARTMENTS")):
        sign(d, WIDTH * 0.80, horizon - 250 + wi_ * 37, word, b, size=15, seed=750 + wi_, pad=10)
    # potted plant by the stoop
    stroke(d, [(WIDTH * 0.355, horizon - 4), (WIDTH * 0.365, horizon - 52), (WIDTH * 0.40, horizon - 52), (WIDTH * 0.41, horizon - 4)],
           width=4, jitter=2.0, passes=1, seed=763, boil=b, alpha=170)
    for st_, (dx0, dx1, dy1) in enumerate(((-4, -26, -28), (2, 5, -36), (8, 30, -24))):
        stroke(d, [(WIDTH * 0.3825 + dx0, horizon - 52), (WIDTH * 0.3825 + (dx0 + dx1) / 2, horizon - 52 + dy1 * 0.8),
                   (WIDTH * 0.3825 + dx1, horizon - 52 + dy1)], width=3, jitter=1.6, passes=1, seed=766 + st_, boil=b, alpha=140)
    # bush by the right windows
    for bsh in range(4):
        stroke(d, circle_pts(WIDTH * 0.685 + bsh * 14, horizon - 16 - (bsh % 2) * 10, 16 + (bsh % 2) * 6, 10),
               width=3, jitter=1.8, passes=1, seed=780 + bsh, boil=b, alpha=120)
    # marcus walks to the door, stops, raises the key
    walkp = ease(seg_(t, t0, t0 + 1.8))
    enterp = ease(seg_(t, t0 + 3.5, t0 + 5.0))
    fx = WIDTH * (0.335 + 0.105 * walkp + 0.072 * enterp)
    moving = (walkp < 1.0) or (0.02 < enterp < 0.98)
    fig_a = int(235 * (1 - seg_(t, t0 + 4.5, t0 + 5.3)))
    route_path(d, [(WIDTH * 0.28, horizon + 30), (WIDTH * 0.455, horizon + 30)], seg_(t, t0 + 0.2, t0 + 1.8), b, seed=768, alpha=110)
    if fig_a > 4:
        draw_marcus(d, fx, horizon, Hm, b,
                    walk_phase=((t * 1.15) % 1.0) if moving else None, box=False, seed=730, alpha=fig_a)
    if walkp >= 1.0 and enterp <= 0.05:
        kx, ky = fx + 0.155 * Hm, horizon - 0.46 * Hm
        stroke(d, circle_pts(kx, ky, 10, 10), width=3, jitter=1.2, passes=1, seed=770, boil=b)
        stroke(d, pline(kx + 9, ky, kx + 40, ky), width=3, jitter=1.2, passes=1, seed=771, boil=b)
        stroke(d, pline(kx + 32, ky, kx + 32, ky + 9), width=3, jitter=1.0, passes=1, seed=772, boil=b)
        d.ellipse((kx - 6, ky - 6, kx + 6, ky + 6), fill=(226, 178, 92, 160))
    return img

def _mv_evening(t, t0):
    b = boil_of(t)
    img = wash_layer("evening", b, [
        (lambda d, w, h: d.rectangle((0, 0, w, h * 0.75), fill=255), (96, 110, 122), 0.35, 70),
        (lambda d, w, h: d.rectangle((w * 0.60, h * 0.34, w * 0.78, h * 0.62), fill=255), (240, 200, 116), 0.6, 22),
        (lambda d, w, h: d.rectangle((0, h * 0.75, w, h), fill=255), (150, 148, 132), 0.4, 34),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    horizon = HEIGHT * 0.78
    # house wall + warm window
    stroke(d, pline(WIDTH * 0.54, HEIGHT * 0.16, WIDTH * 0.54, horizon), width=6, jitter=3, seed=801, boil=b)
    stroke(d, pline(WIDTH * 0.54, HEIGHT * 0.16, WIDTH * 0.94, HEIGHT * 0.16), width=6, jitter=3, seed=802, boil=b)
    # apartment face: window grid, one warm-lit (the wash glows behind it)
    for r in range(2):
        for c in range(3):
            gx0 = WIDTH * (0.60 + c * 0.115); gy0 = HEIGHT * (0.22 + r * 0.21)
            stroke(d, [(gx0, gy0), (gx0 + 96, gy0), (gx0 + 96, gy0 + 128), (gx0, gy0 + 128), (gx0, gy0)],
                   width=4, jitter=2.0, passes=1, seed=806 + r * 3 + c, boil=b, alpha=160)
    sign(d, WIDTH * 0.755, HEIGHT * 0.19, "MAPLE COURT APARTMENTS", b, size=16, seed=815, pad=12)
    # stoop steps
    stroke(d, pline(WIDTH * 0.30, horizon, WIDTH, horizon), width=6, jitter=3, seed=804, boil=b)
    stroke(d, pline(WIDTH * 0.26, horizon + 38, WIDTH * 0.62, horizon + 38), width=5, jitter=2.4, seed=805, boil=b)
    stroke(d, pline(WIDTH * 0.22, horizon + 74, WIDTH * 0.66, horizon + 74), width=5, jitter=2.4, seed=816, boil=b)
    # stars appearing
    r = random.Random(9)
    star_p = ease(seg_(t, t0 + 0.5, t0 + 3.5))
    n_st = int(star_p * 12)
    for i in range(n_st):
        sx, sy = r.uniform(0.04, 0.5) * WIDTH, r.uniform(0.06, 0.4) * HEIGHT
        born = seg_(t, t0 + 0.5 + i * 0.25, t0 + 1.0 + i * 0.25)
        d.ellipse((sx - 3.5, sy - 3.5, sx + 3.5, sy + 3.5), fill=(255, 255, 255, int(235 * born)))
        stroke(d, [(sx - 7, sy), (sx + 7, sy)], width=2, jitter=0.8, passes=1, seed=810 + i, boil=b, alpha=int(150 * born))
        stroke(d, [(sx, sy - 7), (sx, sy + 7)], width=2, jitter=0.8, passes=1, seed=830 + i, boil=b, alpha=int(150 * born))
    # the block at night: rooftop silhouettes, telephone wire, crescent moon
    # a legible city skyline: stepped rooftops, lit windows, a water tower
    sky = [(0, 0.34), (0.055, 0.34), (0.055, 0.27), (0.115, 0.27), (0.115, 0.36), (0.175, 0.36),
           (0.175, 0.22), (0.245, 0.22), (0.245, 0.335), (0.31, 0.335), (0.31, 0.29), (0.375, 0.29),
           (0.375, 0.38), (0.44, 0.38), (0.44, 0.41), (0.52, 0.41)]
    stroke(d, [(WIDTH * x, HEIGHT * y) for x, y in sky], width=3, jitter=1.6, passes=1, seed=820, boil=b, alpha=130)
    r2 = random.Random(4)
    for wi in range(14):
        wx_ = WIDTH * r2.uniform(0.015, 0.50); wy_ = HEIGHT * r2.uniform(0.30, 0.62)
        d.rectangle((wx_, wy_, wx_ + 10, wy_ + 14), fill=(238, 200, 116, r2.randint(70, 140)))
    stroke(d, [(WIDTH * 0.205, HEIGHT * 0.22), (WIDTH * 0.205, HEIGHT * 0.16), (WIDTH * 0.245, HEIGHT * 0.16),
               (WIDTH * 0.245, HEIGHT * 0.22)], width=3, jitter=1.4, passes=1, seed=823, boil=b, alpha=120)
    stroke(d, pline(WIDTH * 0.198, HEIGHT * 0.16, WIDTH * 0.252, HEIGHT * 0.16), width=3, jitter=1.2, passes=1, seed=828, boil=b, alpha=120)
    stroke(d, [(0, HEIGHT * 0.14), (WIDTH * 0.30, HEIGHT * 0.19), (WIDTH * 0.53, HEIGHT * 0.165)],
           width=2, jitter=1.6, passes=1, seed=821, boil=b, alpha=90)
    # the moon, with light in it
    d.ellipse((WIDTH * 0.115 - 30, HEIGHT * 0.105 - 30, WIDTH * 0.115 + 30, HEIGHT * 0.105 + 30), fill=(244, 232, 178, 200))
    d.ellipse((WIDTH * 0.115 - 12, HEIGHT * 0.105 - 34, WIDTH * 0.115 + 44, HEIGHT * 0.105 + 22), fill=(96, 110, 122, 235))
    stroke(d, circle_pts(WIDTH * 0.115, HEIGHT * 0.105, 30, 14, a0=-1.9, a1=1.6), width=4, jitter=1.4, passes=1, seed=822, boil=b, alpha=170)
    d.rectangle((WIDTH * 0.715 + 4, HEIGHT * 0.43, WIDTH * 0.715 + 92, HEIGHT * 0.445), fill=(120, 128, 116, 140))
    d.rectangle((WIDTH * 0.83, HEIGHT * 0.22, WIDTH * 0.83 + 96, HEIGHT * 0.22 + 128), fill=(238, 200, 116, 40))
    # stoop railing + trash can
    stroke(d, pline(WIDTH * 0.585, horizon + 2, WIDTH * 0.585, horizon - 92), width=4, jitter=1.8, passes=1, seed=824, boil=b, alpha=170)
    stroke(d, pline(WIDTH * 0.52, horizon - 88, WIDTH * 0.60, horizon - 92), width=4, jitter=1.8, passes=1, seed=825, boil=b, alpha=170)
    tc = WIDTH * 0.845
    stroke(d, [(tc, horizon + 44), (tc + 4, horizon - 32), (tc + 62, horizon - 32), (tc + 66, horizon + 44)],
           width=4, jitter=2.0, passes=1, seed=826, boil=b, alpha=160)
    stroke(d, pline(tc - 4, horizon - 34, tc + 70, horizon - 36), width=4, jitter=1.8, passes=1, seed=827, boil=b, alpha=160)
    # marcus seated ON the top step, mug on the step beside him
    draw_marcus(d, WIDTH * 0.44, horizon, HEIGHT * 0.215, b, sit=True, box=False, phone=False, seed=850)
    mug = (WIDTH * 0.44 + 104, horizon + 10)
    d.rounded_rectangle((mug[0], mug[1], mug[0] + 30, mug[1] + 26), radius=5, fill=(226, 178, 92, 210))
    stroke(d, circle_pts(mug[0] + 34, mug[1] + 13, 8, 8, a0=-1.4, a1=1.4), width=3, jitter=1.0, passes=1, seed=851, boil=b, alpha=170)
    return img

def sc_finale(t: float) -> Image.Image:
    b = boil_of(t)
    t0 = 76.0
    horizon = HEIGHT * 0.72
    img = wash_layer("finale", b, [
        (lambda d, w, h: d.ellipse((w * 0.30, h * 0.72 - h * 0.40, w * 1.1, h * 0.72 + h * 0.24), fill=255), AMB_SOFT, 0.45, 70),
        (lambda d, w, h: d.ellipse((w * 0.66, h * 0.72 - w * 0.06, w * 0.78, h * 0.72 + w * 0.03), fill=255), AMB, 0.8, 14),
        (lambda d, w, h: d.rectangle((0, h * 0.72, w, h), fill=255), GROUND, 0.5, 34),
    ]).copy()
    d = ImageDraw.Draw(img, "RGBA")
    walk_p = seg_(t, t0, t0 + 5.2)
    lock_p = ease(seg_(t, t0 + 5.9, t0 + 7.7))
    fig_a = 1 - seg_(t, t0 + 4.7, t0 + 5.6)   # figure fully gone BEFORE the lockup arrives
    stroke(d, pline(0, horizon, WIDTH, horizon), width=6, jitter=3, seed=901, boil=b,
           alpha=int(235 * (1 - 0.75 * lock_p)))
    # sidewalk edge + a young street tree: a real morning street
    stroke(d, pline(0, horizon + 46, WIDTH, horizon + 42), width=4, jitter=2.2, passes=1, seed=902, boil=b,
           alpha=int(110 * (1 - 0.8 * lock_p)))
    for cx_, cy_, cw_ in ((0.26, 0.16, 110), (0.55, 0.11, 80)):
        stroke(d, [(WIDTH * cx_ - cw_, HEIGHT * cy_), (WIDTH * cx_ + cw_, HEIGHT * cy_)], width=5, jitter=2.6,
               passes=1, seed=930 + int(cx_ * 100), boil=b, alpha=int(55 * (1 - lock_p)))
    for bsh in range(3):
        stroke(d, circle_pts(WIDTH * 0.90 + bsh * 18, horizon - 12 - (bsh % 2) * 8, 18, 10), width=3, jitter=1.8,
               passes=1, seed=935 + bsh, boil=b, alpha=int(110 * (1 - lock_p)))
    if lock_p < 0.9:
        ta = int(150 * (1 - lock_p))
        stroke(d, pline(WIDTH * 0.12, horizon, WIDTH * 0.115, horizon - 150), width=4, jitter=2.2, passes=1, seed=903, boil=b, alpha=ta)
        for br in range(3):
            stroke(d, pline(WIDTH * 0.115, horizon - 110 - br * 16, WIDTH * (0.09 + br * 0.02), horizon - 160 - br * 12),
                   width=3, jitter=1.8, passes=1, seed=904 + br, boil=b, alpha=ta)
        for fo in range(3):
            d.ellipse((WIDTH * (0.085 + fo * 0.018) - 22, horizon - 176 - fo * 10 - 18,
                       WIDTH * (0.085 + fo * 0.018) + 22, horizon - 176 - fo * 10 + 18),
                      fill=(174, 206, 192, int(50 * (1 - lock_p))))
    if fig_a > 0.02:
        fx = WIDTH * (0.30 + 0.18 * ease(walk_p))
        a = int(235 * fig_a)
        # the route line runs ahead of him toward the sun — the name, drawn
        route_path(d, [(WIDTH * 0.16, horizon + 24), (WIDTH * 0.86, horizon + 24)],
                   1.0, b, seed=906, alpha=int(130 * fig_a))
        d.ellipse((fx - 90, horizon - 8, fx + 60, horizon + 12), fill=(*SHADOW, int(70 * fig_a)))
        draw_marcus(d, fx, horizon, HEIGHT * 0.30, b, walk_phase=(t * 1.15) % 1.0, box=False, alpha=a)
    if lock_p > 0:
        a = int(255 * lock_p)
        cx, cy = WIDTH // 2, HEIGHT * 0.375
        rr = 108
        # soft paper glow clears the backdrop so the lockup reads instantly
        for k in range(6, 0, -1):
            ga = int(34 * lock_p)
            d.ellipse((cx - rr * 2.4 - k * 60, cy - rr * 1.9 - k * 40, cx + rr * 2.4 + k * 60, cy + rr * 3.6 + k * 40),
                      fill=(*PAPER_BG, ga))
        stroke(d, circle_pts(cx, cy, rr, 18), width=7, jitter=2.8, seed=910, boil=b, alpha=a)
        d.polygon([(cx, cy - rr * 0.62), (cx + rr * 0.16, cy), (cx, cy + rr * 0.62), (cx - rr * 0.16, cy)], fill=(*INK, int(a * 0.85)))
        d.polygon([(cx - rr * 0.62, cy), (cx, cy - rr * 0.14), (cx + rr * 0.62, cy), (cx, cy + rr * 0.14)], fill=(140, 180, 166, int(a * 0.8)))
        fnews = ImageFont.truetype(NEWS_SB, 120)
        wtx = d.textlength("Pathfinder", font=fnews)
        d.text(((WIDTH - wtx) / 2, cy + rr + 34), "Pathfinder", font=fnews, fill=(*INK, a))
        # the underline IS the route — dashed, drawn left to right
        route_path(d, [((WIDTH - wtx) / 2, cy + rr + 184), ((WIDTH + wtx) / 2, cy + rr + 184)],
                   seg_(t, t0 + 6.6, t0 + 8.2), b, seed=911, alpha=int(200 * lock_p), width=5)
        fmono = ImageFont.truetype(GMONO, 30)
        url = "pathfinder.windwardline.com"
        wu = d.textlength(url, font=fmono)
        d.text(((WIDTH - wu) / 2, cy + rr + 214), url, font=fmono, fill=(*INK, int(a * 0.62)))
    return img

# ---------------- UI scenes (real captures) ----------------

def sc_ui_journey(t: float) -> Image.Image:
    """One continuous real session, full screen, visible cursor.
    Film 24-31: settle on Today. 31-37: cursor glides to Mark as complete.
    37-44.6: the click + Route-updated dialog, held."""
    src = _piecewise_src(t, [
        (24.0, 31.0, 0.9, 2.2),
        (31.0, 37.0, 2.2, 5.2),
        (37.0, 44.6, 5.2, 12.8),
    ])
    return ui_frame(cap_frame(int(src * 30)), t, boil_of(t), zoom0=1.0, zoom1=1.0, p=0)

def sc_ui_history(t: float) -> Image.Image:
    src = _piecewise_src(t, [(57.0, 61.5, 17.4, 21.9)])
    return ui_frame(cap_frame(int(src * 30)), t, boil_of(t), zoom0=1.0, zoom1=1.0, p=0)

def sc_ui_wide(t: float) -> Image.Image:
    # post-completion Today: the new Focus Action on screen = visible progress
    return ui_frame(cap_frame(430), t, boil_of(t), zoom0=1.0, zoom1=1.0, p=0)

# ---------------- compositor ----------------

SCENES = [
    (0.0, 6.4, sc_gates),
    (6.1, 10.45, sc_van),
    (10.1, 18.75, sc_tangle),
    (18.3, 24.4, sc_bedroom),
    (24.0, 44.65, sc_ui_journey),
    (44.3, 47.6, sc_dmv),
    (47.2, 57.4, sc_montage),   # work + keys
    (57.0, 61.5, sc_ui_history),
    (61.1, 68.6, lambda t: _mv_evening(t, 61.4)),
    (68.2, 76.4, sc_ui_wide),
    (76.0, 90.0, sc_finale),
]
XF = 0.45

def frame_at(t: float) -> Image.Image:
    active = [(s, e, fn) for (s, e, fn) in SCENES if s <= t <= e]
    if not active:
        img = PAPER.copy()
    elif len(active) == 1:
        img = active[0][2](t)
    else:
        (s1, e1, f1), (s2, e2, f2) = active[-2], active[-1]
        w = seg_(t, s2, min(s2 + XF, e1))
        img = Image.blend(f1(t), f2(t), ease(w))
    img.paste(VIGNETTE, (0, 0), VIGNETTE)
    fade = min(seg_(t, 0.0, 0.8), 1 - seg_(t, 88.8, 90.0))
    if fade < 1:
        img = Image.blend(Image.new("RGB", (WIDTH, HEIGHT), PAPER_BG), img, fade)
    return img

def main():
    outdir = ROOT.parent / "exports"
    outdir.mkdir(exist_ok=True)
    out = outdir / "Pathfinder-Marcus-90s-FINAL-CUT.mp4"
    enc = subprocess.Popen([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
        "-i", str(ROOT / "audio" / "soundtrack-marcus5.wav"),
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "256k", "-shortest", str(out)], stdin=subprocess.PIPE)
    total = 90 * FPS
    for i in range(total):
        t = (i + 0.5) / FPS
        enc.stdin.write(frame_at(t).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{total} ({t:.1f}s)", flush=True)
    enc.stdin.close()
    enc.wait()
    print("DONE ->", out, flush=True)

if __name__ == "__main__":
    main()
