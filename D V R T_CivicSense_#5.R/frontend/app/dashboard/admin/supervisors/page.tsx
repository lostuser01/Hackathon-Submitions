"use client";
import { useState, useEffect, FormEvent } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminSupervisors() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [creatingSupervisor, setCreatingSupervisor] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newSupervisor, setNewSupervisor] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    assigned_office_id: "",
    assigned_department_id: "",
  });

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [deptRes, offRes] = await Promise.all([
          apiFetch("/departments/"),
          apiFetch("/offices/")
        ]);
        if (deptRes.ok) setDepartments(await deptRes.json());
        if (offRes.ok) setOffices(await offRes.json());
      } catch (err) {
        console.error("Error loading dropdowns:", err);
      }
    };
    loadDropdowns();
  }, []);

  const handleCreateSupervisor = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingSupervisor(true);
    setMessage(null);

    try {
      // 1. Sign them up in Supabase Auth
      const signupRes = await apiFetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newSupervisor.email,
          password: newSupervisor.password,
          first_name: newSupervisor.first_name,
          last_name: newSupervisor.last_name,
          phone_number: null,
          address_line_1: null,
        }),
      });

      if (!signupRes.ok) {
        const errData = await signupRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create supervisor auth account");
      }

      const signupData = await signupRes.json();
      const newUserId = signupData.user?.id;
      
      if (!newUserId) {
        throw new Error("No user id returned from signup");
      }

      // 2. CREATE their profile explicitly using POST
      const profileRes = await apiFetch(`/profiles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newUserId, // Link the profile to the newly created Auth ID
          first_name: newSupervisor.first_name,
          last_name: newSupervisor.last_name,
          email: newSupervisor.email,
          password: newSupervisor.password, // Passed to satisfy the Pydantic schema
          role: "supervisor",
          assigned_office_id: newSupervisor.assigned_office_id,
          assigned_department_id: newSupervisor.assigned_department_id,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create supervisor profile");
      }

      setMessage({ type: "success", text: `Supervisor ${newSupervisor.first_name} provisioned successfully.` });
      setNewSupervisor({ first_name: "", last_name: "", email: "", password: "", assigned_office_id: "", assigned_department_id: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create supervisor" });
    } finally {
      setCreatingSupervisor(false);
    }
  };

  return (
    <div className="animate-fade-in-up w-full">
      <h3 className="text-2xl font-bold mb-8 text-[#FF2D55] tracking-widest floating-text">SUPERVISOR CONTROL</h3>

      {message && (
        <div className={`mb-8 max-w-xl p-4 rounded border font-mono text-sm ${
          message.type === "success" ? "bg-green-500/10 border-green-500 text-green-400" : "bg-red-500/10 border-red-500 text-red-400"
        }`}>
          &gt; {message.text}
        </div>
      )}

      <div className="max-w-xl bg-[#0B1026]/50 border border-white/10 rounded-2xl p-8">
        <h4 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">PROVISION NEW SUPERVISOR</h4>
        
        <form onSubmit={handleCreateSupervisor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">First Name</label>
              <input type="text" required value={newSupervisor.first_name} onChange={e => setNewSupervisor({...newSupervisor, first_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Last Name</label>
              <input type="text" required value={newSupervisor.last_name} onChange={e => setNewSupervisor({...newSupervisor, last_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">System Email</label>
            <input type="email" required value={newSupervisor.email} onChange={e => setNewSupervisor({...newSupervisor, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Access Key (Password)</label>
            <input type="password" required minLength={6} value={newSupervisor.password} onChange={e => setNewSupervisor({...newSupervisor, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Office Jurisdiction</label>
            <select required value={newSupervisor.assigned_office_id} onChange={e => setNewSupervisor({...newSupervisor, assigned_office_id: e.target.value})} className="w-full bg-[#0B1026] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 font-['JetBrains_Mono',monospace] appearance-none cursor-pointer">
              <option value="">-- SELECT OFFICE --</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Department Assignment</label>
            <select required value={newSupervisor.assigned_department_id} onChange={e => setNewSupervisor({...newSupervisor, assigned_department_id: e.target.value})} className="w-full bg-[#0B1026] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 font-['JetBrains_Mono',monospace] appearance-none cursor-pointer">
              <option value="">-- SELECT DEPARTMENT --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <button type="submit" disabled={creatingSupervisor} className="w-full bg-white/5 border border-[#FF2D55]/30 hover:bg-[#FF2D55] text-white rounded px-6 py-4 font-bold tracking-widest uppercase transition-all mt-4 disabled:opacity-50 cursor-pointer">
            {creatingSupervisor ? "PROVISIONING..." : "PROVISION ACCOUNT"}
          </button>
        </form>
      </div>
    </div>
  );
}
