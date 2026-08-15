import { supabase, supabaseAnonKey, supabaseUrl } from "../lib/supabaseClient";

export const SERVER_BASE = `${supabaseUrl}/functions/v1/server`;
export const ROUTE_PREFIX = "/make-server-f76250f6";

export async function authenticatedHeaders() {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    apikey: supabaseAnonKey!,
  };
}

export async function parseApiError(res: Response) {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.error || parsed.message || text;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = { ...(await authenticatedHeaders()), ...(init.headers || {}) };
  const res = await fetch(`${SERVER_BASE}${ROUTE_PREFIX}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await parseApiError(res)}`);
  return await res.json() as T;
}
