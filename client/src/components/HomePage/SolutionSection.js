import React from 'react';

const SolutionSection = () => {
  const solutions = [
    {
      title: 'Instant Response',
      description: 'AI-powered chatbots provide immediate answers 24/7',
      icon: '⚡'
    },
    {
      title: 'Smart Learning',
      description: 'Continuously improves from every interaction',
      icon: '🧠'
    },
    {
      title: 'Seamless Integration',
      description: 'Works with your existing systems and workflows',
      icon: '🔗'
    },
    {
      title: 'Multi-Channel Support',
      description: 'Consistent experience across all platforms',
      icon: '💬'
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Left Side - Content - Increased to 60% width */}
          <div className="w-full lg:w-3/5">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Our AI Solution</h2>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl">
              Revolutionary AI technology that transforms your customer support into a competitive advantage. 
              Experience the power of intelligent automation that scales with your business.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {solutions.map((solution, index) => (
                <div key={index} className="bg-[#111a24] p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl mb-4 ">{solution.icon}</div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3  text-[#a9f00f]">{solution.title}</h3>
                  <p className="text-gray-200 md:text-lg">{solution.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Side - Image - Decreased to 40% width */}
          <div className="w-full lg:w-2/5 mt-12 lg:mt-0 lg:sticky lg:top-24">
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <img 
                src="/assets/image2.png" 
                alt="AI Solution Visualization" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
