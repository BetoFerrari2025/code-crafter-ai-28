
-- Update check_and_use_credit to bypass for admin email
CREATE OR REPLACE FUNCTION public.check_and_use_credit(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits_used INTEGER;
  v_max_credits INTEGER;
  v_plan TEXT;
  v_email TEXT;
BEGIN
  -- Check if user is admin
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email = 'ferraribetoferrari@gmail.com' THEN
    -- Admin gets unlimited credits
    INSERT INTO public.user_daily_credits (user_id, usage_date, credits_used, max_credits)
    VALUES (p_user_id, CURRENT_DATE, 0, 999999)
    ON CONFLICT (user_id, usage_date) DO UPDATE SET max_credits = 999999;

    SELECT credits_used INTO v_credits_used
    FROM public.user_daily_credits
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    RETURN json_build_object(
      'allowed', true,
      'credits_used', COALESCE(v_credits_used, 0) + 1,
      'max_credits', 999999,
      'remaining', 999998 - COALESCE(v_credits_used, 0)
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
$function$;
