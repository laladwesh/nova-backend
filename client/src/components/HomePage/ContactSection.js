import React from 'react';

const ContactSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center justify-center text-center lg:text-left">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-white">Get Started Today</h2>
            <p className="text-lg text-gray-400 mb-8">
              Ready to revolutionize your customer support? Our team is here to help you get started with AI-powered solutions that will transform your business.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start">
                <div className="bg-[#9ae20b] p-3 rounded-full mr-4">
                  <span className="text-white">📧</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Email Us</h4>
                  <a href="mailto:rudraksh@tajmanor.in" className="text-gray-400 hover:text-[#9ae20b] transition-colors">
                    rudraksh@tajmanor.in
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <div className="bg-[#9ae20b] p-3 rounded-full mr-4">
                  <span className="text-white">📞</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Call Us</h4>
                  <a href="tel:07440256485" className="text-gray-400 hover:text-[#9ae20b] transition-colors">
                    07440256485
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <div className="bg-[#9ae20b] p-3 rounded-full mr-4">
                  <span className="text-white">💬</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Live Chat</h4>
                  <p className="text-gray-400">Available 24/7</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl shadow-xl overflow-hidden flex justify-center items-center">
            <img 
              src="/assets/image1.png" 
              alt="Customer Support Team" 
              className="w-full max-w-md h-auto object-contain mx-auto rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
