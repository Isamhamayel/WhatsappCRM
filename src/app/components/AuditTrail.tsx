import { useState } from "react";
import { Shield, Search, Filter, User, Calendar, Box, Edit, Trash2, Plus, Send, UserPlus, RefreshCw } from "lucide-react";

// Mock audit trail data
const auditData = [
  {
    id: 1,
    timestamp: "2026-04-20T14:45:00",
    user: "Sarah Johnson",
    objectType: "Lead",
    objectId: "1234",
    objectName: "John Doe",
    action: "updated",
    changes: [
      { field: "Status", oldValue: "New", newValue: "Qualified" },
      { field: "Priority", oldValue: "Medium", newValue: "High" },
    ],
  },
  {
    id: 2,
    timestamp: "2026-04-20T13:30:00",
    user: "System",
    objectType: "Campaign",
    objectId: "456",
    objectName: "Spring Sale",
    action: "sent",
    changes: [
      { field: "Messages Sent", oldValue: "0", newValue: "1,250" },
    ],
  },
  {
    id: 3,
    timestamp: "2026-04-20T12:20:00",
    user: "Mike Chen",
    objectType: "Ticket",
    objectId: "789",
    objectName: "Support Ticket #789",
    action: "created",
    changes: [
      { field: "Priority", oldValue: "-", newValue: "High" },
      { field: "Assigned To", oldValue: "-", newValue: "Sarah Johnson" },
    ],
  },
  {
    id: 4,
    timestamp: "2026-04-20T11:15:00",
    user: "Emma Wilson",
    objectType: "Contact",
    objectId: "321",
    objectName: "Alice Williams",
    action: "updated",
    changes: [
      { field: "Email", oldValue: "alice@old.com", newValue: "alice@new.com" },
      { field: "Department", oldValue: "Sales", newValue: "Marketing" },
    ],
  },
  {
    id: 5,
    timestamp: "2026-04-20T10:05:00",
    user: "David Brown",
    objectType: "Template",
    objectId: "12",
    objectName: "Welcome Message",
    action: "deleted",
    changes: [],
  },
  {
    id: 6,
    timestamp: "2026-04-19T17:45:00",
    user: "Sarah Johnson",
    objectType: "Lead",
    objectId: "567",
    objectName: "Robert Martinez",
    action: "created",
    changes: [
      { field: "Status", oldValue: "-", newValue: "New" },
      { field: "Source", oldValue: "-", newValue: "WhatsApp" },
    ],
  },
  {
    id: 7,
    timestamp: "2026-04-19T16:30:00",
    user: "Mike Chen",
    objectType: "Contact",
    objectId: "890",
    objectName: "Emma Davis",
    action: "updated",
    changes: [
      { field: "Tags", oldValue: "VIP", newValue: "VIP, Premium" },
    ],
  },
  {
    id: 8,
    timestamp: "2026-04-19T15:20:00",
    user: "System",
    objectType: "Ticket",
    objectId: "445",
    objectName: "Support Ticket #445",
    action: "updated",
    changes: [
      { field: "Status", oldValue: "Open", newValue: "Resolved" },
    ],
  },
  {
    id: 9,
    timestamp: "2026-04-19T14:10:00",
    user: "Emma Wilson",
    objectType: "Lead",
    objectId: "234",
    objectName: "James Wilson",
    action: "updated",
    changes: [
      { field: "Status", oldValue: "Warm", newValue: "Hot" },
    ],
  },
  {
    id: 10,
    timestamp: "2026-04-19T13:00:00",
    user: "David Brown",
    objectType: "Campaign",
    objectId: "678",
    objectName: "Product Launch",
    action: "created",
    changes: [
      { field: "Audience Size", oldValue: "-", newValue: "500" },
      { field: "Status", oldValue: "-", newValue: "Draft" },
    ],
  },
];

