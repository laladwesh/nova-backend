import React from 'react';

const CtaSection = () => {
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdldpWMz0Bs_g9ZVfpiQ7klC8q8yWEOqpVz81zmBb2SxsuhWw/viewform";

  return (
    <section className="py-20 bg-[#111a23] px-4">
      <div className="container mx-auto">
        <div className="bg-[#1a2630] rounded-xl shadow-2xl border border-gray-700 p-8 md:p-12 max-w-6xl mx-auto">
          <div className="text-left">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Transform Your Customer Support Today
            </h2>
            <p className="text-xl mb-8 text-gray-200 max-w-3xl">
              Stop Losing Leads and making your customers feel frustrated Anymore
            </p>
            <p className="text-xl mb-8 text-gray-200 max-w-3xl">
              Novamatrixz offers tailored AI solutions for real estate, e-commerce, and more.
            </p>
            <p className="text-xl mb-8 text-gray-200 max-w-3xl">
              Schedule Your Free Demo & ROI Consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={googleFormUrl} target="_blank" rel="noopener noreferrer">
                <button className="bg-[#9ae20b] text-black font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 text-lg">
                  Schedule Free Demo
                </button>
              </a>
              <button className="border-2 border-white text-white font-semibold py-4 px-8 rounded-lg hover:bg-white hover:text-purple-600 transition duration-300 text-lg">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
