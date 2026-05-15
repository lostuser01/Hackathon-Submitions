"use client";
import { useState, useEffect, FormEvent } from "react";
import { apiFetch } from "@/lib/api";

const officeTypes = [
  "municipal_corp",
  "municipal_council",
  "panchayat",
  "state_dept",
  "sub_station",
];

export default function AdminOperations() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Forms State
  const [newDept, setNewDept] = useState({ code: "", name: "", description: "" });
  const [newOffice, setNewOffice] = useState({ name: "", type: "municipal_corp", district: "", lat: 15.2993, lon: 74.1240 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [deptRes, offRes] = await Promise.all([
        apiFetch("/departments/"),
        apiFetch("/offices/")
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (offRes.ok) setOffices(await offRes.json());
    } catch (err) {
      console.error("Failed to load operations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await apiFetch("/departments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });

      if (!res.ok) throw new Error((await res.json()).detail || "Failed to create department");
      
      setMessage({ type: "success", text: `Department ${newDept.code} added to the Grid.` });
      setNewDept({ code: "", name: "", description: "" });
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOffice = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await apiFetch("/offices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffice),
      });

      if (!res.ok) throw new Error((await res.json()).detail || "Failed to create office");
      
      setMessage({ type: "success", text: `Office ${newOffice.name} registered on the Grid.` });
      setNewOffice({ name: "", type: "municipal_corp", district: "", lat: 15.2993, lon: 74.1240 });
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#FF2D55] animate-pulse font-mono tracking-widest uppercase">
          Syncing Infrastructure Data...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up w-full">
      <h3 className="text-2xl font-bold mb-8 text-[#FF2D55] tracking-widest floating-text">DEPARTMENT OPERATIONS</h3>

      {message && (
        <div className={`mb-8 p-4 rounded border font-mono text-sm ${
          message.type === "success" ? "bg-green-500/10 border-green-500 text-green-400" : "bg-red-500/10 border-red-500 text-red-400"
        }`}>
          &gt; {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DEPARTMENTS SECTION */}
        <div className="space-y-6">
          <div className="bg-[#0B1026]/50 border border-white/10 rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 uppercase tracking-widest">Register Department</h4>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Code</label>
                  <input required value={newDept.code} onChange={e => setNewDept({...newDept, code: e.target.value})} placeholder="SWM" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Name</label>
                  <input required value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="Solid Waste Management" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Description</label>
                <input value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-white/5 border border-[#FF2D55]/30 hover:bg-[#FF2D55]/20 text-[#FF2D55] rounded py-3 font-bold tracking-widest uppercase transition-all disabled:opacity-50 cursor-pointer">
                Commit Department
              </button>
            </form>
          </div>

          <div className="bg-[#0B1026]/30 border border-white/5 rounded-2xl p-6 h-64 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-500 mb-4 tracking-widest uppercase">Active Departments ({departments.length})</h4>
            <div className="space-y-2">
              {departments.map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                  <span className="font-mono text-[#00F5FF] font-bold">{d.code}</span>
                  <span className="text-sm text-slate-300">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OFFICES SECTION */}
        <div className="space-y-6">
          <div className="bg-[#0B1026]/50 border border-white/10 rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 uppercase tracking-widest">Register Office Node</h4>
            <form onSubmit={handleCreateOffice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Office Name</label>
                <input required value={newOffice.name} onChange={e => setNewOffice({...newOffice, name: e.target.value})} placeholder="Panaji Main Office" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">District</label>
                  <input required value={newOffice.district} onChange={e => setNewOffice({...newOffice, district: e.target.value})} placeholder="North Goa" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Type</label>
                  <select required value={newOffice.type} onChange={e => setNewOffice({...newOffice, type: e.target.value})} className="w-full bg-[#0B1026] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono appearance-none cursor-pointer">
                    {officeTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Latitude</label>
                  <input type="number" step="any" required value={newOffice.lat} onChange={e => setNewOffice({...newOffice, lat: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Longitude</label>
                  <input type="number" step="any" required value={newOffice.lon} onChange={e => setNewOffice({...newOffice, lon: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#FF2D55]/50 font-mono" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-white/5 border border-[#FF2D55]/30 hover:bg-[#FF2D55]/20 text-[#FF2D55] rounded py-3 font-bold tracking-widest uppercase transition-all disabled:opacity-50 cursor-pointer">
                Commit Office Node
              </button>
            </form>
          </div>

          <div className="bg-[#0B1026]/30 border border-white/5 rounded-2xl p-6 h-64 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-500 mb-4 tracking-widest uppercase">Active Office Nodes ({offices.length})</h4>
            <div className="space-y-2">
              {offices.map(o => (
                <div key={o.id} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-sm text-white font-bold">{o.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{o.type.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono text-xs text-[#00F5FF] bg-[#00F5FF]/10 px-2 py-1 rounded">{o.district}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
