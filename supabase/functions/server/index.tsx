import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();
const ROUTE_PREFIX = "/make-server-f76250f6";

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey"],
  allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const env = (name: string) => Deno.env.get(name) || "";

const getServiceSupabase = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

type AppRole = "admin" | "manager" | "agent" | "finance";
type AppProfile = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
  is_platform_admin: boolean;
};

type WhatsAppInstance = {
  id: string;
  tenant_id: string;
  name: string;
  phone_number: string | null;
  provider: "green_api";
  provider_instance_id: string;
  api_url: string;
  status: "active" | "paused" | "disconnected";
  is_default: boolean;
  last_state: string | null;
  last_checked_at: string | null;
};

type InstanceCredentials = {
  api_token?: string;
  webhook_secret?: string;
};

function jsonError(c: any, message: string, status = 400) {
  return c.json({ error: message }, status);
}

async function requireAppUser(c: any, allowedRoles?: AppRole[]) {
  const authorization = c.req.header("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) return { response: jsonError(c, "Authentication required", 401) };

  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    return { response: jsonError(c, "Supabase auth environment is not configured", 500) };
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return { response: jsonError(c, "Invalid or expired session", 401) };
  }

  const service = getServiceSupabase();
  const { data: profile, error: profileError } = await service
    .from("users")
    .select("id, auth_user_id, tenant_id, email, full_name, role, is_active, is_platform_admin")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    return { response: jsonError(c, "CRM user is not provisioned or is inactive", 403) };
  }

  const typedProfile = profile as AppProfile;

  const { data: tenant } = await service
    .from("tenants")
    .select("status, trial_ends_at")
    .eq("id", typedProfile.tenant_id)
    .maybeSingle();

  if (!typedProfile.is_platform_admin) {
    if (!tenant || ["suspended", "cancelled"].includes(String(tenant.status))) {
      return { response: jsonError(c, "This customer workspace is not active", 403) };
    }
    if (tenant.status === "trial" && tenant.trial_ends_at && new Date(tenant.trial_ends_at).getTime() < Date.now()) {
      return { response: jsonError(c, "This customer trial has expired", 403) };
    }
  }

  if (allowedRoles && !typedProfile.is_platform_admin && !allowedRoles.includes(typedProfile.role)) {
    return { response: jsonError(c, "Insufficient permission", 403) };
  }

  return { profile: typedProfile, service, authUser: authData.user };
}

async function requirePlatformAdmin(c: any) {
  const auth = await requireAppUser(c);
  if ("response" in auth) return auth;
  if (!auth.profile.is_platform_admin) {
    return { response: jsonError(c, "Platform administrator permission required", 403) };
  }
  return auth;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

function randomSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanApiUrl(apiUrl?: string | null) {
  const value = String(apiUrl || "https://api.green-api.com").trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(value)) throw new Error("GREEN-API URL must use HTTPS");
  return value;
}

async function getInstanceCredentials(service: any, instanceId: string): Promise<InstanceCredentials> {
  const { data, error } = await service.rpc("get_whatsapp_instance_credentials", {
    p_instance_id: instanceId,
  });
  if (error) throw new Error(`Credential lookup failed: ${error.message}`);
  return (data || {}) as InstanceCredentials;
}

