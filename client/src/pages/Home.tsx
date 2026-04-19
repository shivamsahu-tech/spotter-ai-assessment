import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedBackground />
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}
