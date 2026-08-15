import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, Users, Send, Filter, ChevronDown } from "lucide-react";

// Previous campaigns data
const previousCampaigns = [
  { id: 1, name: "Summer Sale 2026", totalAudience: 1248, statuses: { notDelivered: 13, delivered: 343, read: 736, replied: 156 } },
  { id: 2, name: "Product Launch Announcement", totalAudience: 856, statuses: { notDelivered: 11, delivered: 422, read: 345, replied: 78 } },
  { id: 3, name: "Black Friday Promo", totalAudience: 2104, statuses: { notDelivered: 24, delivered: 890, read: 967, replied: 223 } },
  { id: 4, name: "New Year Greetings", totalAudience: 1567, statuses: { notDelivered: 18, delivered: 512, read: 834, replied: 203 } },
];

// Saved audiences
const savedAudiences = [
  { id: 1, name: "Hot Leads", contactCount: 45, description: "All contacts with lead status = Hot" },
  { id: 2, name: "VIP Customers", contactCount: 128, description: "Customers with purchase history > $1000" },
  { id: 3, name: "Support Team Contacts", contactCount: 342, description: "All contacts assigned to Support department" },
  { id: 4, name: "Inactive Leads", contactCount: 234, description: "Leads with no activity in last 30 days" },
  { id: 5, name: "Finance Customers", contactCount: 89, description: "All customers in Finance department" },
];

