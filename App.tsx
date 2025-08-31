import React from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import GstAutomationHub from './pages/GstAutomationHub';

function App(): React.ReactNode {
  return (
    <div className="flex h-screen bg-white text-charcoal">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#ffffff',
          color: '#121212',
          border: '1px solid #e5e7eb',
          borderRadius: '0.25rem',
          boxShadow: 'none',
        },
      }}/>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <GstAutomationHub />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
