'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminSupervisors() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', departmentId: '' });
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch departments
    apiFetch('/departments/')
      .then(res => res.json())
      .then(data => {
        setDepartments(data);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: data[0].id }));
        }
      })
      .catch(err => console.error("Could not fetch departments", err));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const names = formData.name.split(' ');
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: names[0] || 'Manager',
          last_name: names.slice(1).join(' ') || 'User',
          email: formData.email,
          password: formData.password,
          role: 'manager',
          assigned_department_id: formData.departmentId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup failed');
      alert(`Manager ${formData.name} created successfully!`);
      setFormData({ ...formData, name: '', email: '', password: '' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <h3 className="text-2xl font-bold mb-8 text-[#FF2D55] tracking-widest floating-text">MANAGER CONTROL</h3>

      <div className="max-w-xl">
        <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">PROVISION NEW MANAGER</h4>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Designation Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0B1026]/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 focus:ring-1 focus:ring-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#0B1026]/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 focus:ring-1 focus:ring-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#0B1026]/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 focus:ring-1 focus:ring-[#FF2D55]/50 font-['JetBrains_Mono',monospace]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Department Assignment</label>
            <select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} className="w-full bg-[#0B1026]/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#FF2D55]/50 focus:ring-1 focus:ring-[#FF2D55]/50 font-['JetBrains_Mono',monospace] appearance-none">
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
              {departments.length === 0 && <option value="">Loading...</option>}
            </select>
          </div>
          <button type="submit" className="w-full bg-white/5 border border-[#FF2D55]/30 hover:border-[#FF2D55] text-white rounded px-6 py-3 font-bold tracking-widest uppercase transition-all mt-4">
            PROVISION ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
}
