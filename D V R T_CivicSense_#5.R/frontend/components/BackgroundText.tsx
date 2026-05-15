'use client';

export function BackgroundText() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04] select-none">
      <div className="absolute top-0 left-0 w-full h-full flex flex-wrap gap-20 p-20 content-start animate-[pulse_10s_ease-in-out_infinite]">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="text-[10vw] font-black tracking-tighter leading-none uppercase">
            Prestige Protocol
          </div>
        ))}
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 text-[45vw] font-black opacity-10 whitespace-nowrap animate-[pulse_15s_ease-in-out_infinite]">
        OVERSEER
      </div>

      <div className="absolute bottom-10 right-10 flex flex-col items-end font-mono text-xs opacity-40">
        <div className="animate-pulse">PROTOCOL_VERSION: 2.5.1</div>
        <div className="animate-pulse delay-75">ENCRYPTION: RSA-4096_GCM</div>
        <div className="animate-pulse delay-150">STATUS: ACTIVE_NODE_ESTABLISHED</div>
        <div className="mt-2 text-[8px]">© 2026 PRESTIGE_IND_SYSTEMS</div>
      </div>
    </div>
  );
}

