import { apiRequest } from "./api";

export interface WhatsAppInstance {
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
  created_at: string;
  updated_at: string;
}

export const whatsappInstancesApi = {
  list: () => apiRequest<{ instances: WhatsAppInstance[] }>("/whatsapp/instances"),

  create: (data: {
    name: string;
    phoneNumber?: string;
    providerInstanceId: string;
    apiToken: string;
    apiUrl?: string;
    webhookSecret?: string;
    isDefault?: boolean;
  }) => apiRequest<{ instance: WhatsAppInstance; webhookSecret: string; webhookToken: string }>("/whatsapp/instances", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<{ instance: WhatsAppInstance; webhookSecret?: string; webhookToken?: string }>(`/whatsapp/instances/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  test: (id: string) => apiRequest<{ connected: boolean; state?: string; error?: string }>(`/whatsapp/instances/${id}/test`, {
    method: "POST",
  }),
};
