"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, Briefcase, Users, Target, Send, ChevronRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form state
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [goal, setGoal] = useState("");
  const [invites, setInvites] = useState(["", "", ""]);
  
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (d?.data) {
        setUser(d.data);
        if (d.data.onboardingCompleted) {
          router.push("/dashboard");
        }
      }
    })
    .catch(() => {});
  }, [router]);

  const updateOnboarding = async (currentStep: number, completed: boolean = false) => {
    const token = localStorage.getItem("accessToken");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/onboarding`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ step: currentStep, completed }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(s => s + 1);
      await updateOnboarding(step + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    
    // Process invites
    const token = localStorage.getItem("accessToken");
    const workspaceId = user?.currentWorkspaceId;
    
    if (token && workspaceId) {
      const validEmails = invites.filter(e => e.includes("@"));
      for (const email of validEmails) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workspaces/${workspaceId}/invites`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ email, role: "member" }),
          });
        } catch (err) {
          console.error("Failed to invite", email);
        }
      }
    }

    await updateOnboarding(4, true);
    
    // Force a small delay for animation
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What best describes your role?</h2>
              <p className="text-[#a1a1aa]">This helps us tailor your Linkedon experience.</p>
            </div>
            <div className="grid gap-3 pt-4">
              {["Sales / GTM", "Recruiting / HR", "Founder / Exec", "Marketing", "Other"].map(r => (
                <button
                  key={r}
                  onClick={() => { setRole(r); handleNext(); }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    role === r ? "border-violet-600 bg-violet-600/10 text-white" : "border-[#1c1c1c] hover:border-[#2a2a2a] text-[#a1a1aa] hover:text-white bg-[#040404]"
                  }`}
                >
                  <span className="font-medium">{r}</span>
                  {role === r && <Check className="w-5 h-5 text-violet-500" />}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What is your main goal?</h2>
              <p className="text-[#a1a1aa]">We'll help you get there faster.</p>
            </div>
            <div className="grid gap-3 pt-4">
              {[
                "Find personal emails for outreach",
                "Find verified phone numbers",
                "Enrich bulk CRM records",
                "Build targeted lead lists"
              ].map(g => (
                <button
                  key={g}
                  onClick={() => { setGoal(g); handleNext(); }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    goal === g ? "border-violet-600 bg-violet-600/10 text-white" : "border-[#1c1c1c] hover:border-[#2a2a2a] text-[#a1a1aa] hover:text-white bg-[#040404]"
                  }`}
                >
                  <span className="font-medium">{g}</span>
                  {goal === g && <Check className="w-5 h-5 text-violet-500" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invite your team</h2>
              <p className="text-[#a1a1aa]">Linkedon is better together. Share your {user?.workspace?.name || 'workspace'} credits.</p>
            </div>
            
            <div className="pt-4 space-y-3">
              {invites.map((email, i) => (
                <div key={i} className="relative">
                  <Send className="w-4 h-4 text-[#666] absolute left-3 top-3.5" />
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => {
                      const newInvites = [...invites];
                      newInvites[i] = e.target.value;
                      setInvites(newInvites);
                    }}
                    className="w-full bg-[#080808] border border-[#1c1c1c] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#666] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  />
                </div>
              ))}
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleNext}
                  className="flex-1 bg-white text-black font-semibold rounded-lg py-3 hover:bg-zinc-200 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 bg-transparent text-[#666] font-medium rounded-lg py-3 hover:text-white transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">You're all set!</h2>
            <p className="text-[#a1a1aa] mb-8">
              We've loaded your account with 5 free credits.<br />
              Let's find your first contact.
            </p>
            
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full bg-violet-600 text-white font-semibold rounded-lg py-3.5 hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Preparing dashboard..." : "Go to Dashboard"}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#1c1c1c]">
        <div 
          className="h-full bg-violet-600 transition-all duration-500 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Linkedon</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
