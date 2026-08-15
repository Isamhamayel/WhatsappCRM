-- PLATFORM OWNER / FIRST ADMIN BOOTSTRAP (SaaS v3)
-- 1) Supabase Dashboard > Authentication > Users: create your own email/password user.
-- 2) Replace YOUR_EMAIL@example.com below with that exact email.
-- 3) Run this AFTER schema.sql.
--
-- This first account is both:
--   • admin of the default internal workspace
--   • platform administrator (can create/manage customer tenants)

DO $$
DECLARE
  target_email TEXT := 'YOUR_EMAIL@example.com';
  target_auth_id UUID;
  default_tenant UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  SELECT id INTO target_auth_id
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_auth_id IS NULL THEN
    RAISE EXCEPTION 'No Supabase Auth user found for %', target_email;
  END IF;

  UPDATE public.users
  SET auth_user_id = target_auth_id,
      tenant_id = default_tenant,
      role = 'admin',
      is_platform_admin = TRUE,
      is_active = TRUE,
      updated_at = NOW()
  WHERE lower(email) = lower(target_email);

  IF NOT FOUND THEN
    INSERT INTO public.users (
      auth_user_id, tenant_id, email, full_name, role, is_platform_admin, is_active
    )
    VALUES (
      target_auth_id,
      default_tenant,
      target_email,
      split_part(target_email, '@', 1),
      'admin',
      TRUE,
      TRUE
    );
  END IF;
END $$;
