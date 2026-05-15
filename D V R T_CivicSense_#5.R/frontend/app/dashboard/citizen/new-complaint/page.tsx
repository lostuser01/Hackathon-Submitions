"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Send, MapPin, Loader2, AlertTriangle } from "lucide-react";

export default function NewComplaint() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lat: 15.2993, // Default to Goa coordinates
    lon: 74.1240,
  });

  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch("/profiles/me");
        if (res.ok) {
          const data = await res.json();
          setCitizenId(data.id);
        }
      } catch (err) {
        console.error("Failed to fetch user ID", err);
      }
    };
    fetchUser();
  }, []);

  const handleGetLocation = () => {
    setLocating(true);
    setLocationError(null);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          }));
          setLocating(false);
        },
        (error) => {
          setLocationError("Unable to access location. Please enter manually or check permissions.");
          setLocating(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!citizenId) throw new Error("Unable to verify identity. Please log in again.");

      const payload = {
        title: formData.title,
        description: formData.description,
        lat: formData.lat,
        lon: formData.lon,
        citizen_id: citizenId
      };

      const response = await apiFetch("/complaints/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to submit complaint.");
      }

      alert("SUCCESS: Issue transmitted to the grid. AI routing initiated.");
      router.push("/dashboard/citizen");
      
    } catch (error: any) {
      console.error(error);
      setErrorMsg(`TRANSMISSION ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up p-8 max-w-4xl mx-auto space-y-12 pb-24">
      <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
        <div className="p-4 bg-[#00F5FF]/10 rounded-2xl border border-[#00F5FF]/30">
          <Send className="text-[#00F5FF]" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">File Complaint</h1>
          <p className="text-slate-400 font-mono text-sm tracking-widest uppercase mt-1">
            Transmit anomaly data to the Grid
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-500/10 border-l-4 border-red-500 p-4 text-red-400 font-mono text-sm">
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-[#0B1026]/50 p-8 rounded-2xl border border-white/10">
        
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase">
            Incident Title
          </label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Broken Streetlight on Main St"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F5FF]/50 transition-colors"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase">
            Detailed Description
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide context for the AI routing engine..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F5FF]/50 transition-colors resize-none"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase">
              Incident Coordinates
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="flex items-center gap-2 text-xs font-bold text-[#00F5FF] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              {locating ? "ACQUIRING..." : "AUTO-LOCATE"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Latitude</label>
              <input
                required
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00F5FF]/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Longitude</label>
              <input
                required
                type="number"
                step="any"
                value={formData.lon}
                onChange={(e) => setFormData({ ...formData, lon: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00F5FF]/50"
              />
            </div>
          </div>
          {locationError && (
            <p className="text-red-400 text-xs font-mono">{locationError}</p>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading || !citizenId}
            className="w-full flex items-center justify-center gap-3 bg-[#00F5FF]/20 hover:bg-[#00F5FF] text-[#00F5FF] hover:text-black border border-[#00F5FF]/50 rounded-xl py-4 font-black tracking-widest uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {loading ? "TRANSMITTING..." : "SUBMIT TO GRID"}
          </button>
          {!citizenId && (
            <p className="text-center text-xs text-red-400 mt-3 font-mono">
              Identity verification required. Please refresh or log in again.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
