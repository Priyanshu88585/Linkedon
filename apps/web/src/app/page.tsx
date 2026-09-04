"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Mail, Phone, Shield, Users, Code2, Chrome, BarChart3,
  Check, ChevronRight, Globe, Lock, Search, Database, ArrowRight,
  Star, Menu, X,
} from "lucide-react";

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1c1c1c] bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Linkedon</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {[
            { href: "/features", label: "Features" },
            { href: "/pricing", label: "Pricing" },
            { href: "/documentation", label: "Docs" },
            { href: "/about", label: "About" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            Start free
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-[#a1a1aa]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#1c1c1c] bg-[#080808] px-6 py-4 flex flex-col gap-2">
          {["/features", "/pricing", "/documentation", "/about"].map((href) => (
            <Link key={href} href={href} className="py-2 text-[#a1a1aa] capitalize">
              {href.slice(1)}
            </Link>
          ))}
          <div className="flex gap-3 mt-2 pt-2 border-t border-[#1c1c1c]">
            <Link href="/login" className="flex-1 text-center py-2 text-sm border border-[#2a2a2a] rounded-lg text-[#a1a1aa]">
              Sign in
            </Link>
            <Link href="/register" className="flex-1 text-center py-2 text-sm bg-violet-600 rounded-lg text-white">
              Start free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="hero-gradient" />
      <div className="grid-pattern absolute inset-0 opacity-30" />
      <div className="noise-texture" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-violet-500/20 bg-violet-500/5 text-sm text-violet-400">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Professional contact enrichment platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
            Find verified
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              professional contacts
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mx-auto mb-10 leading-relaxed">
            Enrich professional profiles with authorized contact data.
            Get verified emails and phone numbers from licensed sources — directly from your browser.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="group flex items-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-violet-600/25"
            >
              Start for free
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/documentation"
              className="flex items-center gap-2 px-6 py-3.5 border border-[#2a2a2a] hover:border-[#3a3a3a] text-white font-medium rounded-xl transition-all duration-200 hover:bg-white/5"
            >
              <Code2 className="w-4 h-4 text-[#a1a1aa]" />
              View API docs
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { value: "10M+", label: "Profiles enriched" },
              { value: "95%", label: "Email accuracy" },
              { value: "50+", label: "Data sources" },
              { value: "<1s", label: "Average response" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-[#666]">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mt-20"
        >
          <div className="absolute inset-x-0 -top-px h-px glow-line" />
          <div className="relative rounded-2xl border border-[#1c1c1c] overflow-hidden shadow-2xl bg-[#080808]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1c1c1c] bg-[#0d0d0d]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
                <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
                <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-[#121212] border border-[#1c1c1c] text-xs text-[#666] text-center">
                app.linkedon.io/dashboard
              </div>
            </div>
            {/* Dashboard mockup */}
            <DashboardPreview />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Dashboard Preview Mockup ─────────────────────────────────────────────────

function DashboardPreview() {
  const enrichments = [
    { name: "Sarah Chen", company: "Stripe", email: "s.chen@stripe.com", status: "verified" },
    { name: "Marcus Johnson", company: "OpenAI", email: "m.johnson@openai.com", status: "verified" },
    { name: "Priya Sharma", company: "Vercel", email: "p.sharma@vercel.com", status: "verified" },
    { name: "David Kim", company: "Figma", email: "d.kim@figma.com", status: "pending" },
  ];

  return (
    <div className="p-6 flex gap-6 min-h-[380px]">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col gap-1 w-44 shrink-0">
        {["Dashboard", "Contacts", "Search", "Lists", "History", "Billing"].map((item, i) => (
          <div
            key={item}
            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
              i === 0
                ? "bg-violet-600/10 text-violet-400 border border-violet-600/20"
                : "text-[#666]"
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {item}
          </div>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Credits left", value: "487", accent: true },
            { label: "This month", value: "213" },
            { label: "Contacts", value: "1,847" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="p-3 rounded-xl bg-[#0d0d0d] border border-[#1c1c1c]">
              <div className="text-[10px] text-[#666] uppercase tracking-wider">{label}</div>
              <div className={`text-xl font-bold mt-1 ${accent ? "text-violet-400" : "text-white"}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent enrichments */}
        <div className="rounded-xl bg-[#0d0d0d] border border-[#1c1c1c] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1c1c1c] text-xs font-medium text-[#a1a1aa]">
            Recent Enrichments
          </div>
          {enrichments.map((e, i) => (
            <div
              key={i}
              className="px-4 py-2.5 flex items-center gap-3 border-b border-[#1c1c1c] last:border-0 hover:bg-[#121212] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-violet-600/20 text-violet-400 text-[10px] font-bold flex items-center justify-center">
                {e.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{e.name}</div>
                <div className="text-[10px] text-[#666]">{e.company}</div>
              </div>
              <div className="text-[10px] text-[#a1a1aa] truncate hidden sm:block">{e.email}</div>
              <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                e.status === "verified"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}>
                {e.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Mail,
    title: "Email Enrichment",
    description: "Find verified work emails with confidence scores and source attribution from authorized data providers.",
  },
  {
    icon: Phone,
    title: "Phone Enrichment",
    description: "Discover direct dial and mobile numbers in E.164 format, sourced from licensed databases only.",
  },
  {
    icon: Chrome,
    title: "Chrome Extension",
    description: "Enrich contacts directly from LinkedIn, GitHub, and other professional profiles without leaving your browser.",
  },
  {
    icon: Code2,
    title: "REST API",
    description: "Integrate enrichment into your existing workflow with our clean, typed REST API. Full OpenAPI documentation included.",
  },
  {
    icon: Database,
    title: "Bulk CSV Processing",
    description: "Upload thousands of contacts at once. Map columns, preview results, and export enriched data.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "GDPR-compliant. Full audit trails, data deletion tools, configurable retention policies.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description: "Collaborate with your team. Fine-grained RBAC — Owner, Admin, Member, Viewer roles.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Track enrichment success rates, credit usage, provider performance, and team activity.",
  },
];

function Features() {
  return (
    <section className="py-32 px-6" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-violet-500/20 bg-violet-500/5 text-sm text-violet-400">
            Everything you need
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Built for professional
            <br />
            contact intelligence
          </h2>
          <p className="text-[#a1a1aa] max-w-xl mx-auto">
            Every feature designed to help you find and verify professional contact data from authorized sources — at scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-2xl border border-[#1c1c1c] bg-[#080808] hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mb-4 group-hover:bg-violet-600/20 transition-colors">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Install the Extension",
      description: "Add Linkedon to Chrome in seconds. Sign in with your account to link the extension to your workspace.",
      icon: Chrome,
    },
    {
      step: "02",
      title: "Visit Any Profile",
      description: "Navigate to a professional profile on LinkedIn, GitHub, or another supported platform.",
      icon: Globe,
    },
    {
      step: "03",
      title: "Enrich & Export",
      description: "Click Enrich. Get verified emails and phones from authorized sources. Save to your contact list.",
      icon: Zap,
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-[#1c1c1c]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How it works</h2>
          <p className="text-[#a1a1aa]">Three steps from profile to verified contact data</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ step, title, description, icon: Icon }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-[calc(100%+1rem)] w-8 text-[#2a2a2a]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono text-violet-400 font-bold">{step}</span>
                <div className="w-10 h-10 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#a1a1aa]" />
                </div>
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Free",
    price: 0,
    credits: 5,
    description: "Try Linkedon, no credit card required",
    features: ["5 credits/month", "Email enrichment", "Chrome Extension", "1 list"],
    cta: "Get started free",
    href: "/register",
  },
  {
    name: "Pro",
    price: 79,
    credits: 500,
    description: "For growing teams and recruiters",
    featured: true,
    features: [
      "500 credits/month",
      "Email + phone enrichment",
      "Bulk CSV enrichment",
      "Team (10 members)",
      "Full API access",
      "Webhooks",
      "Priority support",
    ],
    cta: "Start Pro trial",
    href: "/register?plan=pro",
  },
  {
    name: "Business",
    price: 199,
    credits: 2000,
    description: "For sales teams and agencies",
    features: [
      "2,000 credits/month",
      "All enrichment types",
      "Unlimited lists",
      "Team (50 members)",
      "Advanced API",
      "Audit logs",
      "Dedicated support",
    ],
    cta: "Start Business trial",
    href: "/register?plan=business",
  },
];

function Pricing() {
  return (
    <section className="py-32 px-6 border-t border-[#1c1c1c]" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-[#a1a1aa]">Pay only for what you use. Credits never expire within your billing period.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map(({ name, price, credits, description, features, cta, href, featured }) => (
            <div
              key={name}
              className={`relative p-6 rounded-2xl border transition-all ${
                featured
                  ? "border-violet-500/50 bg-violet-600/5 shadow-lg shadow-violet-600/10"
                  : "border-[#1c1c1c] bg-[#080808]"
              }`}
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full">
                  Most popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-semibold text-white mb-1">{name}</h3>
                <p className="text-xs text-[#666]">{description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${price}</span>
                <span className="text-[#666] text-sm">/month</span>
                <div className="mt-1 text-xs text-violet-400 font-medium">{credits} credits/month</div>
              </div>
              <Link
                href={href}
                className={`block w-full py-2.5 text-center text-sm font-semibold rounded-xl transition-all mb-6 ${
                  featured
                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                    : "border border-[#2a2a2a] hover:border-[#3a3a3a] text-white hover:bg-white/5"
                }`}
              >
                {cta}
              </Link>
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#666] mt-8">
          Need more? <Link href="/contact" className="text-violet-400 hover:underline">Contact us</Link> for Enterprise pricing.
        </p>
      </div>
    </section>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────

function Security() {
  return (
    <section className="py-32 px-6 border-t border-[#1c1c1c]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-violet-500/20 bg-violet-500/5 text-sm text-violet-400">
            <Shield className="w-3.5 h-3.5" />
            Security & Compliance
          </div>
          <h2 className="text-3xl font-bold mb-6">
            Built with privacy
            <br />
            at the core
          </h2>
          <p className="text-[#a1a1aa] mb-8 leading-relaxed">
            Every enrichment result comes with source attribution. We only use authorized and licensed data providers.
            Your data stays yours.
          </p>
          <ul className="space-y-4">
            {[
              "All contact data sourced from authorized providers",
              "Full audit trail for every enrichment",
              "Configurable data retention policies",
              "One-click account and data deletion",
              "API keys stored as SHA-256 hashes only",
              "Rate limiting and abuse prevention",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[#a1a1aa]">
                <div className="w-5 h-5 rounded-full bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mt-0.5 shrink-0">
                  <Check className="w-3 h-3 text-violet-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Lock, title: "JWT Auth", desc: "15-min access tokens with secure refresh rotation" },
            { icon: Shield, title: "GDPR Ready", desc: "Full data export and deletion on request" },
            { icon: Search, title: "Audit Logs", desc: "Every action logged with IP, user, and timestamp" },
            { icon: Database, title: "Encrypted", desc: "All sensitive data encrypted at rest and in transit" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl border border-[#1c1c1c] bg-[#080808]">
              <Icon className="w-5 h-5 text-violet-400 mb-3" />
              <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
              <p className="text-xs text-[#666] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-32 px-6 border-t border-[#1c1c1c]">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <h2 className="text-4xl font-bold mb-4">
          Start enriching contacts
          <br />
          in minutes
        </h2>
        <p className="text-[#a1a1aa] mb-8">
          5 free credits, no credit card required. Install the Chrome Extension and enrich your first contact today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group flex items-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all"
          >
            Get started free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/api-docs"
            className="flex items-center gap-2 px-6 py-3.5 border border-[#2a2a2a] text-white rounded-xl hover:bg-white/5 transition-all"
          >
            <Code2 className="w-4 h-4 text-[#a1a1aa]" />
            View API reference
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const links = {
    Product: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/documentation", label: "Documentation" },
      { href: "/api-docs", label: "API Reference" },
      { href: "/changelog", label: "Changelog" },
    ],
    Company: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/security", label: "Security" },
    ],
    Legal: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  };

  return (
    <footer className="border-t border-[#1c1c1c] px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">Linkedon</span>
            </Link>
            <p className="text-sm text-[#666] leading-relaxed">
              Professional contact enrichment from authorized sources.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[#666] mb-4">{category}</h4>
              <ul className="space-y-3">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#a1a1aa] hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#1c1c1c] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#666]">
            © {new Date().getFullYear()} Linkedon. All rights reserved.
          </p>
          <p className="text-xs text-[#666]">
            Contact data sourced from authorized providers only.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
