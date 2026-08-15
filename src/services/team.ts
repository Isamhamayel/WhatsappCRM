import { apiRequest } from "./api";

export interface TeamUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "agent" | "finance";
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const teamApi = {
  listUsers: () => apiRequest<{ users: TeamUser[] }>("/team/users"),
  inviteUser: (data: { email: string; fullName: string; role: string; department?: string }) =>
    apiRequest<{ user: TeamUser; invited: boolean }>("/team/users/invite", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: { fullName?: string; role?: string; department?: string; isActive?: boolean }) =>
    apiRequest<{ user: TeamUser }>(`/team/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
