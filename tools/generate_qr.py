#!/usr/bin/env python3
"""
Construction Brand - QR generator
=================================

Builds into ./qr :

  construction-brand-qr.png            plain QR, brand navy on white
  construction-brand-qr.svg            vector QR, for the print shop
  construction-brand-qr-framed.png     branded frame, logo at the 4 CORNERS
  construction-brand-qr-framed-edges.png   branded frame, logo on the 4 EDGES
  construction-brand-table-tent.png    A5 portrait @300dpi, ready to print

Every generated PNG is machine-decoded before the script exits. If a file
cannot be read back, the script FAILS instead of handing you a dead QR.

Usage
-----
    python tools/generate_qr.py
    python tools/generate_qr.py --url https://yourname.github.io/cb-event/

With no --url it reads the `url:` value out of data/event.js, so the QR and
the page can never drift apart.

Requires: qrcode, pillow   (opencv-python-headless enables the scan check)
"""

import argparse
import os
import re
import sys

try:
    import qrcode
    from qrcode.constants import ERROR_CORRECT_H
except ImportError:
    sys.exit("Missing dependency. Run:  python -m pip install qrcode pillow")

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from qrcode.image.styledpil import StyledPilImage
try:
    from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
except ImportError:                                   # older qrcode releases
    from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import VerticalGradiantColorMask

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "qr")
LOGO_PNG = os.path.join(ROOT, "assets", "img", "logo.png")          # mark only
LOGO_FULL = os.path.join(ROOT, "assets", "img", "logo-full.png")    # with wordmark
WORDMARK_LIGHT = os.path.join(ROOT, "assets", "img", "wordmark-light.png")  # for navy

NAVY = (28, 53, 71)
NAVY_DEEP = (14, 32, 42)
TEAL = (46, 138, 155)
TEAL_DEEP = (31, 95, 110)      # bottom of the module gradient: still 9:1 on white
WHITE = (255, 255, 255)
PAPER = (244, 247, 248)
GREY = (126, 149, 159)

SS = 4          # supersampling factor for the drawn mark


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #

def url_from_event_js():
    path = os.path.join(ROOT, "data", "event.js")
    try:
        with open(path, encoding="utf-8") as fh:
            src = fh.read()
    except OSError:
        return None
    m = re.search(r'\burl\s*:\s*["\']([^"\']+)["\']', src)
    return m.group(1) if m else None


