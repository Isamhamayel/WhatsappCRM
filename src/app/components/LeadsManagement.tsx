import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Plus, Eye, TrendingUp, TrendingDown, MinusCircle, XCircle, Download, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import * as XLSX from "xlsx";

const statusConfig = {
  hot: { label: "Hot", color: "bg-red-100 text-red-700", icon: TrendingUp },
  warm: { label: "Warm", color: "bg-orange-100 text-orange-700", icon: TrendingUp },
  cold: { label: "Cold", color: "bg-blue-100 text-blue-700", icon: TrendingDown },
  lost: { label: "Lost", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const leads = [
  { id: 1, name: "Alice Williams", phone: "+1 234 567 8901", status: "hot", owner: "You", department: "Sales", lastContact: "2m ago", value: "$25,000" },
  { id: 2, name: "Robert Martinez", phone: "+1 234 567 8902", status: "warm", owner: "Sarah Johnson", department: "Sales", lastContact: "1h ago", value: "$15,000" },
  { id: 3, name: "Emma Davis", phone: "+1 234 567 8903", status: "hot", owner: "Mike Chen", department: "Sales", lastContact: "3h ago", value: "$35,000" },
  { id: 4, name: "James Wilson", phone: "+1 234 567 8904", status: "cold", owner: "You", department: "Sales", lastContact: "1d ago", value: "$8,000" },
  { id: 5, name: "Maria Garcia", phone: "+1 234 567 8905", status: "warm", owner: "Emma Wilson", department: "Sales", lastContact: "2d ago", value: "$18,000" },
  { id: 6, name: "David Lee", phone: "+1 234 567 8906", status: "lost", owner: "Sarah Johnson", department: "Sales", lastContact: "5d ago", value: "$12,000" },
];

type SortField = "name" | "phone" | "status" | "owner" | "department" | "value" | "lastContact";
type SortDirection = "asc" | "desc" | null;

export function LeadsManagement() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);

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

  const getSortedLeads = () => {
    let filtered = leads;

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter((lead) => lead.status === selectedStatus);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((lead) =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply owner filter
    if (filterOwner) {
      filtered = filtered.filter((lead) => lead.owner === filterOwner);
    }

    // Apply department filter
    if (filterDepartment) {
      filtered = filtered.filter((lead) => lead.department === filterDepartment);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle value field (remove $ and convert to number)
        if (sortField === "value") {
          aVal = parseInt(aVal.replace(/[$,]/g, ""));
          bVal = parseInt(bVal.replace(/[$,]/g, ""));
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredLeads = getSortedLeads();

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredLeads.map((lead) => ({
      Name: lead.name,
      Phone: lead.phone,
      Status: statusConfig[lead.status as keyof typeof statusConfig].label,
      Owner: lead.owner,
      Department: lead.department,
      Value: lead.value,
      "Last Contact": lead.lastContact,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");

    // Generate file name with current date
    const fileName = `leads_export_${new Date().toISOString().split("T")[0]}.xlsx`;

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

  const uniqueOwners = Array.from(new Set(leads.map((lead) => lead.owner)));
  const uniqueDepartments = Array.from(new Set(leads.map((lead) => lead.department)));

  const clearFilters = () => {
    setFilterOwner(null);
    setFilterDepartment(null);
    setSearchTerm("");
    setSelectedStatus(null);
  };

  const activeFiltersCount = [filterOwner, filterDepartment, selectedStatus].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads Management</h1>
          <p className="text-gray-500 mt-1">Track and manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Export to Excel</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Lead</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = leads.filter((l) => l.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
              className={`bg-white rounded-xl border-2 p-4 text-left transition-all ${
                selectedStatus === key ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{config.label} Leads</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{count}</p>
                </div>
                <div className={`${config.color} rounded-lg p-2`}>
                  <config.icon className="w-5 h-5" />
                </div>
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
              placeholder="Search leads by name, phone, or owner..."
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
          <div className="pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus || ""}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
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
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{filteredLeads.length}</span> of{" "}
          <span className="font-medium text-gray-900">{leads.length}</span> leads
        </p>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  onClick={() => handleSort("value")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Value</span>
                    {getSortIcon("value")}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("lastContact")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Last Contact</span>
                    {getSortIcon("lastContact")}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-gray-900">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[lead.status as keyof typeof statusConfig].color}`}>
                      {statusConfig[lead.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{lead.owner}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {lead.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.value}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.lastContact}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/leads/${lead.id}`)}
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