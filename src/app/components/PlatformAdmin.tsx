import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, RefreshCw, Smartphone, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthProvider";
import { PlatformTenant, platformApi } from "../../services/platform";

export function PlatformAdmin() {
  const { profile } = useAuth();
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", billingEmail: "", plan: "starter", maxUsers: 5, maxWhatsappInstances: 1, adminEmail: "", adminName: "" });

  const totals = useMemo(() => ({
    customers: tenants.length,
    users: tenants.reduce((sum, x) => sum + Number(x.user_count || 0), 0),
    whatsapp: tenants.reduce((sum, x) => sum + Number(x.whatsapp_count || 0), 0),
  }), [tenants]);

  async function load() {
    setLoading(true);
    try {
      const data = await platformApi.listTenants();
      setTenants(data.tenants || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (profile?.is_platform_admin) void load(); }, [profile?.is_platform_admin]);

  async function updateCustomer(id: string, data: { plan?: string; status?: string }) {
    try {
      await platformApi.updateTenant(id, data);
      toast.success("Customer updated.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function createCustomer() {
    if (!form.name.trim()) return toast.error("Customer/company name is required.");
    setSaving(true);
    try {
      const result = await platformApi.createTenant(form);
      if (result.adminInvite?.warning) toast.warning(result.adminInvite.warning);
      else if (result.adminInvite?.invited) toast.success("Customer created and admin invitation sent.");
      else toast.success("Customer workspace created.");
      setShowAdd(false);
      setForm({ name: "", billingEmail: "", plan: "starter", maxUsers: 5, maxWhatsappInstances: 1, adminEmail: "", adminName: "" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!profile?.is_platform_admin) {
    return <div className="p-8"><div className="bg-white border border-gray-200 rounded-xl p-8 text-center"><p className="font-semibold text-gray-900">Platform administrator access required.</p></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold text-gray-900">Platform Admin</h1><p className="text-gray-500 mt-1">Manage customer workspaces, plans and SaaS limits.</p></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Plus className="w-4 h-4" /> New Customer</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Metric title="Customers" value={totals.customers} icon={<Building2 className="w-5 h-5" />} />
        <Metric title="Active users" value={totals.users} icon={<Users className="w-5 h-5" />} />
        <Metric title="WhatsApp accounts" value={totals.whatsapp} icon={<Smartphone className="w-5 h-5" />} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between"><div><h2 className="font-semibold text-gray-900">Customer workspaces</h2><p className="text-sm text-gray-500">Tenant data remains isolated by RLS.</p></div><button onClick={() => void load()} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div>
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="text-left px-5 py-3">Customer</th><th className="text-left px-5 py-3">Plan</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Users</th><th className="text-left px-5 py-3">WhatsApp</th><th className="text-left px-5 py-3">Billing</th></tr></thead><tbody className="divide-y divide-gray-100">{tenants.map((tenant) => <tr key={tenant.id} className="hover:bg-gray-50"><td className="px-5 py-4"><p className="font-medium text-gray-900">{tenant.name}</p><p className="text-xs text-gray-500">{tenant.slug}</p></td><td className="px-5 py-4"><select value={tenant.plan} onChange={(e) => void updateCustomer(tenant.id, { plan: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white capitalize"><option value="starter">Starter</option><option value="pro">Professional</option><option value="enterprise">Enterprise</option></select></td><td className="px-5 py-4"><select value={tenant.status} onChange={(e) => void updateCustomer(tenant.id, { status: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white capitalize"><option value="trial">Trial</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option></select></td><td className="px-5 py-4">{tenant.user_count}/{tenant.max_users}</td><td className="px-5 py-4">{tenant.whatsapp_count}/{tenant.max_whatsapp_instances}</td><td className="px-5 py-4 text-gray-600">{tenant.billing_email || "—"}</td></tr>)}</tbody></table></div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"><div className="p-5 border-b"><h2 className="text-lg font-semibold">Create customer workspace</h2><p className="text-sm text-gray-500 mt-1">Optionally invite the customer's first administrator now.</p></div><div className="p-5 grid md:grid-cols-2 gap-4"><Field label="Company name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><Field label="Billing email" value={form.billingEmail} onChange={(v) => setForm({ ...form, billingEmail: v })} /><label className="block"><span className="text-sm font-medium text-gray-700">Plan</span><select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="starter">Starter</option><option value="pro">Professional</option><option value="enterprise">Enterprise</option></select></label><NumberField label="Max users" value={form.maxUsers} onChange={(v) => setForm({ ...form, maxUsers: v })} /><NumberField label="Max WhatsApp numbers" value={form.maxWhatsappInstances} onChange={(v) => setForm({ ...form, maxWhatsappInstances: v })} /><div></div><Field label="Customer admin name" value={form.adminName} onChange={(v) => setForm({ ...form, adminName: v })} /><Field label="Customer admin email" value={form.adminEmail} onChange={(v) => setForm({ ...form, adminEmail: v })} /></div><div className="p-5 border-t flex justify-end gap-2"><button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={() => void createCustomer()} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving ? "Creating..." : "Create customer"}</button></div></div></div>
      )}
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) { return <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-3"><div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">{icon}</div><div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-semibold text-gray-900">{value}</p></div></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="text-sm font-medium text-gray-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) { return <label className="block"><span className="text-sm font-medium text-gray-700">{label}</span><input type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, Number(e.target.value)))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label>; }
