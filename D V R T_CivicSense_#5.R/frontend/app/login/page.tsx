"use client";
import React, { useState } from "react";
import Link from "next/link";
import { apiFetch, setAuthCookie } from "@/lib/api";

import { User, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      setAuthCookie(data.access_token);

      const role = data.user?.role || "citizen";
      if (role === "admin") {
        window.location.href = "/dashboard/admin";
      } else if (role === "manager") {
        window.location.href = "/dashboard/manager";
      } else if (role === "supervisor") {
        window.location.href = "/dashboard/supervisor";
      } else {
        window.location.href = "/dashboard/citizen";
      }
    } catch (err: any) {
      setError(err.message || "ACCESS_DENIED: Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-transparent text-white font-['Sora',sans-serif] relative overflow-hidden">
      <div className="bg-scanner" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="auth-card-purple animate-fade-in-up">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Sign in
            </h2>
            <p className="text-white/60 text-sm font-medium">
              Welcome back or{" "}
              <Link href="/signup" className="text-[#8B5CF6] hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 text-red-400 text-xs font-mono">
              &gt; {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col">
            <div className="auth-input-container">
              <User className="auth-input-icon" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input-purple"
                placeholder="Email address"
              />
            </div>

            <div className="auth-input-container">
              <Lock className="auth-input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input-purple"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-button-primary"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40 mb-3">New User?</p>
            <Link
              href="/signup"
              className="inline-block w-full py-3 px-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 hover:border-[#8B5CF6]/50 transition-all duration-300"
            >
              Initialize Identity
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