async function resolveWhatsAppInstance(
  service: any,
  tenantId: string,
  options?: { instanceId?: string | null; conversationId?: string | null },
): Promise<WhatsAppInstance> {
  let targetInstanceId = options?.instanceId || null;

  if (!targetInstanceId && options?.conversationId) {
    const { data: conversation } = await service
      .from("conversations")
      .select("whatsapp_instance_id")
      .eq("id", options.conversationId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    targetInstanceId = conversation?.whatsapp_instance_id || null;
  }

  let query = service
    .from("whatsapp_instances")
    .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  query = targetInstanceId
    ? query.eq("id", targetInstanceId)
    : query.eq("is_default", true);

  let { data: instance, error } = await query.maybeSingle();

  // For first-time tenants, gracefully use the only active number even if the
  // admin forgot to mark it as default.
  if (!instance && !targetInstanceId) {
    const fallback = await service
      .from("whatsapp_instances")
      .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    instance = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);
  if (!instance) throw new Error("No active WhatsApp account is configured for this customer");
  return instance as WhatsAppInstance;
}

async function greenApiSend(instance: WhatsAppInstance, apiToken: string, phone: string, message: string) {
  if (!apiToken) throw new Error("The GREEN-API token for this WhatsApp account is missing");

  const digits = normalizePhone(phone);
  if (digits.length < 7 || digits.length > 15) throw new Error("Invalid WhatsApp phone number");
  if (!message?.trim()) throw new Error("Message is required");
  if (message.length > 20000) throw new Error("Message is too long");

  const chatId = `${digits}@c.us`;
  const response = await fetch(
    `${cleanApiUrl(instance.api_url)}/waInstance${instance.provider_instance_id}/sendMessage/${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    },
  );

  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.message || data?.error || `GREEN-API HTTP ${response.status}`);
  return data;
}

async function testGreenApiInstance(service: any, instance: WhatsAppInstance) {
  const credentials = await getInstanceCredentials(service, instance.id);
  if (!credentials.api_token) throw new Error("GREEN-API token is missing");

  const res = await fetch(
    `${cleanApiUrl(instance.api_url)}/waInstance${instance.provider_instance_id}/getStateInstance/${credentials.api_token}`,
  );
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || data?.error || `GREEN-API HTTP ${res.status}`);

  const state = data?.stateInstance || "unknown";
  await service
    .from("whatsapp_instances")
    .update({ last_state: state, last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", instance.id);

  return state;
}

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get(`${ROUTE_PREFIX}/health`, (c) => c.json({ status: "ok", architecture: "saas-v3" }));

// ─── TENANT WHATSAPP ACCOUNT MANAGEMENT ──────────────────────────────────────
app.get(`${ROUTE_PREFIX}/whatsapp/instances`, async (c) => {
  const auth = await requireAppUser(c);
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.service
    .from("whatsapp_instances")
    .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at, created_at, updated_at")
    .eq("tenant_id", auth.profile.tenant_id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return jsonError(c, error.message, 500);
  return c.json({ instances: data || [] });
});

app.post(`${ROUTE_PREFIX}/whatsapp/instances`, async (c) => {
  const auth = await requireAppUser(c, ["admin"]);
  if ("response" in auth) return auth.response;

  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  const tenantId = auth.profile.tenant_id;
  const providerInstanceId = String(body.providerInstanceId || "").trim();
  if (!/^\d{1,20}$/.test(providerInstanceId)) return jsonError(c, "A valid GREEN-API instance ID is required");
  if (!String(body.apiToken || "").trim()) return jsonError(c, "GREEN-API API token is required");

  const { data: tenant } = await auth.service
    .from("tenants")
    .select("max_whatsapp_instances")
    .eq("id", tenantId)
    .single();
  const { count } = await auth.service
    .from("whatsapp_instances")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .neq("status", "disconnected");

  if ((count || 0) >= Number(tenant?.max_whatsapp_instances || 1)) {
    return jsonError(c, "Your current plan has reached its WhatsApp account limit", 403);
  }

  const webhookSecret = String(body.webhookSecret || "").trim() || randomSecret();
  const isDefault = Boolean(body.isDefault) || (count || 0) === 0;

  const { data: id, error } = await auth.service.rpc("upsert_whatsapp_instance_secure", {
    p_id: null,
    p_tenant_id: tenantId,
    p_name: String(body.name || "WhatsApp").trim(),
    p_phone_number: String(body.phoneNumber || "").trim() || null,
    p_provider_instance_id: providerInstanceId,
    p_api_url: cleanApiUrl(body.apiUrl),
    p_api_token: String(body.apiToken).trim(),
    p_webhook_secret: webhookSecret,
    p_is_default: isDefault,
    p_status: "active",
  });

  if (error) return jsonError(c, error.message, 500);

  const { data: instance } = await auth.service
    .from("whatsapp_instances")
    .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at, created_at, updated_at")
    .eq("id", id)
    .single();

  return c.json({ instance, webhookSecret, webhookToken: `Bearer ${webhookSecret}` });
});

app.put(`${ROUTE_PREFIX}/whatsapp/instances/:id`, async (c) => {
  const auth = await requireAppUser(c, ["admin"]);
  if ("response" in auth) return auth.response;
  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  const id = c.req.param("id");
  const { data: existing, error: existingError } = await auth.service
    .from("whatsapp_instances")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", auth.profile.tenant_id)
    .maybeSingle();
  if (existingError || !existing) return jsonError(c, "WhatsApp account not found", 404);

  const rotateWebhook = Boolean(body.rotateWebhookSecret);
  const newWebhookSecret = rotateWebhook ? randomSecret() : "";

  const { error } = await auth.service.rpc("upsert_whatsapp_instance_secure", {
    p_id: id,
    p_tenant_id: auth.profile.tenant_id,
    p_name: String(body.name ?? existing.name),
    p_phone_number: String(body.phoneNumber ?? existing.phone_number ?? "").trim() || null,
    p_provider_instance_id: String(body.providerInstanceId ?? existing.provider_instance_id),
    p_api_url: cleanApiUrl(body.apiUrl ?? existing.api_url),
    p_api_token: String(body.apiToken || "").trim(),
    p_webhook_secret: String(body.webhookSecret || newWebhookSecret).trim(),
    p_is_default: body.isDefault === undefined ? Boolean(existing.is_default) : Boolean(body.isDefault),
    p_status: String(body.status || existing.status),
  });
  if (error) return jsonError(c, error.message, 500);

  const { data: instance } = await auth.service
    .from("whatsapp_instances")
    .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at, created_at, updated_at")
    .eq("id", id)
    .single();

  return c.json({
    instance,
    ...(rotateWebhook ? { webhookSecret: newWebhookSecret, webhookToken: `Bearer ${newWebhookSecret}` } : {}),
  });
});

app.post(`${ROUTE_PREFIX}/whatsapp/instances/:id/test`, async (c) => {
  const auth = await requireAppUser(c, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const { data: instance } = await auth.service
    .from("whatsapp_instances")
    .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at")
    .eq("id", c.req.param("id"))
    .eq("tenant_id", auth.profile.tenant_id)
    .maybeSingle();
  if (!instance) return jsonError(c, "WhatsApp account not found", 404);

  try {
    const state = await testGreenApiInstance(auth.service, instance as WhatsAppInstance);
    return c.json({ connected: state === "authorized", state });
  } catch (e) {
    return c.json({ connected: false, error: e instanceof Error ? e.message : String(e) }, 502);
  }
});

// Backwards-compatible default-account connection test.
app.get(`${ROUTE_PREFIX}/whatsapp/test`, async (c) => {
  const auth = await requireAppUser(c, ["admin", "manager"]);
  if ("response" in auth) return auth.response;
  try {
    const instance = await resolveWhatsAppInstance(auth.service, auth.profile.tenant_id);
    const state = await testGreenApiInstance(auth.service, instance);
    return c.json({ connected: state === "authorized", state, instanceId: instance.id });
  } catch (e) {
    return c.json({ connected: false, error: e instanceof Error ? e.message : String(e) }, 502);
  }
});

// ─── OUTBOUND MESSAGE ─────────────────────────────────────────────────────────
app.post(`${ROUTE_PREFIX}/whatsapp/send`, async (c) => {
  const auth = await requireAppUser(c, ["admin", "manager", "agent"]);
  if ("response" in auth) return auth.response;

  let payload: any;
  try { payload = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  try {
    const instance = await resolveWhatsAppInstance(auth.service, auth.profile.tenant_id, {
      instanceId: payload.whatsappInstanceId || null,
      conversationId: payload.conversationId || null,
    });
    const credentials = await getInstanceCredentials(auth.service, instance.id);
    const result = await greenApiSend(instance, String(credentials.api_token || ""), String(payload.phone || ""), String(payload.message || ""));
    return c.json({ ...result, whatsappInstanceId: instance.id });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});

// ─── GREEN-API MULTI-TENANT INBOUND WEBHOOK ───────────────────────────────────
app.post(`${ROUTE_PREFIX}/whatsapp/webhook`, async (c) => {
  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  const providerInstanceId = String(body?.instanceData?.idInstance || "").trim();
  if (!providerInstanceId) return jsonError(c, "Missing GREEN-API instanceData.idInstance");

  const service = getServiceSupabase();
  const { data: instance, error: instanceError } = await service
    .from("whatsapp_instances")
    .select("id, tenant_id, name, phone_number, provider, provider_instance_id, api_url, status, is_default, last_state, last_checked_at")
    .eq("provider", "green_api")
    .eq("provider_instance_id", providerInstanceId)
    .neq("status", "disconnected")
    .maybeSingle();

  if (instanceError || !instance) return jsonError(c, "Unknown WhatsApp instance", 404);

  const credentials = await getInstanceCredentials(service, instance.id);
  const webhookAuthorization = c.req.header("Authorization") || "";
  const suppliedSecret = webhookAuthorization.startsWith("Bearer ")
    ? webhookAuthorization.slice(7)
    : webhookAuthorization.startsWith("Basic ")
      ? webhookAuthorization.slice(6)
      : webhookAuthorization;

  if (!credentials.webhook_secret || !suppliedSecret || suppliedSecret !== credentials.webhook_secret) {
    return jsonError(c, "Unauthorized webhook", 401);
  }

  if (body.typeWebhook === "stateInstanceChanged") {
    await service
      .from("whatsapp_instances")
      .update({
        last_state: body.statusInstance || "unknown",
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", instance.id);
    return c.json({ ok: true, state: body.statusInstance || "unknown" });
  }

  if (body.typeWebhook !== "incomingMessageReceived") {
    return c.json({ ok: true, skipped: body.typeWebhook || "unknown" });
  }

  const senderPhone = String(body.senderData?.sender || "").replace(/@(c\.us|lid)$/i, "");
  if (!senderPhone) return jsonError(c, "Missing sender phone");

  const messageBody =
    body.messageData?.textMessageData?.textMessage ||
    body.messageData?.extendedTextMessageData?.text ||
    "[Non-text WhatsApp message]";

  // GREEN-API retries delivery, so make the receiver idempotent.
  if (body.idMessage) {
    const { data: duplicate } = await service
      .from("messages")
      .select("id")
      .eq("whatsapp_instance_id", instance.id)
      .eq("green_api_message_id", body.idMessage)
      .maybeSingle();
    if (duplicate) return c.json({ ok: true, duplicate: true });
  }

  const { data: contact, error: contactError } = await service
    .from("contacts")
    .upsert(
      {
        tenant_id: instance.tenant_id,
        phone: senderPhone,
        name: body.senderData?.senderName || senderPhone,
        source: "whatsapp",
      },
      { onConflict: "tenant_id,phone" },
    )
    .select()
    .single();
  if (contactError || !contact) return jsonError(c, contactError?.message || "Contact upsert failed", 500);

  let { data: conversation, error: conversationError } = await service
    .from("conversations")
    .select("*")
    .eq("tenant_id", instance.tenant_id)
    .eq("contact_id", contact.id)
    .eq("whatsapp_instance_id", instance.id)
    .maybeSingle();

  if (!conversation && !conversationError) {
    const inserted = await service
      .from("conversations")
      .insert({
        tenant_id: instance.tenant_id,
        contact_id: contact.id,
        whatsapp_instance_id: instance.id,
        status: "open",
      })
      .select()
      .single();
    conversation = inserted.data;
    conversationError = inserted.error;
  }
  if (conversationError || !conversation) return jsonError(c, conversationError?.message || "Conversation creation failed", 500);

  const { error: messageError } = await service.from("messages").insert({
    tenant_id: instance.tenant_id,
    conversation_id: conversation.id,
    whatsapp_instance_id: instance.id,
    sender: "customer",
    body: messageBody,
    green_api_message_id: body.idMessage || null,
    status: "delivered",
  });
  if (messageError) return jsonError(c, messageError.message, 500);

  await service
    .from("conversations")
    .update({
      whatsapp_instance_id: instance.id,
      last_message: messageBody,
      last_message_at: new Date().toISOString(),
      unread_count: Number(conversation.unread_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversation.id)
    .eq("tenant_id", instance.tenant_id);

  return c.json({ ok: true, tenantId: instance.tenant_id, whatsappInstanceId: instance.id });
});

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
app.post(`${ROUTE_PREFIX}/campaigns/send`, async (c) => {
  const auth = await requireAppUser(c, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const { campaignId } = await c.req.json();
  if (!campaignId) return jsonError(c, "campaignId is required");

  const { data: campaign, error: campaignError } = await auth.service
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("tenant_id", auth.profile.tenant_id)
    .maybeSingle();
  if (campaignError || !campaign) return jsonError(c, "Campaign not found", 404);

  let instance: WhatsAppInstance;
  try {
    instance = await resolveWhatsAppInstance(auth.service, auth.profile.tenant_id, {
      instanceId: campaign.whatsapp_instance_id || null,
    });
  } catch (e) {
    return jsonError(c, e instanceof Error ? e.message : String(e), 400);
  }

  const credentials = await getInstanceCredentials(auth.service, instance.id);
  const { data: recipients, error: recipientsError } = await auth.service
    .from("campaign_recipients")
    .select("id, phone")
    .eq("campaign_id", campaignId)
    .eq("status", "pending");
  if (recipientsError) return jsonError(c, recipientsError.message, 500);
  if (!recipients?.length) return c.json({ ok: true, sent: 0, whatsappInstanceId: instance.id });

  let sent = 0;
  for (const recipient of recipients) {
    try {
      const result = await greenApiSend(instance, String(credentials.api_token || ""), recipient.phone, campaign.message);
      await auth.service
        .from("campaign_recipients")
        .update({
          status: "sent",
          green_api_message_id: result.idMessage || null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);
      sent++;
    } catch {
      await auth.service.from("campaign_recipients").update({ status: "failed" }).eq("id", recipient.id);
    }
  }

  await auth.service
    .from("campaigns")
    .update({
      status: "active",
      sent_count: sent,
      whatsapp_instance_id: instance.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("tenant_id", auth.profile.tenant_id);

  return c.json({ ok: true, sent, whatsappInstanceId: instance.id });
});

// ─── CUSTOMER TEAM MANAGEMENT ─────────────────────────────────────────────────
app.get(`${ROUTE_PREFIX}/team/users`, async (c) => {
  const auth = await requireAppUser(c, ["admin", "manager"]);
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.service
    .from("users")
    .select("id, email, full_name, role, department, avatar_url, is_active, created_at")
    .eq("tenant_id", auth.profile.tenant_id)
    .eq("is_platform_admin", false)
    .order("created_at", { ascending: true });
  if (error) return jsonError(c, error.message, 500);
  return c.json({ users: data || [] });
});

app.post(`${ROUTE_PREFIX}/team/users/invite`, async (c) => {
  const auth = await requireAppUser(c, ["admin"]);
  if ("response" in auth) return auth.response;
  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.fullName || "").trim();
  const role = String(body.role || "agent") as AppRole;
  const department = String(body.department || "").trim() || null;
  if (!email.includes("@") || !fullName) return jsonError(c, "Name and valid email are required");
  if (!["admin", "manager", "agent", "finance"].includes(role)) return jsonError(c, "Invalid role");

  const { data: tenant } = await auth.service.from("tenants").select("max_users").eq("id", auth.profile.tenant_id).single();
  const { count } = await auth.service.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", auth.profile.tenant_id).eq("is_active", true).eq("is_platform_admin", false);
  if ((count || 0) >= Number(tenant?.max_users || 5)) return jsonError(c, "Your current plan has reached its user limit", 403);

  const { data: inviteData, error: inviteError } = await auth.service.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, tenant_id: auth.profile.tenant_id },
  });
  if (inviteError || !inviteData.user) return jsonError(c, inviteError?.message || "Invitation failed", 400);

  const { data: userProfile, error: profileError } = await auth.service
    .from("users")
    .insert({
      auth_user_id: inviteData.user.id,
      tenant_id: auth.profile.tenant_id,
      email,
      full_name: fullName,
      role,
      department,
      is_active: true,
      is_platform_admin: false,
    })
    .select("id, email, full_name, role, department, avatar_url, is_active, created_at")
    .single();
  if (profileError) return jsonError(c, profileError.message, 500);
  return c.json({ user: userProfile, invited: true });
});

app.put(`${ROUTE_PREFIX}/team/users/:id`, async (c) => {
  const auth = await requireAppUser(c, ["admin"]);
  if ("response" in auth) return auth.response;
  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.fullName !== undefined) update.full_name = String(body.fullName).trim();
  if (body.department !== undefined) update.department = String(body.department || "").trim() || null;
  if (body.isActive !== undefined) update.is_active = Boolean(body.isActive);
  if (body.role !== undefined) {
    const role = String(body.role);
    if (!["admin", "manager", "agent", "finance"].includes(role)) return jsonError(c, "Invalid role");
    update.role = role;
  }

  const { data, error } = await auth.service
    .from("users")
    .update(update)
    .eq("id", c.req.param("id"))
    .eq("tenant_id", auth.profile.tenant_id)
    .eq("is_platform_admin", false)
    .select("id, email, full_name, role, department, avatar_url, is_active, created_at")
    .maybeSingle();
  if (error) return jsonError(c, error.message, 500);
  if (!data) return jsonError(c, "User not found", 404);
  return c.json({ user: data });
});

// ─── PLATFORM / RESELLER ADMIN ────────────────────────────────────────────────
app.get(`${ROUTE_PREFIX}/platform/tenants`, async (c) => {
  const auth = await requirePlatformAdmin(c);
  if ("response" in auth) return auth.response;

  const [{ data: tenants, error }, { data: instances }, { data: users }] = await Promise.all([
    auth.service.from("tenants").select("id, name, slug, plan, status, billing_email, max_users, max_whatsapp_instances, trial_ends_at, created_at").order("created_at", { ascending: false }),
    auth.service.from("whatsapp_instances").select("tenant_id, status"),
    auth.service.from("users").select("tenant_id, is_active"),
  ]);
  if (error) return jsonError(c, error.message, 500);

  const enriched = (tenants || []).map((tenant: any) => ({
    ...tenant,
    whatsapp_count: (instances || []).filter((i: any) => i.tenant_id === tenant.id && i.status !== "disconnected").length,
    user_count: (users || []).filter((u: any) => u.tenant_id === tenant.id && u.is_active).length,
  }));
  return c.json({ tenants: enriched });
});

app.put(`${ROUTE_PREFIX}/platform/tenants/:id`, async (c) => {
  const auth = await requirePlatformAdmin(c);
  if ("response" in auth) return auth.response;
  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.plan !== undefined) update.plan = String(body.plan);
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!["trial", "active", "suspended", "cancelled"].includes(status)) return jsonError(c, "Invalid tenant status");
    update.status = status;
  }
  if (body.billingEmail !== undefined) update.billing_email = String(body.billingEmail || "").trim() || null;
  if (body.maxUsers !== undefined) update.max_users = Math.max(1, Number(body.maxUsers));
  if (body.maxWhatsappInstances !== undefined) update.max_whatsapp_instances = Math.max(1, Number(body.maxWhatsappInstances));
  if (body.trialEndsAt !== undefined) update.trial_ends_at = body.trialEndsAt || null;

  const { data, error } = await auth.service
    .from("tenants")
    .update(update)
    .eq("id", c.req.param("id"))
    .select("id, name, slug, plan, status, billing_email, max_users, max_whatsapp_instances, trial_ends_at, created_at")
    .maybeSingle();
  if (error) return jsonError(c, error.message, 500);
  if (!data) return jsonError(c, "Customer not found", 404);
  return c.json({ tenant: data });
});

app.post(`${ROUTE_PREFIX}/platform/tenants`, async (c) => {
  const auth = await requirePlatformAdmin(c);
  if ("response" in auth) return auth.response;

  let body: any;
  try { body = await c.req.json(); } catch { return jsonError(c, "Invalid JSON body"); }
  const name = String(body.name || "").trim();
  if (!name) return jsonError(c, "Customer/company name is required");

  const slug = String(body.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `customer-${Date.now()}`;

  const { data: tenant, error } = await auth.service
    .from("tenants")
    .insert({
      name,
      slug,
      plan: String(body.plan || "starter"),
      status: String(body.status || "trial"),
      billing_email: String(body.billingEmail || "").trim() || null,
      max_users: Math.max(1, Number(body.maxUsers || 5)),
      max_whatsapp_instances: Math.max(1, Number(body.maxWhatsappInstances || 1)),
      trial_ends_at: body.trialEndsAt || null,
    })
    .select("id, name, slug, plan, status, billing_email, max_users, max_whatsapp_instances, trial_ends_at, created_at")
    .single();
  if (error || !tenant) return jsonError(c, error?.message || "Customer creation failed", 500);

  await auth.service.from("departments").insert([
    { tenant_id: tenant.id, name: "Sales", color: "#25D366" },
    { tenant_id: tenant.id, name: "Support", color: "#128C7E" },
    { tenant_id: tenant.id, name: "Finance", color: "#075E54" },
  ]);

  let adminInvite: any = null;
  if (String(body.adminEmail || "").trim()) {
    const adminEmail = String(body.adminEmail).trim().toLowerCase();
    const adminName = String(body.adminName || adminEmail.split("@")[0]).trim();
    const { data: inviteData, error: inviteError } = await auth.service.auth.admin.inviteUserByEmail(adminEmail, {
      data: { full_name: adminName, tenant_id: tenant.id },
    });

    if (!inviteError && inviteData.user) {
      const profileInsert = await auth.service.from("users").insert({
        auth_user_id: inviteData.user.id,
        tenant_id: tenant.id,
        email: adminEmail,
        full_name: adminName,
        role: "admin",
        is_active: true,
        is_platform_admin: false,
      });
      adminInvite = profileInsert.error
        ? { invited: true, profileCreated: false, warning: profileInsert.error.message }
        : { invited: true, profileCreated: true };
    } else {
      adminInvite = { invited: false, warning: inviteError?.message || "Admin invitation failed" };
    }
  }

  return c.json({ tenant, adminInvite });
});

Deno.serve(app.fetch);
