import { Download, TrendingUp, Users, Target, MessageSquare } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const campaignData = [
  { month: "Jan", sent: 3200, delivered: 3120, replied: 380 },
  { month: "Feb", sent: 2800, delivered: 2750, replied: 310 },
  { month: "Mar", sent: 4100, delivered: 4050, replied: 520 },
  { month: "Apr", sent: 2100, delivered: 2080, replied: 234 },
];

const leadsConversionData = [
  { status: "Hot", converted: 45, lost: 12 },
  { status: "Warm", converted: 78, lost: 34 },
  { status: "Cold", converted: 23, lost: 89 },
];

const agentPerformanceData = [
  { name: "Sarah J.", conversations: 145, avgResponse: "2m", satisfaction: 4.8 },
  { name: "Mike C.", conversations: 132, avgResponse: "3m", satisfaction: 4.6 },
  { name: "Emma W.", conversations: 118, avgResponse: "2m", satisfaction: 4.9 },
  { name: "David B.", conversations: 98, avgResponse: "5m", satisfaction: 4.3 },
];

const departmentData = [
  { name: "Sales", value: 890, color: "#3b82f6" },
  { name: "Support", value: 1240, color: "#10b981" },
  { name: "Finance", value: 350, color: "#8b5cf6" },
];

export function Reports() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Track performance across campaigns, leads, and team members</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          <span className="font-medium">Export Report</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Conversations</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">2,480</p>
              <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
            </div>
            <div className="bg-blue-500 rounded-lg p-3">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Leads Converted</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">146</p>
              <p className="text-xs text-green-600 mt-1">+8% vs last month</p>
            </div>
            <div className="bg-green-500 rounded-lg p-3">
              <Target className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">3m</p>
              <p className="text-xs text-green-600 mt-1">-15% vs last month</p>
            </div>
            <div className="bg-purple-500 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Satisfaction</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">4.7</p>
              <p className="text-xs text-green-600 mt-1">+0.2 vs last month</p>
            </div>
            <div className="bg-orange-500 rounded-lg p-3">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance (Last 4 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={campaignData}>
            <CartesianGrid key="grid-campaign" strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis key="xaxis-campaign" dataKey="month" stroke="#9ca3af" />
            <YAxis key="yaxis-campaign" stroke="#9ca3af" />
            <Tooltip key="tooltip-campaign" />
            <Line key="line-sent" type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Sent" />
            <Line key="line-delivered" type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} name="Delivered" />
            <Line key="line-replied" type="monotone" dataKey="replied" stroke="#8b5cf6" strokeWidth={2} name="Replied" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Conversion */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads Conversion by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsConversionData}>
              <CartesianGrid key="grid-conversion" strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis key="xaxis-conversion" dataKey="status" stroke="#9ca3af" />
              <YAxis key="yaxis-conversion" stroke="#9ca3af" />
              <Tooltip key="tooltip-conversion" />
              <Bar key="bar-converted" dataKey="converted" fill="#10b981" name="Converted" radius={[8, 8, 0, 0]} />
              <Bar key="bar-lost" dataKey="lost" fill="#ef4444" name="Lost" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                key="departments-pie"
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry) => (
                  <Cell key={`dept-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key="tooltip-departments" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Agent Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agentPerformanceData.map((agent, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {agent.name.split(" ")[0][0]}{agent.name.split(" ")[1][0]}
                      </div>
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{agent.conversations}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{agent.avgResponse}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{agent.satisfaction}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < Math.floor(agent.satisfaction) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                        ))}
                      </div>
                    </div>
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
