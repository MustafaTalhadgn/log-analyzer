import React from 'react';
import { LayoutDashboard, Terminal, Settings, Activity, FileSearch } from 'lucide-react';
import { NavLink } from 'react-router-dom'; // Link verme özelliği ekledik
import logoIcon from '../../public/images/icon.png';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-dark-900 border-r border-dark-700 flex flex-col text-slate-300 flex-shrink-0 transition-all duration-300">
      {/* Logo Alanı */}
      <div className="p-6 flex items-center gap-3 border-b border-dark-700">
        <img
          src={logoIcon}
          alt="Log Analyzer"
          className="w-8 h-8"
        />
        <h1 className="text-xl font-bold text-white tracking-wider">LOG ANALYZER</h1>
      </div>
      
      {/* Menü */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavItem to="/" icon={<LayoutDashboard size={20} />} text="Genel Bakış" />
        <NavItem to="/alerts" icon={<Activity size={20} />} text="Tehdit Akışı" />
        <NavItem to="/rules" icon={<Terminal size={20} />} text="Kurallar" />
        <NavItem to="/offline" icon={<FileSearch size={20} />} text="Offline Analiz" />
        {/* <NavItem to="/logs" icon={<FileText size={20} />} text="Canlı Loglar" /> İleride açarız */}

      </nav>


    </div>
  );
};

// NavItem Bileşeni (NavLink kullanarak aktif sınıfı otomatik almasını sağladık)
const NavItem = ({ icon, text, to }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
        isActive 
          ? 'bg-cyber-blue/10 text-cyber-blue border-l-4 border-cyber-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
          : 'hover:bg-dark-800 hover:text-white hover:translate-x-1'
      }`
    }
  >
    <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
    <span className="font-medium inline-flex items-center gap-2">{text}</span>
  </NavLink>
);

export default Sidebar;