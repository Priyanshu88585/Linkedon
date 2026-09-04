"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, ArrowUp, ArrowDown, TrendingUp, Users, CheckCircle,
  Clock, AlertCircle, ArrowRight, Plus,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="p-5 rounded-2xl border border-[#1c1c1c] bg-[#080808] hover:border-[#2a2a2a] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        {delta && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-green-400" : "text-red-400"}`}>
            {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {delta}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-[#666]">{label}</div>
    </div>
  );
}

// ─── Enrichment chart mock data ───────────────────────────────────────────────

const chartData = [
  { day: "Mon", enrichments: 12, success: 11 },
  { day: "Tue", enrichments: 19, success: 18 },
  { day: "Wed", enrichments: 8, success: 7 },
  { day: "Thu", enrichments: 24, success: 22 },
  { day: "Fri", enrichments: 31, success: 29 },
  { day: "Sat", enrichments: 6, success: 6 },
  { day: "Sun", enrichments: 14, success: 13 },
];

// ─── Recent Activity ──────────────────────────────────────────────────────────

const recentActivity = [
  { name: "Sarah Chen", company: "Stripe", status: "completed", time: "2m ago", email: "s.chen@stripe.com" },
  { name: "Marcus Johnson", company: "OpenAI", status: "completed", time: "8m ago", email: "m.johnson@openai.com" },
  { name: "Priya Sharma", company: "Vercel", status: "completed", time: "15m ago", email: "p.sharma@vercel.com" },
  { name: "David Kim", company: "Figma", status: "no_result", time: "23m ago", email: null },
  { name: "Emma Wilson", company: "Notion", status: "completed", time: "1h ago", email: "e.wilson@notion.so" },
];

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-green-400", label: "Enriched" },
  pending: { icon: Clock, color: "text-yellow-400", label: "Pending" },
  no_result: { icon: AlertCircle, color: "text-[#666]", label: "No result" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [credits, setCredits] = useState(487);

  const stats = [
    { label: "Credits remaining", value: credits, delta: "", positive: true, icon: Zap },
    { label: "Enriched this month", value: "213", delta: "+24%", positive: true, icon: TrendingUp },
    { label: "Total contacts", value: "1,847", delta: "+12%", positive: true, icon: Users },
    { label: "Success rate", value: "94.3%", delta: "+1.2%", positive: true, icon: CheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[#666] text-sm mt-0.5">Your enrichment overview for this period.</p>
        </div>
        <Link
          href="/dashboard/enrichment/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enrich contact
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Enrichment chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-[#1c1c1c] bg-[#080808]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Enrichment activity</h2>
              <p className="text-xs text-[#666] mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#666]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                Total
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Successful
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="enrichGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Area type="monotone" dataKey="enrichments" stroke="#7c3aed" fill="url(#enrichGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="success" stroke="#22c55e" fill="url(#successGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Credit breakdown */}
        <div className="p-6 rounded-2xl border border-[#1c1c1c] bg-[#080808]">
          <h2 className="font-semibold text-white mb-1">Credit usage</h2>
          <p className="text-xs text-[#666] mb-6">This billing period</p>

          <div className="space-y-3 mb-6">
            {[
              { label: "Email enrichment", used: 180, total: 500 },
              { label: "Phone enrichment", used: 33, total: 500 },
              { label: "Bulk import", used: 0, total: 500 },
            ].map(({ label, used }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a1a1aa]">{label}</span>
                  <span className="text-[#666]">{used} used</span>
                </div>
                <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${(used / 500) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-violet-600/5 border border-violet-600/20">
            <div className="text-xs text-[#666] mb-0.5">Remaining credits</div>
            <div className="text-2xl font-bold text-violet-400">{credits}</div>
            <div className="text-[10px] text-[#666] mt-1">Resets in 18 days</div>
          </div>

          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 mt-4 text-xs text-violet-400 hover:underline"
          >
            Manage plan
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent enrichments */}
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#080808] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c]">
          <h2 className="font-semibold text-white">Recent enrichments</h2>
          <Link href="/dashboard/enrichment" className="text-xs text-violet-400 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-[#1c1c1c]">
          {recentActivity.map((item, i) => {
            const sc = statusConfig[item.status as keyof typeof statusConfig];
            const StatusIcon = sc.icon;
            return (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#0d0d0d] transition-colors">
                <div className="w-8 h-8 rounded-full bg-violet-600/15 text-violet-400 text-sm font-bold flex items-center justify-center shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="text-xs text-[#666]">{item.company}</div>
                </div>
                <div className="hidden md:block text-xs text-[#a1a1aa] truncate max-w-[160px]">
                  {item.email ?? "—"}
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {sc.label}
                </div>
                <div className="text-xs text-[#444] shrink-0">{item.time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
