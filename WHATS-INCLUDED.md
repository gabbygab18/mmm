# MMM — Favicon

Extract over the repo root; paths already match.

## Files
- public/favicon.ico, favicon-16x16.png, favicon-32x32.png
- public/apple-touch-icon.png (iOS home screen)
- public/android-chrome-192x192.png, android-chrome-512x512.png (Android / PWA)
- public/site.webmanifest  (filled in: name "Margaret's MemoryCare Music",
  short_name "MMM", theme_color #0a2f5a, background_color #faf4e7)
- src/app/layout.tsx  — added metadata.icons + metadata.manifest (overwrite is safe;
  this is your current layout with only that block added)

## After deploying
Browsers cache favicons hard. If the old icon lingers, hard-refresh
(Ctrl/Cmd-Shift-R) or open the tab in a private window to confirm.
