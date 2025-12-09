ALTER TABLE messages
ADD COLUMN image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-images' );

CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'chat-images' );
