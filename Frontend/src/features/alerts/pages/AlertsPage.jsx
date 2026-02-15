import React, { useEffect, useState } from 'react';
import { ShieldAlert, Clock, Search, Filter } from 'lucide-react';
import { alertService } from '../api/alertService';
import StatusBadge from '../../../shared/components/StatusBadge';
import Loading from '../../../shared/components/Loading';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Alarmlar çekilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Her 10 saniyede bir yenile
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Basit bir filtreleme mantığı
  const filteredAlerts = alerts.filter(alert => 
    alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.source_ip?.includes(searchTerm) ||
    alert.rule_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Başlık ve Filtreleme */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-cyber-red" />
            Tehdit Bildirimleri
          </h2>
          <p className="text-slate-400">Sistem tarafından yakalanan tüm güvenlik alarmları.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyber-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="IP, Mesaj veya Kural ara..." 
              className="w-full bg-dark-800 border border-dark-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-cyber-blue transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-300 p-2 rounded-lg transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-dark-900 text-xs uppercase font-medium text-slate-300">
            <tr>
              <th className="px-6 py-4">Zaman</th>
              <th className="px-6 py-4">Kritiklik</th>
              <th className="px-6 py-4">Kural Adı</th>
              <th className="px-6 py-4">Mesaj</th>
              <th className="px-6 py-4">Kaynak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {loading ? (
              <tr><td colSpan="5"><Loading /></td></tr>
            ) : filteredAlerts.length === 0 ? (
               <tr>
                 <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                   Kayıt bulunamadı.
                 </td>
               </tr>
            ) : filteredAlerts.map((alert) => (
              <tr key={alert.ID || Math.random()} className="hover:bg-dark-700/50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-2 text-slate-400 whitespace-nowrap">
                  <Clock size={14} />
                  {new Date(alert.created_at).toLocaleString('tr-TR')}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={alert.severity} />
                </td>
                <td className="px-6 py-4 font-medium text-white">
                  {alert.rule_name || "Bilinmeyen"}
                </td>
                <td className="px-6 py-4 text-slate-300 max-w-md truncate" title={alert.message}>
                  {alert.message}
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                   <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600 text-cyber-blue">
                     {alert.source_ip}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsPage;