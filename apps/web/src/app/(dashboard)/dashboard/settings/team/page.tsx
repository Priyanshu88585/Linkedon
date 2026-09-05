"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Trash2, Plus, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => {
  const token = localStorage.getItem("accessToken");
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
};

export default function TeamSettingsPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  // Fetch current user
  const { data: userData } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, fetcher);
  const user = userData?.data;
  const workspaceId = user?.currentWorkspaceId;

  // Fetch members
  const { data: membersData, mutate: mutateMembers } = useSWR(
    workspaceId ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/workspaces/${workspaceId}/members` : null,
    fetcher
  );

  const users = membersData?.data?.users || [];
  const members = membersData?.data?.members || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !workspaceId) return;

    setInviting(true);
    setInviteMessage(null);

    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      
      if (data.success) {
        setInviteMessage({ type: "success", text: data.data.message });
        setInviteEmail("");
        mutateMembers(); // Refresh list
      } else {
        setInviteMessage({ type: "error", text: data.error?.message || "Failed to invite user" });
      }
    } catch (err) {
      setInviteMessage({ type: "error", text: "Network error occurred" });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    const token = localStorage.getItem("accessToken");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workspaces/${workspaceId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      mutateMembers();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="p-6 text-[#666]">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Team Settings</h1>
        <p className="text-[#a1a1aa]">Manage your workspace members and pending invitations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Member List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-[#1c1c1c] flex items-center justify-between bg-white/5">
              <div className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#a1a1aa]" />
                Active Members ({users.length})
              </div>
            </div>
            
            <div className="divide-y divide-[#1c1c1c]">
              {users.map((u: any) => {
                const memberData = members.find((m: any) => m.userId === u._id);
                const role = memberData?.role || u.role;
                const isOwner = role === "owner";
                
                return (
                  <div key={u._id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {u.name}
                          {u._id === user._id && <span className="badge badge-accent">You</span>}
                        </div>
                        <div className="text-sm text-[#666]">{u.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-[#a1a1aa] capitalize flex items-center gap-1.5">
                        {isOwner ? <ShieldAlert className="w-3.5 h-3.5 text-violet-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                        {role}
                      </div>
                      
                      {!isOwner && u._id !== user._id && (
                        <button 
                          onClick={() => handleRemove(u._id)}
                          className="p-2 text-[#666] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* We would render pending invites here if we had a dedicated invites collection, 
              but for this MVP we just add users directly if they exist or mock it. */}
        </div>

        {/* Right Col: Invite Form */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" />
              Invite new member
            </h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-[#080808] border border-[#1c1c1c] rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#080808] border border-[#1c1c1c] rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none appearance-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteMessage && (
                <div className={`p-3 rounded-lg text-sm ${inviteMessage.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {inviteMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-white text-black font-medium py-2 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
                {!inviting && <Plus className="w-4 h-4" />}
              </button>
            </form>
          </div>
          
          <div className="p-4 rounded-xl border border-violet-600/20 bg-violet-600/5">
            <h4 className="font-semibold text-violet-400 text-sm mb-1">Shared Billing</h4>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              All members in your workspace share the same credit balance and subscription plan. 
              Only admins and owners can view billing details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
