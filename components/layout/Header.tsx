import React, { useState } from 'react';
import { BellIcon, Bars3Icon, XMarkIcon } from '../icons/Icons';

function Header(): React.ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems: string[] = ['GST Automation'];

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white relative">
       <div className="flex items-center">
         <div className="md:hidden mr-4">
           <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-charcoal" aria-expanded={isMenuOpen} aria-controls="mobile-menu">
            <span className="sr-only">Open main menu</span>
             {isMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
           </button>
         </div>
         <h1 className="text-xl font-bold text-charcoal font-display">d2c-sync</h1>
       </div>
       <div className="hidden md:block">
        {/* Can add a search bar or breadcrumbs here */}
       </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 text-light-grey rounded-full hover:text-charcoal hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-charcoal">
           <span className="sr-only">View notifications</span>
          <BellIcon />
        </button>
        <div className="relative">
          <button className="flex items-center space-x-3">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src="https://picsum.photos/100/100"
              alt="User"
            />
            <div className="hidden sm:block text-left">
                <div className="font-semibold text-charcoal">The D2C Brand</div>
                <div className="text-sm text-light-grey">Founder</div>
            </div>
          </button>
        </div>
      </div>
       {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 shadow-lg z-20">
          <nav className="flex flex-col p-4 space-y-1">
            {navItems.map(item => (
              <button 
                key={item} 
                onClick={() => { setIsMenuOpen(false); }}
                className={`text-left p-3 rounded-md text-base font-semibold text-primary bg-blue-50`}
                aria-current="page"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
