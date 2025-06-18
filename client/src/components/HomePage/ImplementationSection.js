import React from 'react';

const ImplementationSection = () => {
  const steps = [
    {
      number: '1',
      title: 'Consultation',
      description: 'We analyze your current support process and identify optimization opportunities'
    },
    {
      number: '2',
      title: 'Customization',
      description: 'AI is trained on your specific data and configured to match your brand voice'
    },
    {
      number: '3',
      title: 'Integration',
      description: 'Seamless deployment across your existing platforms and workflows'
    },
    {
      number: '4',
      title: 'Optimization',
      description: 'Continuous monitoring and refinement for peak performance'
    }
  ];

  return (
    <section className="py-16  px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">Simple Implementation Process</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From consultation to deployment, we handle everything. Get your AI support system running in just weeks, not months.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImplementationSection;
