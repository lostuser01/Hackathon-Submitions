"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Loader2, ClipboardList, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function Complaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

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
    fetchComplaints();
  }, []);


  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="text-[#00F5FF] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-4">
      <div className="flex items-center gap-4 mb-8">
        <ClipboardList className="text-[#00F5FF]" size={32} />
        <h3 className="text-2xl font-bold text-white tracking-widest uppercase">My Complaints</h3>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">
            &gt; NO_DATA_FOUND: Your transmission history is empty.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${selected === c.id
                  ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]'
                  : 'bg-white/5 border-white/10 hover:border-[#00F5FF]/50'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#00F5FF] font-bold text-xs">#{c.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-black tracking-widest uppercase flex items-center gap-1 ${c.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        c.status === 'pending_routing' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                      {c.status === 'resolved' ? <CheckCircle2 size={12} /> :
                        c.status === 'pending_routing' ? <Clock size={12} /> : <AlertCircle size={12} />}
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h4 className="text-white font-bold">{c.title}</h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{c.description}</p>
              {c.image_url && (
                <div className="mt-4">
                  <span className="text-[#00F5FF] block mb-1 text-[10px] font-mono">ATTACHED EVIDENCE:</span>
                  <img src={c.image_url} alt="Complaint Evidence" className="w-full h-auto max-w-[200px] rounded-md border border-white/10" />
                </div>
              )}

              {selected === c.id && (
                <div className="mt-6 pt-6 border-t border-white/10 font-mono text-[10px] text-slate-500 grid grid-cols-2 gap-6">
                  <div><span className="text-[#00F5FF] block mb-1">PRIORITY:</span> {c.priority ? c.priority.toUpperCase() : 'MEDIUM'}</div>
                  <div><span className="text-[#00F5FF] block mb-1">ROUTING:</span> {c.department_id ? 'MANUAL_OR_AI_ASSIGNED' : 'PENDING_AI_VECTOR'}</div>
                  <div className="col-span-2 bg-[#00F5FF]/5 p-3 rounded-lg">
                    <span className="text-[#00F5FF] block mb-2">PROTOCOL_STATUS:</span>
                    {c.department_id ? `Assigned to department node [${c.department_id}]. Processing state [ ${c.status.toUpperCase()} ].` : `Awaiting AI routing determination. state [ ${c.status.toUpperCase()} ].`}
                    {c.resolution_notes && (
                      <div className="mt-4 pt-4 border-t border-[#00F5FF]/10 text-slate-300 gap-2 flex flex-col">
                        <span className="text-green-400">RESOLUTION_REPORT:</span>
                        {c.resolution_notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