export function CampaignCreate() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<"all" | "saved-audience" | "previous-campaign">("all");
  const [selectedAudience, setSelectedAudience] = useState<number | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusLogic, setStatusLogic] = useState<"OR" | "AND">("OR");
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const getAudienceCount = () => {
    if (audienceType !== "previous-campaign" || !selectedCampaign || selectedStatuses.length === 0) {
      return 0;
    }

    const campaign = previousCampaigns.find(c => c.id === selectedCampaign);
    if (!campaign) return 0;

    if (statusLogic === "OR") {
      // Sum all selected statuses
      let count = 0;
      if (selectedStatuses.includes("not-delivered")) count += campaign.statuses.notDelivered;
      if (selectedStatuses.includes("delivered")) count += campaign.statuses.delivered;
      if (selectedStatuses.includes("read")) count += campaign.statuses.read;
      if (selectedStatuses.includes("replied")) count += campaign.statuses.replied;
      return count;
    } else {
      // AND logic - this would need more complex data structure in real app
      // For now, show a smaller subset
      const baseCount = Math.min(...selectedStatuses.map(status => {
        if (status === "not-delivered") return campaign.statuses.notDelivered;
        if (status === "delivered") return campaign.statuses.delivered;
        if (status === "read") return campaign.statuses.read;
        if (status === "replied") return campaign.statuses.replied;
        return 0;
      }));
      return Math.floor(baseCount * 0.7); // Approximate overlap
    }
  };

  const selectedCampaignData = previousCampaigns.find(c => c.id === selectedCampaign);
  const selectedAudienceData = savedAudiences.find(a => a.id === selectedAudience);

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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Campaign</h1>
            <p className="text-sm text-gray-500 mt-1">Design and schedule a new WhatsApp campaign</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Campaign Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Summer Sale 2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Message Editor */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Message</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Text</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Type your campaign message here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">Character count: {message.length}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Media Attachment (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload image or document</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audience Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience</h2>
          <div className="space-y-4">
            <div 
              onClick={() => setAudienceType("all")}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                audienceType === "all" ? "border-emerald-600 bg-emerald-50" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input 
                type="radio" 
                name="audience" 
                className="w-4 h-4 text-emerald-600" 
                checked={audienceType === "all"}
                onChange={() => {}}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">All Contacts</p>
                <p className="text-sm text-gray-500">Send to all contacts in your database (1,248 contacts)</p>
              </div>
            </div>
            
            <div 
              onClick={() => setAudienceType("saved-audience")}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                audienceType === "saved-audience" ? "border-emerald-600 bg-emerald-50" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input 
                type="radio" 
                name="audience" 
                className="w-4 h-4 text-emerald-600" 
                checked={audienceType === "saved-audience"}
                onChange={() => {}}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Saved Audience</p>
                <p className="text-sm text-gray-500">Select from saved audience segments</p>
              </div>
            </div>

            <div 
              onClick={() => setAudienceType("previous-campaign")}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                audienceType === "previous-campaign" ? "border-emerald-600 bg-emerald-50" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input 
                type="radio" 
                name="audience" 
                className="w-4 h-4 text-emerald-600" 
                checked={audienceType === "previous-campaign"}
                onChange={() => {}}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Previous Campaign Audience</p>
                <p className="text-sm text-gray-500">Target users from a previous campaign based on their status</p>
              </div>
            </div>

            {/* Previous Campaign Configuration */}
            {audienceType === "previous-campaign" && (
              <div className="ml-7 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:bg-white transition-colors"
                    >
                      <span className="text-sm text-gray-900">
                        {selectedCampaignData ? selectedCampaignData.name : "Choose a campaign..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showCampaignDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {previousCampaigns.map((campaign) => (
                          <button
                            key={campaign.id}
                            onClick={() => {
                              setSelectedCampaign(campaign.id);
                              setShowCampaignDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{campaign.totalAudience} total recipients</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedCampaign && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Status</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => toggleStatus("not-delivered")}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedStatuses.includes("not-delivered")
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Not Delivered</span>
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("not-delivered")}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedCampaignData?.statuses.notDelivered}
                          </p>
                        </button>

                        <button
                          onClick={() => toggleStatus("delivered")}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedStatuses.includes("delivered")
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Delivered</span>
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("delivered")}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedCampaignData?.statuses.delivered}
                          </p>
                        </button>

                        <button
                          onClick={() => toggleStatus("read")}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedStatuses.includes("read")
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Read</span>
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("read")}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedCampaignData?.statuses.read}
                          </p>
                        </button>

                        <button
                          onClick={() => toggleStatus("replied")}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedStatuses.includes("replied")
                              ? "border-green-500 bg-green-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Replied</span>
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes("replied")}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedCampaignData?.statuses.replied}
                          </p>
                        </button>
                      </div>
                    </div>

                    {selectedStatuses.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Logic</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setStatusLogic("OR")}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                              statusLogic === "OR"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-medium"
                                : "border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            OR (Any status)
                          </button>
                          <button
                            onClick={() => setStatusLogic("AND")}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                              statusLogic === "AND"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-medium"
                                : "border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            AND (All statuses)
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {statusLogic === "OR" 
                            ? "Contacts who match ANY of the selected statuses" 
                            : "Contacts who match ALL of the selected statuses"}
                        </p>
                      </div>
                    )}

                    {selectedStatuses.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-emerald-600" />
                          <p className="text-sm font-medium text-emerald-900">Target Audience</p>
                        </div>
                        <p className="text-2xl font-semibold text-emerald-900">
                          {getAudienceCount().toLocaleString()} contacts
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          From "{selectedCampaignData?.name}" with status:{" "}
                          {selectedStatuses.map(s => s.replace("-", " ")).join(` ${statusLogic} `)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Saved Audience Configuration */}
            {audienceType === "saved-audience" && (
              <div className="ml-7 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Audience</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:bg-white transition-colors"
                    >
                      <span className="text-sm text-gray-900">
                        {selectedAudienceData ? selectedAudienceData.name : "Choose an audience..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showAudienceDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {savedAudiences.map((audience) => (
                          <button
                            key={audience.id}
                            onClick={() => {
                              setSelectedAudience(audience.id);
                              setShowAudienceDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900">{audience.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{audience.contactCount} contacts</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedAudience && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-900">Target Audience</p>
                    </div>
                    <p className="text-2xl font-semibold text-emerald-900">
                      {selectedAudienceData?.contactCount.toLocaleString()} contacts
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      From "{selectedAudienceData?.name}" with description:{" "}
                      {selectedAudienceData?.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="schedule" className="w-4 h-4 text-emerald-600" defaultChecked />
              <div>
                <p className="font-medium text-gray-900">Send Now</p>
                <p className="text-sm text-gray-500">Campaign will be sent immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="schedule" className="w-4 h-4 text-emerald-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Schedule for Later</p>
                <p className="text-sm text-gray-500 mb-3">Choose a specific date and time</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="time" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            onClick={() => navigate("/campaigns")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Save as Draft
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            <Send className="w-4 h-4" />
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  );
}