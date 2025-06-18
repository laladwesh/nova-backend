import React from 'react';
import HeroSection from '../components/HomePage/HeroSection';
import ProblemSection from '../components/HomePage/ProblemSection';
import SolutionSection from '../components/HomePage/SolutionSection';
import RoiSection from '../components/HomePage/RoiSection';
import ImplementationSection from '../components/HomePage/ImplementationSection';
import CtaSection from '../components/HomePage/CtaSection';
import UseCasesSection from '../components/HomePage/UseCasesSection';
import ContactSection from '../components/HomePage/ContactSection';

const HomePage = () => {
  return (
    <div className="min-h-screen text-white relative">
    
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <RoiSection />
        <ImplementationSection />
        <CtaSection />
        <UseCasesSection />
        <ContactSection />
   
    </div>
  );
};

export default HomePage;