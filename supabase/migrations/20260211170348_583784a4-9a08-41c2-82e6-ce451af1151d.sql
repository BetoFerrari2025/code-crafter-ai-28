
-- Table to track daily credit usage per user
CREATE TABLE public.user_daily_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  max_credits INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.user_daily_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_daily_credits FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all credits
CREATE POLICY "Service role can manage credits"
ON public.user_daily_credits FOR ALL
USING (true);

-- Function to check and increment credits (called from edge function with service role)
CREATE OR REPLACE FUNCTION public.check_and_use_credit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_used INTEGER;
  v_max_credits INTEGER;
  v_plan TEXT;
BEGIN
  -- Check user subscription plan
  SELECT plan_name INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  -- Set max credits based on plan
  IF v_plan = 'start' THEN
    v_max_credits := 20;
  ELSIF v_plan = 'pro' THEN
    v_max_credits := 50;
  ELSIF v_plan = 'premium' THEN
    v_max_credits := 999999;
  ELSE
    v_max_credits := 5;
  END IF;

  -- Upsert today's record
  INSERT INTO public.user_daily_credits (user_id, usage_date, credits_used, max_credits)
  VALUES (p_user_id, CURRENT_DATE, 0, v_max_credits)
  ON CONFLICT (user_id, usage_date) DO UPDATE SET max_credits = v_max_credits;

  -- Get current usage
  SELECT credits_used, udc.max_credits INTO v_credits_used, v_max_credits
  FROM public.user_daily_credits udc
  WHERE udc.user_id = p_user_id AND udc.usage_date = CURRENT_DATE;

  -- Check limit
  IF v_credits_used >= v_max_credits THEN
    RETURN json_build_object(
      'allowed', false,
      'credits_used', v_credits_used,
      'max_credits', v_max_credits,
      'remaining', 0
    );
  END IF;

  -- Increment
  UPDATE public.user_daily_credits
  SET credits_used = credits_used + 1, updated_at = now()
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'allowed', true,
    'credits_used', v_credits_used + 1,
    'max_credits', v_max_credits,
    'remaining', v_max_credits - v_credits_used - 1
  );
END;
$$;
