import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, Shield, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../lib/supabaseClient";
import { TeamUser, teamApi } from "../../services/team";

type Department = { id: string; name: string; color: string | null };

const roleBadge: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  agent: "bg-blue-100 text-blue-700",
  finance: "bg-amber-100 text-amber-700",
};

export function UsersDepartments() {
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.is_platform_admin;
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", role: "agent", department: "Sales" });

  const activeUsers = useMemo(() => users.filter((u) => u.is_active).length, [users]);

  async function load() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const [team, deps] = await Promise.all([
        teamApi.listUsers(),
        supabase.from("departments").select("id, name, color").eq("tenant_id", profile.tenant_id).order("name"),
      ]);
      setUsers(team.users || []);
      setDepartments((deps.data || []) as Department[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (profile?.tenant_id) void load(); }, [profile?.tenant_id]);

  async function invite() {
    if (!form.fullName.trim() || !form.email.trim()) return toast.error("Name and email are required.");
    setSaving(true);
    try {
      await teamApi.inviteUser(form);
      toast.success("Invitation sent and CRM profile created.");
      setShowInvite(false);
      setForm({ fullName: "", email: "", role: "agent", department: departments[0]?.name || "Sales" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: TeamUser) {
    try {
      await teamApi.updateUser(user.id, { isActive: !user.is_active });
      toast.success(user.is_active ? "User deactivated." : "User activated.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users & Departments</h1>
          <p className="text-gray-500 mt-1">Manage real customer users inside this tenant workspace.</p>
        </div>
        {canManage && <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Plus className="w-4 h-4" /> Invite User</button>}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <InfoCard title="Active users" value={`${activeUsers}/${profile?.max_users || "—"}`} icon={<Users className="w-5 h-5" />} />
        <InfoCard title="Departments" value={String(departments.length)} icon={<Building2 className="w-5 h-5" />} />
        <InfoCard title="Your role" value={profile?.is_platform_admin ? "Platform Admin" : profile?.role || "—"} icon={<Shield className="w-5 h-5" />} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Departments</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => {
            const count = users.filter((u) => u.department === dept.name && u.is_active).length;
            return <div key={dept.id} className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Building2 className="w-4 h-4 text-gray-600" /></div><div><p className="font-medium text-gray-900">{dept.name}</p><p className="text-sm text-gray-500">{count} active members</p></div></div></div>;
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Team members</h2></div>
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div> : users.length === 0 ? <div className="p-12 text-center text-gray-500">No customer users yet.</div> : (
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b"><tr><th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">User</th><th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Role</th><th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Department</th><th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Status</th><th className="px-5 py-3 text-right text-xs text-gray-500 uppercase">Action</th></tr></thead><tbody className="divide-y divide-gray-100">{users.map((user) => <tr key={user.id} className="hover:bg-gray-50"><td className="px-5 py-4"><p className="font-medium text-gray-900">{user.full_name}</p><p className="text-sm text-gray-500">{user.email}</p></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[user.role] || "bg-gray-100 text-gray-700"}`}><Shield className="w-3 h-3" />{user.role}</span></td><td className="px-5 py-4 text-sm text-gray-700">{user.department || "—"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}><UserCheck className="w-3 h-3" />{user.is_active ? "Active" : "Inactive"}</span></td><td className="px-5 py-4 text-right">{canManage && user.id !== profile?.id && <button onClick={() => void toggleUser(user)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">{user.is_active ? "Deactivate" : "Activate"}</button>}</td></tr>)}</tbody></table></div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Invitations use Supabase Auth. Configure your Supabase Auth email/SMTP settings before customer onboarding so invite emails reach users reliably.
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-lg"><div className="p-5 border-b"><h2 className="text-lg font-semibold">Invite team member</h2><p className="text-sm text-gray-500 mt-1">This creates a Supabase Auth invitation and a tenant-scoped CRM profile.</p></div><div className="p-5 space-y-4"><Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} /><Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} /><label className="block"><span className="text-sm font-medium text-gray-700">Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="agent">Agent</option><option value="manager">Manager</option><option value="finance">Finance</option><option value="admin">Admin</option></select></label><label className="block"><span className="text-sm font-medium text-gray-700">Department</span><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">{departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></label></div><div className="p-5 border-t flex justify-end gap-2"><button onClick={() => setShowInvite(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={() => void invite()} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving ? "Inviting..." : "Send invite"}</button></div></div></div>
      )}
    </div>
  );
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) { return <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">{icon}</div><div><p className="text-sm text-gray-500">{title}</p><p className="font-semibold text-gray-900 capitalize">{value}</p></div></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="text-sm font-medium text-gray-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label>; }
