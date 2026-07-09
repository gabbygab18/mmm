-- Add optional YouTube channel URL to musician profiles.
-- Musicians self-manage their channel content; the app simply links to it.
ALTER TABLE musicians
  ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT;

ALTER TABLE musicians
  ADD CONSTRAINT musicians_youtube_channel_url_check CHECK (
    youtube_channel_url IS NULL
    OR youtube_channel_url ~* '^https?://(www\.)?youtube\.com/(@|c/|channel/|user/).+'
  );
