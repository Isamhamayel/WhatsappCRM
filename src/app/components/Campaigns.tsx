import { useNavigate } from "react-router";
import { Plus, Eye, Send, CheckCheck, MessageSquare, TrendingUp } from "lucide-react";

const campaigns = [
  {
    id: 1,
    name: "Summer Sale 2026",
    status: "completed",
    sent: 1248,
    delivered: 1235,
    read: 892,
    replied: 156,
    created: "2 days ago",
  },
  {
    id: 2,
    name: "Product Launch Announcement",
    status: "active",
    sent: 856,
    delivered: 845,
    read: 423,
    replied: 78,
    created: "1 week ago",
  },
  {
    id: 3,
    name: "Customer Feedback Survey",
    status: "scheduled",
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    created: "3 hours ago",
  },
  {
    id: 4,
    name: "Easter Promotion",
    status: "draft",
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    created: "5 hours ago",
  },
];

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  active: { label: "Active", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
};

export function Campaigns() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and manage WhatsApp marketing campaigns</p>
        </div>
        <button
          onClick={() => navigate("/campaigns/create")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Campaign</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">2,104</p>
            </div>
            <div className="bg-blue-500 rounded-lg p-3">
              <Send className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">2,080</p>
            </div>
            <div className="bg-green-500 rounded-lg p-3">
              <CheckCheck className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Read Rate</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">63%</p>
            </div>
            <div className="bg-purple-500 rounded-lg p-3">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reply Rate</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">11%</p>
            </div>
            <div className="bg-orange-500 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Replied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{campaign.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[campaign.status as keyof typeof statusConfig].color}`}>
                      {statusConfig[campaign.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.delivered.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.read.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.replied.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaign.created}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/campaigns/${campaign.id}/analytics`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
