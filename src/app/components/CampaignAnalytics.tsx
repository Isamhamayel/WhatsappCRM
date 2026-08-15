import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send, CheckCheck, Eye, MessageSquare, Download, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

const timelineData = [
  { hour: "9AM", sent: 120, delivered: 118, read: 45 },
  { hour: "10AM", sent: 240, delivered: 235, read: 156 },
  { hour: "11AM", sent: 180, delivered: 178, read: 234 },
  { hour: "12PM", sent: 220, delivered: 218, read: 312 },
  { hour: "1PM", sent: 160, delivered: 158, read: 428 },
  { hour: "2PM", sent: 200, delivered: 198, read: 567 },
  { hour: "3PM", sent: 128, delivered: 130, read: 892 },
];

const statusData = [
  { name: "Delivered", value: 1235, color: "#10b981" },
  { name: "Read", value: 892, color: "#6366f1" },
  { name: "Replied", value: 156, color: "#f59e0b" },
  { name: "Failed", value: 13, color: "#ef4444" },
];

// Detailed audience report data
const audienceReport = [
  { id: 1, name: "Alice Williams", phone: "+1 234 567 8901", status: "replied", sentTime: "9:15 AM", deliveredTime: "9:15 AM", readTime: "9:23 AM", repliedTime: "9:45 AM" },
  { id: 2, name: "Robert Martinez", phone: "+1 234 567 8902", status: "read", sentTime: "9:16 AM", deliveredTime: "9:16 AM", readTime: "10:12 AM", repliedTime: "-" },
  { id: 3, name: "Emma Davis", phone: "+1 234 567 8903", status: "replied", sentTime: "9:17 AM", deliveredTime: "9:17 AM", readTime: "9:34 AM", repliedTime: "11:20 AM" },
  { id: 4, name: "James Wilson", phone: "+1 234 567 8904", status: "delivered", sentTime: "9:18 AM", deliveredTime: "9:18 AM", readTime: "-", repliedTime: "-" },
  { id: 5, name: "Maria Garcia", phone: "+1 234 567 8905", status: "read", sentTime: "9:19 AM", deliveredTime: "9:19 AM", readTime: "11:45 AM", repliedTime: "-" },
  { id: 6, name: "David Lee", phone: "+1 234 567 8906", status: "not-delivered", sentTime: "9:20 AM", deliveredTime: "-", readTime: "-", repliedTime: "-" },
  { id: 7, name: "Sarah Chen", phone: "+1 234 567 8907", status: "replied", sentTime: "9:21 AM", deliveredTime: "9:21 AM", readTime: "9:55 AM", repliedTime: "10:30 AM" },
  { id: 8, name: "Michael Brown", phone: "+1 234 567 8908", status: "read", sentTime: "9:22 AM", deliveredTime: "9:22 AM", readTime: "12:15 PM", repliedTime: "-" },
  { id: 9, name: "Jessica Taylor", phone: "+1 234 567 8909", status: "delivered", sentTime: "9:23 AM", deliveredTime: "9:23 AM", readTime: "-", repliedTime: "-" },
  { id: 10, name: "Daniel Anderson", phone: "+1 234 567 8910", status: "read", sentTime: "9:24 AM", deliveredTime: "9:24 AM", readTime: "1:30 PM", repliedTime: "-" },
  { id: 11, name: "Lisa Moore", phone: "+1 234 567 8911", status: "not-delivered", sentTime: "9:25 AM", deliveredTime: "-", readTime: "-", repliedTime: "-" },
  { id: 12, name: "Kevin White", phone: "+1 234 567 8912", status: "replied", sentTime: "9:26 AM", deliveredTime: "9:26 AM", readTime: "10:05 AM", repliedTime: "2:15 PM" },
];

const statusBadgeConfig = {
  "not-delivered": { label: "Not Delivered", color: "bg-red-100 text-red-700" },
  "delivered": { label: "Delivered", color: "bg-blue-100 text-blue-700" },
  "read": { label: "Read", color: "bg-purple-100 text-purple-700" },
  "replied": { label: "Replied", color: "bg-green-100 text-green-700" },
};

type SortField = "name" | "phone" | "status" | "sentTime" | "deliveredTime" | "readTime" | "repliedTime";
type SortDirection = "asc" | "desc" | null;

