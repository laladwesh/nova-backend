import React from 'react';

const ContactSection = () => {
  const googleFormUrl = "https://forms.gle/exampleFormLink123";

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-white">Get Started Today</h2>
            <p className="text-lg text-gray-400 mb-8">
              Ready to revolutionize your customer support? Our team is here to help you get started with AI-powered solutions that will transform your business.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-purple-600 p-3 rounded-full mr-4">
                  <span className="text-white">📧</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Email Us</h4>
                  <p className="text-gray-400">support@novamatrixz.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-purple-600 p-3 rounded-full mr-4">
                  <span className="text-white">📞</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Call Us</h4>
                  <p className="text-gray-400">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-purple-600 p-3 rounded-full mr-4">
                  <span className="text-white">💬</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Live Chat</h4>
                  <p className="text-gray-400">Available 24/7</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-white">Schedule Your Free Demo</h3>
            <p className="text-gray-400 mb-6">
              See our AI in action and discover how it can transform your customer support operations.
            </p>
            <a href={googleFormUrl} target="_blank" rel="noopener noreferrer">
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-pink-600 transition duration-300">
                Book Your Demo Now
              </button>
            </a>
            <p className="text-sm text-gray-500 mt-4 text-center">
              No commitment required • Free consultation • Implementation support included
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
