'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, FileBarChart2, Map } from 'lucide-react';

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FeaturesSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Animate the section header
      gsap.fromTo('.feature-header',
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
        }
      );

      // Stagger animate the feature cards
      gsap.fromTo('.feature-card',
        { y: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.feature-grid',
            start: 'top 75%',
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'back.out(1.2)',
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-teal-500" />,
      title: "FMCSA-Compliant Routing Engine",
      description: "A deterministic state machine that automatically calculates 11-hour driving limits, 14-consecutive-hour duty windows, and 70-hour cycle restarts without manual input."
    },
    {
      icon: <FileBarChart2 className="w-8 h-8 text-teal-500" />,
      title: "Automated ELD Daily Logs",
      description: "Instantly transforms complex, multi-day trip timelines into rigid 24-hour midnight-to-midnight grids, ready for Electronic Logging Device (ELD) graph rendering."
    },
    {
      icon: <Map className="w-8 h-8 text-teal-500" />,
      title: "High-Fidelity Geographic Interpolation",
      description: "Utilizes the Haversine formula to pinpoint exact longitude and latitude coordinates for every sleeper berth, mandatory break, and fuel stop along the HGV route."
    }
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
    >

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Section Header */}
        <div className="feature-header mb-16 max-w-3xl">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Engineered for <span className="text-teal-600/90 font-semibold">Compliance.</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            Stop manually calculating hours of service. Our API handles the relentless math of long-haul logistics so you can focus on the road.
          </p>
        </div>

        {/* Feature Grid - Rigid mobile-first layout */}
        <div className="feature-grid grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group relative bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:bg-white hover:shadow-xl hover:border-teal-100 transition-all duration-300 ease-out hover:-translate-y-1"
            >
              {/* Icon Container with subtle pulse on hover */}
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-teal-200 transition-transform duration-300">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-700 mb-3">
                {feature.title}
              </h3>

              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                {feature.description}
              </p>

              {/* Decorative bottom line that expands on hover */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-teal-500 rounded-t-md scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
