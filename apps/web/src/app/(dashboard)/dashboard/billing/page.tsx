"use client";

import { useState, useEffect } from "react";
import { CreditCard, Zap, Check, ExternalLink, AlertCircle, Loader2, ArrowUpRight } from "lucide-react";

const plans = [
  { name: "Free", price: 0, credits: 5, current: false },
  { name: "Starter", price: 29, credits: 100, current: false },
  { name: "Pro", price: 79, credits: 500, current: true, popular: true },
  { name: "Business", price: 199, credits: 2000, current: false },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setBilling(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.data?.url) window.location.href = data.data.url;
    } catch {}
    setPortalLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Billing & Credits</h1>
        <p className="text-[#666] text-sm mt-0.5">Manage your subscription and credit balance.</p>
      </div>

      {/* Current plan */}
      <div className="p-6 rounded-2xl border border-[#1c1c1c] bg-[#080808]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-[#666] uppercase tracking-widest mb-1">Current plan</div>
            <h2 className="text-xl font-bold text-white">
              {loading ? "—" : billing?.subscription?.planId?.displayName ?? "Free"}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-[#a1a1aa]">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                {billing?.balance?.balance ?? "—"} credits remaining
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] rounded-xl text-sm text-[#a1a1aa] hover:text-white hover:border-[#3a3a3a] transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              Manage billing
            </button>
          </div>
        </div>

        {billing?.subscription?.currentPeriodEnd && (
          <div className="mt-4 pt-4 border-t border-[#1c1c1c] flex items-center gap-2 text-xs text-[#666]">
            <AlertCircle className="w-3.5 h-3.5" />
            Renews {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </div>
        )}
      </div>

      {/* Plans comparison */}
      <div>
        <h2 className="font-semibold text-white mb-4">Available plans</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plans.map(({ name, price, credits, current, popular }) => (
            <div
              key={name}
              className={`relative p-5 rounded-2xl border transition-all ${
                current
                  ? "border-violet-500/40 bg-violet-600/5"
                  : "border-[#1c1c1c] bg-[#080808] hover:border-[#2a2a2a]"
              }`}
            >
              {popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-violet-600 text-[10px] font-bold text-white rounded-full">
                  Popular
                </div>
              )}
              {current && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
              )}
              <h3 className="font-semibold text-white mb-1">{name}</h3>
              <div className="text-2xl font-bold text-white mb-0.5">${price}</div>
              <div className="text-xs text-[#666] mb-4">/month · {credits} credits</div>
              {current ? (
                <div className="text-xs text-violet-400 font-medium">Current plan</div>
              ) : (
                <button className="text-xs text-violet-400 hover:underline flex items-center gap-1">
                  {price > 79 ? "Upgrade" : price === 0 ? "Downgrade" : "Switch"}
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Credit history teaser */}
      <div className="p-6 rounded-2xl border border-[#1c1c1c] bg-[#080808]">
        <h2 className="font-semibold text-white mb-4">Credit usage history</h2>
        <div className="text-sm text-[#666]">
          Credit transaction history is available in your{" "}
          <button className="text-violet-400 hover:underline">full billing portal</button>.
        </div>
      </div>
    </div>
  );
}