def font(size, bold=False):
    names = (["arialbd.ttf", "segoeuib.ttf", "DejaVuSans-Bold.ttf"] if bold
             else ["arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"])
    for n in names:
        for base in (r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu", ""):
            try:
                return ImageFont.truetype(os.path.join(base, n) if base else n, size)
            except OSError:
                continue
    return ImageFont.load_default()


def text_width(draw, s, f):
    return draw.textbbox((0, 0), s, font=f)[2]


def centre(draw, y, s, f, fill, width):
    draw.text(((width - text_width(draw, s, f)) / 2, y), s, font=f, fill=fill)


# --------------------------------------------------------------------------- #
# the mark
# --------------------------------------------------------------------------- #

def draw_mark(size):
    """The CB monogram, drawn from scratch so the script needs no image file.
    Used only when assets/img/logo.png is absent."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def box(cx, cy, r):
        return [cx - r, cy - r, cx + r, cy + r]

    stroke = int(0.115 * S)

    # teal C — gap on the right, drawn clockwise from 55 deg round to 305 deg
    d.arc(box(0.42 * S, 0.56 * S, 0.29 * S), 55, 305, fill=TEAL, width=stroke)

    # navy B: stem plus two bowls
    x = 0.50 * S
    d.line([(x, 0.30 * S), (x, 0.85 * S)], fill=NAVY, width=stroke)
    d.arc(box(0.605 * S, 0.435 * S, 0.135 * S), 270, 90, fill=NAVY, width=stroke)
    d.arc(box(0.615 * S, 0.705 * S, 0.147 * S), 270, 90, fill=NAVY, width=stroke)

    # crane boom across the top, with the hoist line
    top, bot = 0.115 * S, 0.185 * S
    d.line([(0.20 * S, top), (0.94 * S, top)], fill=TEAL, width=int(0.030 * S))
    d.line([(0.20 * S, bot), (0.94 * S, bot)], fill=TEAL, width=int(0.030 * S))
    step = (0.94 - 0.20) * S / 5.0
    for i in range(5):
        x0 = 0.20 * S + i * step
        d.line([(x0, bot), (x0 + step / 2, top), (x0 + step, bot)],
               fill=TEAL, width=int(0.022 * S))
    d.line([(0.86 * S, bot), (0.86 * S, 0.60 * S)], fill=TEAL, width=int(0.018 * S))

    return img.resize((size, size), Image.LANCZOS)


def load_mark(size):
    """Official artwork if the client dropped it in, otherwise the drawing."""
    if os.path.exists(LOGO_PNG):
        m = Image.open(LOGO_PNG).convert("RGBA")
        m.thumbnail((size, size), Image.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
        return canvas
    return draw_mark(size)


def badge(diameter):
    """The mark on a white disc - exactly how the brand uses it on Instagram,
    and the only way a navy-and-teal logo stays legible on a navy frame. A
    thin light-teal ring lifts the disc off the navy so it reads as a badge
    even at table-tent size."""
    d4 = diameter * SS
    disc = Image.new("RGBA", (d4, d4), (0, 0, 0, 0))
    dd = ImageDraw.Draw(disc)
    ring = max(2, int(d4 * 0.035))
    dd.ellipse([0, 0, d4 - 1, d4 - 1], fill=(124, 200, 214, 255))          # ring
    dd.ellipse([ring, ring, d4 - 1 - ring, d4 - 1 - ring], fill=WHITE + (255,))
    disc = disc.resize((diameter, diameter), Image.LANCZOS)

    inner = int(diameter * 0.80)
    mark = load_mark(inner)
    disc.paste(mark, ((diameter - inner) // 2, (diameter - inner) // 2), mark)
    return disc


# --------------------------------------------------------------------------- #
# QR builders
# --------------------------------------------------------------------------- #

def build(url, px=2400):
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H,
                       box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    # render at native size close to the target so the rounded modules are
    # drawn crisp instead of being upscaled
    qr.box_size = max(4, px // (qr.modules_count + 8))
    return qr


def plain_png(qr, px):
    """Rounded modules with a navy -> deep-teal gradient. Both ends of the
    gradient stay far above the contrast a scanner needs; the finder squares
    keep their geometry, only their corners soften."""
    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=VerticalGradiantColorMask(back_color=WHITE, top_color=NAVY,
                                             bottom_color=TEAL_DEEP),
    ).convert("RGB")
    return img.resize((px, px), Image.LANCZOS)


def with_centre_mark(qr_img):
    """The full lockup - the mark with CONSTRUCTION BRAND right under it - on
    a rounded white plate in the middle of the code. Error correction H
    tolerates ~30% loss; the plate is held near 8% of the code's area and
    every output is decoded back at several scales before it is kept."""
    px = qr_img.width
    if os.path.exists(LOGO_FULL):
        mark = Image.open(LOGO_FULL).convert("RGBA")
        mark.thumbnail((int(px * 0.21), int(px * 0.27)), Image.LANCZOS)   # portrait lockup
        pad = int(mark.width * 0.13)
    else:
        side = int(px * 0.19)
        mark = load_mark(side)
        pad = int(side * 0.17)
    pw, ph = mark.width + pad * 2, mark.height + pad * 2
    # rounded plate, to sit with the rounded modules rather than fight them
    plate = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle([0, 0, pw - 1, ph - 1],
                                            radius=int(min(pw, ph) * 0.22), fill=WHITE + (255,))
    plate.paste(mark, (pad, pad), mark)

    out = qr_img.copy()
    out.paste(plate, ((px - pw) // 2, (px - ph) // 2), plate)
    return out


def truss(d, x0, x1, y, th, color, alpha=255):
    """The warren truss from the crane boom - the same motif that divides the
    site header. Drawn between two x positions, centred on y."""
    top, bot = y - th // 2, y + th // 2
    lw = max(2, th // 7)
    col = color + (alpha,)
    d.line([(x0, top), (x1, top)], fill=col, width=lw)
    d.line([(x0, bot), (x1, bot)], fill=col, width=lw)
    step = th * 2.4
    x = x0
    while x + step <= x1 + 1:
        d.line([(x, bot), (x + step / 2, top), (x + step, bot)], fill=col, width=lw)
        x += step


def framed(qr_img, style="corners"):
    """Brand frame around the code: a navy card with rounded corners, the same
    teal glow as the site header, the truss motif, and the real mark in white
    discs. Every mark sits OUTSIDE the QR and its quiet zone, so none of this
    can affect scanning."""
    q = qr_img.width
    band = int(q * 0.26)                 # navy frame thickness - room for real badges
    S = q + band * 2
    R = int(S * 0.055)                   # card corner radius

    # -- navy card with a soft teal glow, clipped to the rounded shape --
    base = Image.new("RGBA", (S, S), NAVY + (255,))
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gr = int(S * 0.6)
    ImageDraw.Draw(glow).ellipse([S - gr * 1.1, -gr * 0.5, S + gr * 0.3, gr * 0.9],
                                 fill=TEAL + (85,))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.07))
    base.alpha_composite(glow)

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=R, fill=255)
    card = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    card.paste(base, (0, 0), mask)
    d = ImageDraw.Draw(card)

    # -- white panel behind the code, slightly larger than the code itself --
    pad = int(band * 0.20)
    d.rounded_rectangle([band - pad, band - pad, S - band + pad, S - band + pad],
                        radius=int(band * 0.28), fill=WHITE + (255,))
    card.paste(qr_img.convert("RGBA"), (band, band))

    # -- the marks --
    size = int(band * 0.84)
    disc = badge(size)
    off = (band - size) // 2

    if style == "edges":
        spots = [((S - size) // 2, off),                  # top
                 ((S - size) // 2, S - size - off),       # bottom
                 (off, (S - size) // 2),                  # left
                 (S - size - off, (S - size) // 2)]       # right
    else:
        spots = [(off, off), (S - size - off, off),
                 (off, S - size - off), (S - size - off, S - size - off)]
        gap = int(band * 0.28)
        x0, x1 = off + size + gap, S - off - size - gap
        # truss between the top discs ...
        truss(d, x0, x1, band // 2, int(band * 0.16), TEAL, 200)
        # ... and the wordmark between the bottom ones, so the brand is read
        # in words as well as seen in the mark
        if os.path.exists(WORDMARK_LIGHT):
            wm = Image.open(WORDMARK_LIGHT).convert("RGBA")
            wm.thumbnail((x1 - x0, int(band * 0.66)), Image.LANCZOS)
            card.paste(wm, ((S - wm.width) // 2, S - band // 2 - wm.height // 2), wm)
        else:
            truss(d, x0, x1, S - band // 2, int(band * 0.16), TEAL, 200)

    for xy in spots:
        card.paste(disc, xy, disc)

    return card


def write_svg(qr, path):
    """Hand-rolled SVG so the print shop gets true vector, no extra deps."""
    matrix = qr.get_matrix()
    n = len(matrix)
    border = 4
    size = n + border * 2

    rects = []
    for y, row in enumerate(matrix):
        x = 0
        while x < n:
            if row[x]:
                run = 1
                while x + run < n and row[x + run]:
                    run += 1
                rects.append('<rect x="%d" y="%d" width="%d" height="1"/>'
                             % (x + border, y + border, run))
                x += run
            else:
                x += 1

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
           'shape-rendering="crispEdges" width="1000" height="1000">\n'
           '  <rect width="%d" height="%d" fill="#FFFFFF"/>\n'
           '  <g fill="#1C3547">\n    %s\n  </g>\n</svg>\n'
           % (size, size, size, size, "\n    ".join(rects)))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(svg)


def table_tent(framed_img, url, path):
    """A5 portrait at 300 dpi - the card that sits on each table. White page,
    the full lockup at the top where there is room for the wordmark, then
    the framed code."""
    W, H = 1748, 2480
    card = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(card)

    f_head = font(84, True)
    f_sub, f_url, f_small = font(44), font(34, True), font(32)

    y = 110
    if os.path.exists(LOGO_FULL):
        lock = Image.open(LOGO_FULL).convert("RGBA")
        lock.thumbnail((int(W * 0.42), 520), Image.LANCZOS)
        card.paste(lock, ((W - lock.width) // 2, y), lock)
        y += lock.height + 70
    else:
        centre(d, y, "CONSTRUCTION BRAND", font(38, True), TEAL, W)
        y += 90

    centre(d, y, "PROJECT OWNERS EVENING", f_head, NAVY, W)
    y += 130

    side = 1080
    q = framed_img.resize((side, side), Image.LANCZOS)
    qx = (W - side) // 2
    card.paste(q, (qx, y), q)
    y += side + 96

    centre(d, y, "SCAN FOR TONIGHT'S PROGRAMME", f_sub, NAVY, W)
    short = url.replace("https://", "").replace("http://", "").rstrip("/")
    centre(d, y + 84, short, f_url, TEAL, W)

    d.line([(W * 0.22, y + 176), (W * 0.78, y + 176)], fill=PAPER, width=5)
    centre(d, y + 208, "Grand Millennium Sulaimani  ·  Monday 21 September, 16:30", f_small, GREY, W)
    centre(d, y + 256, "0770 307 5050  -  0770 308 5050", f_small, GREY, W)

    card.save(path, "PNG", optimize=True)


# --------------------------------------------------------------------------- #
# verification
# --------------------------------------------------------------------------- #

def verify(paths, url):
    """Decode every generated PNG and confirm it still carries the URL.
    A branded QR that does not scan is worse than no QR at all."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("\n!! opencv not installed - SKIPPING the scan check.")
        print("!! Run: python -m pip install opencv-python-headless")
        print("!! Then scan every printed file with two real phones before printing.")
        return True

    det = cv2.QRCodeDetector()
    scales = (0.15, 0.20, 0.25, 0.30, 0.40, 0.50)   # print-like sizes
    ok = True
    print("\nScan check (decoded back from the generated image, at full size")
    print("and at %s of it; full size must pass, and at most one small scale may miss):"
          % ", ".join("%d%%" % int(s * 100) for s in scales))
    for p in paths:
        img = cv2.imread(p)
        h, w = img.shape[:2]

        def read(scale):
            s = img if scale == 1.0 else cv2.resize(
                img, (max(1, int(w * scale)), max(1, int(h * scale))), interpolation=cv2.INTER_AREA)
            try:
                return det.detectAndDecode(s)[0]
            except cv2.error:
                return ""

        full = read(1.0)
        small = [read(s) == url for s in scales]
        pattern = "".join("o" if hit else "-" for hit in small)
        name = os.path.basename(p)
        if full == url and small.count(False) <= 1:
            print("  OK    %-40s full:yes  small:%s" % (name, pattern))
        elif full and full != url:
            print("  WRONG %-40s decoded: %s" % (name, full))
            ok = False
        else:
            print("  FAIL  %-40s full:%s  small:%s" % (name, "yes" if full == url else "no", pattern))
            ok = False
    return ok


# --------------------------------------------------------------------------- #

def main():
    ap = argparse.ArgumentParser(description="Generate the event QR code.")
    ap.add_argument("--url", help="URL the QR should point at")
    ap.add_argument("--px", type=int, default=2400, help="QR size in pixels")
    args = ap.parse_args()

    url = args.url or url_from_event_js()
    if not url:
        sys.exit("No URL given and none found in data/event.js. Pass --url.")
    if "example.github.io" in url:
        print("!! WARNING: still the placeholder URL from data/event.js.")
        print("!! Set the real one before printing anything.\n")

    os.makedirs(OUT, exist_ok=True)
    qr = build(url, args.px)

    base = plain_png(qr, args.px)
    centred = with_centre_mark(base)

    p_plain = os.path.join(OUT, "construction-brand-qr.png")
    p_svg = os.path.join(OUT, "construction-brand-qr.svg")
    p_corn = os.path.join(OUT, "construction-brand-qr-framed.png")
    p_edge = os.path.join(OUT, "construction-brand-qr-framed-edges.png")
    p_tent = os.path.join(OUT, "construction-brand-table-tent.png")

    centred.save(p_plain, "PNG", optimize=True)
    write_svg(qr, p_svg)

    corners = framed(centred, "corners")
    edges = framed(centred, "edges")
    corners.save(p_corn, "PNG", optimize=True)
    edges.save(p_edge, "PNG", optimize=True)
    table_tent(corners, url, p_tent)

    print("QR target : %s" % url)
    print("Version   : %d  (error correction H, ~30%% damage tolerance)" % qr.version)
    for p in (p_plain, p_svg, p_corn, p_edge, p_tent):
        print("Wrote     : %s" % os.path.relpath(p, ROOT))

    if not verify([p_plain, p_corn, p_edge, p_tent], url):
        sys.exit("\nFAILED: at least one generated QR did not decode. "
                 "Do not print these.")
    print("\nAll generated codes decode back to the target URL.")


if __name__ == "__main__":
    main()
