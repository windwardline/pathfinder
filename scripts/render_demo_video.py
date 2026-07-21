#!/usr/bin/env python3
"""Render the governed Pathfinder Demo Day master from authentic product captures."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/demo/pathfinder-90s-ai-navigated-rough-cut.mp4"
HISTORY = ROOT / "docs/demo/captures/route-history-authentic-dark.png"
MOBILE = ROOT / "docs/demo/captures/today-mobile-authentic.png"
AUDIO = ROOT / "docs/demo/audio/pathfinder-final-mix.wav"
SRT = ROOT / "docs/demo/pathfinder-demo-day-90s.srt"
OUTPUT = ROOT / "docs/demo/exports/Pathfinder-Demo-Day-90s-Master.mp4"
VIDEO_ONLY = ROOT / "docs/demo/exports/.Pathfinder-Demo-Day-90s-video-only.mp4"

HELVETICA = "/System/Library/Fonts/HelveticaNeue.ttc"
GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"

WIDTH = 1920
HEIGHT = 1080
FPS = 30
FRAME_COUNT = 90 * FPS
SOURCE_FRAME_COUNT = 2046
FRAME_BYTES = WIDTH * HEIGHT * 3

INK = (231, 238, 235)
TEAL = (121, 200, 187)
AMBER = (217, 164, 65)
DEEP_GREEN = (7, 17, 14)


def require_files() -> None:
    for item in [SOURCE, HISTORY, MOBILE, AUDIO, SRT, Path(HELVETICA), Path(GEORGIA)]:
        if not item.is_file():
            raise FileNotFoundError(item)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)


def timestamp_seconds(value: str) -> float:
    match = re.fullmatch(r"(\d{2}):(\d{2}):(\d{2}),(\d{3})", value)
    if not match:
        raise ValueError(f"Invalid SRT timestamp: {value}")
    hours, minutes, seconds, milliseconds = (int(part) for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000


def parse_srt() -> list[dict[str, object]]:
    cues: list[dict[str, object]] = []
    for block in re.split(r"\r?\n\r?\n", SRT.read_text().strip()):
        lines = block.splitlines()
        start, end = lines[1].split(" --> ")
        cues.append(
            {
                "start": timestamp_seconds(start),
                "end": timestamp_seconds(end),
                "text": "\n".join(lines[2:]),
            }
        )
    return cues


def center_text(draw: ImageDraw.ImageDraw, y: int, text: str, font: ImageFont.FreeTypeFont, fill) -> None:
    bounds = draw.textbbox((0, 0), text, font=font)
    width = bounds[2] - bounds[0]
    draw.text(((WIDTH - width) / 2, y), text, font=font, fill=fill)


def opening_overlay() -> Image.Image:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (*DEEP_GREEN, 238))
    draw = ImageDraw.Draw(layer)
    small = ImageFont.truetype(HELVETICA, 28)
    headline = ImageFont.truetype(GEORGIA, 60)
    center_text(draw, 405, "C O M I N G  H O M E", small, (*TEAL, 255))
    center_text(draw, 465, "THE ORDER CAN DERAIL EVERYTHING.", headline, (255, 255, 255, 255))
    draw.rounded_rectangle((700, 560, 1220, 564), radius=2, fill=(*TEAL, 235))
    return layer


def caption_overlays(cues: list[dict[str, object]]) -> list[Image.Image]:
    font = ImageFont.truetype(HELVETICA, 52)
    overlays: list[Image.Image] = []
    for cue in cues:
        text = str(cue["text"])
        layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        bounds = draw.multiline_textbbox((0, 0), text, font=font, spacing=12, align="center")
        text_width = bounds[2] - bounds[0]
        text_height = bounds[3] - bounds[1]
        box_width = text_width + 52
        box_height = text_height + 38
        x = (WIDTH - box_width) // 2
        y = HEIGHT - box_height - 56
        draw.rounded_rectangle(
            (x, y, x + box_width, y + box_height), radius=14, fill=(*DEEP_GREEN, 218)
        )
        draw.multiline_text(
            (WIDTH / 2, y + 17),
            text,
            font=font,
            fill=(255, 255, 255, 255),
            spacing=12,
            align="center",
            anchor="ma",
        )
        overlays.append(layer)
    return overlays


def cover(image: Image.Image, width: int, height: int) -> Image.Image:
    scale = max(width / image.width, height / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def history_frame(source: Image.Image, progress: float) -> Image.Image:
    base = source.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    zoom = 1.01 + 0.025 * max(0.0, min(1.0, progress))
    crop_width = round(WIDTH / zoom)
    crop_height = round(HEIGHT / zoom)
    left = (WIDTH - crop_width) // 2
    top = (HEIGHT - crop_height) // 2
    return base.crop((left, top, left + crop_width, top + crop_height)).resize(
        (WIDTH, HEIGHT), Image.Resampling.LANCZOS
    )


def mobile_frame(source: Image.Image, include_call_to_action: bool) -> Image.Image:
    background = cover(source, WIDTH, HEIGHT).filter(ImageFilter.GaussianBlur(32))
    background = ImageEnhance.Brightness(background).enhance(0.32)
    background = ImageEnhance.Color(background).enhance(0.75)

    phone_height = 900
    phone_width = round(source.width * phone_height / source.height)
    phone = source.resize((phone_width, phone_height), Image.Resampling.LANCZOS)
    framed = Image.new("RGB", (phone_width + 24, phone_height + 24), DEEP_GREEN)
    framed.paste(phone, (12, 12))
    background.paste(framed, (330, 78))

    draw = ImageDraw.Draw(background)
    eyebrow = ImageFont.truetype(HELVETICA, 24)
    headline = ImageFont.truetype(GEORGIA, 58)
    url_font = ImageFont.truetype(HELVETICA, 31)
    callout = ImageFont.truetype(HELVETICA, 20)
    draw.text((1030, 350), "R E S P O N S I V E  B Y  D E S I G N", font=eyebrow, fill=TEAL)
    draw.text((1030, 415), "The same Route.", font=headline, fill=(255, 255, 255))
    draw.text((1030, 485), "At the moment it matters.", font=headline, fill=(255, 255, 255))
    if include_call_to_action:
        draw.text((1030, 635), "pathfinder.windwardline.com", font=url_font, fill=INK)
        draw.text((1030, 690), "M I S S I O N - A L I G N E D  P I L O T S", font=callout, fill=AMBER)
    return background


def apply_cursor(frame: Image.Image, time_seconds: float) -> None:
    draw = ImageDraw.Draw(frame)
    if 14.2 <= time_seconds <= 16.1:
        progress = (time_seconds - 14.2) / 1.9
        x = 1100 - 240 * progress
        y = 720 - 38 * progress
        draw.ellipse((x - 22, y - 22, x + 22, y + 22), fill=TEAL)
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=(255, 255, 255))
        if 15.72 <= time_seconds <= 16.12:
            draw.ellipse((x - 38, y - 38, x + 38, y + 38), outline=TEAL, width=4)
    if 42.2 <= time_seconds <= 43.2:
        progress = time_seconds - 42.2
        x = 1200 + 180 * progress
        y = 350 - 168 * progress
        draw.ellipse((x - 22, y - 22, x + 22, y + 22), fill=TEAL)
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=(255, 255, 255))
        if 43.0 <= time_seconds <= 43.2:
            draw.ellipse((x - 38, y - 38, x + 38, y + 38), outline=AMBER, width=4)


def overlay_rgba(frame: Image.Image, layer: Image.Image, opacity: float = 1.0) -> None:
    if opacity <= 0:
        return
    if opacity >= 1:
        frame.paste(layer, (0, 0), layer)
        return
    adjusted = layer.copy()
    adjusted.putalpha(adjusted.getchannel("A").point(lambda value: round(value * opacity)))
    frame.paste(adjusted, (0, 0), adjusted)


def read_frame(stream) -> Image.Image:
    data = stream.read(FRAME_BYTES)
    if len(data) != FRAME_BYTES:
        raise EOFError("The source recording ended before the governed cut point")
    return Image.frombytes("RGB", (WIDTH, HEIGHT), data)


def render() -> None:
    require_files()
    cues = parse_srt()
    captions = caption_overlays(cues)
    opening = opening_overlay()
    history_source = Image.open(HISTORY).convert("RGB")
    mobile_source = Image.open(MOBILE).convert("RGB")
    mobile_plain = mobile_frame(mobile_source, include_call_to_action=False)
    mobile_call_to_action = mobile_frame(mobile_source, include_call_to_action=True)

    decoder = subprocess.Popen(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(SOURCE),
            "-an",
            "-vf",
            f"scale={WIDTH}:{HEIGHT}",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-",
        ],
        stdout=subprocess.PIPE,
    )
    encoder = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{WIDTH}x{HEIGHT}",
            "-r",
            str(FPS),
            "-i",
            "-",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "16",
            "-profile:v",
            "high",
            "-level",
            "4.2",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(VIDEO_ONLY),
        ],
        stdin=subprocess.PIPE,
    )
    if decoder.stdout is None or encoder.stdin is None:
        raise RuntimeError("Could not open the video rendering pipes")

    last_source_frame: Image.Image | None = None
    proposed_fact_hold: Image.Image | None = None
    try:
        for frame_index in range(FRAME_COUNT):
            time_seconds = frame_index / FPS
            if frame_index < SOURCE_FRAME_COUNT:
                frame = read_frame(decoder.stdout)
                last_source_frame = frame.copy()
                if frame_index == round(42.8 * FPS):
                    proposed_fact_hold = frame.copy()
                if frame_index == SOURCE_FRAME_COUNT - 1:
                    decoder.stdout.close()
                    decoder.terminate()
                    try:
                        decoder.wait(timeout=2)
                    except subprocess.TimeoutExpired:
                        decoder.kill()
                        decoder.wait(timeout=2)
            elif time_seconds < 80.15:
                progress = (time_seconds - 67.95) / 12.2
                frame = history_frame(history_source, progress)
            else:
                frame = (mobile_call_to_action if time_seconds >= 85.5 else mobile_plain).copy()

            # Keep the still-Proposed state visible until the narration reaches
            # the confirmation turn. The source continues decoding underneath,
            # so the cut at 50 seconds lands on the authentic confirmed Reroute.
            if 42.9 <= time_seconds < 50 and proposed_fact_hold is not None:
                frame = proposed_fact_hold.copy()

            if 67.95 <= time_seconds < 68.2 and last_source_frame is not None:
                progress = (time_seconds - 67.95) / 0.25
                history = history_frame(history_source, 0)
                frame = Image.blend(last_source_frame, history, max(0.0, min(1.0, progress)))
            elif 79.9 <= time_seconds < 80.15:
                progress = (time_seconds - 79.9) / 0.25
                history = history_frame(history_source, 1)
                frame = Image.blend(history, mobile_plain, max(0.0, min(1.0, progress)))

            if time_seconds < 3.4:
                if time_seconds < 0.35:
                    opacity = time_seconds / 0.35
                elif time_seconds > 2.75:
                    opacity = (3.4 - time_seconds) / 0.65
                else:
                    opacity = 1.0
                overlay_rgba(frame, opening, max(0.0, min(1.0, opacity)))

            apply_cursor(frame, time_seconds)

            for cue, caption in zip(cues, captions, strict=True):
                if float(cue["start"]) <= time_seconds < float(cue["end"]):
                    overlay_rgba(frame, caption)
                    break

            if time_seconds >= 89.55:
                frame = Image.blend(frame, Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0)), (time_seconds - 89.55) / 0.45)

            encoder.stdin.write(frame.tobytes())
            if frame_index % 300 == 0:
                print(f"Rendered frame {frame_index:04d}/{FRAME_COUNT}", flush=True)

        encoder.stdin.close()
        encoder_status = encoder.wait()
        if encoder_status != 0:
            raise RuntimeError(f"Video encoder exited with status {encoder_status}")
    finally:
        if decoder.poll() is None:
            decoder.terminate()
            try:
                decoder.wait(timeout=2)
            except subprocess.TimeoutExpired:
                decoder.kill()
                decoder.wait(timeout=2)

    mux = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(VIDEO_ONLY),
            "-i",
            str(AUDIO),
            "-filter_complex",
            "[1:a]apad[audio]",
            "-map",
            "0:v",
            "-map",
            "[audio]",
            "-t",
            "90",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "320k",
            "-ar",
            "48000",
            "-movflags",
            "+faststart",
            str(OUTPUT),
        ]
    )
    if mux.returncode != 0:
        raise RuntimeError(f"Audio mux exited with status {mux.returncode}")
    VIDEO_ONLY.unlink(missing_ok=True)
    print(f"Rendered {OUTPUT}")


if __name__ == "__main__":
    try:
        render()
    except Exception as error:
        print(f"Demo video render failed: {error}", file=sys.stderr)
        raise
