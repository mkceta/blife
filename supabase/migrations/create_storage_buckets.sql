-- Storage buckets and policies for BLife app

-- Create 'listings' bucket for marketplace product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own listing folders
DROP POLICY IF EXISTS "Users can upload to listings bucket" ON storage.objects;
CREATE POLICY "Users can upload to listings bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listings');

-- Allow authenticated users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listings');

-- Allow everyone to view listing images (public bucket)
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
CREATE POLICY "Anyone can view listing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');

-- =============================================
-- POSTS BUCKET
-- =============================================

-- Create 'posts' bucket for community post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to posts bucket
DROP POLICY IF EXISTS "Users can upload to posts bucket" ON storage.objects;
CREATE POLICY "Users can upload to posts bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

-- Allow authenticated users to update their own posts images
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posts');

-- Allow authenticated users to delete their own posts images
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts');

-- Allow everyone to view post images
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

-- =============================================
-- AVATARS BUCKET
-- =============================================

-- Create 'avatars' bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow everyone to view avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =============================================
-- FLATS BUCKET
-- =============================================

-- Create 'flats' bucket for flat/apartment rental images
INSERT INTO storage.buckets (id, name, public)
VALUES ('flats', 'flats', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to flats bucket
DROP POLICY IF EXISTS "Users can upload to flats bucket" ON storage.objects;
CREATE POLICY "Users can upload to flats bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'flats');

-- Allow authenticated users to update their own flat images
DROP POLICY IF EXISTS "Users can update their own flat images" ON storage.objects;
CREATE POLICY "Users can update their own flat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'flats');

-- Allow authenticated users to delete their own flat images
DROP POLICY IF EXISTS "Users can delete their own flat images" ON storage.objects;
CREATE POLICY "Users can delete their own flat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'flats');

-- Allow everyone to view flat images
DROP POLICY IF EXISTS "Anyone can view flat images" ON storage.objects;
CREATE POLICY "Anyone can view flat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'flats');
