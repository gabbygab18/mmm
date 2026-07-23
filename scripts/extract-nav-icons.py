#!/usr/bin/env python3
"""The design pack exports each sidebar row as one image (icon + label text).

Only the glyph is needed — the label is set live in Poppins. This finds the
vertical gap between the icon and the text, crops the icon out, and writes it
as a square white-on-transparent PNG.
"""
import os
import numpy as np
from PIL import Image

SRC = '/home/claude/work/assets'
DST = '/home/claude/work/repo/MMM/public/mmm/nav'
os.makedirs(DST, exist_ok=True)

JOBS = {
    # musician / facility sidebar
    'dashboard':    'MMM Musician Dashboard/Dashboard.png',
    'performances': 'MMM Musician Dashboard/Upcoming Performances.png',
    'availability': 'MMM Musician Dashboard/Availability.png',
    'hours':        'MMM Musician Dashboard/Volunteer Hours.png',
    'resources':    'MMM Musician Dashboard/Resources.png',
    'notifications':'MMM Musician Dashboard/Notifications.png',
    'profile':      'MMM Musician Dashboard/Profile.png',
    # admin sidebar
    'musicians':    'MMM Admin Dashboard Assets/Musicians.png',
    'facilities':   'MMM Admin Dashboard Assets/Facilities.png',
    'bookings':     'MMM Admin Dashboard Assets/Bookings.png',
    'education':    'MMM Admin Dashboard Assets/Education Library.png',
    'video':        'MMM Admin Dashboard Assets/Performacnce Video.png',
    'songs':        'MMM Admin Dashboard Assets/Song Library.png',
    'announcement': 'MMM Admin Dashboard Assets/Announcement.png',
    'adminresources':'MMM Admin Dashboard Assets/Resources.png',
    'reports':      'MMM Admin Dashboard Assets/Reports.png',
    'analytics':    'MMM Admin Dashboard Assets/Analytics.png',
    'settings':     'MMM Admin Dashboard Assets/Settings.png',
    # support card
    'support':      'MMM Musician Dashboard/Need Help icon.png',
}


def icon_only(path, out, size=96):
    im = Image.open(path).convert('RGBA')
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    a = np.array(im)[:, :, 3]
    cols = (a > 25).sum(axis=0)

    # Walk right from the glyph until a run of empty columns appears — that's
    # the gap before the label.
    gap_start = None
    run = 0
    for x, v in enumerate(cols):
        if v == 0:
            run += 1
            if run >= 8 and x > 12:
                gap_start = x - run + 1
                break
        else:
            run = 0

    glyph = im.crop((0, 0, gap_start, im.height)) if gap_start else im
    b = glyph.getbbox()
    if b:
        glyph = glyph.crop(b)

    # Pad to a square so every icon optically aligns in the nav.
    side = max(glyph.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(glyph, ((side - glyph.width) // 2, (side - glyph.height) // 2), glyph)
    canvas = canvas.resize((size, size), Image.LANCZOS)
    canvas.save(out, optimize=True)
    return canvas.size, gap_start


for name, rel in JOBS.items():
    src = os.path.join(SRC, rel)
    if not os.path.exists(src):
        print(f'  !! MISSING {rel}')
        continue
    size, gap = icon_only(src, os.path.join(DST, f'{name}.png'))
    print(f'  {name:16s} icon={size} split_at={gap}')

print('\nTotal:', sum(os.path.getsize(os.path.join(DST, f)) for f in os.listdir(DST)) // 1024, 'KB')
