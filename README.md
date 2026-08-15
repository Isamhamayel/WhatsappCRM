# WhatsApp CRM — SaaS v3

Multi-tenant, multi-number WhatsApp CRM generated from the original Figma Make project and hardened for commercial SaaS use.

## Stack

- React 18 + Vite frontend
- Supabase Auth + PostgreSQL + RLS + Realtime
- Supabase Edge Function backend
- Supabase Vault for encrypted per-customer GREEN-API credentials
- GREEN-API for WhatsApp messaging/webhooks
- Optional GitHub Pages deployment for the static frontend

## SaaS model

```text
Platform owner
  └─ Customer tenant A
      ├─ Admin / Manager / Agent users
      ├─ Contacts / Leads / Tickets / Campaigns
      └─ WhatsApp Accounts
          ├─ Sales number -> GREEN-API instance A1
          └─ Support number -> GREEN-API instance A2
  └─ Customer tenant B
      └─ WhatsApp number -> GREEN-API instance B1
```

Every CRM row is tenant-scoped. Each WhatsApp account has its own encrypted API token and webhook token. Incoming webhooks are routed by `instanceData.idInstance` to the correct tenant.

## 1. Frontend setup

Copy `.env.example` to `.env` and set only browser-safe values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```

Then:

```bash
npm install
npm run dev
```

Never put GREEN-API tokens or `SUPABASE_SERVICE_ROLE_KEY` in frontend files.

## 2. Database

Run `supabase/schema.sql` in Supabase SQL Editor.

The schema:

- keeps tenant isolation with RLS;
- adds SaaS plan/status/limit fields;
- adds `whatsapp_instances`;
- supports multiple WhatsApp numbers per tenant;
- links conversations/messages/campaigns to a WhatsApp instance;
- stores GREEN-API API/webhook credentials in Supabase Vault;
- adds platform-owner metadata without making tenant roles global.

## 3. First platform owner

1. Supabase Dashboard → Authentication → Users → create your own Auth user.
2. Edit `supabase/bootstrap_first_admin.sql` and replace `YOUR_EMAIL@example.com`.
3. Run it in SQL Editor.

That account becomes both tenant `admin` and `is_platform_admin = true`.

After login, a **Platform Admin** menu appears. You can create customer tenants and optionally invite the customer's first administrator.

## 4. Deploy backend

The backend is `supabase/functions/server/index.tsx`.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy server
```

`supabase/config.toml` intentionally sets `verify_jwt = false` because GREEN-API must call the webhook without a Supabase user JWT. All CRM API routes validate the user's Supabase JWT inside the function, while the public webhook validates the per-instance GREEN-API webhook token.

No global `GREEN_API_INSTANCE_ID` or `GREEN_API_TOKEN` environment variables are used in SaaS v3.

## 5. Connect customer WhatsApp accounts

Customer Admin → **WhatsApp Accounts** → **Add WhatsApp**.

Enter:

- account label, e.g. `Sales WhatsApp`;
- phone number label;
- GREEN-API Instance ID;
- GREEN-API API Token;
- API URL (normally `https://api.green-api.com`).

The API token goes directly to the Edge Function and is encrypted in Supabase Vault. It is never returned to the browser.

For a new connection the backend generates a webhook secret and shows its GREEN-API Webhook URL Token **once**. Save it in GREEN-API.

Use this webhook URL for every customer instance:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/server/make-server-f76250f6/whatsapp/webhook
```

Each instance uses its own Webhook URL Token. The backend reads `instanceData.idInstance`, finds the matching tenant/account, validates that account's token, then stores the message in that tenant.

## 6. Customer users

Customer Admin → **Users & Departments** → **Invite User**.

Invites are sent through Supabase Auth and the new profile is automatically linked to the same tenant. User-count plan limits are enforced by the backend.

Configure Supabase Auth email/SMTP before commercial onboarding so invitation emails are reliable.

## 7. Platform plans and suspension

Platform Admin can create tenants and set:

- plan;
- status: trial / active / suspended / cancelled;
- maximum users;
- maximum WhatsApp accounts;
- billing email.

Suspended/cancelled tenants are rejected by protected backend routes. Expired trials are also blocked when `trial_ends_at` is set.

## 8. GitHub

Push this project to a **private** GitHub repository. Do not commit `.env` or backend secrets.

The included GitHub Actions workflow can deploy the frontend to GitHub Pages after Supabase is configured and tested.

## GREEN-API partner/reseller automation

SaaS v3 supports manually connecting any number of customer GREEN-API instances. GREEN-API also offers a Partner API for automatically creating instances. That can be added later without redesigning this database because each created instance already maps naturally to `whatsapp_instances`.
