import { MessageSquare, TrendingUp, AlertCircle, Send, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const kpiData = [
  { label: "Total Conversations", value: "1,248", change: "+12%", trend: "up", icon: MessageSquare, color: "bg-blue-500" },
  { label: "New Leads", value: "324", change: "+8%", trend: "up", icon: TrendingUp, color: "bg-green-500" },
  { label: "Open Tickets", value: "47", change: "-5%", trend: "down", icon: AlertCircle, color: "bg-orange-500" },
  { label: "Campaign Performance", value: "89%", change: "+3%", trend: "up", icon: Send, color: "bg-purple-500" },
];

const messagesData = [
  { date: "Mon", messages: 145 },
  { date: "Tue", messages: 178 },
  { date: "Wed", messages: 162 },
  { date: "Thu", messages: 195 },
  { date: "Fri", messages: 210 },
  { date: "Sat", messages: 128 },
  { date: "Sun", messages: 95 },
];

const leadsData = [
  { status: "Hot", count: 45 },
  { status: "Warm", count: 89 },
  { status: "Cold", count: 120 },
  { status: "Lost", count: 32 },
];

const recentActivity = [
  { user: "Sarah Johnson", action: "Closed ticket", item: "#1234", time: "2 min ago" },
  { user: "Mike Chen", action: "Converted lead", item: "John Smith", time: "15 min ago" },
  { user: "Emma Wilson", action: "Sent campaign", item: "Summer Sale 2026", time: "1 hour ago" },
  { user: "David Brown", action: "Created ticket", item: "#1235", time: "2 hours ago" },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trend === "up" ? (
                    <ArrowUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.change}
                  </span>
                  <span className="text-sm text-gray-500">vs last week</span>
                </div>
              </div>
              <div className={`${kpi.color} rounded-lg p-3`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Over Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messagesData}>
              <CartesianGrid key="grid-messages" strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis key="xaxis-messages" dataKey="date" stroke="#9ca3af" />
              <YAxis key="yaxis-messages" stroke="#9ca3af" />
              <Tooltip key="tooltip-messages" />
              <Line key="line-messages" type="monotone" dataKey="messages" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsData}>
              <CartesianGrid key="grid-leads" strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis key="xaxis-leads" dataKey="status" stroke="#9ca3af" />
              <YAxis key="yaxis-leads" stroke="#9ca3af" />
              <Tooltip key="tooltip-leads" />
              <Bar key="bar-leads" dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
              <Send className="w-5 h-5" />
              <span className="font-medium">Send Campaign</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">View Inbox</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Create Lead</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-sm font-medium flex-shrink-0">
                  {activity.user.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                    <span className="font-medium">{activity.item}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
