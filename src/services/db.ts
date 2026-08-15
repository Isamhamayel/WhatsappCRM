/**
 * Data access layer — all DB reads/writes go through here.
 * To migrate from Supabase to MySQL: replace this file only.
 * Components never import supabase directly.
 */
import { supabase } from "../lib/supabaseClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  tenant_id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  tags: string[];
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  contact_id: string;
  whatsapp_instance_id: string | null;
  assigned_user_id: string | null;
  department: string | null;
  status: "open" | "pending" | "resolved" | "closed";
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  contacts?: Contact;
}

export interface Message {
  id: string;
  conversation_id: string;
  whatsapp_instance_id?: string | null;
  sender: "agent" | "customer" | "system";
  body: string;
  status: string;
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  name: string;
  phone: string | null;
  status: "hot" | "warm" | "cold" | "lost" | "won";
  department: string | null;
  value: number;
  notes: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  department: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  message: string;
  whatsapp_instance_id?: string | null;
  status: "draft" | "scheduled" | "active" | "completed" | "failed";
  sent_count: number;
  delivered_count: number;
  read_count: number;
  replied_count: number;
  created_at: string;
}

export interface QuickReply {
  id: string;
  name: string;
  shortcut: string;
  content: string;
  category: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  object_type: string;
  object_id: string | null;
  object_name: string | null;
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
  created_at: string;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contactsDb = {
  list: (tenantId: string) =>
    supabase.from("contacts").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),

  get: (id: string) =>
    supabase.from("contacts").select("*").eq("id", id).single(),

  create: (data: Partial<Contact>) =>
    supabase.from("contacts").insert(data).select().single(),

  update: (id: string, data: Partial<Contact>) =>
    supabase.from("contacts").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id).select().single(),

  delete: (id: string) =>
    supabase.from("contacts").delete().eq("id", id),
};

// ─── Conversations ───────────────────────────────────────────────────────────

export const conversationsDb = {
  list: (tenantId: string) =>
    supabase
      .from("conversations")
      .select("*, contacts(*)")
      .eq("tenant_id", tenantId)
      .order("last_message_at", { ascending: false }),

  get: (id: string) =>
    supabase.from("conversations").select("*, contacts(*)").eq("id", id).single(),

  markRead: (id: string) =>
    supabase.from("conversations").update({ unread_count: 0 }).eq("id", id),
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const messagesDb = {
  list: (conversationId: string) =>
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),

  insert: (data: Partial<Message> & { tenant_id: string; conversation_id: string; sender: string; body: string }) =>
    supabase.from("messages").insert(data).select().single(),
};

// ─── Leads ───────────────────────────────────────────────────────────────────

export const leadsDb = {
  list: (tenantId: string) =>
    supabase.from("leads").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),

  create: (data: Partial<Lead>) =>
    supabase.from("leads").insert(data).select().single(),

  update: (id: string, data: Partial<Lead>) =>
    supabase.from("leads").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id).select().single(),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const ticketsDb = {
  list: (tenantId: string) =>
    supabase.from("tickets").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),

  create: (data: Partial<Ticket>) =>
    supabase.from("tickets").insert(data).select().single(),

  update: (id: string, data: Partial<Ticket>) =>
    supabase.from("tickets").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id).select().single(),
};

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const campaignsDb = {
  list: (tenantId: string) =>
    supabase.from("campaigns").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),

  create: (data: Partial<Campaign>) =>
    supabase.from("campaigns").insert(data).select().single(),

  update: (id: string, data: Partial<Campaign>) =>
    supabase.from("campaigns").update(data).eq("id", id).select().single(),
};

// ─── Quick Replies ────────────────────────────────────────────────────────────

export const quickRepliesDb = {
  list: (tenantId: string) =>
    supabase.from("quick_replies").select("*").eq("tenant_id", tenantId).order("name"),

  create: (data: Partial<QuickReply> & { tenant_id: string }) =>
    supabase.from("quick_replies").insert(data).select().single(),

  update: (id: string, data: Partial<QuickReply>) =>
    supabase.from("quick_replies").update(data).eq("id", id).select().single(),

  delete: (id: string) =>
    supabase.from("quick_replies").delete().eq("id", id),
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogsDb = {
  list: (tenantId: string, filters?: { objectType?: string; limit?: number }) =>
    supabase
      .from("audit_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(filters?.limit || 100),

  insert: (data: Partial<AuditLog> & { tenant_id: string; action: string; object_type: string }) =>
    supabase.from("audit_logs").insert(data),
};
