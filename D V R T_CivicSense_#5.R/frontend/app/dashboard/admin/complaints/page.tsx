"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AdminComplaints() {
  const [selected, setSelected] = useState<string | null>(null);
  const [assignedSup, setAssignedSup] = useState("");
  const [routing, setRouting] = useState(false);
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pending" | "all">("pending");

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [compRes, profRes, deptRes] = await Promise.all([
        apiFetch("/complaints/"),
        apiFetch("/profiles/"),
        apiFetch("/departments/")
      ]);

      if (!compRes.ok) {
        const err = await compRes.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to load complaints: ${compRes.status}`);
      }
      
      setComplaints(await compRes.json());

      if (profRes.ok) {
        const profData = await profRes.json();
        setSupervisors(profData.filter((p: any) => p.role === "supervisor"));
      }
      
      if (deptRes.ok) {
        setDepartments(await deptRes.json());
      }
    } catch (err: any) {
      console.error("Data load error:", err);
      setErrorMsg(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoute = async (id: string) => {
    if (!assignedSup) return alert("Select a supervisor first.");
    
    setRouting(true);
    try {
      const res = await apiFetch(`/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assigned_worker_id: assignedSup, 
          status: "routed" 
        })
      });

      if (res.ok) {
        alert(`Complaint successfully routed to supervisor.`);
        setSelected(null);
        setAssignedSup("");
        loadData(); // Refresh the list
      } else {
        const error = await res.json();
        alert(error.detail || "Routing failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRouting(false);
    }
  };

  const getDepartmentName = (id: string) => {
    if (!id) return "Unassigned / Pending AI";
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : "Unknown Department";
  };

  const displayedComplaints = viewMode === "pending" 
    ? complaints.filter(c => c.status === "pending_routing" || c.status === "re_routed" || !c.status)
    : complaints;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center w-full">
        <Loader2 className="text-[#FF2D55] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up w-full">
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-[#FF2D55] tracking-widest floating-text">
          MANAGE COMPLAINTS
        </h3>
        
        {/* Toggle View Mode */}
        <div className="flex bg-[#0B1026] border border-white/10 rounded-lg p-1 mt-4 md:mt-0 shadow-lg">
          <button 
            type="button"
            onClick={() => setViewMode("pending")}
            className={`px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-md transition-all cursor-pointer ${
              viewMode === "pending" 
                ? "bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/30" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Needs Routing
          </button>
          <button 
            type="button"
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-md transition-all cursor-pointer ${
              viewMode === "all" 
                ? "bg-white/20 text-white" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All Complaints
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="relative z-20 mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 font-mono text-sm">
          &gt; ERROR: {errorMsg}
        </div>
      )}

      <div className="relative z-20 space-y-4 max-w-4xl">
        {displayedComplaints.map(c => (
          <div
            key={c.id}
            onClick={() => setSelected(selected === c.id ? null : c.id)}
            className={`p-5 rounded-lg border cursor-pointer transition-all duration-300 ${
              selected === c.id ? "bg-[#FF2D55]/10 border-[#FF2D55]" : "bg-[#0B1026]/50 border-white/10 hover:border-[#FF2D55]/50"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-['JetBrains_Mono',monospace] text-[#FF2D55] font-bold uppercase">
                ENTRY_{c.id.slice(0, 8)}
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-500 border border-slate-700 px-2 py-1 rounded">
                {(c.status || "Unknown").replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm text-slate-300 font-bold">{c.title}</p>
            <p className="text-sm text-slate-400 mt-1">{c.description}</p>
            
            <div className="mt-3 text-xs font-['JetBrains_Mono',monospace] text-slate-500">
              AI Suggested Routing: <span className="text-white/80">{getDepartmentName(c.department_id)}</span>
            </div>

            {selected === c.id && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4">
                <select 
                  value={assignedSup}
                  onChange={(e) => setAssignedSup(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0B1026] border border-white/10 rounded px-3 py-2 text-sm text-white font-['JetBrains_Mono',monospace] outline-none flex-1 cursor-pointer"
                >
                  <option value="">Select Supervisor to Assign...</option>
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={routing}
                  onClick={(e) => { e.stopPropagation(); handleRoute(c.id); }}
                  className="bg-[#FF2D55]/20 hover:bg-[#FF2D55] hover:text-white text-[#FF2D55] border border-[#FF2D55]/50 px-4 py-2 rounded text-sm font-bold tracking-widest transition-colors cursor-pointer disabled:opacity-50"
                >
                  {routing ? 'ROUTING...' : 'CONFIRM ROUTING'}
                </button>
              </div>
            )}
          </div>
        ))}

        {displayedComplaints.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-slate-500 font-mono tracking-widest uppercase">
              {viewMode === "pending" ? "No pending complaints require routing." : "Zero complaints found in the database."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
