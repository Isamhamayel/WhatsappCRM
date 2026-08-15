# Security / SaaS v3 Changes

SaaS v3 keeps the v2 authentication hardening and adds commercial multi-tenant isolation.

- Real Supabase email/password authentication and protected routes.
- Tenant-scoped RLS instead of generated `USING (true)` policies.
- Separate `is_platform_admin` capability from customer roles.
- Tenant lifecycle: trial / active / suspended / cancelled.
- User and WhatsApp-account plan limits.
- Real tenant user invitations through Supabase Auth.
- New `whatsapp_instances` table: multiple GREEN-API accounts per customer.
- Conversations, messages and campaigns can retain the exact WhatsApp account used.
- GREEN-API API tokens and webhook secrets are encrypted in Supabase Vault.
- Browser roles cannot read Vault or encrypted-secret identifiers through the CRM API.
- One webhook endpoint supports every customer.
- Incoming webhook tenant selection comes from GREEN-API `instanceData.idInstance`, not a browser-supplied tenant ID.
- Every GREEN-API instance has a different webhook authentication secret.
- Webhook ingestion is idempotent by instance + provider message ID.
- Outbound sends validate user, tenant and WhatsApp instance server-side.
- Campaigns cannot use another tenant's WhatsApp account.
- Customer admins can invite/deactivate tenant users; plan limits are enforced server-side.
- Platform administration is exposed only through authenticated Edge Function routes.
- Deprecated single-tenant GREEN-API environment variables are no longer used.
