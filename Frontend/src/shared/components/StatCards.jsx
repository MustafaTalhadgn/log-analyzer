import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  // Renk sınıfları (Tailwind Config'e uygun)
  const colors = {
    blue: "text-cyber-blue bg-cyber-blue/10 border-cyber-blue/20",
    red: "text-cyber-red bg-cyber-red/10 border-cyber-red/20",
    green: "text-cyber-green bg-cyber-green/10 border-cyber-green/20",
    yellow: "text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/20",
  };

  const activeColor = colors[color] || colors.blue;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-lg hover:border-dark-600 transition-all group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg border ${activeColor} transition-colors`}>
          <Icon size={24} />
        </div>
      </div>
      
      {/* Opsiyonel: Trend Göstergesi (İleride backend verirse kullanırız) */}
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium">
          {trend > 0 ? (
            <span className="text-green-500 flex items-center"><ArrowUpRight size={12}/> %{trend}</span>
          ) : (
            <span className="text-red-500 flex items-center"><ArrowDownRight size={12}/> %{Math.abs(trend)}</span>
          )}
          <span className="text-slate-500 ml-1">geçen haftaya göre</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;