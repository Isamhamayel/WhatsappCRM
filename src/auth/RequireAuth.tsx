import { Navigate, useLocation } from "react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, profileError, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading account...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">CRM access is not provisioned</h1>
          <p className="mt-2 text-sm text-gray-600">{profileError || "No CRM user profile was found for this login."}</p>
          <button
            onClick={() => void signOut()}
            className="mt-6 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
