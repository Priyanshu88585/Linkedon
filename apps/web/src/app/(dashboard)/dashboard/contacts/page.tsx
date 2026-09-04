"use client";

import { useState, useEffect } from "react";
import { Search, Mail, Phone, Plus, Filter, MoreHorizontal, Download, Upload } from "lucide-react";
import Link from "next/link";

type Contact = {
  _id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  company?: string;
  emails: { value: string; isPrimary?: boolean }[];
  phones: { value: string }[];
  createdAt: string;
};

function ContactRow({ contact }: { contact: Contact }) {
  const displayName = contact.fullName || `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || "Unknown";
  const primaryEmail = contact.emails.find((e) => e.isPrimary)?.value ?? contact.emails[0]?.value;
  const primaryPhone = contact.phones[0]?.value;

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#0d0d0d] transition-colors border-b border-[#1c1c1c] last:border-0">
      <div className="w-8 h-8 rounded-full bg-violet-600/15 text-violet-400 text-sm font-bold flex items-center justify-center shrink-0">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{displayName}</div>
        <div className="text-xs text-[#666]">{contact.jobTitle}{contact.company ? ` @ ${contact.company}` : ""}</div>
      </div>
      <div className="hidden md:flex items-center gap-1 text-xs text-[#a1a1aa]">
        {primaryEmail && <><Mail className="w-3 h-3 text-[#444]" />{primaryEmail}</>}
      </div>
      <div className="hidden lg:flex items-center gap-1 text-xs text-[#a1a1aa]">
        {primaryPhone && <><Phone className="w-3 h-3 text-[#444]" />{primaryPhone}</>}
      </div>
      <button className="p-1.5 text-[#444] hover:text-[#666] rounded transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/contacts`);
    if (query) url.searchParams.set("q", query);
    url.searchParams.set("page", String(page));
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setContacts(d.data ?? []);
        setTotal(d.meta?.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, page]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-[#666] text-sm">{total.toLocaleString()} total contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 border border-[#2a2a2a] rounded-xl text-sm text-[#a1a1aa] hover:text-white hover:border-[#3a3a3a] transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#2a2a2a] rounded-xl text-sm text-[#a1a1aa] hover:text-white hover:border-[#3a3a3a] transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <Link
            href="/dashboard/enrichment"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add contact
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1c1c1c] bg-[#080808] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1c1c1c]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-4 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5 border-b border-[#1c1c1c]">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-40 rounded" />
                  <div className="skeleton h-2.5 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#666] text-sm">No contacts yet.</p>
            <Link href="/dashboard/enrichment" className="text-violet-400 text-sm hover:underline mt-2 block">
              Enrich your first contact →
            </Link>
          </div>
        ) : (
          contacts.map((c) => <ContactRow key={c._id} contact={c} />)
        )}
      </div>
    </div>
  );
}
