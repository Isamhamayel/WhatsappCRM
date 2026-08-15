import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Inbox,
  Target,
  Ticket,
  Megaphone,
  Users,
  Users2,
  BarChart3,
  Settings,
  MessageSquare,
  Bell,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Command,
  Filter,
  Calendar,
  Building2,
  UserCircle,
  Tags,
  Shield,
  LogOut,
  Smartphone,
  Crown,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Audiences", href: "/audiences", icon: Users },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Users & Departments", href: "/users", icon: Users2 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "WhatsApp Accounts", href: "/whatsapp-accounts", icon: Smartphone },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Audit Trail", href: "/audit-trail", icon: Shield },
  { name: "Platform Admin", href: "/platform", icon: Crown, platformOnly: true },
];

// Mock data for search
const allConversations = [
  { id: 1, type: "conversation", name: "Alice Williams", department: "Sales", phone: "+1 234 567 8901", lastMessage: "Thanks for the information!", date: "2 min ago" },
  { id: 2, type: "conversation", name: "Robert Martinez", department: "Support", phone: "+1 234 567 8902", lastMessage: "I'm having issues with my account", date: "15 min ago" },
  { id: 3, type: "conversation", name: "Emma Davis", department: "Finance", phone: "+1 234 567 8903", lastMessage: "Could you send me the invoice?", date: "1 hour ago" },
];

const allLeads = [
  { id: 1, type: "lead", name: "Alice Williams", status: "hot", company: "Tech Corp", value: "$50,000", date: "Today" },
  { id: 2, type: "lead", name: "James Wilson", status: "warm", company: "Marketing Inc", value: "$25,000", date: "Yesterday" },
  { id: 3, type: "lead", name: "Sarah Chen", status: "cold", company: "Sales Solutions", value: "$10,000", date: "2 days ago" },
];

const allTickets = [
  { id: 1234, type: "ticket", title: "Account setup issue", status: "open", priority: "high", assignee: "You", date: "1 hour ago" },
  { id: 1235, type: "ticket", title: "Payment not processing", status: "in-progress", priority: "urgent", assignee: "Sarah J.", date: "3 hours ago" },
  { id: 1236, type: "ticket", title: "Feature request: Dark mode", status: "resolved", priority: "low", assignee: "Mike C.", date: "1 day ago" },
];

const allContacts = [
  { id: 1, type: "contact", name: "Alice Williams", phone: "+1 234 567 8901", email: "alice@techcorp.com", tags: ["VIP", "Sales"] },
  { id: 2, type: "contact", name: "Robert Martinez", phone: "+1 234 567 8902", email: "robert@example.com", tags: ["Support"] },
  { id: 3, type: "contact", name: "Emma Davis", phone: "+1 234 567 8903", email: "emma@finance.com", tags: ["Finance", "Premium"] },
];

