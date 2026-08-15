-- WhatsApp CRM — security-hardened schema
-- Safe goal: authenticated users can only access rows for their own tenant.
-- Edge Functions use the Supabase service role and therefore bypass RLS by design.
-- IMPORTANT: SaaS v3 encrypts per-customer GREEN-API credentials in Supabase Vault; browser users never receive them.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TENANTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  whatsapp_phone TEXT,
  -- Deprecated legacy columns retained only for compatibility with old Figma data.
  -- Do not store real credentials here; authenticated clients are not granted access to them.
  green_api_instance_id TEXT,
  green_api_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.tenants (id, name, slug, plan, whatsapp_phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Your Company', 'default', 'pro', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin','manager','agent','finance')),
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade old Figma-created users table without dropping data.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);

-- ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#25D366',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.departments (tenant_id, name, color)
SELECT '00000000-0000-0000-0000-000000000001', v.name, v.color
FROM (VALUES ('Sales', '#25D366'), ('Support', '#128C7E'), ('Finance', '#075E54')) AS v(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d
  WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001' AND d.name = v.name
);

-- ─── CONTACTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  company TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'whatsapp',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- ─── CONVERSATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id)
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('agent','customer','system')),
  sender_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  green_api_message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','read','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEADS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'warm' CHECK (status IN ('hot','warm','cold','lost','won')),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department TEXT,
  value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKETS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','pending','resolved','closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','completed','failed')),
  audience_type TEXT DEFAULT 'all',
  scheduled_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  replied_count INT DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','replied','failed')),
  green_api_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIENCES / QUICK REPLIES / AUDIT ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB DEFAULT '{}',
  contact_count INT DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shortcut TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id UUID,
  object_name TEXT,
  changes JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON public.messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON public.tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON public.campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_audiences_tenant ON public.audiences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ─── SECURITY HELPERS ────────────────────────────────────────────────────────
-- SECURITY DEFINER prevents recursive RLS lookups while deriving the caller's CRM profile.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = TRUE
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = TRUE
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = TRUE
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Remove all old/generated policies on these CRM tables, including the unsafe USING(true) policies.
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'tenants','users','contacts','conversations','messages','leads','tickets',
        'campaigns','campaign_recipients','audiences','departments','quick_replies','audit_logs'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Tenant/user metadata is read-only from the browser. Sensitive tenant credential columns are not granted.
CREATE POLICY tenants_select_own ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.current_tenant_id());

CREATE POLICY users_select_same_tenant ON public.users
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY departments_select_same_tenant ON public.departments
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY departments_write_management ON public.departments
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

-- Standard tenant-scoped CRM tables.
CREATE POLICY contacts_select_own_tenant ON public.contacts
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY contacts_insert_own_tenant ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY contacts_update_own_tenant ON public.contacts
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY contacts_delete_management ON public.contacts
  FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY conversations_select_own_tenant ON public.conversations
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY conversations_insert_own_tenant ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY conversations_update_own_tenant ON public.conversations
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY conversations_delete_management ON public.conversations
  FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY messages_select_own_tenant ON public.messages
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY messages_insert_agent ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND sender = 'agent'
    AND sender_user_id = public.current_app_user_id()
  );

CREATE POLICY leads_select_own_tenant ON public.leads
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY leads_insert_own_tenant ON public.leads
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY leads_update_own_tenant ON public.leads
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY leads_delete_management ON public.leads
  FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY tickets_select_own_tenant ON public.tickets
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY tickets_insert_own_tenant ON public.tickets
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tickets_update_own_tenant ON public.tickets
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tickets_delete_management ON public.tickets
  FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY campaigns_select_own_tenant ON public.campaigns
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY campaigns_write_management ON public.campaigns
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY campaign_recipients_select_own_tenant ON public.campaign_recipients
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id AND c.tenant_id = public.current_tenant_id()
  ));
CREATE POLICY campaign_recipients_write_management ON public.campaign_recipients
  FOR ALL TO authenticated
  USING (
    public.current_user_role() IN ('admin','manager')
    AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.current_user_role() IN ('admin','manager')
    AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.tenant_id = public.current_tenant_id())
  );

CREATE POLICY audiences_select_own_tenant ON public.audiences
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY audiences_write_management ON public.audiences
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY quick_replies_select_own_tenant ON public.quick_replies
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY quick_replies_insert_own_tenant ON public.quick_replies
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY quick_replies_update_own_tenant ON public.quick_replies
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY quick_replies_delete_management ON public.quick_replies
  FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));

CREATE POLICY audit_logs_select_management ON public.audit_logs
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.current_user_role() IN ('admin','manager'));
CREATE POLICY audit_logs_insert_own_tenant ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND (user_id IS NULL OR user_id = public.current_app_user_id())
  );

