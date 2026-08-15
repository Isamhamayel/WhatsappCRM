import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Loader2, MessageSquare, Plus, RefreshCw, ShieldCheck, Smartphone, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthProvider";
import { supabaseUrl } from "../../lib/supabaseClient";
import { WhatsAppInstance, whatsappInstancesApi } from "../../services/whatsappInstances";

const webhookUrl = `${supabaseUrl}/functions/v1/server/make-server-f76250f6/whatsapp/webhook`;

export function WhatsAppAccounts() {
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.is_platform_admin;
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Sales WhatsApp",
    phoneNumber: "",
    providerInstanceId: "",
    apiToken: "",
    apiUrl: "https://api.green-api.com",
    isDefault: true,
  });

  const activeCount = useMemo(() => instances.filter((item) => item.status !== "disconnected").length, [instances]);

  async function load() {
    setLoading(true);
    try {
      const data = await whatsappInstancesApi.list();
      setInstances(data.instances || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createInstance() {
    if (!form.providerInstanceId.trim() || !form.apiToken.trim()) {
      toast.error("GREEN-API Instance ID and API Token are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await whatsappInstancesApi.create(form);
      setIssuedToken(result.webhookToken);
      setShowAdd(false);
      setForm({ name: "Sales WhatsApp", phoneNumber: "", providerInstanceId: "", apiToken: "", apiUrl: "https://api.green-api.com", isDefault: false });
      toast.success("WhatsApp account added securely.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function testInstance(id: string) {
    setTestingId(id);
    try {
      const result = await whatsappInstancesApi.test(id);
      if (result.connected) toast.success(`Connected: ${result.state || "authorized"}`);
      else toast.error(result.error || `State: ${result.state || "not connected"}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setTestingId(null);
    }
  }

  async function makeDefault(item: WhatsAppInstance) {
    try {
      await whatsappInstancesApi.update(item.id, { isDefault: true });
      toast.success(`${item.name} is now the default account.`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied.`);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">WhatsApp Accounts</h1>
          <p className="text-gray-500 mt-1">Connect one or more GREEN-API numbers to this customer workspace.</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Add WhatsApp
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <SummaryCard label="Connected accounts" value={String(activeCount)} icon={<Smartphone className="w-5 h-5" />} />
        <SummaryCard label="Default routing" value={instances.find((x) => x.is_default)?.name || "Not set"} icon={<Star className="w-5 h-5" />} />
        <SummaryCard label="Credential storage" value="Supabase Vault" icon={<ShieldCheck className="w-5 h-5" />} />
      </div>

      {issuedToken && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div className="font-semibold text-amber-900">Save this webhook token now</div>
          <p className="text-sm text-amber-800">For security, the CRM will not show the decrypted token again. Put this exact value in GREEN-API → Webhook URL Token.</p>
          <CopyRow label="Webhook URL" value={webhookUrl} onCopy={copy} />
          <CopyRow label="Webhook URL Token" value={issuedToken} onCopy={copy} />
          <button onClick={() => setIssuedToken(null)} className="text-sm font-medium text-amber-900 underline">I saved it</button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Connected numbers</h2>
            <p className="text-sm text-gray-500">Incoming messages are routed automatically by GREEN-API Instance ID.</p>
          </div>
          <button onClick={() => void load()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
        ) : instances.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-800">No WhatsApp account connected yet</p>
            <p className="text-sm text-gray-500 mt-1">Add the customer's GREEN-API instance before sending or receiving messages.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {instances.map((item) => (
              <div key={item.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700"><Smartphone className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.is_default && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Default</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{item.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.phone_number || "Phone not labeled"} · Instance {item.provider_instance_id}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      {item.last_state === "authorized" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                      State: {item.last_state || "not tested"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => void testInstance(item.id)} disabled={testingId === item.id} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    {testingId === item.id ? "Testing..." : "Test connection"}
                  </button>
                  {canManage && !item.is_default && (
                    <button onClick={() => void makeDefault(item)} className="px-3 py-2 text-sm text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50">Make default</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900">One webhook URL for every customer</h3>
        <p className="text-sm text-blue-800 mt-1">Use the same webhook URL for all GREEN-API instances. The backend reads <code>instanceData.idInstance</code>, validates that instance's private webhook token, then routes the message to the correct tenant.</p>
        <div className="mt-3"><CopyRow label="Webhook URL" value={webhookUrl} onCopy={copy} /></div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Connect GREEN-API account</h2>
              <p className="text-sm text-gray-500 mt-1">The API token is sent directly to the backend and encrypted in Supabase Vault.</p>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Account name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Sales WhatsApp" />
              <Field label="WhatsApp phone (label)" value={form.phoneNumber} onChange={(v) => setForm({ ...form, phoneNumber: v })} placeholder="+970..." />
              <Field label="GREEN-API Instance ID" value={form.providerInstanceId} onChange={(v) => setForm({ ...form, providerInstanceId: v })} placeholder="1101728000" />
              <Field label="GREEN-API API Token" value={form.apiToken} onChange={(v) => setForm({ ...form, apiToken: v })} placeholder="apiTokenInstance" type="password" />
              <Field label="GREEN-API API URL" value={form.apiUrl} onChange={(v) => setForm({ ...form, apiUrl: v })} placeholder="https://api.green-api.com" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4" />
                Use this as the default outbound number
              </label>
            </div>
            <div className="p-5 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={() => void createInstance()} disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving..." : "Connect account"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">{icon}</div><div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-900 mt-0.5 truncate">{value}</p></div></div>;
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string, label: string) => void }) {
  return <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="text-xs text-gray-500 mb-1">{label}</p><code className="block text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 overflow-x-auto">{value}</code></div><button onClick={() => void onCopy(value, label)} className="p-2 border border-gray-300 rounded-lg hover:bg-white" title={`Copy ${label}`}><Copy className="w-4 h-4" /></button></div>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="block"><span className="text-sm font-medium text-gray-700">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>;
}
