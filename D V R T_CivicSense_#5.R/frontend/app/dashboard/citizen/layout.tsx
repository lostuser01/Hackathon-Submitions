"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { name: "DASHBOARD", path: "/dashboard/citizen" },
    { name: "PROFILE", path: "/dashboard/citizen/profile" },
    { name: "MY COMPLAINTS", path: "/dashboard/citizen/complaints" },
    { name: "NEW COMPLAINT", path: "/dashboard/citizen/new-complaint" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-['Sora',sans-serif] relative overflow-hidden">
      <div className="bg-scanner" />
      <Navbar />

      <div className="relative z-10 flex flex-col md:flex-row items-start justify-center min-h-[calc(100vh-80px)] p-6 md:p-10 lg:p-12 gap-10 max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <div className="auth-card-purple w-full md:w-72 p-6 shrink-0 h-fit sticky top-24">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#8B5CF6] tracking-widest uppercase">
              Citizen Node
            </h2>
            <p className="text-[10px] text-white/40 font-mono">
              STATUS: [ VERIFIED ]
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-5 py-4 rounded-xl text-xs font-bold tracking-widest transition-all duration-300 border flex items-center gap-3 ${
                    active
                      ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                      : "bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#8B5CF6] animate-pulse" : "bg-transparent"}`}
                  />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/5">
            <Link
              href="/login"
              className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              [ TERMINATE_SESSION ]
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-card flex-1 w-full p-10 md:p-12 lg:p-14 min-h-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
}
