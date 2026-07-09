-- Sprint 6: Allow YouTube Shorts URLs in event media attachments

ALTER TABLE public.event_media
  DROP CONSTRAINT IF EXISTS event_media_youtube_url_check;

ALTER TABLE public.event_media
  ADD CONSTRAINT event_media_youtube_url_check
  CHECK (
    youtube_url ~* '^https?://(www\.)?(youtube\.com/(watch\?v=|shorts/)|youtu\.be/).+'
  );
