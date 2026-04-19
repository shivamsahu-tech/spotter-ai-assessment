'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import results1 from '../assets/results1.png';
import results2 from '../assets/results2.png';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ResultsSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.result-card',
        { y: 60, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.results-grid',
            start: 'top 80%',
          },
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.4,
          ease: 'power4.out'
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-16 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Its <span className="text-teal-600">Results</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Experience the precision of Spotter AI through real-world trip logs and HOS calculations.
          </p>
        </div>

        <div className="results-grid grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Result 1: Trip Results */}
          <div className="result-card group">
            <div className="relative rounded-[32px] overflow-hidden border border-slate-200 bg-white shadow-2xl transition-all duration-500 hover:shadow-teal-500/10 hover:border-teal-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trip Metadata Result</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img 
                  src={results1} 
                  alt="Trip Results Screenshot" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

          {/* Result 2: HOS Logs */}
          <div className="result-card group">
            <div className="relative rounded-[32px] overflow-hidden border border-slate-200 bg-white shadow-2xl transition-all duration-500 hover:shadow-teal-500/10 hover:border-teal-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">HOS Logs Result</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img 
                  src={results2} 
                  alt="HOS Logs Screenshot" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
