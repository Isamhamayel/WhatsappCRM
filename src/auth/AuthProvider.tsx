import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export type AppRole = "admin" | "manager" | "agent" | "finance";

export interface AppUserProfile {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_platform_admin: boolean;
  tenant_name?: string;
  tenant_plan?: string;
  tenant_status?: string;
  max_users?: number;
  max_whatsapp_instances?: number;
}

interface AuthContextValue {
  session: Session | null;
  profile: AppUserProfile | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = async (userId?: string) => {
    const authUserId = userId || session?.user.id;
    if (!authUserId) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, auth_user_id, tenant_id, email, full_name, role, department, avatar_url, is_active, is_platform_admin, tenants(name, plan, status, max_users, max_whatsapp_instances)")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setProfileError(error.message);
      return;
    }

    if (!data) {
      setProfile(null);
      setProfileError(
        "Your login is valid, but this account is not linked to a CRM user profile. Ask an administrator to provision it.",
      );
      return;
    }

    if (!data.is_active) {
      setProfile(null);
      setProfileError("This CRM user account is inactive.");
      return;
    }

    const tenant = Array.isArray((data as any).tenants) ? (data as any).tenants[0] : (data as any).tenants;
    setProfile({
      ...(data as any),
      tenant_name: tenant?.name,
      tenant_plan: tenant?.plan,
      tenant_status: tenant?.status,
      max_users: tenant?.max_users,
      max_whatsapp_instances: tenant?.max_whatsapp_instances,
    } as AppUserProfile);
    setProfileError(null);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      if (mounted) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void loadProfile(nextSession.user.id).finally(() => setLoading(false));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setProfileError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileError,
      signIn,
      signOut,
      refreshProfile: () => loadProfile(),
    }),
    [session, profile, loading, profileError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
