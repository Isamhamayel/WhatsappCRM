-- MANUAL CUSTOMER ADMIN LINKER (optional)
-- Normally Platform Admin > New Customer can invite the first customer admin.
-- Use this helper only if you created the Auth user manually in Supabase.
-- Replace BOTH values before running.

DO $$
DECLARE
  target_email TEXT := 'CUSTOMER_ADMIN@example.com';
  target_tenant UUID := 'PASTE-CUSTOMER-TENANT-UUID-HERE';
  target_auth_id UUID;
BEGIN
  SELECT id INTO target_auth_id
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_auth_id IS NULL THEN
    RAISE EXCEPTION 'No Supabase Auth user found for %', target_email;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = target_tenant) THEN
    RAISE EXCEPTION 'Tenant % does not exist', target_tenant;
  END IF;

  INSERT INTO public.users (
    auth_user_id, tenant_id, email, full_name, role, is_platform_admin, is_active
  ) VALUES (
    target_auth_id, target_tenant, target_email, split_part(target_email, '@', 1),
    'admin', FALSE, TRUE
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    email = EXCLUDED.email,
    role = 'admin',
    is_platform_admin = FALSE,
    is_active = TRUE,
    updated_at = NOW();
END $$;
