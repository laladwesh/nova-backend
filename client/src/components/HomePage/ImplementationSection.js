import React from 'react';

const ImplementationSection = () => {
  const steps = [
    {
      number: '1',
      title: 'Your Need assessment by our AI experts'
    },
    {
      number: '2',
      title: 'Custom Chatbot Integration & Training'

    },
    {
      number: '3',
      title: 'Training & Optimizing of Chatbot'
     
    },
    {
      number: '4',
      title: 'Ongoing Support & Analysis'
   
    }
  ];

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-green-900 opacity-90"></div>
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-white tracking-wider" style={{ fontFamily: 'Audiowide' }}>
            Simple Implementation,<br/>Powerful Results
          </h2>
        </div>
        
        <div className="hidden md:flex flex-wrap justify-center items-start gap-4 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center w-64">
              <div className="arrow-step mb-6">
                <div className="arrow-content flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">{step.number}</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              </div>
            </div>
          ))}
               <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            We handle the technical aspects, so you can focus on your business. Novamatrixz ensures a smooth and efficient transition to AI-powered customer support.
          </p>
        </div>

        {/* Mobile view with vertical arrows */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="vertical-arrow flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{step.number}</span>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl font-semibold text-white mb-1">{step.title}</h3>

              </div>
            </div>
          ))}
               <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            We handle the technical aspects, so you can focus on your business. Novamatrixz ensures a smooth and efficient transition to AI-powered customer support.
          </p>
        </div>

        <style jsx>{`
          .arrow-step {
            width: 280px;
            height: 120px;
            margin-right: -15px;
            position: relative;
          }

          .arrow-content {
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, #2F6E24, #52A529);
            clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%);
            position: relative;
          }

          .arrow-step:first-child .arrow-content {
            clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%);
          }

          .arrow-step:last-child .arrow-content {
            clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%);
          }

          /* Mobile vertical arrow styles */
          .vertical-arrow {
            width: 80px;
            height: 100px;
            background: linear-gradient(to bottom, #2F6E24, #52A529);
            clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%);
            position: relative;
          }
        `}</style>
      </div>
    </section>
  );
};

export default ImplementationSection;

