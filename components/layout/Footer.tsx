import React from 'react';
import toast from 'react-hot-toast';

function Footer(): React.ReactNode {
  return (
    <footer className="flex items-center justify-between h-16 px-6 bg-white text-sm text-light-grey">
      <div>
        &copy; {new Date().getFullYear()} D2C-Sync. All rights reserved.
      </div>
      <div className="flex items-center space-x-6">
        <button onClick={() => toast.success('Status Page: All Systems Operational.')} className="hover:text-primary transition-colors">Status</button>
        <button onClick={() => toast('Redirecting to documentation...')} className="hover:text-primary transition-colors">Docs</button>
        <button onClick={() => toast('Opening support chat...')} className="hover:text-primary transition-colors">Support</button>
      </div>
    </footer>
  );
}

export default Footer;