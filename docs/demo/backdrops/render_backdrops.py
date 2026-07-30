#!/usr/bin/env python3
"""Render the Demo Day presenter backdrops.

Three 3840x2160 backgrounds for video-call presentation, drawn from the
application's own design system: paper and spruce, Newsreader for display
type, Geist Mono for the domain. The presenter sits centred in frame, so
every composition keeps the middle clear and works the brand into the
corners and edges.

Deterministic: same inputs, pixel-identical output. Requires Pillow.

    python3 docs/demo/backdrops/render_backdrops.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
FONTS = HERE.parent / "pathfinder-90s" / "build" / "fonts"

W, H = 3840, 2160

# Design tokens from apps/web/src/app/globals.css.
PAPER = (250, 250, 247)
SPRUCE = (23, 89, 78)
SPRUCE_SOFT = (227, 239, 236)
SPRUCE_INK = (15, 61, 54)
NIGHT_INK = (17, 24, 21)
NIGHT_SPRUCE = (15, 61, 54)
MIST = (124, 199, 181)
LAMPLIGHT = (245, 217, 168)
DOMAIN_GREY = (96, 125, 118)

DOMAIN = "pathfinder.windwardline.com"


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"{name}.ttf"), size)


def bezier(points, samples=300):
    """Sample a chain of cubic Bezier segments through the control points."""

    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    out = []
    for i in range(0, len(points) - 3, 3):
        p0, p1, p2, p3 = points[i : i + 4]
        for k in range(samples):
            t = k / samples
            a, b, c = lerp(p0, p1, t), lerp(p1, p2, t), lerp(p2, p3, t)
            d, e = lerp(a, b, t), lerp(b, c, t)
            out.append(lerp(d, e, t))
    return out


def dashed(draw, points, colour, width=10, dash=44, gap=30):
    """Draw a dashed line along sampled points, stepping by arc length."""
    run, travelled, drawing = [], 0.0, True
    for i in range(1, len(points)):
        x0, y0 = points[i - 1]
        x1, y1 = points[i]
        run.append((x0, y0))
        travelled += math.hypot(x1 - x0, y1 - y0)
        if travelled >= (dash if drawing else gap):
            if drawing and len(run) > 1:
                draw.line(run, fill=colour, width=width, joint="curve")
            run, travelled, drawing = [], 0.0, not drawing
    if drawing and len(run) > 1:
        draw.line(run, fill=colour, width=width, joint="curve")


def waypoint(draw, centre, radius, fill, ring):
    x, y = centre
    draw.ellipse([x - radius - 8, y - radius - 8, x + radius + 8, y + radius + 8], fill=ring)
    draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=fill)


def star(draw, centre, radius, colour):
    x, y = centre
    for degrees in range(0, 360, 45):
        angle = math.radians(degrees)
        reach = radius if degrees % 90 == 0 else radius * 0.45
        draw.line(
            [x, y, x + reach * math.cos(angle), y + reach * math.sin(angle)],
            fill=colour,
            width=9,
        )


def field_guide() -> Image.Image:
    """Daylight paper, contour whispers, and the Route crossing the top."""
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    rnd = random.Random(11)
    for i in range(14):
        base = 140 + i * 150
        amplitude = 46 + rnd.random() * 40
        phase = rnd.random() * 6.28
        line = [
            (x, base + amplitude * math.sin(x / 620 + phase) + 26 * math.sin(x / 210 + phase * 2))
            for x in range(0, W + 20, 20)
        ]
        draw.line(line, fill=SPRUCE_SOFT, width=4)

    # Lift the centre back toward clean paper so the presenter reads clearly.
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).ellipse([W * 0.22, H * 0.08, W * 0.78, H * 1.05], fill=110)
    img.paste(Image.new("RGB", (W, H), PAPER), (0, 0), mask.filter(ImageFilter.GaussianBlur(240)))

    draw = ImageDraw.Draw(img)
    route = bezier(
        [
            (W * 0.045, H * 0.88), (W * 0.012, H * 0.60), (W * 0.028, H * 0.34),
            (W * 0.030, H * 0.16), (W * 0.028, H * 0.036), (W * 0.20, H * 0.028),
            (W * 0.40, H * 0.042), (W * 0.62, H * 0.058), (W * 0.80, H * 0.088),
            (W * 0.885, H * 0.16),
        ]
    )
    dashed(draw, route, SPRUCE, width=11, dash=52, gap=36)
    for t in (0.0, 0.24, 0.5, 0.76):
        waypoint(draw, route[int(t * (len(route) - 1))], 22, SPRUCE, PAPER)
    star(draw, route[-1], 64, SPRUCE)
    waypoint(draw, route[-1], 26, SPRUCE_INK, PAPER)

    draw.text((W * 0.075, H * 0.08), "Pathfinder", font=font("Newsreader-Semibold", 168), fill=SPRUCE_INK)
    draw.text(
        (W * 0.077, H * 0.17),
        "What comes next. Why it comes next. What it unlocks.",
        font=font("Newsreader-ItalicMedium", 64),
        fill=SPRUCE,
    )
    mono = font("GeistMono-Regular", 52)
    draw.text((W * 0.955 - draw.textlength(DOMAIN, font=mono), H * 0.925), DOMAIN, font=mono, fill=DOMAIN_GREY)
    return img


def the_way_home() -> Image.Image:
    """The film's closing mood: night sky, a route climbing to a lit window."""
    img = Image.new("RGB", (W, H), NIGHT_INK)
    draw = ImageDraw.Draw(img)

    for y in range(H):
        t = (y / H) ** 1.4
        draw.line(
            [(0, y), (W, y)],
            fill=tuple(int(a + (b - a) * t) for a, b in zip(NIGHT_INK, NIGHT_SPRUCE)),
        )

    rnd = random.Random(7)
    for _ in range(240):
        x, y = rnd.random() * W, rnd.random() * H * 0.55
        if W * 0.34 < x < W * 0.66 and y > H * 0.12:
            continue  # keep the sky quiet directly behind the presenter
        radius = rnd.choice([2, 2, 3, 4])
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=(200, 224, 217))
        if rnd.randint(70, 160) < 100:
            draw.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(120, 150, 142))

    route = bezier(
        [
            (W * 0.10, H * 0.94), (W * 0.20, H * 0.72), (W * 0.055, H * 0.55),
            (W * 0.115, H * 0.375), (W * 0.21, H * 0.30), (W * 0.165, H * 0.20),
        ]
    )
    dashed(draw, route, MIST, width=10, dash=46, gap=34)
    for t in (0.16, 0.52, 0.8):
        waypoint(draw, route[int(t * (len(route) - 1))], 18, MIST, NIGHT_INK)

    end_x, end_y = route[-1]
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [end_x - 130, end_y - 130, end_x + 130, end_y + 130], fill=(120, 96, 54)
    )
    img = ImageChops.add(img, glow.filter(ImageFilter.GaussianBlur(90)))

    draw = ImageDraw.Draw(img)
    waypoint(draw, (end_x, end_y), 30, LAMPLIGHT, (60, 48, 28))

    constellation = [
        (W * 0.86, H * 0.16), (W * 0.925, H * 0.27), (W * 0.845, H * 0.38),
        (W * 0.955, H * 0.46), (W * 0.885, H * 0.56),
    ]
    for a, b in ((0, 1), (1, 2), (2, 3), (3, 4), (1, 3)):
        draw.line([constellation[a], constellation[b]], fill=(52, 92, 83), width=5)
    for i, node in enumerate(constellation):
        waypoint(draw, node, 14 if i % 2 else 18, MIST, NIGHT_INK)

    draw.text((W * 0.045, H * 0.05), "Pathfinder", font=font("Newsreader-Semibold", 168), fill=SPRUCE_SOFT)
    draw.text((W * 0.235, H * 0.865), "The way home.", font=font("Newsreader-ItalicMedium", 96), fill=MIST)
    mono = font("GeistMono-Regular", 52)
    draw.text((W * 0.955 - draw.textlength(DOMAIN, font=mono), H * 0.925), DOMAIN, font=mono, fill=(110, 146, 138))
    return img


