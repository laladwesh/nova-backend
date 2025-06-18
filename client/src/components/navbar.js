import React, { useState } from 'react';

const Navbar = () => {
  // Google Form URL - replace with your actual Google Form URL
  const googleFormUrl = "https://forms.gle/exampleFormLink123";
  
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleNavigation = (e) => {
    e.preventDefault();
    window.open(googleFormUrl, '_blank');
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="bg-[#111a24] shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          
                <div className="flex-shrink-0 flex items-center">
                <img src="/logo192.png" alt="Logo" className="h-10 w-10 lg:h-12 lg:w-12" />
                </div>
            
                <div className="hidden lg:flex items-center flex-1 justify-center px-8">
                <h1 
                  onClick={handleNavigation} 
                  className="text-lg font-bold text-white hover:text-white cursor-pointer transition-all duration-200 text-center leading-tight relative after:absolute after:bottom-[-6px] after:left-0 after:h-1 after:w-0 hover:after:w-full after:bg-yellow-400 after:transition-all after:duration-300 after:rounded-full"
                >
                  Transform the way you handle your Customers with Novamatrixz
                </h1>
                </div>

                {/* Desktop CTA Button */}
          <div className="hidden lg:block">
            <a href={googleFormUrl} target="_blank" rel="noopener noreferrer">
              <button className="bg-[#a9f00f] text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
                Book An Appointment With Us
              </button>
            </a>
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${menuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${menuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 py-6 space-y-6 bg-gray-50 border-t border-gray-200">
          <h2 
            onClick={handleNavigation}
            className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors duration-200 leading-tight"
          >
            Transform the way you handle your Customers with Novamatrixz
          </h2>
          <a href={googleFormUrl} target="_blank" rel="noopener noreferrer" className="block">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm">
              Book Appointment
            </button>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;