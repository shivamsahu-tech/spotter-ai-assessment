import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ResultsSection from '../components/ResultsSection';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedBackground />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ResultsSection />
    </div>
  );
}
