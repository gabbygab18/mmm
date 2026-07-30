-- ============================================================================
-- Profile photo uploads — Supabase Storage bucket + policies
--
-- Reported by the client (July 2026): on musician registration step 2 the photo
-- "isn't uploading after i selected my profile pic".
--
-- Cause: the wizard only recorded the chosen file's *name* in React state. There
-- was nowhere to put the bytes — the project had no Storage buckets at all, and
-- `musicians.profile_image_url` / `centers.profile_image_url` were URL-only
-- fields that a normal user has no way to fill in.
--
-- This adds the one bucket those URL fields can point at. Layout is
--   profile-images/<auth user id>/profile-<timestamp>.<ext>
-- so the owner check is simply the first path segment.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bucket — public read (profile photos appear on public discovery pages),
--    5 MB ceiling and JPEG/PNG only, matching what the wizard advertises.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- file_size_limit / allowed_mime_types only exist on newer storage schemas, so
-- set them separately rather than failing the whole migration on an older one.
-- The client-side check in src/lib/mmm/profile-photo.ts enforces the same limits.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'allowed_mime_types'
  ) THEN
    UPDATE storage.buckets
    SET file_size_limit    = 5242880, -- 5 MB
        allowed_mime_types = ARRAY['image/jpeg', 'image/png']
    WHERE id = 'profile-images';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Policies — anyone may read, but a signed-in user may only write inside
--    their own <user id>/ folder. Scoped to this bucket so no other bucket
--    added later inherits these rules.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
CREATE POLICY "profile_images_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert_own" ON storage.objects;
CREATE POLICY "profile_images_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_images_update_own" ON storage.objects;
CREATE POLICY "profile_images_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_images_delete_own" ON storage.objects;
CREATE POLICY "profile_images_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
