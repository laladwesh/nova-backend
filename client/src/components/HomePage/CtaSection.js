import React from 'react';

const CtaSection = () => {
  const googleFormUrl = "https://forms.gle/exampleFormLink123";

  return (
    <section className="py-20 bg-[#111a23] px-4 ">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-white">
          Ready to Transform Your Customer Support?
        </h2>
        <p className="text-xl mb-8 text-gray-200 max-w-3xl mx-auto">
          Join hundreds of businesses already using our AI solutions to deliver exceptional customer experiences. 
          Schedule your free demo today and see the difference AI can make.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href={googleFormUrl} target="_blank" rel="noopener noreferrer">
            <button className="bg-white text-purple-600 font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 text-lg">
              Schedule Free Demo
            </button>
          </a>
          <button className="border-2 border-white text-white font-semibold py-4 px-8 rounded-lg hover:bg-white hover:text-purple-600 transition duration-300 text-lg">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
