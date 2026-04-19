import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { Fuel, Package, Navigation, Truck, ChevronRight, PlayCircle } from 'lucide-react';

export default function HeroSection() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {

      // 1. Headline stagger
      gsap.from('.ht', {
        y: 28, opacity: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out', delay: 0.05,
      });

      // 2. Card pop-in
      gsap.from('.hc', {
        y: 36, opacity: 0, scale: 0.97, duration: 1.0, ease: 'power3.out', delay: 0.25,
      });

      // 3. Draw the route path
      const path = document.querySelector('.hr-path');
      if (path) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, { strokeDashoffset: 0, duration: 2.8, ease: 'power1.inOut', delay: 0.7 });
      }

      // 4. Glow dot traveling along path
      const glow = document.querySelector('.hr-glow');
      if (glow) {
        const len = glow.getTotalLength();
        gsap.set(glow, { strokeDasharray: `50 ${len}`, strokeDashoffset: len });
        gsap.to(glow, { strokeDashoffset: 0, duration: 2.8, ease: 'power1.inOut', delay: 0.7 });
      }

      // 5. Nodes pop-in timed to path progress
      const nodeDelays = [0.7, 1.45, 1.95, 2.6];
      document.querySelectorAll('.hn').forEach((n, i) => {
        gsap.from(n, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2.2)', delay: nodeDelays[i] });
      });

      // 6. Radar rings
      gsap.to('.hr-radar', {
        scale: 2.6, opacity: 0, duration: 1.9, repeat: -1, ease: 'power2.out',
        stagger: { each: 0.55, repeat: -1 },
      });

      // 7. Gentle card float
      gsap.to('.hc', {
        y: '-=10', duration: 3.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.3,
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // SVG route path — viewBox 800×560
  // Start: 140,430   Fuel: 340,310   Pickup: 500,190   Dropoff: 660,90
  const D = 'M 140 430 C 200 420 280 330 340 310 S 440 210 500 190 S 600 100 660 90';

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full font-sans text-slate-900 flex flex-col overflow-hidden relative"
    >

      <header className="relative z-30 flex-shrink-0">
        <nav className="w-full max-w-7xl mx-auto px-6 md:px-12 py-7 flex items-center justify-between">
          {/* Logo */}
          <div className="ht flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-sm">
              <Truck className="w-6 h-6 text-teal-600" />
            </div>
            <span className="font-extrabold tracking-tighter text-[1.25rem] text-slate-900 leading-none">
              SPOTTER <span className="font-light text-teal-600 uppercase tracking-widest text-[0.8rem] ml-0.5">AI</span>
            </span>
          </div>

          {/* Single CTA */}
          <div className="ht">
            <a
              href="https://github.com/shivamsahu-tech/spotter-ai-assessment"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-slate-900 text-white px-5 py-2.5 rounded-full text-[0.85rem] font-bold hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200 active:scale-95 transition-all group"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span>github</span>
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        </nav>
      </header>

      {/* ── HERO BODY ────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-10 xl:gap-16 pb-10 lg:pb-0">

        {/* ── LEFT ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col gap-10 lg:gap-14">

          {/* Live badge */}
          <div className="ht flex items-center gap-2 w-fit bg-white/70 backdrop-blur-sm border border-teal-100 px-5 py-2 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
            </span>
            <span className="text-[12px] font-bold text-teal-700 tracking-[0.16em] uppercase">Automated Route logs</span>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-6">
            <h1 className="ht font-extrabold text-slate-900 leading-[1.05] tracking-tight text-[3.6rem] lg:text-[4.2rem] xl:text-[4.8rem]">
              Trucking<br />
              Automation<br />
              <span className="text-slate-500 font-medium text-[2.2rem] lg:text-[2.6rem] xl:text-[2.8rem] tracking-normal leading-snug block mt-5">
                That works for you.
              </span>
            </h1>

            {/* Description */}
            <div className="ht space-y-4 max-w-[460px] mt-4">
              <p className="text-[1.1rem] lg:text-[1.2rem] text-slate-500 leading-relaxed font-medium">
                Generate your trip logs automatically with whole trip automation.
              </p>
              <p className="text-[1.1rem] lg:text-[1.2rem] text-slate-500 leading-relaxed font-medium">
                Just put your locations.
              </p>
            </div>
          </div>

          {/* CTA row */}
          <div className="ht flex flex-wrap items-center gap-8 mt-6">
            <button
              onClick={() => navigate('/trip')}
              className="group flex items-center gap-4 bg-slate-900 text-white pl-10 pr-3 py-3 rounded-full text-[1rem] font-bold hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 transition-all active:scale-95 ease-out duration-300"
            >
              Get Started
              <span className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center group-hover:bg-teal-400 transition-colors flex-shrink-0 shadow-sm">
                <ChevronRight className="w-6 h-6 text-white" />
              </span>
            </button>
            <a
              href="https://drive.google.com/file/d/1kens_EKfJ0HlV8tKVS_pBF4fv9n5zS0F/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-teal-500 text-white px-8 py-3 rounded-full text-[1rem] font-bold hover:bg-teal-600 hover:shadow-2xl hover:shadow-teal-300 transition-all active:scale-95 ease-out duration-300"
            >
              Watch Video <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </a>
          </div>

        </div>

        {/* ── RIGHT: Map Card ─────────────────────────────────────── */}
        <div className="w-full lg:w-[54%] xl:w-[58%] flex justify-center lg:justify-end">
          <div
            className="hc w-full max-w-[660px] aspect-[4/3] rounded-[2rem] p-[10px]"
            style={{
              background: 'rgba(255,255,255,0.55)',
              boxShadow: '0 28px 80px -16px rgba(15,23,42,0.13), 0 0 0 1px rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Inner map */}
            <div
              className="w-full h-full rounded-[1.5rem] overflow-hidden relative"
              style={{ background: 'linear-gradient(155deg,#e6f5f3 0%,#edf9f6 45%,#e8f3fb 100%)' }}
            >
              {/* SVG map + route */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice">

                {/* City blocks */}
                <g fill="#ffffff" stroke="#d8eae7" strokeWidth="1.5" opacity="0.95">
                  <rect x="-20" y="-20" width="255" height="180" rx="12" />
                  <rect x="265" y="-20" width="195" height="115" rx="12" />
                  <rect x="490" y="-20" width="175" height="105" rx="12" />
                  <rect x="690" y="-20" width="160" height="130" rx="12" />
                  <rect x="-20" y="190" width="170" height="195" rx="12" />
                  <rect x="180" y="205" width="195" height="148" rx="12" />
                  <rect x="415" y="135" width="165" height="170" rx="12" />
                  <rect x="615" y="125" width="215" height="210" rx="12" />
                  <rect x="-20" y="415" width="240" height="185" rx="12" />
                  <rect x="255" y="395" width="295" height="175" rx="12" />
                  <rect x="590" y="385" width="240" height="185" rx="12" />
                </g>

                {/*Parks*/}
                <g fill="#a7f3d0" opacity="0.40">
                  <rect x="25" y="25" width="75" height="55" rx="8" />
                  <rect x="425" y="148" width="90" height="55" rx="8" />
                  <rect x="660" y="285" width="75" height="75" rx="8" />
                </g>

                {/* Main roads */}
                <g stroke="#e0ebe9" strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="-10" y1="170" x2="820" y2="170" />
                  <line x1="-10" y1="385" x2="820" y2="385" />
                  <line x1="240" y1="-10" x2="240" y2="575" />
                  <line x1="475" y1="-10" x2="475" y2="575" />
                  <line x1="660" y1="-10" x2="660" y2="575" />
                </g>

                {/* Road center dashes */}
                <g stroke="#c4d8d5" strokeWidth="1.5" fill="none" strokeDasharray="14 10">
                  <line x1="-10" y1="170" x2="820" y2="170" />
                  <line x1="-10" y1="385" x2="820" y2="385" />
                  <line x1="240" y1="-10" x2="240" y2="575" />
                  <line x1="475" y1="-10" x2="475" y2="575" />
                  <line x1="660" y1="-10" x2="660" y2="575" />
                </g>

                {/* Route: wide white road shadow */}
                <path d={D} fill="none" stroke="#ffffff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
                {/* Route: teal ghost */}
                <path d={D} fill="none" stroke="#0d9488" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />
                {/* Route: animated draw */}
                <path className="hr-path" d={D} fill="none" stroke="#14b8a6" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 7px rgba(20,184,166,0.6))' }} />
                {/* Route: soft glow trail */}
                <path className="hr-glow" d={D} fill="none" stroke="rgba(20,184,166,0.5)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: 'blur(7px)' }} />
              </svg>

              {/* ── HTML Nodes (% tied to SVG 800×560 viewBox) ──
                  Start   140/800=17.5%  430/560=76.8%
                  Fuel    340/800=42.5%  310/560=55.4%
                  Pickup  500/800=62.5%  190/560=33.9%
                  Dropoff 660/800=82.5%  90/560=16.1%
              ─────────────────────────────────────────────────── */}
              <div className="absolute inset-0 z-20 pointer-events-none">

                {/* Start */}
                <div className="hn absolute" style={{ left: '17.5%', top: '76.8%' }}>
                  <div className="-translate-x-1/2 -translate-y-1/2 relative flex flex-col items-center">
                    <div className="hr-radar absolute w-14 h-14 bg-teal-400 rounded-full opacity-25" />
                    <div className="hr-radar absolute w-14 h-14 bg-teal-400 rounded-full opacity-20" style={{ animationDelay: '0.7s' }} />
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-xl border-[3px] border-white z-10">
                      <Truck className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>
                </div>

                {/* Fuel */}
                <div className="hn absolute" style={{ left: '42.5%', top: '55.4%' }}>
                  <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg border border-amber-100"
                      style={{ boxShadow: '0 4px 18px rgba(251,191,36,0.22)' }}>
                      <Fuel className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="bg-white text-[9.5px] font-bold text-slate-600 px-2.5 py-1 rounded-lg shadow border border-slate-100 uppercase tracking-wider whitespace-nowrap">Fuel Stop</span>
                  </div>
                </div>

                {/* Pickup */}
                <div className="hn absolute" style={{ left: '62.5%', top: '33.9%' }}>
                  <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg border border-emerald-100"
                      style={{ boxShadow: '0 4px 18px rgba(16,185,129,0.18)' }}>
                      <Package className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="bg-white text-[9.5px] font-bold text-slate-600 px-2.5 py-1 rounded-lg shadow border border-slate-100 uppercase tracking-wider whitespace-nowrap">Pickup Stop</span>
                  </div>
                </div>

                {/* Drop-off */}
                <div className="hn absolute" style={{ left: '82.5%', top: '16.1%' }}>
                  <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="hr-radar absolute w-16 h-16 bg-teal-400 rounded-full opacity-25 -top-1" />
                    <div className="hr-radar absolute w-16 h-16 bg-teal-400 rounded-full opacity-20 -top-1" style={{ animationDelay: '0.9s' }} />
                    <div className="w-14 h-14 bg-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/35 border-[3px] border-white z-10">
                      <Navigation className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-white text-[9.5px] font-extrabold text-slate-700 px-3 py-1 rounded-lg shadow-md border border-slate-100 uppercase tracking-widest whitespace-nowrap z-10">Drop-off Stop</span>
                  </div>
                </div>

                {/* Route Summary */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-3.5 rounded-xl shadow-md border border-white/90">
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2">Route Summary</p>
                  <div className="flex items-center gap-4">
                    {[
                      { v: '247 mi', l: 'Distance' },
                      { v: '4h 12m', l: 'Est. Time' },
                      { v: '$82', l: 'Fuel Cost', c: 'text-teal-600' },
                    ].map((s, i) => (
                      <React.Fragment key={s.l}>
                        {i > 0 && <div className="w-px h-6 bg-slate-200" />}
                        <div>
                          <p className={`text-sm font-bold ${s.c ?? 'text-slate-900'}`}>{s.v}</p>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wide font-semibold">{s.l}</p>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

              </div>{/* end overlay */}
            </div>{/* end inner */}
          </div>{/* end hc */}
        </div>

      </main>
    </div>
  );
}