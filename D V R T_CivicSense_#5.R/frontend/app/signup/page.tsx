"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { apiFetch, setAuthCookie } from "@/lib/api";

import { User, Mail, Lock, Phone, MapPin, Calendar, Globe } from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "M",
    address1: "",
    contact: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const names = formData.name.split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";

      const response = await apiFetch("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: firstName,
          last_name: lastName,
          phone_number: formData.contact,
          address_line_1: formData.address1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Signup failed");
      }

      const data = await response.json();
      setAuthCookie(data.access_token);

      alert("Registration successful! Protocol updated.");
      window.location.href = "/dashboard/citizen";
    } catch (err: any) {
      setError(err.message || "UPLINK_ERROR: Failed to establish identity.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-transparent text-white font-['Sora',sans-serif] relative overflow-hidden">
      <div className="bg-scanner" />
      <Navbar />

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="auth-card-purple animate-fade-in-up">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Sign up
            </h2>
            <p className="text-white/60 text-sm font-medium">
              Create an account or{" "}
              <Link href="/login" className="text-[#8B5CF6] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 text-red-400 text-xs font-mono">
              &gt; {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col">
            <div className="auth-input-container">
              <Mail className="auth-input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input-purple"
                placeholder="Email address"
              />
            </div>

            <div className="auth-input-container">
              <User className="auth-input-icon" />
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="auth-input-purple"
                placeholder="Full Name"
              />
            </div>

            <div className="auth-input-container">
              <Phone className="auth-input-icon" />
              <input
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                className="auth-input-purple"
                placeholder="Contact Number"
              />
            </div>

            <div className="auth-input-container">
              <MapPin className="auth-input-icon" />
              <input
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                required
                className="auth-input-purple"
                placeholder="Address / Sector"
              />
            </div>

            <div className="auth-input-container">
              <Calendar className="auth-input-icon" />
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                className="auth-input-purple"
                placeholder="Age"
              />
            </div>

            <div className="auth-input-container">
              <Globe className="auth-input-icon" />
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="auth-input-purple appearance-none"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div className="auth-input-container">
              <Lock className="auth-input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input-purple"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-button-primary"
            >
              {loading ? "Creating Account..." : "Sign up"}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40 mb-3">Already a citizen?</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 hover:border-[#8B5CF6]/50 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-6 text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
            Protocol Security Active
          </p>
        </div>
      </div>
    </div>
  );
}
