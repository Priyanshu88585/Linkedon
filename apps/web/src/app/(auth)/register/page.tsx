"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Check, Github } from "lucide-react";
import { LogoIcon } from "../../../components/ui/logo-icon";
import { useGoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Registration failed");
      localStorage.setItem("accessToken", data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const signupWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message ?? "Google signup failed");

        localStorage.setItem("accessToken", data.data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.data.tokens.refreshToken);

        router.push("/onboarding");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google signup failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google signup was cancelled or failed."),
  });

  const handleGithubSignup = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError("GitHub Client ID is not configured");
      return;
    }
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="flex justify-center mb-6">
          <LogoIcon className="w-12 h-12" />
        </Link>

        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-[#666] text-sm mb-8">
          Start with 5 free credits — no credit card required.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => signupWithGoogle()}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ffffff] hover:bg-[#f1f1f1] text-black font-medium rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleGithubSignup}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#24292e] hover:bg-[#2f363d] text-white font-medium rounded-xl transition-colors text-sm border border-[#3e444a]"
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a2a]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-black px-2 text-[#666]">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Work email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {passwordChecks.map(({ label, valid }) => (
                  <div key={label} className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                    valid ? "bg-green-500/10 text-green-400" : "bg-[#1c1c1c] text-[#666]"
                  }`}>
                    {valid && <Check className="w-2.5 h-2.5" />}
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordChecks.every((c) => c.valid)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#666] mt-4 leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-violet-400 hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>.
        </p>

        <p className="text-center text-sm text-[#666] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
