import React from 'react';

const RoiSection = () => {
  const metrics = [
    {
      value: '85%',
      label: 'Reduction in Support Costs',
      description: 'Save thousands on labor expenses'
    },
    {
      value: '300%',
      label: 'Increase in Response Speed',
      description: 'From hours to seconds'
    },
    {
      value: '95%',
      label: 'Customer Satisfaction Rate',
      description: 'Consistently happy customers'
    },
    {
      value: '24/7',
      label: 'Availability',
      description: 'Never miss an opportunity'
    }
  ];

  return (
    <section className="py-16 bg-[#9ae20b] px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 text-white">Proven Results</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
          Don't just take our word for it. See the measurable impact our AI solutions deliver to businesses like yours.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-700 p-8 rounded-lg shadow-xl">
              <div className="text-5xl font-bold text-purple-400 mb-2">{metric.value}</div>
              <h3 className="text-xl font-semibold mb-2 text-white">{metric.label}</h3>
              <p className="text-gray-300">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoiSection;
