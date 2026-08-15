import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, X, Users, Filter } from "lucide-react";

const availableFilters = {
  leadStatus: {
    label: "Lead Status",
    options: ["Hot", "Warm", "Cold", "Qualified", "Unqualified"]
  },
  tags: {
    label: "Tags",
    options: ["VIP", "Premium", "Regular", "New", "Inactive", "Prospect", "Customer"]
  },
  department: {
    label: "Department",
    options: ["Sales", "Support", "Finance", "Marketing"]
  },
  source: {
    label: "Source",
    options: ["Website", "WhatsApp", "Referral", "Social Media", "Advertisement"]
  },
  lastContact: {
    label: "Last Contact",
    options: ["Last 7 days", "Last 30 days", "Last 90 days", "More than 90 days"]
  },
  assignedTo: {
    label: "Assigned To",
    options: ["You", "Sarah Johnson", "Mike Chen", "Emma Wilson", "Public"]
  }
};

type FilterType = keyof typeof availableFilters;

export function AudienceCreate() {
  const navigate = useNavigate();
  const [audienceName, setAudienceName] = useState("");
  const [audienceDescription, setAudienceDescription] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: FilterType; values: string[] }[]>([]);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND");
  const [showAddFilterDropdown, setShowAddFilterDropdown] = useState(false);

  const addFilter = (type: FilterType) => {
    if (!activeFilters.some(f => f.type === type)) {
      setActiveFilters([...activeFilters, { type, values: [] }]);
    }
    setShowAddFilterDropdown(false);
  };

  const removeFilter = (type: FilterType) => {
    setActiveFilters(activeFilters.filter(f => f.type !== type));
  };

  const toggleFilterValue = (type: FilterType, value: string) => {
    setActiveFilters(activeFilters.map(f => {
      if (f.type === type) {
        if (f.values.includes(value)) {
          return { ...f, values: f.values.filter(v => v !== value) };
        } else {
          return { ...f, values: [...f.values, value] };
        }
      }
      return f;
    }));
  };

  const calculateEstimatedContacts = () => {
    // Mock calculation - in real app, this would query the database
    const baseCount = 1248;
    const filterCount = activeFilters.reduce((sum, f) => sum + f.values.length, 0);
    
    if (filterCount === 0) return baseCount;
    
    if (filterLogic === "AND") {
      // AND logic reduces the audience
      return Math.max(10, Math.floor(baseCount / (filterCount * 2)));
    } else {
      // OR logic can increase the audience
      return Math.min(baseCount, Math.floor(baseCount * 0.3 * filterCount));
    }
  };

  const handleSave = () => {
    // In real app, save to backend
    console.log("Creating audience:", {
      name: audienceName,
      description: audienceDescription,
      filters: activeFilters,
      logic: filterLogic
    });
    navigate("/audiences");
  };

  const availableFilterTypes = Object.keys(availableFilters).filter(
    type => !activeFilters.some(f => f.type === type)
  ) as FilterType[];

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate("/audiences")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Audiences</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Audience</h1>
            <p className="text-sm text-gray-500 mt-1">Build a dynamic contact segment with filters</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Audience Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audience Name *</label>
              <input
                type="text"
                value={audienceName}
                onChange={(e) => setAudienceName(e.target.value)}
                placeholder="e.g., Hot Leads, VIP Customers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={audienceDescription}
                onChange={(e) => setAudienceDescription(e.target.value)}
                rows={3}
                placeholder="Describe what this audience represents..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Filter Logic */}
        {activeFilters.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Logic</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setFilterLogic("AND")}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  filterLogic === "AND"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <p className="font-medium">AND</p>
                <p className="text-xs mt-1">Contacts must match ALL filters</p>
              </button>
              <button
                onClick={() => setFilterLogic("OR")}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  filterLogic === "OR"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <p className="font-medium">OR</p>
                <p className="text-xs mt-1">Contacts match ANY filter</p>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="relative">
              <button
                onClick={() => setShowAddFilterDropdown(!showAddFilterDropdown)}
                disabled={availableFilterTypes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Filter</span>
              </button>

              {showAddFilterDropdown && availableFilterTypes.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {availableFilterTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => addFilter(type)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {availableFilters[type].label}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeFilters.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">No filters added yet</p>
              <p className="text-xs text-gray-500">Click "Add Filter" to start building your audience</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeFilters.map((filter, index) => (
                <div key={filter.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-medium text-gray-900">
                        {availableFilters[filter.type].label}
                      </h3>
                      {filter.values.length > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                          {filter.values.length} selected
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFilter(filter.type)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableFilters[filter.type].options.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleFilterValue(filter.type, option)}
                        className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${
                          filter.values.includes(option)
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-medium"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {index < activeFilters.length - 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {filterLogic}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estimated Audience Size */}
        <div className="bg-gradient-to-r from-emerald-50 to-purple-50 rounded-xl border-2 border-emerald-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 rounded-lg p-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900 mb-1">Estimated Audience Size</p>
              <p className="text-3xl font-bold text-emerald-900">
                {calculateEstimatedContacts().toLocaleString()}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                contacts will match this audience • Updates automatically when new contacts are added
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-lg p-2 mt-0.5">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Dynamic Audience</h3>
              <p className="text-sm text-blue-700 mt-1">
                This audience is dynamic and will automatically include new contacts that match your filter criteria. 
                The contact count updates in real-time as your contact list changes.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            onClick={() => navigate("/audiences")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!audienceName || activeFilters.length === 0 || activeFilters.some(f => f.values.length === 0)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Audience
          </button>
        </div>
      </div>
    </div>
  );
}
