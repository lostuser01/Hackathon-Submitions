"use client";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { apiFetch, getAuthToken } from "@/lib/api";

export default function Profile() {
  const [profile, setProfile] = useState({
    id: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    pincode: "",
    date_of_birth: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await apiFetch("http://localhost:8000/profiles/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to fetch profile");
      }

      const data = await res.json();
      setProfile({
        id: data.id || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone_number: data.phone_number || "",
        address_line_1: data.address_line_1 || "",
        address_line_2: data.address_line_2 || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        date_of_birth: data.date_of_birth || "",
      });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: `ERROR: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await apiFetch(
        `http://localhost:8000/profiles/${profile.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone_number: profile.phone_number,
            address_line_1: profile.address_line_1,
            address_line_2: profile.address_line_2,
            city: profile.city,
            state: profile.state,
            pincode: profile.pincode,
            date_of_birth: profile.date_of_birth || null,
          }),
        },
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update profile");
      }

      setMessage({
        type: "success",
        text: "IDENTITY_SYNC_COMPLETE: Profile updated successfully.",
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: `SYNC_FAILED: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="text-[#00F5FF] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-full p-4">
      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="flex items-center gap-4 mb-10 justify-center">
          <ShieldCheck className="text-[#00F5FF]" size={32} />
          <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase">
            Identity / Profile
          </h3>
        </div>

        {message && (
          <div
            className={`mb-8 p-4 rounded-xl border-l-4 font-mono text-xs ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500 text-green-400"
                : "bg-red-500/10 border-red-500 text-red-400"
            }`}
          >
            &gt; {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* First Name */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                First Designation
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="First Name"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.first_name || "---"}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                Last Designation
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="Last Name"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.last_name || "---"}
                </p>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                Grid Coordinate (Address Line 1)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address_line_1"
                  value={profile.address_line_1}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="Address Line 1"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.address_line_1 || "---"}
                </p>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                Secondary Coordinate (Address Line 2)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address_line_2"
                  value={profile.address_line_2}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="Address Line 2"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.address_line_2 || "---"}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                Sector (City)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="City"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.city || "---"}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                Region (State)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="State"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.state || "---"}
                </p>
              )}
            </div>

            {/* Contact */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-2 ml-1">
                Comms Frequency (Contact)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleChange}
                  className="auth-input-purple"
                  placeholder="Contact"
                />
              ) : (
                <p className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  {profile.phone_number || "---"}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={saving}
                  className="auth-button-primary flex-1"
                >
                  {saving ? (
                    <Loader2 className="animate-spin mx-auto" size={18} />
                  ) : (
                    "SAVE CHANGES"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-4 rounded-xl border border-white/10 text-white/60 font-bold hover:text-white transition-all"
                >
                  CANCEL
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="auth-button-primary w-full"
              >
                EDIT IDENTITY
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
