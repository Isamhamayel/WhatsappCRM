import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Clock, AlertCircle, User, Calendar, FileText, Trash2 } from "lucide-react";

export function TicketDetail() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([
    { id: 1, text: "Customer confirmed they're using Chrome browser. Issue persists.", time: "5 minutes ago", user: "You" },
    { id: 2, text: "Escalated to technical team. Awaiting response.", time: "10 minutes ago", user: "Sarah Johnson" },
  ]);
  const [newNote, setNewNote] = useState("");

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate("/tickets")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Tickets</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm text-gray-500">#1234</span>
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Open
              </span>
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                High Priority
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Account setup issues</h1>
            <p className="text-sm text-gray-500 mt-2">Created 2 minutes ago • Support Department</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Transfer Ticket
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              Mark Resolved
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      AW
                    </div>
                    <p className="text-sm text-gray-900">Alice Williams</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status History</p>
                  <p className="text-sm text-gray-900">Open → Assigned to You (2 min ago)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                  <p className="text-sm text-gray-900">You</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-900">Customer is unable to complete account setup. Error message appears during verification step. They have tried multiple times but continue to receive the same error message.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">Ticket assigned to You</p>
                  <p className="text-xs text-gray-500 mt-1">System • 2 minutes ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">Priority changed to High</p>
                  <p className="text-xs text-gray-500 mt-1">Sarah Johnson • 5 minutes ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">Ticket created from conversation</p>
                  <p className="text-xs text-gray-500 mt-1">System • 10 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Notes */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
            
            {/* Add Note Form */}
            <div className="mb-4">
              <textarea
                placeholder="Add an internal note..."
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <button 
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="mt-2 w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-3">Previous Notes</p>
                {notes.map((note) => (
                  <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 group relative">
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
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Ticket ID</p>
                <p className="text-sm font-mono font-medium text-gray-900">#1234</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Support
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-900">2 minutes ago</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Response Time</p>
                <p className="text-sm text-gray-900">Within SLA (2m)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}