export function CampaignAnalytics() {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedAudience = () => {
    let filtered = audienceReport;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredAudience = getSortedAudience();

  const handleExportToExcel = () => {
    const exportData = filteredAudience.map((item) => ({
      Name: item.name,
      Phone: item.phone,
      Status: statusBadgeConfig[item.status as keyof typeof statusBadgeConfig].label,
      "Sent Time": item.sentTime,
      "Delivered Time": item.deliveredTime,
      "Read Time": item.readTime,
      "Replied Time": item.repliedTime,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audience Report");

    const fileName = `campaign_audience_report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-4 h-4 text-emerald-600" />;
    }
    return <ArrowDown className="w-4 h-4 text-emerald-600" />;
  };

  const statusCounts = {
    "not-delivered": audienceReport.filter(a => a.status === "not-delivered").length,
    "delivered": audienceReport.filter(a => a.status === "delivered").length,
    "read": audienceReport.filter(a => a.status === "read").length,
    "replied": audienceReport.filter(a => a.status === "replied").length,
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Campaigns</span>
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Summer Sale 2026</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Completed
            </span>
            <span className="text-sm text-gray-500">Sent 2 days ago</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">1,248</p>
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
                <p className="text-2xl font-semibold text-gray-900 mt-1">1,235</p>
                <p className="text-xs text-green-600 mt-1">98.9%</p>
              </div>
              <div className="bg-green-500 rounded-lg p-3">
                <CheckCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Read</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">892</p>
                <p className="text-xs text-green-600 mt-1">71.5%</p>
              </div>
              <div className="bg-purple-500 rounded-lg p-3">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Replied</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">156</p>
                <p className="text-xs text-green-600 mt-1">12.5%</p>
              </div>
              <div className="bg-orange-500 rounded-lg p-3">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery & Engagement Timeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid key="grid-timeline" strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis key="xaxis-timeline" dataKey="hour" stroke="#9ca3af" />
                <YAxis key="yaxis-timeline" stroke="#9ca3af" />
                <Tooltip key="tooltip-timeline" />
                <Line key="timeline-sent" type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Sent" />
                <Line key="timeline-delivered" type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} name="Delivered" />
                <Line key="timeline-read" type="monotone" dataKey="read" stroke="#6366f1" strokeWidth={2} name="Read" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  key="status-pie"
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip key="tooltip-status" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Message Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h2>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-900">
              🌞 Summer Sale Alert! Get up to 50% off on all products this week only. Don't miss out on our biggest sale of the year!
              Shop now: https://example.com/summer-sale
            </p>
          </div>
        </div>

        {/* Audience Report Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Audience Report</h2>
              <p className="text-sm text-gray-500 mt-1">Detailed delivery status for all recipients</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/campaigns/create")}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span className="font-medium">Create Follow-up Campaign</span>
              </button>
              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Status Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setFilterStatus(filterStatus === "not-delivered" ? null : "not-delivered")}
              className={`bg-white rounded-lg border-2 p-4 text-left transition-all ${
                filterStatus === "not-delivered" ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-600">Not Delivered</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{statusCounts["not-delivered"]}</p>
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === "delivered" ? null : "delivered")}
              className={`bg-white rounded-lg border-2 p-4 text-left transition-all ${
                filterStatus === "delivered" ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{statusCounts["delivered"]}</p>
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === "read" ? null : "read")}
              className={`bg-white rounded-lg border-2 p-4 text-left transition-all ${
                filterStatus === "read" ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-600">Read</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{statusCounts["read"]}</p>
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === "replied" ? null : "replied")}
              className={`bg-white rounded-lg border-2 p-4 text-left transition-all ${
                filterStatus === "replied" ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-600">Replied</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{statusCounts["replied"]}</p>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{filteredAudience.length}</span> of{" "}
              <span className="font-medium text-gray-900">{audienceReport.length}</span> recipients
            </p>
          </div>

          {/* Audience Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Name</span>
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("phone")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Phone</span>
                      {getSortIcon("phone")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("sentTime")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Sent</span>
                      {getSortIcon("sentTime")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("deliveredTime")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Delivered</span>
                      {getSortIcon("deliveredTime")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("readTime")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Read</span>
                      {getSortIcon("readTime")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("repliedTime")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Replied</span>
                      {getSortIcon("repliedTime")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAudience.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {item.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeConfig[item.status as keyof typeof statusBadgeConfig].color}`}>
                        {statusBadgeConfig[item.status as keyof typeof statusBadgeConfig].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.sentTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.deliveredTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.readTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.repliedTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
