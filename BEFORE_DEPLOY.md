# Before You Deploy — SaaS v3

Use this order:

1. Back up any valuable existing Supabase data.
2. Run `supabase/schema.sql`.
3. Create your own Supabase Auth user.
4. Edit and run `supabase/bootstrap_first_admin.sql`.
5. Deploy the `server` Edge Function.
6. Create local `.env` from `.env.example`.
7. Run `npm install` and `npm run dev`.
8. Log in and confirm the **Platform Admin** page appears.
9. Create a test customer tenant.
10. Invite a test customer admin.
11. As that customer, connect a GREEN-API instance in **WhatsApp Accounts**.
12. Copy the generated webhook URL token into that GREEN-API instance.
13. Test GREEN-API connection.
14. Send WhatsApp → CRM and CRM → WhatsApp.
15. Create a second test tenant/instance and confirm messages never cross tenants.
16. Push to a private GitHub repository.
17. Only then enable public frontend hosting.

## Do not commit

- `.env`
- `SUPABASE_SERVICE_ROLE_KEY`
- any GREEN-API API token
- any GREEN-API webhook token
- any future GREEN-API Partner token
