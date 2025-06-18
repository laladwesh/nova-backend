import React from 'react';

const ProblemSection = () => {
  const problems = [
    {
      title: 'Slow Response Times',
      description: 'Losing potential sales due to delays?',
    },
    {
      title: 'Overwhelmed Support Teams',
      description: 'High labor costs straining your resources?',
    },
    {
      title: 'Inconsistent Support',
      description: 'Damaging your brand reputation with varied service?',
    },
    {
      title: '24/7 Support Demands',
      description: 'Missing off-hour inquiries and frustrating customers?',
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 text-white">Customer Support Challenges?</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
          Many businesses face these challenges. Our AI-powered solutions are designed to address them head-on, providing instant, consistent, and efficient customer support.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className=" p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-2xl font-semibold mb-3 text-purple-400">{problem.title}</h3>
              <p className="text-gray-300">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;