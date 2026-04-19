'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Network, BrainCircuit, FileSearch, FileDown } from 'lucide-react';
import hosLogicImg from '../assets/hos-logic.png';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HowItWorksSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Animate steps
      gsap.fromTo('.step-item',
        { x: -50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.steps-container',
            start: 'top 80%',
          },
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.3,
          ease: 'power3.out',
        }
      );

      // Animate the logic diagram
      gsap.fromTo('.logic-diagram',
        { y: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.logic-diagram',
            start: 'top 85%',
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const logicSteps = [
    {
      title: "State Initialization",
      details: ["Duty Left: 14h", "Driving Left: 11h", "Cycle Left: 70h", "Time Since Break: 0h"],
      desc: "Every trip starts with a clean slate, initializing the 14-hour duty window and 11-hour driving clock."
    },
    {
      title: "Active Monitoring",
      details: ["Distance < 0.001 (Stop)", "Time Since Break > 8h", "Fuel Distance > 999mi"],
      desc: "Our engine continuously checks if a break, sleep, or fueling event is required before moving another mile."
    },
    {
      title: "Clock Resets",
      details: ["Cycle Left < 0.001", "Duty Left < 0.01", "Resting 10+ Hours"],
      desc: "When limits are reached, the algorithm induces a 'Sleeper Berth' reset, replenishing your driving and duty clocks."
    },
    {
      title: "Log Finalization",
      details: ["Calculate Coordinates", "Generate Remarks", "Midnight Grid Mapping"],
      desc: "Once the trip is complete, the state transitions are mapped into a valid midnight-to-midnight DOT logbook."
    }
  ];

  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-20 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
             How it <span className="text-teal-600">Works</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            The intelligence behind Spotter AI: A deterministic state machine that ensures compliance at every turn.
          </p>
        </div>

        <div className="steps-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {logicSteps.map((step, idx) => (
            <div key={idx} className="step-item p-8 rounded-3xl bg-white/70 backdrop-blur-sm border border-slate-100 transition-all hover:border-teal-100 hover:shadow-2xl hover:shadow-teal-500/10 group">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">0{idx + 1}</span>
                <h3 className="text-lg font-bold text-slate-700 leading-tight">{step.title}</h3>
              </div>
              
              <div className="space-y-2 mb-6">
                {step.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500/40" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">{detail}</span>
                  </div>
                ))}
              </div>

              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Logic Diagram Section */}
        <div className="logic-diagram bg-white/40 p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="mb-10 max-w-xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Logic in Action</h3>
            <p className="text-slate-500 font-medium">
              The flowchart below illustrates the exact decision-making process our HOS engine executes for every coordinate entry.
            </p>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-inner p-4 md:p-8 group/logic cursor-pointer">
            <a 
              href="https://app.eraser.io/workspace/kMgBXLrXUBqjK9BObOde?origin=share" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative overflow-hidden rounded-xl"
            >
              <img 
                src={hosLogicImg} 
                alt="HOS Logic Flowchart" 
                className="w-full h-auto object-contain transition-transform duration-500 group-hover/logic:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-teal-600/0 group-hover/logic:bg-teal-600/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover/logic:opacity-100">
                <span className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full text-teal-600 font-bold shadow-xl transform translate-y-4 group-hover/logic:translate-y-0 transition-transform duration-300">
                  View Source & Details
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
