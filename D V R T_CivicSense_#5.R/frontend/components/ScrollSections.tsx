'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ScrollSections({ onSectionChange }: { onSectionChange: (s: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    // Initialize scroll-triggered animations

    const sections = containerRef.current.querySelectorAll('.section');

    sections.forEach((section, i) => {
      const elements = section.querySelectorAll('.hud-element');
      
      // Hero section visible by default
      if (i === 0) {
        gsap.set(elements, { opacity: 1, y: 0 });
      } else {
        gsap.set(elements, { opacity: 0, y: 20 });
      }

      gsap.to(elements, {
        scrollTrigger: { 
          trigger: section, 
          start: 'top 95%', 
          toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Update camera section
      ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        onEnter: () => onSectionChange(i),
        onEnterBack: () => onSectionChange(i),
      });
    });

    ScrollTrigger.refresh();


    // Refresh after a short delay to account for dynamic content
    const timer = setTimeout(() => ScrollTrigger.refresh(), 500);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [onSectionChange]);

  const sectionBg = 'rgba(5, 8, 22, 0.75)';

  return (
    <div ref={containerRef} className="scroll-container">

      {/* SECTION 0 — Hero */}
      <section className="section" style={{ minHeight: '100vh' }}>
        <div className="hero-content hud-element">
          <span className="tag tag-cyan floating-text" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            ◉ CONNECTED TO CITY_GRID.SYS
          </span>
          <h1 style={{
            fontSize: 'clamp(3rem, 10vw, 8rem)',
            fontWeight: 900,
            lineHeight: 0.9,
            marginBottom: '2rem',
            letterSpacing: '-0.05em',
            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(0,245,255,0.2))',
          }}>
            PRESTIGE<br />PROTOCOL
          </h1>
          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', alignItems: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
             {['URGENT × 12', 'AI_ENGINE: ON', 'UPTIME: 99.9%'].map(t => (
               <div key={t} style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00F5FF', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.2em' }}>
                 {t}
               </div>
             ))}
             <Link href="/signup" passHref>
               <button className="hud-button" style={{
                 background: '#00F5FF',
                 border: 'none',
                 borderRadius: '4px',
                 padding: '0.75rem 2rem',
                 color: '#050816',
                 fontWeight: 800,
                 fontSize: '0.8rem',
                 cursor: 'pointer',
                 fontFamily: 'JetBrains Mono, monospace',
                 textTransform: 'uppercase',
                 boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
               }}>
                 Get Started
               </button>
             </Link>
          </div>
        </div>
      </section>

      {/* NEW SECTION — Philosophy */}
      <section className="section" style={{ textAlign: 'left', paddingLeft: '8vw' }}>
        <div className="hud-element" style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#00F5FF', marginBottom: '2rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            // THE_MISSION
          </h2>
          <p style={{ fontSize: '2rem', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: '2rem', letterSpacing: '-0.02em' }}>
            We believe that the distance between a <span style={{ color: '#FF2D55' }}>citizen's pain</span> and a <span style={{ color: '#00FF88' }}>government's action</span> should be measured in milliseconds, not months.
          </p>
          <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1.1rem' }}>
            Prestige Protocol is an automated grievance layer built on top of existing city infrastructure. We use spatial AI to detect, route, and verify civic resolutions at scale.
          </p>
        </div>
      </section>

      {/* SECTION 1 — Citizens Report */}
      <section className="section" style={{ justifyContent: 'flex-start', paddingLeft: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          <div className="hud-line" />
          
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-red" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              📍 SPATIAL_INGRESS
            </span>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Real-time<br />Civic Pulse
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2.5rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '400px' }}>
              Incidents are captured via geo-spatial nodes. Every signal is verified, prioritized, and visualized on the city grid instantly.
            </p>
            <div className="live-feed" style={{ width: '100%', maxWidth: '300px' }}>
              <div className="feed-header">NETWORK_TRAFFIC</div>
              <div className="feed-item">UID_8922 • PRIORITY_HIGH</div>
              <div className="feed-item">UID_8921 • PRIORITY_MED</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — AI Prioritization */}
      <section className="section" style={{ justifyContent: 'flex-end', paddingRight: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-cyan" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              🤖 AI_CORE
            </span>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Neural<br />Priority
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2.5rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '450px' }}>
              Our neural engine analyzes severity clusters, historical resolution patterns, and weather-impact data to optimize field unit dispatching.
            </p>
            <div style={{ background: 'rgba(0, 245, 255, 0.05)', borderLeft: '3px solid #00F5FF', padding: '1rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#00F5FF', fontWeight: 800, marginBottom: '0.5rem' }}>LOG: PRIORITY_DISPATCH</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                &gt; Analyzing cluster ID_902...<br />
                &gt; Routing Unit_7 to North_Sector...<br />
                &gt; Estimated TTL: 45m
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { color: '#FF2D55', label: 'CRITICAL', val: '12' },
                { color: '#FF9F0A', label: 'MODERATE', val: '28' },
                { color: '#00FF88', label: 'NOMINAL', val: '45' },
              ].map(({ color, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
                  </div>
                  <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Resolution */}
      <section className="section">
        <div className="hud-container hud-element" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="tag tag-green" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
              🚀 RESOLUTION_LOOP
            </span>
            <h2 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '2rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
              Closing the<br />Feedback Loop
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem', marginTop: '4rem' }}>
              {[
                { num: '95%', label: 'ACCELERATION' },
                { num: '40%', label: 'EFFICIENCY' },
                { num: '12K', label: 'NODES_FIXED' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="stat-number" style={{ fontSize: '3.5rem', fontWeight: 900 }}>{num}</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', marginTop: '0.5rem' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION — Transparency */}
      <section className="section" style={{ justifyContent: 'flex-start', paddingLeft: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-br" />
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-cyan" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              ⚖️ TRUST_PROTOCOL
            </span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1.1 }}>
              Verification by<br />Design
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '500px' }}>
              Transparency is our core principle. Every grievance resolution is hashed and verified by independent spatial audits. No "paper-only" fixes.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ color: '#00F5FF', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.8rem' }}>CRYPTO_VERIFY</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Immutable logs of every department action, accessible by audit committees in real-time.</div>
              </div>
              <div>
                <div style={{ color: '#00F5FF', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.8rem' }}>AUDIT_BOTS</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Autonomous verification via satellite and local camera feeds to confirm repair quality.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION — Departments */}
      <section className="section" style={{ justifyContent: 'flex-end', paddingRight: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-red" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              🏢 INTER_DEPT_SYNC
            </span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1.1 }}>
              Breaking the<br />Silos
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '450px' }}>
              Prestige Protocol orchestrates responses across 14+ different city departments, ensuring that a drainage leak doesn't become a road hazard.
            </p>
            <ul style={{ color: '#64748b', fontSize: '0.9rem', listStyle: 'none', padding: 0 }}>
              {['Water & Sewerage Routing', 'Public Works Dispatch', 'Electricity Grid Monitoring', 'Sanitation Response Units'].map(item => (
                <li key={item} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#FF2D55' }}>▶</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* NEW SECTION — Security */}
      <section className="section">
        <div className="hud-element" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span className="tag tag-cyan" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            🔒 SECURITY_ENCLAVE
          </span>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1 }}>
            Enterprise-Grade Privacy
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Citizen data is encrypted at the edge. We collect location data only for spatial routing, ensuring total anonymity for whistleblowers and reporters.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>AES-256</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.1em' }}>ENCRYPTION</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>ZERO-K</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.1em' }}>KNOWLEDGE</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>SOC-2</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', letterSpacing: '0.1em' }}>COMPLIANCE</div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION — FILLER TEXT */}
      <section className="section" style={{ justifyContent: 'flex-start', paddingLeft: '8vw' }}>
        <div className="hud-element" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem' }}>Deep Dive into Civic Innovation</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.
          </p>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Nunc non blandit massa enim nec dui nunc mattis enim. Cras sed felis eget velit aliquet sagittis id consectetur purus. Quisque non tellus orci ac auctor augue mauris.
          </p>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Suspendisse potenti nullam ac tortor vitae purus faucibus. Aliquam sem et tortor consequat id porta nibh.
          </p>
        </div>
      </section>

      {/* NEW SECTION — EXTENDED CONTENT */}
      <section className="section" style={{ justifyContent: 'flex-start', paddingLeft: '8vw' }}>
        <div className="hud-element" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem' }}>Extended Narrative</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Proin sit amet semper orci. Integer euismod, lacus eget consectetur sagittis, urna mi pulvinar massa, at varius sapien ligula sit amet turpis.
          </p>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '2rem' }}>
            Suspendisse potenti. In faucibus massa arcu, vitae cursus mi hendrerit nec. Mauris non lectus a magna fermentum aliquet. Vivamus iaculis purus at enim blandit, vitae pharetra odio vulputate.
          </p>
        </div>
      </section>

      {/* NEW SECTION — Neural Mesh */}
      <section className="section" style={{ justifyContent: 'flex-end', paddingRight: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-cyan" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              🕸️ NEURAL_MESH
            </span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1.1 }}>
              Distributed<br />Cognition
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '450px' }}>
              The protocol operates as a distributed mesh network. Every city lamp, sensor, and traffic node acts as a cognitive unit, processing local data before syncing with the central core.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: '#00F5FF' }}>EDGE_COMPUTE</strong><br />
                Low-latency response at the source of the incident.
              </div>
              <div>
                <strong style={{ color: '#00F5FF' }}>SWARM_SYNC</strong><br />
                Nodes collaborate to verify event authenticity.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION — Spatial Audit */}
      <section className="section" style={{ justifyContent: 'flex-start', paddingLeft: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-cyan" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              📡 SPATIAL_AUDIT_V2
            </span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1.1 }}>
              Autonomous<br />Verification
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '500px' }}>
              Every resolution is independently audited by a decentralized network of spatial sensors. If the grid doesn't confirm the fix, the department doesn't get the credit.
            </p>
            <div className="live-feed" style={{ maxWidth: '400px' }}>
              <div className="feed-header">AUDIT_LOG_STREAM</div>
              <div className="feed-item" style={{ color: '#00FF88' }}>[SUCCESS] NODE_772_VERIFIED_BY_SAT</div>
              <div className="feed-item" style={{ color: '#00FF88' }}>[SUCCESS] GRID_REF_902_STABILITY_100%</div>
              <div className="feed-item" style={{ color: '#FF9F0A' }}>[RETRY] SENSOR_A12_SYNC_PENDING</div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION — Citizen Rewards */}
      <section className="section" style={{ justifyContent: 'flex-end', paddingRight: '8vw' }}>
        <div className="hud-container hud-element">
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div style={{ padding: '2rem' }}>
            <span className="tag tag-green" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
              🏆 PRESTIGE_TIERS
            </span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1.1 }}>
              Proof of<br />Contribution
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.1rem', maxWidth: '450px' }}>
              Active citizens earn "Prestige Points" for every verified report. These points unlock tiered rewards and priority governance voting rights.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(0, 255, 136, 0.05)', padding: '1rem', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00FF88' }}>SILVER</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TOP 10% REPORTERS</div>
              </div>
              <div style={{ background: 'rgba(255, 215, 0, 0.05)', padding: '1rem', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFD700' }}>GOLD</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>GOVERNANCE ACCESS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION — IoT Integration */}
      <section className="section" style={{ justifyContent: 'center' }}>
        <div className="hud-element" style={{ textAlign: 'center', maxWidth: '900px' }}>
          <span className="tag tag-cyan" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            🔌 INFRA_SYNC
          </span>
          <h2 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '2rem', color: '#fff', lineHeight: 1 }}>
            Hardware Meets<br />Governance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginTop: '3rem' }}>
            {[
              { icon: '💡', label: 'SMART_LAMPS', val: '4.2k' },
              { icon: '💧', label: 'FLOW_SENSORS', val: '1.8k' },
              { icon: '🚧', label: 'ROAD_NODES', val: '920' },
              { icon: '📡', label: 'RECEPTION', val: '99%' },
            ].map((item) => (
              <div key={item.label} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{item.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{item.val}</div>
                <div style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.2em' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="hud-element" style={{ maxWidth: '800px' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '3rem',
            color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            Upgrade to<br /><span style={{ color: '#00F5FF' }}>Autonomous</span> Governance
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link href="/signup" passHref>
              <button style={{
                background: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '1rem 2.5rem',
                color: '#050816',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
              }}>
                Sign Up
              </button>
            </Link>

          </div>
        </div>
      </section>

    </div>
  );
}