def same_facts_same_route() -> Image.Image:
    """The claim, drawn: a dependency graph resolving into an ordered Route."""
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    for x in range(80, W, 96):
        for y in range(80, H, 96):
            if W * 0.30 < x < W * 0.70 and y > H * 0.14:
                continue
            draw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=SPRUCE_SOFT)

    graph = [
        (W * 0.065, H * 0.20), (W * 0.145, H * 0.30), (W * 0.05, H * 0.42),
        (W * 0.125, H * 0.55), (W * 0.06, H * 0.70), (W * 0.15, H * 0.82),
    ]
    for a, b in ((0, 1), (0, 2), (2, 3), (1, 3), (3, 4), (4, 5), (3, 5)):
        draw.line([graph[a], graph[b]], fill=(178, 208, 201), width=7)
    for i, (x, y) in enumerate(graph):
        if i in (0, 3, 5):
            waypoint(draw, (x, y), 26, SPRUCE, PAPER)
        else:
            draw.ellipse([x - 24, y - 24, x + 24, y + 24], outline=SPRUCE, width=8, fill=PAPER)

    step_x = W * 0.905
    steps = [H * 0.22, H * 0.40, H * 0.58, H * 0.76]
    dashed(
        draw,
        [(step_x, y) for y in range(int(steps[0]), int(steps[-1]), 6)],
        SPRUCE,
        width=9,
        dash=40,
        gap=30,
    )
    numerals = font("GeistMono-Regular", 56)
    for i, y in enumerate(steps):
        waypoint(draw, (step_x, y), 34, SPRUCE if i == 0 else PAPER, SPRUCE)
        if i:
            draw.ellipse([step_x - 34, y - 34, step_x + 34, y + 34], outline=SPRUCE, width=8)
        draw.text((step_x - 17, y - 30), str(i + 1), font=numerals, fill=PAPER if i == 0 else SPRUCE)

    draw.text((W * 0.045, H * 0.055), "Pathfinder", font=font("Newsreader-Semibold", 168), fill=SPRUCE_INK)

    claim, claim_font = "SAME FACTS. SAME ROUTE.", font("GeistMono-Regular", 72)
    draw.text((W * 0.955 - draw.textlength(claim, font=claim_font), H * 0.07), claim, font=claim_font, fill=SPRUCE_INK)

    sub, sub_font = "Every step explains why it comes next.", font("Newsreader-ItalicMedium", 60)
    draw.text((W * 0.955 - draw.textlength(sub, font=sub_font), H * 0.125), sub, font=sub_font, fill=SPRUCE)

    draw.text((W * 0.045, H * 0.925), DOMAIN, font=font("GeistMono-Regular", 52), fill=DOMAIN_GREY)
    return img


BACKDROPS = {
    "Pathfinder-Backdrop-Field-Guide.png": field_guide,
    "Pathfinder-Backdrop-The-Way-Home.png": the_way_home,
    "Pathfinder-Backdrop-Same-Facts-Same-Route.png": same_facts_same_route,
}


def main() -> None:
    for filename, render in BACKDROPS.items():
        render().save(HERE / filename)
        print(f"wrote {filename}")


if __name__ == "__main__":
    main()
