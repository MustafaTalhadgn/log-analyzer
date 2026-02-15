import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-dark-900 text-slate-300 overflow-hidden font-sans selection:bg-cyber-blue selection:text-white">
      {/* Sabit Sidebar */}
      <Sidebar />

      {/* Değişen İçerik Alanı */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
           <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default MainLayout;