-- ─── API PRIVILEGES ─────────────────────────────────────────────────────────
-- anon gets no direct CRM table access. authenticated gets only operations that RLS can constrain.
REVOKE ALL ON TABLE public.tenants, public.users, public.departments, public.contacts,
  public.conversations, public.messages, public.leads, public.tickets, public.campaigns,
  public.campaign_recipients, public.audiences, public.quick_replies, public.audit_logs FROM anon;

REVOKE ALL ON TABLE public.tenants FROM authenticated;
GRANT SELECT (id, name, slug, plan, whatsapp_phone, created_at, updated_at) ON public.tenants TO authenticated;

REVOKE ALL ON TABLE public.users FROM authenticated;
GRANT SELECT ON public.users TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audiences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_replies TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Protect deprecated credential columns from browser roles even if legacy grants existed.
REVOKE SELECT (green_api_instance_id, green_api_token) ON public.tenants FROM authenticated, anon;

-- Optional but recommended in the Supabase Dashboard: disable public sign-ups.

-- ═══════════════════════════════════════════════════════════════════════════════
-- SaaS v3 upgrade — multi-customer / multi-number GREEN-API architecture
-- ═══════════════════════════════════════════════════════════════════════════════

-- Supabase hosted projects have Vault enabled by default; this is harmless if it
-- is already installed and makes local/CLI environments explicit where supported.
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

-- ─── TENANT SUBSCRIPTION / LIFECYCLE ─────────────────────────────────────────
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 5;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_whatsapp_instances INT DEFAULT 1;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_status_check'
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_status_check
      CHECK (status IN ('trial','active','suspended','cancelled'));
  END IF;
END $$;

-- Platform owner flag is deliberately separate from tenant roles. An application
-- user remains an admin/manager/agent/finance inside their tenant, while this flag
-- grants access only to explicit platform-management Edge Function routes.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE;

