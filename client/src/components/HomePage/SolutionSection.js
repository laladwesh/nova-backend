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
    <section className="py-16  px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 text-white">Our AI Solution</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
          Revolutionary AI technology that transforms your customer support into a competitive advantage. 
          Experience the power of intelligent automation that scales with your business.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="bg-gradient-to-br from-purple-600 to-pink-500 p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-4">{solution.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-white">{solution.title}</h3>
              <p className="text-gray-200">{solution.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
