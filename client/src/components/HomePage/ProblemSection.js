import React, { useState } from 'react';
import { FaClock, FaUsers, FaRandom, FaCalendarAlt } from 'react-icons/fa';

const ProblemSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  const problems = [
    {
      title: 'Slow Response Times',
      description: 'Losing potential sales due to delays?',
      icon: <FaClock className="text-4xl text-[#a9f00f] mb-4" />,
      details: 'Our AI solutions reduce response times from hours to seconds, ensuring no potential customer is left waiting.'
    },
    {
      title: 'Overwhelmed Support Teams',
      description: 'High labor costs straining your resources?',
      icon: <FaUsers className="text-4xl text-[#a9f00f] mb-4" />,
      details: 'Let our AI handle routine inquiries, freeing your team to focus on complex issues and strategic initiatives.'
    },
    {
      title: 'Inconsistent Support',
      description: 'Damaging your brand reputation with varied service?',
      icon: <FaRandom className="text-4xl text-[#a9f00f] mb-4" />,
      details: 'Ensure consistent, on-brand responses across all customer interactions with our AI-powered solution.'
    },
    {
      title: '24/7 Support Demands',
      description: 'Missing off-hour inquiries and frustrating customers?',
      icon: <FaCalendarAlt className="text-4xl text-[#a9f00f] mb-4" />,
      details: 'Provide round-the-clock support without overtime costs or night shifts, ensuring customers get help whenever they need it.'
    },
  ];

  const handleCardHover = (index) => {
    setActiveIndex(index);
  };

  return (
    <section className="py-24 px-6 bg-gray-900">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-white leading-tight">Customer Support Challenges?</h1>
        <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
          Many businesses face these challenges. Our AI-powered solutions are designed to address them head-on, providing instant, consistent, and efficient customer support.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div 
              key={index} 
              className={`bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer ${activeIndex === index ? 'border-2 border-[#a9f00f]' : ''}`}
              onMouseEnter={() => handleCardHover(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl mb-6">
                  {problem.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[#a9f00f]">{problem.title}</h3>
                <p className="text-lg text-gray-400 mb-3">{problem.description}</p>
                
                <div className={`mt-5 overflow-hidden transition-all duration-300 ${activeIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-base text-gray-300 pt-4 border-t border-gray-700 leading-relaxed">{problem.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;