
-- Replace overly permissive policy with user-scoped insert policy
DROP POLICY "Service role can manage credits" ON public.user_daily_credits;

-- Only allow users to insert their own records (edge function uses SECURITY DEFINER function anyway)
CREATE POLICY "Users can insert their own credits"
ON public.user_daily_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
ON public.user_daily_credits FOR UPDATE
USING (auth.uid() = user_id);
