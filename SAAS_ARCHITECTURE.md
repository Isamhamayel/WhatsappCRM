# SaaS Architecture

## Tenant boundary

`public.tenants` is the commercial customer/workspace boundary. CRM entities carry `tenant_id` and browser access is enforced with Supabase RLS.

## Identity levels

1. **Platform owner** — `users.is_platform_admin = true`.
2. **Customer tenant** — company/workspace in `tenants`.
3. **Customer user** — `admin`, `manager`, `agent`, or `finance` inside exactly one tenant.

## WhatsApp boundary

`whatsapp_instances` belongs to a tenant and stores only safe provider metadata plus Vault secret UUIDs. Decrypted credentials are available only to service-role SQL helpers used by the Edge Function.

## Incoming route

```text
GREEN-API webhook
  -> instanceData.idInstance
  -> whatsapp_instances.provider_instance_id
  -> verify that instance's Vault webhook secret
  -> resolve tenant_id
  -> contact
  -> conversation + whatsapp_instance_id
  -> message + whatsapp_instance_id
```

## Outgoing route

```text
Authenticated CRM user
  -> Supabase JWT
  -> Edge Function verifies user + tenant
  -> conversation's WhatsApp instance OR tenant default
  -> Vault API token
  -> GREEN-API
```

## Commercial limits

`tenants.max_users` and `tenants.max_whatsapp_instances` are enforced in backend provisioning routes. `tenants.status` can suspend/cancel service without deleting customer data.

## Future reseller automation

GREEN-API Partner API can later automate instance creation/QR onboarding. Store a partner credential only as a server-side secret and create one `whatsapp_instances` row for each returned `idInstance` + `apiTokenInstance`.
