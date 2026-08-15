import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Paperclip, Send, MoreVertical, User, Users as UsersIcon, Building2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Zap, Plus, Edit, Trash2, Keyboard, UserPlus, Target, Ticket, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { sendWhatsAppMessage } from "../../services/whatsapp";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthProvider";

const filters = [
  { id: "all", label: "All Conversations", count: 248 },
  { id: "mine", label: "Assigned to Me", count: 32 },
  { id: "public", label: "Public/Unassigned", count: 15 },
];

const departments = [
  { id: "sales", label: "Sales", count: 89, color: "bg-blue-100 text-blue-700" },
  { id: "support", label: "Support", count: 124, color: "bg-green-100 text-green-700" },
  { id: "finance", label: "Finance", count: 35, color: "bg-purple-100 text-purple-700" },
];

// Fallback mock conversations shown while DB loads or if empty
const mockConversations = [
  {
    id: "mock-1",
    name: "Alice Williams",
    lastMessage: "Thanks for the information! When can we schedule a demo?",
    time: "2m ago",
    unread: 3,
    department: "sales",
    assigned: "You",
    phone: "+1 234 567 8901",
    leadStatus: "hot",
    isRecent: true,
    contactId: "mock-1",
    hasOpenTickets: false,
    openTicketsCount: 0,
    whatsappInstanceId: null as string | null,
  },
];

const leadStatusConfig = {
  hot: { label: "Hot Lead", color: "bg-red-100 text-red-700" },
  warm: { label: "Warm Lead", color: "bg-orange-100 text-orange-700" },
  cold: { label: "Cold Lead", color: "bg-blue-100 text-blue-700" },
  lost: { label: "Lost Lead", color: "bg-gray-100 text-gray-700" },
};

