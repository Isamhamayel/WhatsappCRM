import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Plus, Eye, Download, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import * as XLSX from "xlsx";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  "in-progress": { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700" },
};

const priorityConfig = {
  high: { label: "High", color: "bg-red-100 text-red-700" },
  medium: { label: "Medium", color: "bg-orange-100 text-orange-700" },
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
};

const tickets = [
  { id: 1234, customer: "Alice Williams", subject: "Account setup issues", status: "open", priority: "high", owner: "You", department: "Support", created: "2m ago" },
  { id: 1235, customer: "Robert Martinez", subject: "Payment not processing", status: "in-progress", priority: "high", owner: "Sarah Johnson", department: "Finance", created: "1h ago" },
  { id: 1236, customer: "Emma Davis", subject: "Feature request: Export data", status: "open", priority: "low", owner: "Public", department: "Support", created: "3h ago" },
  { id: 1237, customer: "James Wilson", subject: "Cannot access dashboard", status: "in-progress", priority: "medium", owner: "Mike Chen", department: "Support", created: "5h ago" },
  { id: 1238, customer: "Maria Garcia", subject: "Invoice correction needed", status: "resolved", priority: "medium", owner: "Emma Wilson", department: "Finance", created: "1d ago" },
  { id: 1239, customer: "David Lee", subject: "Password reset not working", status: "closed", priority: "low", owner: "You", department: "Support", created: "2d ago" },
];

type SortField = "id" | "customer" | "subject" | "status" | "priority" | "owner" | "department" | "created";
type SortDirection = "asc" | "desc" | null;

export function TicketSystem() {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);

  // New ticket form states
  const [newTicket, setNewTicket] = useState({
    customer: "",
    subject: "",
    description: "",
    priority: "medium",
    department: "Support"
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
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

  const getSortedTickets = () => {
    let filtered = tickets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((ticket) =>
        ticket.id.toString().includes(searchTerm) ||
        ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority) {
      filtered = filtered.filter((ticket) => ticket.priority === filterPriority);
    }

    // Apply owner filter
    if (filterOwner) {
      filtered = filtered.filter((ticket) => ticket.owner === filterOwner);
    }

    // Apply department filter
    if (filterDepartment) {
      filtered = filtered.filter((ticket) => ticket.department === filterDepartment);
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

  const filteredTickets = getSortedTickets();

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredTickets.map((ticket) => ({
      "Ticket ID": `#${ticket.id}`,
      Customer: ticket.customer,
      Subject: ticket.subject,
      Status: statusConfig[ticket.status as keyof typeof statusConfig].label,
      Priority: priorityConfig[ticket.priority as keyof typeof priorityConfig].label,
      Owner: ticket.owner,
      Department: ticket.department,
      Created: ticket.created,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");

    // Generate file name with current date
    const fileName = `tickets_export_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Save file
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

  const uniqueOwners = Array.from(new Set(tickets.map((ticket) => ticket.owner)));
  const uniqueDepartments = Array.from(new Set(tickets.map((ticket) => ticket.department)));

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterPriority(null);
    setFilterOwner(null);
    setFilterDepartment(null);
    setSearchTerm("");
  };

  const activeFiltersCount = [filterStatus, filterPriority, filterOwner, filterDepartment].filter(Boolean).length;

  const handleCreateTicket = () => {
    // In a real app, this would send to backend
    console.log("Creating ticket:", newTicket);
    setShowNewTicketModal(false);
    setNewTicket({
      customer: "",
      subject: "",
      description: "",
      priority: "medium",
      department: "Support"
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ticket System</h1>
          <p className="text-gray-500 mt-1">Manage customer support tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Export to Excel</span>
          </button>
          <button 
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Ticket</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = tickets.filter((t) => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? null : key)}
              className={`bg-white rounded-xl border-2 p-4 text-left transition-all ${
                filterStatus === key ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{config.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{count}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by ID, subject, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Clear</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus || ""}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filterPriority || ""}
                onChange={(e) => setFilterPriority(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Priorities</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
              <select
                value={filterOwner || ""}
                onChange={(e) => setFilterOwner(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Owners</option>
                {uniqueOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={filterDepartment || ""}
                onChange={(e) => setFilterDepartment(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{filteredTickets.length}</span> of{" "}
          <span className="font-medium text-gray-900">{tickets.length}</span> tickets
        </p>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  onClick={() => handleSort("id")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Ticket ID</span>
                    {getSortIcon("id")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("customer")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Customer</span>
                    {getSortIcon("customer")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("subject")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Subject</span>
                    {getSortIcon("subject")}
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
                  onClick={() => handleSort("priority")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Priority</span>
                    {getSortIcon("priority")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("owner")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Owner</span>
                    {getSortIcon("owner")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("department")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Department</span>
                    {getSortIcon("department")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("created")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Created</span>
                    {getSortIcon("created")}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-gray-900">#{ticket.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {ticket.customer.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm text-gray-900">{ticket.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[ticket.status as keyof typeof statusConfig].color}`}>
                      {statusConfig[ticket.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig[ticket.priority as keyof typeof priorityConfig].color}`}>
                      {priorityConfig[ticket.priority as keyof typeof priorityConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ticket.owner}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {ticket.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ticket.created}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
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

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={newTicket.customer}
                  onChange={(e) => setNewTicket({ ...newTicket, customer: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description of the issue"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={newTicket.department}
                    onChange={(e) => setNewTicket({ ...newTicket, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Support">Support</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.customer || !newTicket.subject}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}