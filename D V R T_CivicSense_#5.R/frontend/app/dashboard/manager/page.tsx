"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function ManagerDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // States for updating a complaint
  const [newStatus, setNewStatus] = useState("in_progress");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Department reassignment
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDepartmentId, setNewDepartmentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await apiFetch("/complaints");
        if (response.ok) {
          const data = await response.json();
          setComplaints(data || []);
        }
      } catch (err) {
        console.error("Fetch complaints error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await apiFetch("/departments/");
        if (response.ok) {
          const data = await response.json();
          setDepartments(data || []);
        }
      } catch (err) {
        console.error("Fetch departments error:", err);
      }
    };

    fetchComplaints();
    fetchDepartments();
  }, []);

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setSaving(true);
    try {
      let response;
      if (newStatus === "resolved") {
        response = await apiFetch(`/complaints/${id}/resolve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolution_notes: resolutionNotes }),
        });
      } else {
        const payload: any = { status: newStatus };
        if (newDepartmentId) {
          payload.department_id = newDepartmentId;
        }
        response = await apiFetch(`/complaints/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        alert(`Complaint protocol updated to ${newStatus}`);
        const updated = await response.json();
        setComplaints(prev => prev.map(c => c.id === id ? updated : c));
        if (newStatus === "resolved") {
          setSelected(null);
        }
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || "Update failed"}`);
      }
    } catch (err) {
      alert("Server connection failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="text-[#FFD60A] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h3 className="text-2xl font-bold mb-8 text-[#FFD60A] tracking-widest floating-text uppercase">
        Queue & Resolution
      </h3>

      <div className="space-y-4 max-w-4xl">
        {complaints.length === 0 ? (
          <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
            &gt; QUEUE_STATUS: [ EMPTY ]
          </p>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              className={`p-6 rounded-2xl border transition-all duration-300 ${selected === c.id ? "bg-[#FFD60A]/10 border-[#FFD60A]" : "bg-[#0B1026]/50 border-white/10 hover:border-[#FFD60A]/30"}`}
            >
              <div
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => setSelected(selected === c.id ? null : c.id)}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[#FFD60A] font-bold text-xs">
                    ENTRY_{c.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h4 className="text-white font-bold tracking-tight mt-1">{c.title}</h4>
                </div>
                <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase border ${c.status === 'resolved' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                    c.status === 'pending_routing' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
                      'border-blue-500/50 text-blue-400 bg-blue-500/10'
                  }`}>
                  {c.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.description}</p>

              {selected === c.id && (
                <form
                  onSubmit={(e) => handleUpdate(e, c.id)}
                  className="mt-6 pt-6 border-t border-white/10 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">
                        Update Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full bg-[#0B1026] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#FFD60A]/50 font-mono text-sm appearance-none"
                      >
                        <option value="routed">ROUTED (READY)</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="delayed">DELAYED</option>
                        <option value="resolved">RESOLVED (CLOSE TICKET)</option>
                        <option value="rejected">REJECTED</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">
                        Reassign Department
                      </label>
                      <select
                        value={newDepartmentId || ""}
                        onChange={(e) => setNewDepartmentId(e.target.value)}
                        className="w-full bg-[#0B1026] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#FFD60A]/50 font-mono text-sm appearance-none"
                      >
                        <option value="">-- No Change --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {newStatus === "resolved" && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">
                          Resolution Report
                        </label>
                        <textarea
                          required
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="SUMMARY OF ACTION TAKEN..."
                          className="w-full bg-[#0B1026] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#FFD60A]/50 font-mono text-sm min-h-[100px]"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-white text-black hover:bg-[#FFD60A] hover:text-black rounded-xl py-4 font-black tracking-[0.3em] uppercase transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        TRANSMITTING...
                      </>
                    ) : (
                      "COMMIT PROTOCOL UPDATE"
                    )}
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

