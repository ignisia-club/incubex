-- Migration 01: Create Storage Bucket and RLS Policies for PPTs

-- 1. Create the bucket (private by default)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incubex-ppts', 'incubex-ppts', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enforce RLS on storage.objects (Supabase enforces this by default, but we are explicitly defining policies)

-- Allow public users (the upload page) to upload files into the bucket
-- Note: We will handle tying the file to the specific team via the database 'submissions' table
CREATE POLICY "Allow public to upload PPTs"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'incubex-ppts' );

-- Only authenticated admins can view and download the PPTs
CREATE POLICY "Allow authenticated to view PPTs"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'incubex-ppts' );
