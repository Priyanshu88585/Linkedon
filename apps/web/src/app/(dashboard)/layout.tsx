"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Search, Users, List, Zap, BarChart3,
  Settings, CreditCard, Key, Bell, LogOut, ChevronDown, Menu, FileSpreadsheet
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Search, label: "Search People", href: "/dashboard/search" },
  { icon: Users, label: "Contacts", href: "/dashboard/contacts" },
  { icon: List, label: "Lists", href: "/dashboard/lists" },
  { icon: Zap, label: "Enrichment", href: "/dashboard/enrichment" },
  { icon: FileSpreadsheet, label: "Bulk Enrichment", href: "/dashboard/enrichment/bulk" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
];

const settingsItems = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Key, label: "API Keys", href: "/dashboard/api-keys" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Fetch user profile for onboarding check
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.onboardingCompleted === false) {
          router.push("/onboarding");
        }
      })
      .catch(() => {});

    // Fetch credits
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCredits(d?.data?.balance))
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`shrink-0 transition-all duration-300 border-r border-[#1c1c1c] bg-[#040404] flex flex-col ${
          sidebarOpen ? "w-[240px]" : "w-[68px]"
        }`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 border-b border-[#1c1c1c] gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg">Linkedon</span>}
        </div>

        {/* Credits badge */}
        {credits !== null && sidebarOpen && (
          <div className="mx-3 my-3 p-2.5 rounded-xl bg-violet-600/10 border border-violet-600/20">
            <div className="text-xs text-[#666] mb-0.5">Credits remaining</div>
            <div className="text-lg font-bold text-violet-400">{credits}</div>
            <Link href="/dashboard/billing" className="text-[10px] text-violet-400/70 hover:text-violet-400 mt-1 block">
              Upgrade plan →
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                  active
                    ? "bg-violet-600/10 text-violet-400 border border-violet-600/20"
                    : "text-[#666] hover:text-white hover:bg-white/5"
                }`}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}

          <div className="pt-4 pb-1 px-3">
            {sidebarOpen && (
              <span className="text-[10px] uppercase tracking-widest text-[#444] font-semibold">Settings</span>
            )}
          </div>

          {settingsItems.map(({ icon: Icon, label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active ? "bg-white/5 text-white" : "text-[#666] hover:text-white hover:bg-white/5"
                }`}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-[#1c1c1c] p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[#666] hover:text-red-400 hover:bg-red-500/5 transition-all"
            title={!sidebarOpen ? "Sign out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[60px] border-b border-[#1c1c1c] bg-[#040404] flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-[#666] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <Link
            href="/dashboard/billing"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-600/20 text-xs text-violet-400 font-medium hover:bg-violet-600/20 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {credits ?? "—"} credits
          </Link>
          <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 text-sm font-bold flex items-center justify-center">
            U
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-black p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
