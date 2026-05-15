"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        router.push("/dashboard/citizen");
      } else {
        console.error("Auth callback error:", error.message);
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white font-mono">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00F5FF] mx-auto mb-4"></div>
        <p className="text-[#00F5FF] tracking-widest text-xs uppercase animate-pulse">
          Exchanging Security Tokens...
        </p>
      </div>
    </div>
  );
}
