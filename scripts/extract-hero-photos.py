#!/usr/bin/env python3
"""The hero banners in the design pack are flattened composites at ~1.8:1, but
the mockup hero band is ~2.46:1 with the photo filling 90% of its height. The
composite therefore can't reproduce the layout at any crop or scale — the
designer placed the photo, the music-staff artwork and the wave as separate
layers in a wider band.

This pulls the photograph out of each composite as its own cutout, with a soft
left edge so it blends into whatever background sits behind it, and reports the
background colour to use for the band.
"""
import os
import numpy as np
from PIL import Image

SRC = '/home/claude/work/repo/MMM/public/mmm/pages'
DST = SRC

# (file, photo left column, photo bottom row) measured from the artwork
JOBS = [
    ('about-hero.png', 'hero-photo-about.png', 600, 430),
    ('faq-hero.png',   'hero-photo-faq.png',   715, 250),
    ('wmm-hero.png',   'hero-photo-wmm.png',   480, 370),
]

FEATHER = 90  # px of left-edge fade, in source pixels


def extract(src, out, x0, y1):
    im = Image.open(os.path.join(SRC, src)).convert('RGBA')
    w, h = im.size
    photo = im.crop((x0, 0, w, min(y1, h)))

    # Feather the left edge so the cutout dissolves into the band background.
    a = np.array(photo)
    alpha = a[:, :, 3].astype(float)
    ramp = np.clip(np.arange(photo.width) / FEATHER, 0, 1)
    a[:, :, 3] = (alpha * ramp[None, :]).astype(np.uint8)
    Image.fromarray(a).save(os.path.join(DST, out), optimize=True)
    return photo.size


def sample_bg(src, y):
    """Average colour of the far-left background strip at a given row."""
    im = Image.open(os.path.join(SRC, src)).convert('RGB')
    a = np.array(im).astype(int)
    strip = a[max(0, y - 10):y + 10, 0:80]
    r, g, b = strip.mean(axis=(0, 1))
    return '#%02x%02x%02x' % (int(r), int(g), int(b))


for src, out, x0, y1 in JOBS:
    size = extract(src, out, x0, y1)
    top = sample_bg(src, 40)
    mid = sample_bg(src, y1 // 2)
    print(f'  {out:24s} {size}  bg_top={top} bg_mid={mid}')
