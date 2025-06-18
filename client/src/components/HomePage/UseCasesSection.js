import React from 'react';

const UseCasesSection = () => {
  const useCases = [
    {
      industry: 'E-commerce',
      title: 'Order Support & Product Inquiries',
      description: 'Handle order status, returns, and product questions instantly',
      benefits: ['Reduce cart abandonment', 'Increase sales conversion', '24/7 shopping support']
    },
    {
      industry: 'SaaS',
      title: 'Technical Support & Onboarding',
      description: 'Guide users through setup and troubleshoot common issues',
      benefits: ['Reduce support tickets', 'Improve user onboarding', 'Faster issue resolution']
    },
    {
      industry: 'Healthcare',
      title: 'Appointment Scheduling & FAQ',
      description: 'Manage appointments and answer common medical questions',
      benefits: ['Streamline scheduling', 'Reduce phone calls', 'Improve patient experience']
    }
  ];

  return (
    <section className="py-16 bg-[#9ae20b] px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">Industry Use Cases</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            See how businesses across different industries are leveraging our AI solutions to transform their customer support.
          </p>
        </div>
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-gray-700 p-8 rounded-lg shadow-xl">
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm inline-block mb-4">
                {useCase.industry}
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white">{useCase.title}</h3>
              <p className="text-gray-300 mb-6">{useCase.description}</p>
              <ul className="space-y-2">
                {useCase.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-purple-400 flex items-center">
                    <span className="mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
