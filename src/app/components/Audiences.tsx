import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Users, Filter, Edit, Trash2, Eye } from "lucide-react";

const audiences = [
  {
    id: 1,
    name: "Hot Leads",
    description: "All contacts with lead status = Hot",
    filters: { leadStatus: ["hot"] },
    contactCount: 45,
    created: "2 weeks ago",
    lastUpdated: "5 minutes ago"
  },
  {
    id: 2,
    name: "VIP Customers",
    description: "Customers with purchase history > $1000",
    filters: { tags: ["vip", "premium"] },
    contactCount: 128,
    created: "1 month ago",
    lastUpdated: "2 hours ago"
  },
  {
    id: 3,
    name: "Support Team Contacts",
    description: "All contacts assigned to Support department",
    filters: { department: ["support"] },
    contactCount: 342,
    created: "3 weeks ago",
    lastUpdated: "1 day ago"
  },
  {
    id: 4,
    name: "Inactive Leads",
    description: "Leads with no activity in last 30 days",
    filters: { leadStatus: ["cold"], lastContact: "30days" },
    contactCount: 234,
    created: "1 week ago",
    lastUpdated: "3 hours ago"
  },
  {
    id: 5,
    name: "Finance Customers",
    description: "All customers in Finance department",
    filters: { department: ["finance"] },
    contactCount: 89,
    created: "2 weeks ago",
    lastUpdated: "6 hours ago"
  },
];

export function Audiences() {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setSelectedAudience(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // In real app, delete the audience
    console.log("Deleting audience:", selectedAudience);
    setShowDeleteModal(false);
    setSelectedAudience(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audiences</h1>
          <p className="text-gray-500 mt-1">Create and manage dynamic contact segments</p>
        </div>
        <button
          onClick={() => navigate("/audiences/create")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Audience</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Audiences</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{audiences.length}</p>
            </div>
            <div className="bg-emerald-500 rounded-lg p-3">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {audiences.reduce((sum, a) => sum + a.contactCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-500 rounded-lg p-3">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Filters</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {audiences.reduce((sum, a) => sum + Object.keys(a.filters).length, 0)}
              </p>
            </div>
            <div className="bg-purple-500 rounded-lg p-3">
              <Filter className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-lg p-2">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">Dynamic Audiences</h3>
            <p className="text-sm text-blue-700 mt-1">
              Audiences are dynamic segments based on filters. When you add a new contact that matches an audience's criteria, 
              they are automatically included. Contact counts update in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Audiences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {audiences.map((audience) => (
          <div key={audience.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{audience.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{audience.description}</p>
                </div>
              </div>
            </div>

            {/* Contact Count */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Contacts</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {audience.contactCount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last updated</p>
                  <p className="text-sm text-gray-900 mt-1">{audience.lastUpdated}</p>
                </div>
              </div>
            </div>

            {/* Filters Preview */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Active Filters</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(audience.filters).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <Filter className="w-3 h-3" />
                    {key}: {Array.isArray(value) ? value.join(", ") : value}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(`/audiences/${audience.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Contacts
              </button>
              <button
                onClick={() => navigate(`/audiences/${audience.id}/edit`)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-300"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(audience.id)}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Audience?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this audience. This action cannot be undone. 
              Your contacts will not be deleted, only the audience segment definition.
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
                Delete Audience
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
