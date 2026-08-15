import { apiRequest } from "./api";

export interface SendMessageResult {
  idMessage?: string;
  whatsappInstanceId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  options?: { conversationId?: string; whatsappInstanceId?: string | null },
): Promise<SendMessageResult> {
  try {
    return await apiRequest<SendMessageResult>("/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({
        phone,
        message,
        conversationId: options?.conversationId || null,
        whatsappInstanceId: options?.whatsappInstanceId || null,
      }),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendCampaign(
  campaignId: string,
): Promise<{ ok: boolean; sent?: number; whatsappInstanceId?: string; error?: string }> {
  try {
    return await apiRequest("/campaigns/send", {
      method: "POST",
      body: JSON.stringify({ campaignId }),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