const defaultTemplates = [
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

type ConvRow = typeof mockConversations[0];
type MsgRow = { id: string; sender: string; text: string; time: string };

export function SharedInbox() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [conversations, setConversations] = useState<ConvRow[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<ConvRow>(mockConversations[0]);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [currentLeadStatus, setCurrentLeadStatus] = useState<string | null>(selectedConversation.leadStatus);
  const [conversationSearch, setConversationSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState(defaultTemplates);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showConvertToLeadModal, setShowConvertToLeadModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from Supabase
  useEffect(() => {
    async function loadConversations() {
      if (!tenantId) return;
      setLoadingConvs(true);
      const { data } = await supabase
        .from("conversations")
        .select("*, contacts(*)")
        .eq("tenant_id", tenantId)
        .order("last_message_at", { ascending: false });

      if (data && data.length > 0) {
        const mapped: ConvRow[] = data.map((c: any) => ({
          id: c.id,
          name: c.contacts?.name || c.contacts?.phone || "Unknown",
          lastMessage: c.last_message || "",
          time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          unread: c.unread_count || 0,
          department: c.department || "support",
          assigned: c.assigned_user_id ? "Assigned" : "Public",
          phone: c.contacts?.phone || "",
          leadStatus: null,
          isRecent: c.last_message_at ? Date.now() - new Date(c.last_message_at).getTime() < 3600000 : false,
          contactId: c.contact_id,
          hasOpenTickets: false,
          openTicketsCount: 0,
          whatsappInstanceId: c.whatsapp_instance_id || null,
        }));
        setConversations(mapped);
        setSelectedConversation(mapped[0]);
        setCurrentLeadStatus(null);
      }
      setLoadingConvs(false);
    }
    loadConversations();
  }, [tenantId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id || selectedConversation.id.startsWith("mock")) return;
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          sender: m.sender,
          text: m.body,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));
      }
    }
    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConversation.id}` }, (payload) => {
        const m = payload.new as any;
        setMessages((prev) => {
          if (prev.some((existing) => existing.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            sender: m.sender,
            text: m.body,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation?.id]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || sending) return;
    if (!tenantId || !profile) {
      toast.error("Your CRM account is not fully provisioned.");
      return;
    }

    setSending(true);
    setMessageText("");

    const optimisticId = `opt-${Date.now()}`;
    const optimistic: MsgRow = {
      id: optimisticId,
      sender: "agent",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimistic]);

    let sendResult: { idMessage?: string; whatsappInstanceId?: string; error?: string } = {};
    if (selectedConversation.phone) {
      sendResult = await sendWhatsAppMessage(selectedConversation.phone, text, {
        conversationId: selectedConversation.id.startsWith("mock") ? undefined : selectedConversation.id,
        whatsappInstanceId: selectedConversation.whatsappInstanceId,
      });
    } else {
      sendResult = { error: "This contact has no WhatsApp phone number." };
    }

    if (!selectedConversation.id.startsWith("mock")) {
      const { data: savedMessage, error: saveError } = await supabase
        .from("messages")
        .insert({
          tenant_id: tenantId,
          conversation_id: selectedConversation.id,
          whatsapp_instance_id: sendResult.whatsappInstanceId || selectedConversation.whatsappInstanceId || null,
          sender: "agent",
          sender_user_id: profile.id,
          body: text,
          green_api_message_id: sendResult.idMessage || null,
          status: sendResult.error ? "failed" : "sent",
        })
        .select()
        .single();

      if (saveError) {
        toast.error(`Message history save failed: ${saveError.message}`);
      } else if (savedMessage) {
        const realMessage: MsgRow = {
          id: savedMessage.id,
          sender: savedMessage.sender,
          text: savedMessage.body,
          time: new Date(savedMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticId && m.id !== savedMessage.id),
          realMessage,
        ]);

        const now = new Date().toISOString();
        await supabase
          .from("conversations")
          .update({ last_message: text, last_message_at: now, whatsapp_instance_id: sendResult.whatsappInstanceId || selectedConversation.whatsappInstanceId || null, updated_at: now })
          .eq("id", selectedConversation.id)
          .eq("tenant_id", tenantId);
      }
    }

    if (sendResult.error) {
      toast.error(`Send failed: ${sendResult.error}`);
    } else {
      toast.success("Message sent via WhatsApp");
    }

    setSending(false);
  };

  // Filter conversations
  const getFilteredConversations = () => {
    let filtered = conversations as ConvRow[];

    // Apply search filter
    if (conversationSearch.trim()) {
      const search = conversationSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.lastMessage.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }

    // Apply department/filter
    if (activeFilter !== "all") {
      if (activeFilter === "mine") {
        filtered = filtered.filter(c => c.assigned === "You");
      } else if (activeFilter === "public") {
        filtered = filtered.filter(c => c.assigned === "Public");
      }
    }

    return filtered;
  };

  const filteredConversations = getFilteredConversations();
  const recentContacts = filteredConversations.filter(c => c.isRecent);
  const olderContacts = filteredConversations.filter(c => !c.isRecent);

  const handleLeadStatusChange = (status: string) => {
    setCurrentLeadStatus(status);
    // Here you would update the conversation in your state/database
  };

  const replaceVariables = (template: string) => {
    return template
      .replace(/{contact_name}/g, selectedConversation.name)
      .replace(/{phone}/g, selectedConversation.phone)
      .replace(/{department}/g, departments.find(d => d.id === selectedConversation.department)?.label || "");
  };

  const insertTemplate = (template: typeof defaultTemplates[0]) => {
    const processedContent = replaceVariables(template.content);
    setMessageText(processedContent);
    setShowTemplatesModal(false);
    textareaRef.current?.focus();
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.shortcut.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const templateCategories = Array.from(new Set(templates.map(t => t.category)));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Show shortcuts help modal (? key)
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      // Close modals on Escape
      if (e.key === 'Escape') {
        if (showTemplatesModal) setShowTemplatesModal(false);
        if (showShortcutsModal) setShowShortcutsModal(false);
        return;
      }

      // Don't trigger shortcuts when typing
      if (isTyping && e.key !== 'Escape') return;

      // R - Focus reply/message input
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        textareaRef.current?.focus();
        return;
      }

      // / - Open quick replies/templates
      if (e.key === '/') {
        e.preventDefault();
        setShowTemplatesModal(true);
        return;
      }

      // E - Focus on assignment (simulate click on assign button)
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        // In a real app, this would trigger assignment dropdown
        return;
      }

      // J/K - Navigate conversations
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const currentIndex = filteredConversations.findIndex(c => c.id === selectedConversation.id);
        if (currentIndex < filteredConversations.length - 1) {
          const nextConv = filteredConversations[currentIndex + 1];
          setSelectedConversation(nextConv);
          setCurrentLeadStatus(nextConv.leadStatus);
        }
        return;
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const currentIndex = filteredConversations.findIndex(c => c.id === selectedConversation.id);
        if (currentIndex > 0) {
          const prevConv = filteredConversations[currentIndex - 1];
          setSelectedConversation(prevConv);
          setCurrentLeadStatus(prevConv.leadStatus);
        }
        return;
      }

      // S - Toggle sidebar collapse
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
        return;
      }

      // Cmd/Ctrl + Enter - Send message
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isTyping) {
        e.preventDefault();
        handleSend();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTemplatesModal, showShortcutsModal, sidebarCollapsed, selectedConversation, filteredConversations, messageText, handleSend]);

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* Left Sidebar - Filters & Conversations */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-0 min-w-0" : "w-96 min-w-96"
      }`}>
        {!sidebarCollapsed && (
          <>
          {/* Filters */}
          <div className="border-b border-gray-200">
            {/* Search Box - Always Visible */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters Header */}
            <div className="px-4 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {filtersCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* Collapsible Filters Content */}
            {!filtersCollapsed && (
              <div className="px-4 pb-4">
                <div className="space-y-1">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeFilter === filter.id ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span className="text-xs font-medium">{filter.count}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Departments</span>
                  </div>
                  <div className="space-y-1">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dept.color.split(" ")[0]}`}></span>
                          <span className="text-gray-700">{dept.label}</span>
                        </div>
                        <span className="text-xs text-gray-500">{dept.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            )}
            {/* Recent Contacts */}
            {recentContacts.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase">Recent Contacts</p>
                </div>
                {recentContacts.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedConversation.id === conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setCurrentLeadStatus(conv.leadStatus);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Older Conversations */}
            {olderContacts.length > 0 && (
              <div>
                {recentContacts.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">All Conversations</p>
                  </div>
                )}
                {olderContacts.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedConversation.id === conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setCurrentLeadStatus(conv.leadStatus);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          </>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-1/2 -translate-y-1/2 bg-white border-2 border-gray-300 rounded-full p-1.5 hover:bg-gray-50 transition-all z-20 shadow-lg"
        style={{ left: sidebarCollapsed ? "0px" : "calc(24rem - 12px)" }}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium">
                {selectedConversation.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedConversation.name}</h2>
                <p className="text-sm text-gray-500">{selectedConversation.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#ECE5DD]">
          {messages.length === 0 && !loadingConvs && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-md ${msg.sender === "agent" ? "bg-[#DCF8C6] text-gray-900" : "bg-white"} rounded-lg px-4 py-2.5 shadow-sm`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === "agent" ? "text-gray-600" : "text-gray-500"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Quick Replies (Templates)"
            >
              <Zap className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message or use / for templates..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span>Tip: Type / or click the lightning icon for quick replies</span>
            </div>
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
            >
              <Keyboard className="w-3 h-3" />
              <span>Press ? for shortcuts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Contact Details */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Contact Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contact info..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Status Overview */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-900 mb-3">Contact Summary</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-gray-700">Contact</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">✓ Yes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-gray-700">Sales Lead</span>
                </div>
                {currentLeadStatus ? (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {leadStatusConfig[currentLeadStatus as keyof typeof leadStatusConfig].label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">No</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-gray-700">Support Tickets</span>
                </div>
                {selectedConversation.hasOpenTickets ? (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    {selectedConversation.openTicketsCount} Open
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Contact Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm text-gray-900">{selectedConversation.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm text-gray-900">{selectedConversation.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <span className={`inline-block text-xs px-2 py-1 rounded ${departments.find((d) => d.id === selectedConversation.department)?.color}`}>
                  {departments.find((d) => d.id === selectedConversation.department)?.label}
                </span>
              </div>
            </div>

            {/* View Full Contact Profile */}
            <button
              onClick={() => navigate(`/contacts/${selectedConversation.contactId}`)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Contact Profile
            </button>
          </div>

          {/* Assignment */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Assignment</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{selectedConversation.assigned}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Set as Public
              </button>
              <button className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Transfer Conversation
              </button>
            </div>
          </div>

          {/* Lead Management */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Sales Lead</h3>
            {currentLeadStatus ? (
              <>
                <div className={`border rounded-lg p-3 mb-3 ${
                  currentLeadStatus === "hot" ? "bg-red-50 border-red-200" :
                  currentLeadStatus === "warm" ? "bg-orange-50 border-orange-200" :
                  currentLeadStatus === "cold" ? "bg-blue-50 border-blue-200" :
                  "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    <span className={`text-xs font-medium ${
                      currentLeadStatus === "hot" ? "text-red-700" :
                      currentLeadStatus === "warm" ? "text-orange-700" :
                      currentLeadStatus === "cold" ? "text-blue-700" :
                      "text-gray-700"
                    }`}>
                      {leadStatusConfig[currentLeadStatus as keyof typeof leadStatusConfig].label}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/leads/${selectedConversation.id}`)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Lead Details
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Change Status:</p>
                  {Object.entries(leadStatusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleLeadStatusChange(key)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentLeadStatus === key
                          ? `${config.color} border-2 border-current`
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Just a Contact</p>
                  <p className="text-xs text-gray-500 mb-2">This person is not tracked as a sales lead.</p>
                  <p className="text-xs text-gray-600">Convert to lead if they show interest in:</p>
                  <ul className="text-xs text-gray-600 mt-1 ml-3 space-y-0.5">
                    <li>• Pricing or purchasing</li>
                    <li>• Product demos</li>
                    <li>• Sales inquiries</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowConvertToLeadModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <Target className="w-4 h-4" />
                  Convert to Sales Lead
                </button>
              </div>
            )}
          </div>

          {/* Tickets */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Support Tickets</h3>
            {selectedConversation.hasOpenTickets ? (
              <div className="space-y-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-900">
                      {selectedConversation.openTicketsCount} Open Ticket{selectedConversation.openTicketsCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/tickets?contact=${selectedConversation.contactId}`)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View All Tickets
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create New Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">No Support Tickets</p>
                  <p className="text-xs text-gray-600">Create a ticket if they need help with:</p>
                  <ul className="text-xs text-gray-600 mt-1 ml-3 space-y-0.5">
                    <li>• Technical issues</li>
                    <li>• Bug reports</li>
                    <li>• Account problems</li>
                    <li>• Feature requests</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Ticket className="w-4 h-4" />
                  Create Support Ticket
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Notes</h3>
            <textarea
              placeholder="Add notes..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            <button className="mt-2 w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              Save Note
            </button>
          </div>
        </div>
      </div>

      {/* Quick Replies Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Quick Replies</h2>
                </div>
                <button
                  onClick={() => {
                    setShowTemplatesModal(false);
                    setTemplateSearch("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates by name, category, or shortcut..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-6">
              {templateCategories.map((category) => {
                const categoryTemplates = filteredTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;

                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{category}</h3>
                    <div className="space-y-2">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => insertTemplate(template)}
                          className="w-full text-left p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-indigo-300 rounded-lg transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{template.name}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">
                                {template.shortcut}
                              </span>
                            </div>
                            <Zap className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          <p className="text-sm text-gray-600">
                            {replaceVariables(template.content)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No templates found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Variables:</span>
                  <code className="px-2 py-0.5 bg-white rounded text-xs">{"{contact_name}"}</code>
                  <code className="px-2 py-0.5 bg-white rounded text-xs">{"{phone}"}</code>
                  <code className="px-2 py-0.5 bg-white rounded text-xs">{"{department}"}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">General</h3>
                <div className="space-y-2">
                  <ShortcutItem shortcut="?" description="Show keyboard shortcuts" />
                  <ShortcutItem shortcut="Esc" description="Close modal or dialog" />
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Navigation</h3>
                <div className="space-y-2">
                  <ShortcutItem shortcut="J" description="Next conversation" />
                  <ShortcutItem shortcut="K" description="Previous conversation" />
                  <ShortcutItem shortcut="S" description="Toggle sidebar" />
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Actions</h3>
                <div className="space-y-2">
                  <ShortcutItem shortcut="R" description="Focus reply / message input" />
                  <ShortcutItem shortcut="/" description="Open quick replies" />
                  <ShortcutItem shortcut="E" description="Assign conversation" />
                  <ShortcutItem shortcut="Cmd/Ctrl + Enter" description="Send message (when typing)" />
                </div>
              </div>

              {/* Tips */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-emerald-900 mb-2">Pro Tips</h3>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Use J/K to quickly navigate through conversations</li>
                  <li>• Type shortcuts in quick replies for instant access</li>
                  <li>• Press R to immediately start typing a reply</li>
                  <li>• Press S to maximize your chat view</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <p className="text-sm text-gray-600 text-center">
                Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">?</kbd> anytime to view this help
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Lead Modal */}
      {showConvertToLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 rounded-lg p-3">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Convert to Lead</h2>
                <p className="text-sm text-gray-500">Track {selectedConversation.name} as a sales opportunity</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-yellow-900 mb-2">When to convert to a Lead?</p>
                <p className="text-xs text-yellow-700 mb-2">Convert when they show <strong>sales interest</strong>:</p>
                <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                  <li>• Asking about pricing or plans</li>
                  <li>• Requesting a demo or trial</li>
                  <li>• Interested in purchasing</li>
                  <li>• Asking about product features</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Initial Lead Status</label>
                <div className="space-y-2">
                  {Object.entries(leadStatusConfig).filter(([key]) => key !== 'lost').map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setCurrentLeadStatus(key)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        currentLeadStatus === key
                          ? `${config.color} border-2 border-current`
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs mt-0.5 opacity-75">
                        {key === 'hot' && 'Ready to buy, high interest'}
                        {key === 'warm' && 'Interested, needs nurturing'}
                        {key === 'cold' && 'Early stage, low priority'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> This creates a sales lead you can track in the Leads section. You can change the status later.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConvertToLeadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConvertToLeadModal(false);
                  // In real app, create lead record
                  navigate(`/leads/${selectedConversation.id}`);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Ticket className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Support Ticket</h2>
                <p className="text-sm text-gray-500">For {selectedConversation.name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900 mb-2">When to create a ticket?</p>
                <p className="text-xs text-yellow-700 mb-2">Create when they need <strong>support or have issues</strong>:</p>
                <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                  <li>• Technical problems or bugs</li>
                  <li>• Account/login issues</li>
                  <li>• Feature not working correctly</li>
                  <li>• Questions needing investigation</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Cannot login to account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option>Low - Can wait</option>
                  <option>Medium - Normal response</option>
                  <option>High - Needs quick attention</option>
                  <option>Urgent - Blocking their work</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="What is the problem? What did they try? What should happen?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Ticket will be assigned to Support team and tracked until resolved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateTicketModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateTicketModal(false);
                  // In real app, create ticket record
                  navigate('/tickets');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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

// Shortcut Item Component
function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-700">{description}</span>
      <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-gray-900 shadow-sm">
        {shortcut}
      </kbd>
    </div>
  );
}

// Conversation Item Component
function ConversationItem({ conv, isSelected, onClick }: {
  conv: typeof conversations[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
        isSelected ? "bg-emerald-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
          {conv.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 truncate">{conv.name}</h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conv.time}</span>
          </div>
          <p className="text-sm text-gray-600 truncate mb-1">{conv.lastMessage}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded ${departments.find((d) => d.id === conv.department)?.color}`}>
              {departments.find((d) => d.id === conv.department)?.label}
            </span>
            {conv.unread > 0 && (
              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
