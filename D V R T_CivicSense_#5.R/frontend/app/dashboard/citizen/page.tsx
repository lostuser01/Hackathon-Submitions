"use client";
import React, { useEffect, useState } from "react";
import { User, ClipboardList, ShieldAlert, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function CitizenDashboard() {
  const [userName, setUserName] = useState<string>("Citizen");
  const [complaintCount, setComplaintCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileRes, complaintsRes] = await Promise.all([
          apiFetch("/profiles/me"),
          apiFetch("/complaints")
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserName(profile.first_name || "Citizen");
        }

        if (complaintsRes.ok) {
          const complaints = await complaintsRes.json();
          setComplaintCount(complaints.length);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);


  const stats = [
    {
      label: "Active Complaints",
      value: complaintCount.toString().padStart(2, "0"),
      icon: ClipboardList,
      color: "text-[#00F5FF]",
    },
    {
      label: "Safety Status",
      value: "SECURE",
      icon: ShieldAlert,
      color: "text-green-400",
    },
    {
      label: "Credit Level",
      value: "ALPHA",
      icon: Zap,
      color: "text-purple-400",
    },
  ];

  const actions = [
    {
      title: "File New Complaint",
      desc: "Report a local issue to the Grid",
      href: "/dashboard/citizen/new-complaint",
      icon: ClipboardList,
    },
    {
      title: "View My Profile",
      desc: "Manage your decentralized identity",
      href: "/dashboard/citizen/profile",
      icon: User,
    },
    {
      title: "Complaint History",
      desc: "Track your reported coordinates",
      href: "/dashboard/citizen/complaints",
      icon: ShieldAlert,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#00F5FF]" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-12">
        <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-2">
          Citizen Terminal
        </h3>
        <p className="text-sm text-slate-400 font-mono">
          Welcome back, <span className="text-[#00F5FF]">{userName}</span>. Current node status: <span className="text-green-400">OPTIMIZED</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-8 flex flex-col items-center text-center group hover:border-[#00F5FF]/50 transition-all">
            <stat.icon className={`${stat.color} mb-4 group-hover:scale-110 transition-transform`} size={32} />
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">{stat.label}</p>
            <p className="text-4xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="group">
            <div className="glass-card p-8 h-full flex flex-col border border-white/5 hover:border-[#00F5FF]/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00F5FF] scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
              <action.icon className="text-[#00F5FF] mb-6 group-hover:rotate-12 transition-transform" size={24} />
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#00F5FF] transition-colors">{action.title}</h4>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
