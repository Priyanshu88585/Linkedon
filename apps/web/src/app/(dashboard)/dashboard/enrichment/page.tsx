"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Mail, Phone, Linkedin, Github, Loader2, CheckCircle, AlertCircle, Copy, Save, X } from "lucide-react";
import { EnrichmentInputType } from "@linkedon/types";

type ResultItem = {
  category: string;
  value: string;
  confidence: number;
  source: string;
  verified: boolean;
};

export default function EnrichmentPage() {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<EnrichmentInputType>(EnrichmentInputType.LINKEDIN_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [enrichmentId, setEnrichmentId] = useState<string | null>(null);

  const inputTypes = [
    { value: EnrichmentInputType.LINKEDIN_URL, label: "LinkedIn URL", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
    { value: EnrichmentInputType.DOMAIN, label: "Domain", icon: Globe, placeholder: "company.com" },
    { value: EnrichmentInputType.EMAIL, label: "Email", icon: Mail, placeholder: "person@company.com" },
    { value: EnrichmentInputType.GITHUB_URL, label: "GitHub URL", icon: Github, placeholder: "https://github.com/username" },
  ];

  const selected = inputTypes.find((t) => t.value === inputType)!;

  const handleEnrich = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/enrichment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ input: input.trim(), inputType, saveContact: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Enrichment failed");

      const id = data.data.enrichmentId;
      setEnrichmentId(id);
      setStatus("queued");

      // Poll for results
      let attempts = 0;
      const poll = async () => {
        attempts++;
        if (attempts > 30) {
          setStatus("timeout");
          setLoading(false);
          return;
        }
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/enrichment/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        const s = d.data?.status;
        setStatus(s);
        if (s === "completed" || s === "no_result") {
          setResults(d.data?.results ?? []);
          setLoading(false);
        } else if (s === "failed") {
          setError(d.data?.error ?? "Enrichment failed");
          setLoading(false);
        } else {
          setTimeout(poll, 1500);
        }
      };
      setTimeout(poll, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Enrich Contact</h1>
        <p className="text-[#666] text-sm mt-0.5">
          Enter a LinkedIn URL, email, or domain to retrieve verified contact information.
        </p>
      </div>

      {/* Input type selector */}
      <div className="flex flex-wrap gap-2">
        {inputTypes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setInputType(value); setInput(""); setResults(null); setError(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              inputType === value
                ? "bg-violet-600/10 border-violet-600/40 text-violet-400"
                : "border-[#1c1c1c] text-[#666] hover:text-white hover:border-[#2a2a2a]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleEnrich} className="flex gap-3">
        <div className="flex-1 relative">
          <selected.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selected.placeholder}
            className="w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-500 transition-colors"
          />
          {input && (
            <button type="button" onClick={() => setInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#666]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Enriching..." : "Enrich"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-8 rounded-2xl border border-[#1c1c1c] bg-[#080808] flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-600/30 border-t-violet-600 animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium">Enriching contact...</p>
            <p className="text-xs text-[#666] mt-1">
              {status === "queued" ? "Queued for processing" : "Querying authorized data sources"}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {results !== null && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {results.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[#1c1c1c] bg-[#080808] text-center">
              <AlertCircle className="w-8 h-8 text-[#444] mx-auto mb-3" />
              <p className="text-white font-medium">No contact data found</p>
              <p className="text-sm text-[#666] mt-1">
                We could not find verified contact information for this input.
                Try a different URL or email.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1c1c1c] bg-[#080808] overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1c1c1c]">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <h2 className="font-semibold text-white">Contact enriched</h2>
                  <p className="text-xs text-[#666]">Saved to your contacts</p>
                </div>
              </div>

              <div className="divide-y divide-[#1c1c1c]">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-8 h-8 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center">
                      {r.category === "email" ? (
                        <Mail className="w-3.5 h-3.5 text-violet-400" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{r.value}</div>
                      <div className="text-xs text-[#666]">
                        Source: {r.source} · Confidence: {Math.round(r.confidence * 100)}%
                      </div>
                    </div>
                    {r.verified && (
                      <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </div>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(r.value)}
                      className="p-1.5 text-[#666] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      aria-label="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