-- ─── WHATSAPP INSTANCES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  provider TEXT NOT NULL DEFAULT 'green_api' CHECK (provider IN ('green_api')),
  provider_instance_id TEXT NOT NULL,
  api_url TEXT NOT NULL DEFAULT 'https://api.green-api.com',
  api_token_secret_id UUID,
  webhook_secret_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','disconnected')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  last_state TEXT,
  last_checked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_instance_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_tenant ON public.whatsapp_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON public.whatsapp_instances(tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_default_per_tenant
  ON public.whatsapp_instances(tenant_id)
  WHERE is_default = TRUE AND status <> 'disconnected';

-- Each conversation remembers which company WhatsApp number owns the chat.
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_instance ON public.conversations(whatsapp_instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_instance ON public.messages(whatsapp_instance_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_whatsapp_instance ON public.campaigns(whatsapp_instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_id_per_instance
  ON public.messages(whatsapp_instance_id, green_api_message_id)
  WHERE whatsapp_instance_id IS NOT NULL AND green_api_message_id IS NOT NULL;

-- The v2 schema allowed only one conversation per contact. SaaS v3 allows the
-- same contact to talk to the same tenant through different company numbers.
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_contact_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_contact_instance
  ON public.conversations(tenant_id, contact_id, whatsapp_instance_id)
  WHERE whatsapp_instance_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_contact_legacy
  ON public.conversations(tenant_id, contact_id)
  WHERE whatsapp_instance_id IS NULL;

-- ─── SECURITY HELPERS ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT u.is_platform_admin
    FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = TRUE
    LIMIT 1
  ), FALSE)
$$;

REVOKE ALL ON FUNCTION public.current_is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_is_platform_admin() TO authenticated;

-- Re-define tenant resolution so suspended/cancelled/expired customer workspaces
-- cannot keep using direct browser Data API access. Platform owners remain able
-- to access their internal workspace even while managing customer lifecycle.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.tenant_id
  FROM public.users u
  JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.auth_user_id = auth.uid()
    AND u.is_active = TRUE
    AND (
      u.is_platform_admin = TRUE
      OR t.status = 'active'
      OR (t.status = 'trial' AND (t.trial_ends_at IS NULL OR t.trial_ends_at > NOW()))
    )
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;

-- Secrets are encrypted at rest in Supabase Vault. Only service_role may call
-- these helpers. Browser users can never read decrypted GREEN-API credentials.
CREATE OR REPLACE FUNCTION public.upsert_whatsapp_instance_secure(
  p_id UUID,
  p_tenant_id UUID,
  p_name TEXT,
  p_phone_number TEXT,
  p_provider_instance_id TEXT,
  p_api_url TEXT,
  p_api_token TEXT,
  p_webhook_secret TEXT,
  p_is_default BOOLEAN DEFAULT FALSE,
  p_status TEXT DEFAULT 'active'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID := COALESCE(p_id, uuid_generate_v4());
  v_api_secret_id UUID;
  v_webhook_secret_id UUID;
BEGIN
  IF p_tenant_id IS NULL OR NULLIF(TRIM(p_provider_instance_id), '') IS NULL THEN
    RAISE EXCEPTION 'tenant and provider instance id are required';
  END IF;

  SELECT wi.api_token_secret_id, wi.webhook_secret_id
    INTO v_api_secret_id, v_webhook_secret_id
  FROM public.whatsapp_instances wi
  WHERE wi.id = v_id;

  IF v_api_secret_id IS NULL THEN
    IF NULLIF(p_api_token, '') IS NULL THEN
      RAISE EXCEPTION 'API token is required for a new WhatsApp instance';
    END IF;
    SELECT vault.create_secret(
      p_api_token,
      NULL,
      'GREEN-API token for WhatsApp instance ' || v_id::TEXT
    ) INTO v_api_secret_id;
  ELSIF NULLIF(p_api_token, '') IS NOT NULL THEN
    PERFORM vault.update_secret(v_api_secret_id, p_api_token, NULL, 'GREEN-API token for WhatsApp instance ' || v_id::TEXT);
  END IF;

  IF v_webhook_secret_id IS NULL THEN
    IF NULLIF(p_webhook_secret, '') IS NULL THEN
      RAISE EXCEPTION 'Webhook secret is required for a new WhatsApp instance';
    END IF;
    SELECT vault.create_secret(
      p_webhook_secret,
      NULL,
      'GREEN-API webhook token for WhatsApp instance ' || v_id::TEXT
    ) INTO v_webhook_secret_id;
  ELSIF NULLIF(p_webhook_secret, '') IS NOT NULL THEN
    PERFORM vault.update_secret(v_webhook_secret_id, p_webhook_secret, NULL, 'GREEN-API webhook token for WhatsApp instance ' || v_id::TEXT);
  END IF;

  IF p_is_default THEN
    UPDATE public.whatsapp_instances
       SET is_default = FALSE, updated_at = NOW()
     WHERE tenant_id = p_tenant_id AND id <> v_id;
  END IF;

  INSERT INTO public.whatsapp_instances (
    id, tenant_id, name, phone_number, provider, provider_instance_id, api_url,
    api_token_secret_id, webhook_secret_id, status, is_default, updated_at
  ) VALUES (
    v_id, p_tenant_id, COALESCE(NULLIF(TRIM(p_name), ''), 'WhatsApp'), NULLIF(TRIM(p_phone_number), ''),
    'green_api', TRIM(p_provider_instance_id), COALESCE(NULLIF(TRIM(p_api_url), ''), 'https://api.green-api.com'),
    v_api_secret_id, v_webhook_secret_id, p_status, p_is_default, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone_number = EXCLUDED.phone_number,
    provider_instance_id = EXCLUDED.provider_instance_id,
    api_url = EXCLUDED.api_url,
    api_token_secret_id = EXCLUDED.api_token_secret_id,
    webhook_secret_id = EXCLUDED.webhook_secret_id,
    status = EXCLUDED.status,
    is_default = EXCLUDED.is_default,
    updated_at = NOW();

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_whatsapp_instance_credentials(p_instance_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'api_token', api_secret.decrypted_secret,
    'webhook_secret', webhook_secret.decrypted_secret
  )
  FROM public.whatsapp_instances wi
  LEFT JOIN vault.decrypted_secrets api_secret ON api_secret.id = wi.api_token_secret_id
  LEFT JOIN vault.decrypted_secrets webhook_secret ON webhook_secret.id = wi.webhook_secret_id
  WHERE wi.id = p_instance_id
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.upsert_whatsapp_instance_secure(UUID,UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_whatsapp_instance_credentials(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_whatsapp_instance_secure(UUID,UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_whatsapp_instance_credentials(UUID) TO service_role;

-- ─── WHATSAPP INSTANCE RLS / API PRIVILEGES ──────────────────────────────────
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_instances_select_own_tenant ON public.whatsapp_instances;
CREATE POLICY whatsapp_instances_select_own_tenant ON public.whatsapp_instances
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

REVOKE ALL ON TABLE public.whatsapp_instances FROM anon, authenticated;
GRANT SELECT (
  id, tenant_id, name, phone_number, provider, provider_instance_id, api_url,
  status, is_default, last_state, last_checked_at, metadata, created_at, updated_at
) ON public.whatsapp_instances TO authenticated;

-- Tenant lifecycle metadata is visible to its own authenticated users but remains
-- writable only through privileged backend/platform routes.
REVOKE ALL ON TABLE public.tenants FROM authenticated;
GRANT SELECT (
  id, name, slug, plan, whatsapp_phone, status, billing_email, max_users,
  max_whatsapp_instances, trial_ends_at, metadata, created_at, updated_at
) ON public.tenants TO authenticated;

-- Do not expose Vault itself to browser roles.
REVOKE ALL ON ALL TABLES IN SCHEMA vault FROM anon, authenticated;

-- v3 no longer uses these global Edge Function secrets:
-- GREEN_API_INSTANCE_ID, GREEN_API_TOKEN, GREEN_API_WEBHOOK_SECRET, WHATSAPP_TENANT_ID
-- Each tenant/number is now resolved from public.whatsapp_instances + Vault.
