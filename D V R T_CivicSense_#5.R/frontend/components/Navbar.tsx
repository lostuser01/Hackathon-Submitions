'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      padding: scrolled ? '1rem 2rem' : '2rem',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      background: scrolled ? 'rgba(5, 8, 22, 0.8)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0, 245, 255, 0.1)' : '1px solid transparent',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #00F5FF, #8B5CF6)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1.2rem',
          color: '#fff',
          boxShadow: '0 0 15px rgba(0, 245, 255, 0.4)'
        }}>
          P
        </div>
        <span style={{
          fontWeight: 700,
          fontSize: '1.1rem',
          letterSpacing: '-0.02em',
          color: '#fff',
          fontFamily: 'Sora, sans-serif'
        }}>
          PRESTIGE<span style={{ color: '#00F5FF' }}>PROTOCOL</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div className="hidden md:flex items-center gap-1.5 mr-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">System: Nominal</span>
        </div>
        
        <div className="flex gap-3">
          <Link href="/login">
            <button className="text-[11px] font-black text-white/60 hover:text-white tracking-widest uppercase px-4 py-2 transition-colors">
              Login
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-lg px-6 py-2.5 text-[11px] font-black text-[#00F5FF] hover:bg-[#00F5FF]/20 hover:border-[#00F5FF] transition-all tracking-widest uppercase">
              Join Grid
            </button>
          </Link>
        </div>
      </div>


      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </nav>
  );
}
