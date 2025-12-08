-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Public can view safe columns of published projects" ON public.projects;

-- Create a new policy that allows anyone to view published projects
CREATE POLICY "Anyone can view published projects"
ON public.projects
FOR SELECT
USING (is_published = true);