export function MainLayout() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const initials = (profile?.full_name || profile?.email || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    type: "all", // all, conversation, lead, ticket, contact
    department: "all",
    status: "all",
    dateRange: "all",
  });

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
        setSearchQuery("");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal]);

  // Search function
  const performSearch = () => {
    const query = searchQuery.toLowerCase();
    let results: any[] = [];

    // Filter by type
    const conversations = searchFilters.type === "all" || searchFilters.type === "conversation" ? allConversations : [];
    const leads = searchFilters.type === "all" || searchFilters.type === "lead" ? allLeads : [];
    const tickets = searchFilters.type === "all" || searchFilters.type === "ticket" ? allTickets : [];
    const contacts = searchFilters.type === "all" || searchFilters.type === "contact" ? allContacts : [];

    // Search conversations
    const filteredConversations = conversations.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );

    // Search leads
    const filteredLeads = leads.filter(l =>
      l.name.toLowerCase().includes(query) ||
      l.company.toLowerCase().includes(query)
    );

    // Search tickets
    const filteredTickets = tickets.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.id.toString().includes(query)
    );

    // Search contacts
    const filteredContacts = contacts.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.tags.some(tag => tag.toLowerCase().includes(query))
    );

    results = [
      ...filteredConversations,
      ...filteredLeads,
      ...filteredTickets,
      ...filteredContacts
    ];

    // Apply department filter
    if (searchFilters.department !== "all") {
      results = results.filter(r =>
        r.department?.toLowerCase() === searchFilters.department.toLowerCase()
      );
    }

    // Apply status filter
    if (searchFilters.status !== "all") {
      results = results.filter(r =>
        r.status?.toLowerCase() === searchFilters.status.toLowerCase()
      );
    }

    return results;
  };

  const searchResults = searchQuery.length >= 2 ? performSearch() : [];

  const handleResultClick = (result: any) => {
    setShowSearchModal(false);
    setSearchQuery("");

    // Navigate based on result type
    switch (result.type) {
      case "conversation":
        navigate("/inbox");
        break;
      case "lead":
        navigate(`/leads/${result.id}`);
        break;
      case "ticket":
        navigate(`/tickets/${result.id}`);
        break;
      case "contact":
        navigate(`/contacts/${result.id}`);
        break;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="bg-emerald-600 rounded-lg p-2">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-semibold text-gray-900">WhatsApp CRM</h1>
                <p className="text-xs text-gray-500">{profile?.tenant_name || "Customer Workspace"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.filter((item) => !item.platformOnly || profile?.is_platform_admin).map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
              title={sidebarCollapsed ? item.name : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Toggle */}
        <div className="p-4 border-t border-gray-200">
          {!sidebarCollapsed ? (
            <div className="mb-3">
              <div className="flex items-center gap-3 w-full px-3 py-2 rounded-lg">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {initials || "U"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || profile?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile?.role || "user"}{profile?.department ? ` • ${profile.department}` : ""}</p>
                </div>
              </div>
              <button
                onClick={() => void signOut()}
                className="mt-1 flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-700 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => void signOut()}
              title="Sign out"
              className="flex items-center justify-center w-full px-3 py-2 rounded-lg hover:bg-red-50 transition-colors mb-3"
            >
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {initials || "U"}
              </div>
            </button>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <button
                onClick={() => setShowSearchModal(true)}
                className="w-full"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <div className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg text-left text-gray-500 bg-white hover:bg-gray-50 transition-colors">
                    Search conversations, contacts, leads...
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-600">
                      {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                    </kbd>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-600">
                      K
                    </kbd>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[600px] flex flex-col">
            {/* Search Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search across all conversations, contacts, leads, tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-lg focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 overflow-x-auto">
                {/* Type Filter */}
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters({ ...searchFilters, type: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="conversation">Conversations</option>
                  <option value="lead">Leads</option>
                  <option value="ticket">Tickets</option>
                  <option value="contact">Contacts</option>
                </select>

                {/* Department Filter */}
                <select
                  value={searchFilters.department}
                  onChange={(e) => setSearchFilters({ ...searchFilters, department: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">All Departments</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="finance">Finance</option>
                </select>

                {/* Status Filter */}
                <select
                  value={searchFilters.status}
                  onChange={(e) => setSearchFilters({ ...searchFilters, status: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                {/* Date Filter */}
                <select
                  value={searchFilters.dateRange}
                  onChange={(e) => setSearchFilters({ ...searchFilters, dateRange: e.target.value })}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                {/* Clear Filters */}
                {(searchFilters.type !== "all" || searchFilters.department !== "all" || searchFilters.status !== "all" || searchFilters.dateRange !== "all") && (
                  <button
                    onClick={() => setSearchFilters({ type: "all", department: "all", status: "all", dateRange: "all" })}
                    className="px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {searchQuery.length < 2 ? (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Type at least 2 characters to search</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Conversations</p>
                        <p className="text-xs">Search by name, phone, message</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Leads</p>
                        <p className="text-xs">Search by name, company</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Ticket className="w-4 h-4 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Tickets</p>
                        <p className="text-xs">Search by ID, title</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Contacts</p>
                        <p className="text-xs">Search by name, phone, email</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No results found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try different keywords or adjust filters</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <p className="text-sm text-gray-600 px-2 mb-3">
                    Found <span className="font-medium text-gray-900">{searchResults.length}</span> results
                  </p>
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                    >
                      {result.type === "conversation" && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                            {result.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Inbox className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{result.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {result.department}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{result.lastMessage}</p>
                            <p className="text-xs text-gray-400 mt-1">{result.phone} • {result.date}</p>
                          </div>
                        </div>
                      )}
                      {result.type === "lead" && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{result.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                result.status === "hot" ? "bg-red-100 text-red-700" :
                                result.status === "warm" ? "bg-orange-100 text-orange-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {result.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{result.company}</p>
                            <p className="text-xs text-gray-400 mt-1">{result.value} • {result.date}</p>
                          </div>
                        </div>
                      )}
                      {result.type === "ticket" && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Ticket className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Ticket className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">#{result.id}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                result.status === "open" ? "bg-yellow-100 text-yellow-700" :
                                result.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                                "bg-green-100 text-green-700"
                              }`}>
                                {result.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900">{result.title}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {result.priority} priority • Assigned to {result.assignee} • {result.date}
                            </p>
                          </div>
                        </div>
                      )}
                      {result.type === "contact" && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{result.name}</span>
                            </div>
                            <p className="text-sm text-gray-600">{result.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-400">{result.phone}</p>
                              {result.tags.map((tag: string) => (
                                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Use filters to refine results</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}