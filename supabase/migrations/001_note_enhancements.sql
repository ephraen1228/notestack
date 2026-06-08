-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- Note columns for pin and color
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

-- Storage bucket for note image attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "Users upload own note images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for embedded images
CREATE POLICY "Public read note images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'note-attachments');

-- Users can delete their own uploads
CREATE POLICY "Users delete own note images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
