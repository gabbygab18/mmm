#!/usr/bin/env python3
"""Pull the mobile-layout artwork into public/mmm/mobile/.

Same rule as the desktop pack: only real artwork is taken. Anything that is
copy rendered as an image (headings, labels, button captions) is skipped, since
type is set live in Cormorant Garamond and Poppins.
"""
import os
from PIL import Image

SRC = '/home/claude/work/mobile/Mobile layout'
DST = '/home/claude/work/repo/MMM/public/mmm/mobile'
os.makedirs(DST, exist_ok=True)

MANIFEST = {
    # page heroes / backgrounds
    'about-hero.png':        'About/Header Image.png',
    'about-margaret.png':    'About/Maragaret_s Image.png',
    'about-notes.png':       'About/Music Notes design.png',
    'about-timeline.png':    'About/Timeline icons.png',
    'faq-bg.png':            'FAQ Mobile/BG Design.png',
    'faq-notes.png':         'FAQ Mobile/Musical Notes design.png',
    'contact-bg.png':        'Contact Page/BG Design.png',
    'contact-map.png':       'Contact Page/Palm Beach Map.png',
    'how-hero.png':          'How it works mobile/Header Image.png',
    'edu-hero.png':          'First time Edu Mobile/Header Image.png',
    'home-bg.png':           'Homepage Mobile Assets/BG Image.png',
    'getstarted-bg.png':     'Get Started Mobile Assets/BG Design.png',
    'reg-bg.png':            'Facility Registration Mobile Assets/Step 1/BG Design.png',
    # dashboard headers
    'dash-facility.png':     'Facility Dashboard/Header Image.png',
    'dash-admin.png':        'Admin Dashboard Mobile/Header Image.png',
    'request-hero.png':      'Request a performance/Header Image.png',
}


def trim(rel, out, max_w=1100):
    src = os.path.join(SRC, rel)
    if not os.path.exists(src):
        print(f'  !! MISSING {rel}')
        return None
    im = Image.open(src).convert('RGBA')
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(os.path.join(DST, out), optimize=True)
    return im.size


for out, rel in MANIFEST.items():
    size = trim(rel, out)
    if size:
        print(f'  {out:22s} {size}')

total = sum(os.path.getsize(os.path.join(DST, f)) for f in os.listdir(DST))
print(f'\nTotal: {total // 1024} KB')
