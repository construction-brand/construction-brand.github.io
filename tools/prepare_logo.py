#!/usr/bin/env python3
"""
Construction Brand - logo preparation
=====================================

Takes the official artwork (logo@2x.png in the project root, or any file you
pass with --src) and derives what the site and the QR generator need:

  assets/img/logo.png        the MARK only (C + B + crane), square, transparent
                             -> page header badge, QR corner badges, QR centre
  assets/img/logo-full.png   the full lockup with the wordmark, trimmed
                             -> table tent
  assets/img/icon-512.png    mark on a navy rounded square
                             -> Android / iOS add-to-home-screen icon
  assets/img/og.png          1200 x 630 share card
                             -> WhatsApp / Telegram / Instagram link preview

The crane hook in the artwork doubles as the "O" of CONSTRUCTION, so there is
no empty row between mark and wordmark. The mark is cut where the body of the
C/B ends and only the thin hoist cable continues - that reads as the mark on
its own.

Usage
-----
    python tools/prepare_logo.py
    python tools/prepare_logo.py --src path/to/logo.png
"""

import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    import numpy as np
except ImportError:
    sys.exit("numpy is needed (it comes with opencv-python-headless).")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")

NAVY = (28, 53, 71)
TEAL = (46, 138, 155)
WHITE = (255, 255, 255)


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


# --------------------------------------------------------------------------- #

def to_rgba(src):
    """Return the artwork as RGBA with a real alpha channel. A flat white
    background is converted to transparency using distance-from-white, which
    keeps anti-aliased edges soft."""
    img = Image.open(src).convert("RGBA")
    arr = np.asarray(img).astype(np.int16)
    alpha = arr[..., 3]

    if alpha.min() < 250:                      # already has transparency
        return img

    whiteness = arr[..., :3].min(axis=2)       # 255 for pure white
    new_alpha = np.clip((255 - whiteness) * (255.0 / 55.0), 0, 255).astype(np.uint8)
    out = arr[..., :3].astype(np.uint8)
    return Image.fromarray(np.dstack([out, new_alpha]), "RGBA")


def bbox_of(img):
    a = np.asarray(img)[..., 3]
    ys, xs = np.where(a > 8)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def pad_square(img, margin=0.06):
    """Centre on a transparent square with a little breathing room."""
    w, h = img.size
    side = int(max(w, h) * (1 + margin * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return canvas


def split_mark(lockup):
    """Cut the mark off the top of the lockup. Scan downward for the first row
    where almost nothing is drawn - that is the hoist cable alone, just below
    the body of the C and B."""
    a = np.asarray(lockup)[..., 3]
    h, w = a.shape
    occ = (a > 8).sum(axis=1)                 # opaque pixels per row
    start, end = int(h * 0.40), int(h * 0.80)
    thin = occ[start:end] < w * 0.02
    if not thin.any():
        return lockup                          # unknown artwork: use as is
    cut = start + int(np.argmax(thin))         # first cable-only row
    mark = lockup.crop((0, 0, w, cut))
    x0, y0, x1, y1 = bbox_of(mark)
    return mark.crop((x0, y0, x1, y1))


# --------------------------------------------------------------------------- #

def make_icon(mark, side=512):
    icon = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ImageDraw.Draw(icon).rounded_rectangle([0, 0, side - 1, side - 1],
                                           radius=int(side * 0.21), fill=NAVY + (255,))
    disc = int(side * 0.78)
    badge = Image.new("RGBA", (disc, disc), (0, 0, 0, 0))
    ImageDraw.Draw(badge).ellipse([0, 0, disc - 1, disc - 1], fill=WHITE + (255,))
    inner = int(disc * 0.72)
    m = mark.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    badge.paste(m, ((disc - m.width) // 2, (disc - m.height) // 2), m)
    icon.paste(badge, ((side - disc) // 2, (side - disc) // 2), badge)
    return icon


def make_og(lockup):
    """1200 x 630 - what WhatsApp shows when the link is pasted."""
    W, H = 1200, 630
    card = Image.new("RGB", (W, H), NAVY)

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W - 620, -260, W + 180, 480], fill=TEAL + (80,))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    card.paste(glow, (0, 0), glow)

    d = ImageDraw.Draw(card)

    # white panel with the full lockup on the left
    px, py, pw, ph = 64, 64, 440, 502
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=28, fill=WHITE)
    m = lockup.copy()
    m.thumbnail((pw - 80, ph - 80), Image.LANCZOS)
    card.paste(m, (px + (pw - m.width) // 2, py + (ph - m.height) // 2), m)

    # copy on the right
    x = 570
    d.text((x, 150), "EVENING PROGRAMME", font=font(26, True), fill=TEAL)
    d.text((x, 196), "Project Owners", font=font(74, True), fill=WHITE)
    d.text((x, 282), "Evening", font=font(74, True), fill=WHITE)
    d.text((x, 400), "Grand Millennium Sulaimani", font=font(34), fill=(157, 182, 194))
    d.text((x, 446), "Monday 21 September 2026  ·  16:30", font=font(34), fill=(157, 182, 194))

    # truss along the bottom, off the logo
    ty, th, step = H - 40, 22, 60
    d.line([(0, ty), (W, ty)], fill=TEAL, width=3)
    d.line([(0, ty + th), (W, ty + th)], fill=TEAL, width=3)
    xx = 0
    while xx < W:
        d.line([(xx, ty + th), (xx + step // 2, ty), (xx + step, ty + th)], fill=TEAL, width=3)
        xx += step
    return card


# --------------------------------------------------------------------------- #

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join(ROOT, "logo@2x.png"))
    args = ap.parse_args()
    if not os.path.exists(args.src):
        sys.exit("Artwork not found: %s" % args.src)

    os.makedirs(IMG, exist_ok=True)

    art = to_rgba(args.src)
    x0, y0, x1, y1 = bbox_of(art)
    lockup = art.crop((x0, y0, x1, y1))
    mark = split_mark(lockup)

    p_mark = os.path.join(IMG, "logo.png")
    p_full = os.path.join(IMG, "logo-full.png")
    p_icon = os.path.join(IMG, "icon-512.png")
    p_og = os.path.join(IMG, "og.png")

    pad_square(mark).save(p_mark, "PNG", optimize=True)
    lockup.save(p_full, "PNG", optimize=True)
    make_icon(mark).save(p_icon, "PNG", optimize=True)
    make_og(lockup).save(p_og, "PNG", optimize=True)

    print("source      : %s  (%dx%d)" % (os.path.relpath(args.src, ROOT), *art.size))
    print("lockup bbox : %dx%d" % lockup.size)
    print("mark crop   : %dx%d  (cut at %.0f%% of lockup height)"
          % (mark.size[0], mark.size[1], 100.0 * mark.size[1] / lockup.size[1]))
    for p in (p_mark, p_full, p_icon, p_og):
        im = Image.open(p)
        print("wrote       : %-26s %dx%d" % (os.path.relpath(p, ROOT), *im.size))


if __name__ == "__main__":
    main()