const actionIcons: Record<string, any> = {
  created: { icon: Plus, color: "text-green-600", bg: "bg-green-100" },
  updated: { icon: Edit, color: "text-blue-600", bg: "bg-blue-100" },
  deleted: { icon: Trash2, color: "text-red-600", bg: "bg-red-100" },
  sent: { icon: Send, color: "text-purple-600", bg: "bg-purple-100" },
  assigned: { icon: UserPlus, color: "text-teal-600", bg: "bg-teal-100" },
};

const objectTypes = ["All Types", "Contact", "Lead", "Ticket", "Campaign", "Template"];
const users = ["All Users", "Sarah Johnson", "Mike Chen", "Emma Wilson", "David Brown", "System"];

export function AuditTrail() {
  const [selectedObjectType, setSelectedObjectType] = useState("All Types");
  const [selectedUser, setSelectedUser] = useState("All Users");
  const [dateRange, setDateRange] = useState("last-7-days");
  const [searchTerm, setSearchTerm] = useState("");

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours < 1) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  const groupByDate = (entries: typeof auditData) => {
    const groups: Record<string, typeof auditData> = {};

    entries.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else {
        dateKey = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return groups;
  };

  const filteredData = auditData.filter((entry) => {
    const matchesObjectType = selectedObjectType === "All Types" || entry.objectType === selectedObjectType;
    const matchesUser = selectedUser === "All Users" || entry.user === selectedUser;
    const matchesSearch =
      searchTerm === "" ||
      entry.objectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.objectId.includes(searchTerm) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesObjectType && matchesUser && matchesSearch;
  });

  const groupedData = groupByDate(filteredData);

  return (
    <div className="flex h-full">
      {/* Filters Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Object ID, name, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Object Type Filter */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Box className="w-4 h-4" />
            Object Type
          </label>
          <div className="space-y-2">
            {objectTypes.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="objectType"
                  value={type}
                  checked={selectedObjectType === type}
                  onChange={(e) => setSelectedObjectType(e.target.value)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* User Filter */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <User className="w-4 h-4" />
            User
          </label>
          <div className="space-y-2">
            {users.map((user) => (
              <label key={user} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="user"
                  value={user}
                  checked={selectedUser === user}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{user}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="last-hour">Last Hour</option>
            <option value="last-24-hours">Last 24 Hours</option>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSelectedObjectType("All Types");
            setSelectedUser("All Users");
            setDateRange("last-7-days");
            setSearchTerm("");
          }}
          className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>

      {/* Main Content - Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
                <p className="text-gray-500 mt-1">Track all changes and actions across your CRM</p>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{filteredData.length}</span> of{" "}
              <span className="font-medium text-gray-900">{auditData.length}</span> audit entries
            </p>
          </div>

          {/* Timeline */}
          {Object.entries(groupedData).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit entries found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria.</p>
              <button
                onClick={() => {
                  setSelectedObjectType("All Types");
                  setSelectedUser("All Users");
                  setSearchTerm("");
                }}
                className="px-4 py-2 text-sm text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedData).map(([dateKey, entries]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{dateKey}</h2>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Entries for this date */}
                  <div className="space-y-4">
                    {entries.map((entry) => {
                      const actionConfig = actionIcons[entry.action] || actionIcons.updated;
                      const IconComponent = actionConfig.icon;

                      return (
                        <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`${actionConfig.bg} rounded-lg p-2 flex-shrink-0`}>
                              <IconComponent className={`w-5 h-5 ${actionConfig.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">
                                    <span className="font-medium">{entry.user}</span>{" "}
                                    <span className={actionConfig.color}>{entry.action}</span>{" "}
                                    <span className="font-medium">{entry.objectType}</span>{" "}
                                    <span className="text-gray-600">#{entry.objectId}</span>
                                  </p>
                                  <p className="text-sm text-gray-600 mt-0.5">{entry.objectName}</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</span>
                              </div>

                              {/* Changes */}
                              {entry.changes.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                  <p className="text-xs font-medium text-gray-700 mb-2">Changes:</p>
                                  <div className="space-y-1">
                                    {entry.changes.map((change, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs">
                                        <span className="font-medium text-gray-700">{change.field}:</span>
                                        <span className="text-gray-500">{change.oldValue}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-gray-900">{change.newValue}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
