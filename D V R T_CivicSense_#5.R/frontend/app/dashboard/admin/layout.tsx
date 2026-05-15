"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { name: "SYSTEM OVERVIEW", path: "/dashboard/admin" },
    { name: "MANAGE COMPLAINTS", path: "/dashboard/admin/complaints" },
    { name: "DEPARTMENT OPS", path: "/dashboard/admin/operations" },
    { name: "MANAGER CONTROL", path: "/dashboard/admin/managers" },
    { name: "SUPERVISOR CONTROL", path: "/dashboard/admin/supervisors" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-['Sora',sans-serif] relative overflow-hidden">
      <div className="bg-scanner" />
      <Navbar />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] p-6 gap-6 max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="glass-card w-64 h-fit sticky top-24">
          <div
            className="hud-corner hud-corner-tl"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-corner hud-corner-tr"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-corner hud-corner-bl"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-corner hud-corner-br"
            style={{ borderColor: "#FF2D55" }}
          />

          <h2 className="text-xl font-bold mb-6 text-[#FF2D55] tracking-widest text-center">
            ADMIN OVERSEER
          </h2>

          <nav className="flex flex-col gap-4">
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`p-3 rounded-lg text-sm font-['JetBrains_Mono',monospace] tracking-wider transition-all duration-300 border ${active ? "bg-[#FF2D55]/10 border-[#FF2D55]/50 text-[#FF2D55]" : "bg-transparent border-transparent text-slate-400 hover:border-white/10 hover:text-white"}`}
                >
                  {active && <span className="mr-2">►</span>}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card relative min-h-[500px]">
          <div
            className="hud-corner hud-corner-tl"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-corner hud-corner-tr"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-corner hud-corner-bl"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-corner hud-corner-br"
            style={{ borderColor: "#FF2D55" }}
          />
          <div
            className="hud-line"
            style={{
              background: "linear-gradient(90deg, #FF2D55, transparent)",
            }}
          />

          {children}
        </div>
      </div>
    </div>
  );
}
