import React from 'react';

const UseCasesSection = () => {
  const useCases = [
    {
      industry: 'E-commerce',
      description: 'Enhance online shopping experiences with instant product support and personalized recommendations.'
    },
    {
      industry: 'Real Estate',
      description: 'Provide virtual tours, answer property inquiries, and qualify leads 24/7.'
    },
    {
      industry: 'Healthcare',
      description: 'Streamline appointment scheduling, answer common questions, and provide support.'
    }
  ];

  return (
    <section className="py-16 bg-[#9ae20b] px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-16 text-center text-black">Real-World AI Applications</h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="text-center">
              <h3 className="text-2xl font-semibold mb-4 text-black">{useCase.industry}</h3>
              <p className="text-lg text-black">{useCase.description}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-center mt-12 text-black">
          We are not just limited to these, Our AI Chatbots are transforming the higher education, Service Agencies as well!
        </p>
      </div>
    </section>
  );
};

export default UseCasesSection;
