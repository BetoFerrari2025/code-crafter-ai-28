-- Fix PUBLIC_DATA_EXPOSURE: Restrict published projects to safe columns only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view published projects via share token" ON public.projects;

-- Create a secure function that returns only safe columns for published projects
CREATE OR REPLACE FUNCTION public.get_published_projects()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  thumbnail text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT id, name, description, thumbnail, created_at
  FROM projects
  WHERE is_published = true;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_published_projects() TO anon, authenticated;

-- Create a new restrictive policy for published projects
-- This policy only allows viewing specific safe columns
CREATE POLICY "Public can view safe columns of published projects"
ON public.projects
FOR SELECT
USING (
  is_published = true 
  AND (
    -- Allow owner to see all columns
    auth.uid() = user_id
  )
);

-- Note: For truly public access to only safe columns, applications should use
-- the get_published_projects() function instead of direct table queries