import { apiRequest } from "./api";

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "trial" | "active" | "suspended" | "cancelled";
  billing_email: string | null;
  max_users: number;
  max_whatsapp_instances: number;
  trial_ends_at: string | null;
  created_at: string;
  whatsapp_count: number;
  user_count: number;
}

export const platformApi = {
  listTenants: () => apiRequest<{ tenants: PlatformTenant[] }>("/platform/tenants"),
  updateTenant: (id: string, data: { plan?: string; status?: string; maxUsers?: number; maxWhatsappInstances?: number; billingEmail?: string }) => apiRequest<{ tenant: PlatformTenant }>(`/platform/tenants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  createTenant: (data: {
    name: string;
    slug?: string;
    plan?: string;
    status?: string;
    billingEmail?: string;
    maxUsers?: number;
    maxWhatsappInstances?: number;
    trialEndsAt?: string | null;
    adminEmail?: string;
    adminName?: string;
  }) => apiRequest<{ tenant: PlatformTenant; adminInvite?: { invited: boolean; profileCreated?: boolean; warning?: string } }>("/platform/tenants", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};
