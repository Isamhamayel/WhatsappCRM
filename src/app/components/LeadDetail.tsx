import { useNavigate } from "react-router";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign, User, Building2, MessageSquare, Edit, X, Check, Trash2 } from "lucide-react";
import { useState } from "react";

const activity = [
  { type: "message", description: "Sent message about pricing", time: "2 minutes ago", user: "You" },
  { type: "call", description: "Phone call - 15 minutes", time: "1 hour ago", user: "You" },
  { type: "note", description: "Added note: Very interested in enterprise plan", time: "3 hours ago", user: "You" },
  { type: "status", description: "Status changed to Hot", time: "1 day ago", user: "Sarah Johnson" },
  { type: "created", description: "Lead created from inbox conversation", time: "3 days ago", user: "System" },
];

const messages = [
  { id: 1, sender: "customer", text: "Hi! I'm interested in your product", time: "10:23 AM" },
  { id: 2, sender: "agent", text: "Hello! Thanks for reaching out. I'd be happy to help you learn more.", time: "10:24 AM" },
  { id: 3, sender: "customer", text: "What pricing plans do you offer?", time: "10:25 AM" },
];

export function LeadDetail() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState([
    { id: 1, text: "Very interested in enterprise plan. Follow up next week.", time: "3 hours ago", user: "You" }
  ]);
  const [newNote, setNewNote] = useState("");
  
  // Editable lead information
  const [leadInfo, setLeadInfo] = useState({
    name: "Alice Williams",
    phone: "+1 234 567 8901",
    email: "alice.williams@example.com",
    company: "Acme Technologies Inc.",
    location: "San Francisco, CA",
    estimatedValue: "$25,000",
    owner: "You",
    status: "hot",
    department: "Sales"
  });

  // Temporary state for editing
  const [editedInfo, setEditedInfo] = useState(leadInfo);

  const handleSaveEdit = () => {
    setLeadInfo(editedInfo);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedInfo(leadInfo);
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note = {
        id: notes.length + 1,
        text: newNote,
        time: "Just now",
        user: "You"
      };
      setNotes([note, ...notes]);
      setNewNote("");
    }
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleOpenChat = () => {
    // Navigate to shared inbox with this lead's conversation
    navigate('/inbox?conversation=1');
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Leads</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-medium">
              {leadInfo.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{leadInfo.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  Hot Lead
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {leadInfo.department}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleOpenChat}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Transfer Lead
            </button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
              Convert to Customer
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">Cancel</span>
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Save</span>
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{leadInfo.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900">{leadInfo.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <p className="text-sm text-gray-900">{leadInfo.company}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm text-gray-900">{leadInfo.location}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <input
                      type="text"
                      value={editedInfo.phone}
                      onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <input
                      type="email"
                      value={editedInfo.email}
                      onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <input
                      type="text"
                      value={editedInfo.company}
                      onChange={(e) => setEditedInfo({ ...editedInfo, company: e.target.value })}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <input
                      type="text"
                      value={editedInfo.location}
                      onChange={(e) => setEditedInfo({ ...editedInfo, location: e.target.value })}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conversation History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h2>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-md ${msg.sender === "agent" ? "bg-emerald-600 text-white" : "bg-gray-100"} rounded-lg px-4 py-2.5`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === "agent" ? "text-emerald-100" : "text-gray-500"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={handleOpenChat}
              className="mt-4 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              View Full Conversation
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {activity.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    </div>
                    {index < activity.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-2"></div>}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.user} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimated Value</p>
                  <p className="text-sm font-medium text-gray-900">{leadInfo.estimatedValue}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Owner</p>
                  <p className="text-sm font-medium text-gray-900">{leadInfo.owner}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Contact</p>
                  <p className="text-sm font-medium text-gray-900">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900">3 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="space-y-3 mb-3">
              {notes.map((note) => (
                <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 group relative">
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="absolute top-2 right-2 p-1 text-yellow-600 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-sm text-gray-900 pr-6">{note.text}</p>
                  <p className="text-xs text-gray-500 mt-2">{note.user} • {note.time}</p>
                </div>
              ))}
            </div>
            <textarea
              placeholder="Add a note..."
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            <button 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="mt-2 w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}