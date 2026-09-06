"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function GithubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (!code) {
      setError("No authorization code provided from GitHub.");
      return;
    }

    const authenticate = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error?.message ?? "GitHub authentication failed");
        }

        // Store tokens
        localStorage.setItem("accessToken", data.data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.data.tokens.refreshToken);

        // Check if onboarding is completed, otherwise go to onboarding
        if (data.data.user.onboardingCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    authenticate();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Authentication Failed</h1>
          <p className="text-[#a1a1aa] text-sm mb-6">{error}</p>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">Authenticating</h1>
      <p className="text-[#a1a1aa] text-sm">Please wait while we connect your GitHub account...</p>
    </div>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Loading</h1>
      </div>
    }>
      <GithubCallbackContent />
    </Suspense>
  );
}
