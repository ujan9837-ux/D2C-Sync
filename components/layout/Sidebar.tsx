import React from 'react';
import { ScaleIcon, LogoIcon } from '../icons/Icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-base rounded-md transition-colors duration-200 ${
      active
        ? 'text-primary font-semibold'
        : 'text-light-grey hover:text-primary'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

function Sidebar(): React.ReactNode {
  const navItems: { label: string, icon: React.ReactNode }[] = [
    { label: 'GST Automation', icon: <ScaleIcon /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white text-charcoal border-r border-gray-200">
      <div className="flex items-center justify-center h-20">
        <LogoIcon className="w-8 h-8 text-primary" />
        <h1 className="ml-3 text-2xl font-bold tracking-wider font-display">d2c-sync</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <NavItem 
            key={item.label}
            icon={item.icon} 
            label={item.label} 
            active={true}
            onClick={() => {}}
          />
        ))}
      </nav>
      <div className="px-4 py-6">
        {/* Can add user profile or settings link here */}
      </div>
    </aside>
  );
}

export default Sidebar;
