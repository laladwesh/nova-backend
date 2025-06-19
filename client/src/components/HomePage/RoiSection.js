import React from 'react';

const RoiSection = () => {
  return (
    <section className="py-16 bg-[#82b912] px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12 text-black">Real ROI: Proven Results</h2>
        
        <div className="max-w-4xl mx-auto space-y-10">
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-black">40% Reduction in Support Costs</h3>
            <p className="text-black text-lg">
              Our AI solutions dramatically cut operational expenses by automating routine customer inquiries, allowing your team to focus on high-value tasks.
            </p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-black">61% Increase in Customer Satisfaction</h3>
            <p className="text-black text-lg">
              Clients report significant improvements in customer experience metrics after implementing our AI-powered support solutions.
            </p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-black">40% Faster Response Times</h3>
            <p className="text-black text-lg">
              Transform customer wait times from minutes to seconds with intelligent automation that provides instant, accurate responses around the clock.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoiSection;

