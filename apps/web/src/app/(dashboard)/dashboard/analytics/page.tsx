"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Zap, Loader2, Target } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ec4899'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ totalEnriched: 0, creditsSpent: 0, hitRate: 0 });
  const [trendData, setTrendData] = useState([]);
  const [providerData, setProviderData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [overviewRes, trendRes, providersRes] = await Promise.all([
          fetch("http://localhost:3001/api/v1/analytics/overview", { headers }),
          fetch("http://localhost:3001/api/v1/analytics/usage-trend", { headers }),
          fetch("http://localhost:3001/api/v1/analytics/providers", { headers })
        ]);

        if (!overviewRes.ok) throw new Error("Failed to load analytics");

        const overviewData = await overviewRes.json();
        const trend = await trendRes.json();
        const providers = await providersRes.json();

        setOverview(overviewData.data);
        setTrendData(trend.data);
        
        // Format provider data for PieChart
        const formattedProviders = providers.data.map((p: any) => ({
          name: p._id,
          value: p.successful
        }));
        setProviderData(formattedProviders);
      } catch (err) {
        setError("Could not load analytics. Are you an admin?");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Analytics Dashboard</h1>
        <p className="text-zinc-400 mt-2">
          Monitor your team's enrichment usage and provider hit rates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Total Enriched</h3>
            <Users className="h-5 w-5 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{overview.totalEnriched}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Credits Spent</h3>
            <Zap className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{overview.creditsSpent}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Overall Hit Rate</h3>
            <Target className="h-5 w-5 text-pink-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{overview.hitRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-base font-medium text-white mb-6">30-Day Usage Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  stroke="#666" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Total Attempted"
                  stroke="#7c3aed" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="successful" 
                  name="Successful Hits"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-base font-medium text-white mb-6">Successful Hits by Provider</h3>
          <div className="h-72 flex flex-col items-center justify-center">
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-500">No provider data available.</p>
            )}
            
            {providerData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {providerData.map((entry: any, index) => (
                  <div key={entry.name} className="flex items-center text-xs text-zinc-400">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {entry.name || 'UNKNOWN'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
