import React from 'react';

const HeroSection = () => {
  return (
    <section 
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/assets/image3.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Main heading */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 text-white tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              NovaMatrixz
            </span>
          </h1>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Transform Your Customer Support 
            <span className="block text-blue-400">with AI</span>
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto mb-6 leading-relaxed">
          Instant answers, happy customers, real results.
        </p>
        
        <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-5xl mx-auto mb-8 leading-relaxed">
          With our cutting-edge technology, our AI chatbots deliver 24/7 support, reduce costs, and boost sales.
        </p>
        <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-5xl mx-auto mb-8 leading-relaxed">
          Whether it's lead generation, automated customer support, or proper leads management, our results stand out.
        </p>

    

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
            <div className="text-white font-medium">Support Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">90%</div>
            <div className="text-white font-medium">Cost Reduction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">3x</div>
            <div className="text-white font-medium">Sales Increase</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;