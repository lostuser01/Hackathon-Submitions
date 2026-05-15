"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ complaints: 0, supervisors: 0, accuracy: "98.2%" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [complaintsRes, profilesRes] = await Promise.all([
          apiFetch("/complaints/"),
          apiFetch("/profiles/")
        ]);

        let complaintsCount = 0;
        let supervisorsCount = 0;

        if (complaintsRes.ok) {
          const complaints = await complaintsRes.json();
          complaintsCount = complaints.length;
        }

        if (profilesRes.ok) {
          const profiles = await profilesRes.json();
          // Filter to count only supervisors
          supervisorsCount = profiles.filter((p: any) => p.role === "supervisor").length;
        }

        setStats({ complaints: complaintsCount, supervisors: supervisorsCount, accuracy: "98.2%" });
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in-up">
      <h3 className="text-2xl font-bold mb-8 text-[#FF2D55] tracking-widest floating-text">
        SYSTEM OVERVIEW
      </h3>
      
      {loading ? (
        <div className="text-[#FF2D55] animate-pulse font-mono tracking-widest uppercase">Syncing with Grid...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-white/10 rounded-lg bg-[#0B1026]/50">
            <div className="text-sm font-['JetBrains_Mono',monospace] text-slate-400 mb-2">
              TOTAL COMPLAINTS
            </div>
            <div className="text-4xl font-bold text-white">{stats.complaints}</div>
          </div>
          <div className="p-6 border border-white/10 rounded-lg bg-[#0B1026]/50">
            <div className="text-sm font-['JetBrains_Mono',monospace] text-slate-400 mb-2">
              ACTIVE SUPERVISORS
            </div>
            <div className="text-4xl font-bold text-[#FF2D55]">{stats.supervisors}</div>
          </div>
          <div className="p-6 border border-white/10 rounded-lg bg-[#0B1026]/50">
            <div className="text-sm font-['JetBrains_Mono',monospace] text-slate-400 mb-2">
              AI ROUTING ACCURACY
            </div>
            <div className="text-4xl font-bold text-[#00F5FF]">{stats.accuracy}</div>
          </div>
        </div>
      )}
    </div>
  );
}
