'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: 'QUEUE & RESOLUTION', path: '/dashboard/manager' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-['Sora',sans-serif] relative overflow-hidden">
      <div className="bg-scanner" />
      <Navbar />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] p-6 gap-6 max-w-7xl mx-auto">

        {/* Sidebar */}
        <div className="glass-card w-64 h-fit sticky top-24">
          <div className="hud-corner hud-corner-tl" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-corner hud-corner-tr" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-corner hud-corner-bl" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-corner hud-corner-br" style={{ borderColor: '#FFD60A' }} />

          <h2 className="text-xl font-bold mb-6 text-[#FFD60A] tracking-widest text-center">MANAGER TERMINAL</h2>

          <nav className="flex flex-col gap-4">
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link key={link.path} href={link.path} className={`p-3 rounded-lg text-sm font-['JetBrains_Mono',monospace] tracking-wider transition-all duration-300 border ${active ? 'bg-[#FFD60A]/10 border-[#FFD60A]/50 text-[#FFD60A]' : 'bg-transparent border-transparent text-slate-400 hover:border-white/10 hover:text-white'}`}>
                  {active && <span className="mr-2">►</span>}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card relative min-h-[500px]">
          <div className="hud-corner hud-corner-tl" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-corner hud-corner-tr" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-corner hud-corner-bl" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-corner hud-corner-br" style={{ borderColor: '#FFD60A' }} />
          <div className="hud-line" style={{ background: 'linear-gradient(90deg, #FFD60A, transparent)' }} />

          {children}
        </div>
      </div>
    </div>
  );
}
