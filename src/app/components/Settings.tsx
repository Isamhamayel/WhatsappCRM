import { useState } from "react";
import { Save, Bell, Phone, Globe, Lock, CreditCard, Smartphone, Zap, Plus, Edit, Trash2, X } from "lucide-react";

interface Template {
  id: number;
  name: string;
  category: string;
  shortcut: string;
  content: string;
}

const defaultTemplates: Template[] = [
  {
    id: 1,
    name: "Greeting",
    category: "General",
    shortcut: "/hi",
    content: "Hi {contact_name}! Thanks for reaching out. How can I help you today?"
  },
  {
    id: 2,
    name: "Demo Scheduling",
    category: "Sales",
    shortcut: "/demo",
    content: "Hi {contact_name}! I'd be happy to schedule a demo for you. What day and time works best for you this week?"
  },
  {
    id: 3,
    name: "Pricing Information",
    category: "Sales",
    shortcut: "/pricing",
    content: "We have three main plans: Starter ($29/mo), Professional ($79/mo), and Enterprise (custom pricing). Each plan includes different features. Which one interests you most?"
  },
  {
    id: 4,
    name: "Technical Support",
    category: "Support",
    shortcut: "/support",
    content: "Hi {contact_name}! I'm sorry you're experiencing issues. Can you please describe the problem in more detail so I can help you resolve it?"
  },
  {
    id: 5,
    name: "Follow Up",
    category: "General",
    shortcut: "/followup",
    content: "Hi {contact_name}! Just following up on our previous conversation. Do you have any questions or need any additional information?"
  },
  {
    id: 6,
    name: "Thank You",
    category: "General",
    shortcut: "/thanks",
    content: "Thank you {contact_name}! We appreciate your business. If you need anything else, feel free to reach out."
  },
  {
    id: 7,
    name: "Invoice Request",
    category: "Finance",
    shortcut: "/invoice",
    content: "Hi {contact_name}! I'll send you the invoice right away. Please allow 5-10 minutes for it to arrive in your email."
  },
  {
    id: 8,
    name: "Out of Office",
    category: "General",
    shortcut: "/ooo",
    content: "Thank you for your message. I'm currently out of office and will respond to you within 24 hours. For urgent matters, please contact support@company.com."
  }
];

export function Settings() {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    shortcut: "",
    content: ""
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({ name: "", category: "General", shortcut: "", content: "" });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      shortcut: template.shortcut,
      content: template.content
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!formData.name || !formData.shortcut || !formData.content) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingTemplate) {
      setTemplates(templates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, ...formData }
          : t
      ));
    } else {
      const newTemplate: Template = {
        id: Math.max(...templates.map(t => t.id), 0) + 1,
        ...formData
      };
      setTemplates([...templates, newTemplate]);
    }

    setShowTemplateModal(false);
    setFormData({ name: "", category: "General", shortcut: "", content: "" });
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplateToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      setTemplates(templates.filter(t => t.id !== templateToDelete));
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your company settings and preferences</p>
      </div>

      {/* Quick Replies Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Replies</h2>
              <p className="text-sm text-gray-500">Manage templates for faster responses</p>
            </div>
          </div>
          <button
            onClick={handleAddTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            Available variables: <code className="px-1.5 py-0.5 bg-blue-100 rounded">{"{contact_name}"}</code>{" "}
            <code className="px-1.5 py-0.5 bg-blue-100 rounded">{"{phone}"}</code>{" "}
            <code className="px-1.5 py-0.5 bg-blue-100 rounded">{"{department}"}</code>
          </p>
        </div>

        {/* Templates by Category */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryTemplates = templates.filter(t => t.category === category);
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">{category}</h3>
                <div className="space-y-2">
                  {categoryTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">
                              {template.shortcut}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{template.content}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              defaultValue="Acme Corp"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option>UTC-08:00 Pacific Time</option>
              <option>UTC-05:00 Eastern Time</option>
              <option>UTC+00:00 GMT</option>
            </select>
          </div>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">WhatsApp Connection</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900">Connected</p>
                <p className="text-sm text-green-700">+1 (555) 123-4567</p>
              </div>
              <button className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                Disconnect
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Profile Name</label>
            <input
              type="text"
              defaultValue="Acme Corp Support"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
            <textarea
              rows={3}
              defaultValue="Hi! Thanks for contacting Acme Corp. How can we help you today?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">New Messages</p>
              <p className="text-sm text-gray-500">Get notified when you receive new messages</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
          </label>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Lead Updates</p>
              <p className="text-sm text-gray-500">Get notified when lead status changes</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
          </label>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Campaign Results</p>
              <p className="text-sm text-gray-500">Get notified when campaigns complete</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" />
          </label>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Daily Summary</p>
              <p className="text-sm text-gray-500">Receive daily performance summaries</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-left">
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-left">
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Billing & Plan</h2>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-emerald-900">Professional Plan</p>
              <p className="text-sm text-emerald-700">$79/month • Billed monthly</p>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              Upgrade
            </button>
          </div>
        </div>
        <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="text-left">
            <p className="font-medium text-gray-900">Payment Methods</p>
            <p className="text-sm text-gray-500">Manage your payment methods</p>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Add/Edit Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? "Edit Template" : "Add New Template"}
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Greeting, Demo Scheduling"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="General">General</option>
                  <option value="Sales">Sales</option>
                  <option value="Support">Support</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shortcut <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  placeholder="e.g., /hi, /demo, /pricing"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Agents can type this shortcut to quickly access the template
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your template message here..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables: <code className="px-1 py-0.5 bg-gray-100 rounded">{"{contact_name}"}</code>{" "}
                  <code className="px-1 py-0.5 bg-gray-100 rounded">{"{phone}"}</code>{" "}
                  <code className="px-1 py-0.5 bg-gray-100 rounded">{"{department}"}</code>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                {editingTemplate ? "Save Changes" : "Add Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Template?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this quick reply template. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
