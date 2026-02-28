
-- Create monthly credits table
CREATE TABLE public.user_monthly_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  credits_used INTEGER NOT NULL DEFAULT 0,
  max_credits INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_month)
);

-- Enable RLS
ALTER TABLE public.user_monthly_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own monthly credits"
  ON public.user_monthly_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly credits"
  ON public.user_monthly_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly credits"
  ON public.user_monthly_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Update check_and_use_credit to also track monthly credits
CREATE OR REPLACE FUNCTION public.check_and_use_credit(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits_used INTEGER;
  v_max_credits INTEGER;
  v_monthly_used INTEGER;
  v_monthly_max INTEGER;
  v_plan TEXT;
  v_email TEXT;
  v_current_month DATE;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::date;

  -- Check if user is admin
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email = 'ferraribetoferrari@gmail.com' THEN
    INSERT INTO public.user_daily_credits (user_id, usage_date, credits_used, max_credits)
    VALUES (p_user_id, CURRENT_DATE, 0, 999999)
    ON CONFLICT (user_id, usage_date) DO UPDATE SET max_credits = 999999;

    INSERT INTO public.user_monthly_credits (user_id, usage_month, credits_used, max_credits)
    VALUES (p_user_id, v_current_month, 0, 999999)
    ON CONFLICT (user_id, usage_month) DO UPDATE SET max_credits = 999999;

    SELECT credits_used INTO v_credits_used
    FROM public.user_daily_credits
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    RETURN json_build_object(
      'allowed', true,
      'credits_used', COALESCE(v_credits_used, 0) + 1,
      'max_credits', 999999,
      'remaining', 999998 - COALESCE(v_credits_used, 0),
      'monthly_used', 0,
      'monthly_max', 999999,
      'monthly_remaining', 999999
    );
  END IF;

  -- Check user subscription plan
  SELECT plan_name INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  -- Set max credits based on plan
  IF v_plan = 'start' THEN
    v_max_credits := 20;
    v_monthly_max := 999999;
  ELSIF v_plan = 'pro' THEN
    v_max_credits := 50;
    v_monthly_max := 999999;
  ELSIF v_plan = 'premium' THEN
    v_max_credits := 999999;
    v_monthly_max := 999999;
  ELSE
    v_max_credits := 5;
    v_monthly_max := 30;
  END IF;

  -- Upsert daily record
  INSERT INTO public.user_daily_credits (user_id, usage_date, credits_used, max_credits)
  VALUES (p_user_id, CURRENT_DATE, 0, v_max_credits)
  ON CONFLICT (user_id, usage_date) DO UPDATE SET max_credits = v_max_credits;

  -- Upsert monthly record
  INSERT INTO public.user_monthly_credits (user_id, usage_month, credits_used, max_credits)
  VALUES (p_user_id, v_current_month, 0, v_monthly_max)
  ON CONFLICT (user_id, usage_month) DO UPDATE SET max_credits = v_monthly_max;

  -- Get current daily usage
  SELECT credits_used, udc.max_credits INTO v_credits_used, v_max_credits
  FROM public.user_daily_credits udc
  WHERE udc.user_id = p_user_id AND udc.usage_date = CURRENT_DATE;

  -- Get current monthly usage
  SELECT credits_used, umc.max_credits INTO v_monthly_used, v_monthly_max
  FROM public.user_monthly_credits umc
  WHERE umc.user_id = p_user_id AND umc.usage_month = v_current_month;

  -- Check monthly limit first (for free users)
  IF v_monthly_used >= v_monthly_max THEN
    RETURN json_build_object(
      'allowed', false,
      'credits_used', v_credits_used,
      'max_credits', v_max_credits,
      'remaining', GREATEST(v_max_credits - v_credits_used, 0),
      'monthly_used', v_monthly_used,
      'monthly_max', v_monthly_max,
      'monthly_remaining', 0,
      'monthly_exhausted', true
    );
  END IF;

  -- Check daily limit
  IF v_credits_used >= v_max_credits THEN
    RETURN json_build_object(
      'allowed', false,
      'credits_used', v_credits_used,
      'max_credits', v_max_credits,
      'remaining', 0,
      'monthly_used', v_monthly_used,
      'monthly_max', v_monthly_max,
      'monthly_remaining', v_monthly_max - v_monthly_used
    );
  END IF;

  -- Increment daily
  UPDATE public.user_daily_credits
  SET credits_used = credits_used + 1, updated_at = now()
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  -- Increment monthly
  UPDATE public.user_monthly_credits
  SET credits_used = credits_used + 1, updated_at = now()
  WHERE user_id = p_user_id AND usage_month = v_current_month;

  RETURN json_build_object(
    'allowed', true,
    'credits_used', v_credits_used + 1,
    'max_credits', v_max_credits,
    'remaining', v_max_credits - v_credits_used - 1,
    'monthly_used', v_monthly_used + 1,
    'monthly_max', v_monthly_max,
    'monthly_remaining', v_monthly_max - v_monthly_used - 1
  );
END;
$function$;
