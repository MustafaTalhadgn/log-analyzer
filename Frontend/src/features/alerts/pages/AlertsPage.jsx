import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Clock, Search, Filter, X, List, Calendar, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { alertService } from '../api/alertService';
import StatusBadge from '../../../shared/components/StatusBadge';
import Loading from '../../../shared/components/Loading';
import AlertReviewButton from '../../../shared/components/AlertReviewButton';
import { useWebSocket } from '../../../shared/hooks/useWebSocket';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtreleri temizleme fonksiyonu
  const clearFilters = () => {
    setSearchTerm('');
    setSeverityFilter('');
    setTimeFilter('');
    setTypeFilter('');
    setSearchParams({});
  };

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

  const handleWsMessage = useCallback((payload) => {
    const data = payload?.type === 'alert' ? payload.data : payload;
    if (!data || (!data.alert_id && !data.AlertId && !data.rule_id)) {
      return;
    }
    setAlerts((prev) => [data, ...prev].slice(0, 200));
  }, []);

  useWebSocket(null, { onMessage: handleWsMessage });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const severityParam = searchParams.get('severity');
    const paramSeverityFilter = severityParam ? severityParam.toUpperCase() : '';
    const effectiveSeverityFilter = (severityFilter || paramSeverityFilter).toUpperCase();
    const last24hParam = searchParams.get('last24h');
    const last24h = last24hParam === '1' || last24hParam === 'true';
    const effectiveTimeFilter = timeFilter || (last24h ? '24h' : '');
    const sourceParam = (searchParams.get('source') || '').trim().toLowerCase();
    const normalizedTypeFilter = typeFilter.trim().toLowerCase();
    const now = Date.now();
    const timeWindowMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return alerts.filter((alert) => {
      const messageMatch = alert.message?.toLowerCase().includes(normalizedSearch);
      const sourceMatch = alert.source_ip?.includes(normalizedSearch);
      const ruleMatch = alert.rule_name?.toLowerCase().includes(normalizedSearch);
      const matchesSearch = !normalizedSearch || messageMatch || sourceMatch || ruleMatch;
      const matchesSourceParam = !sourceParam || alert.source_ip?.toLowerCase().includes(sourceParam);
      const logType = (alert.log_type || alert.LogType || '').toLowerCase();
      const matchesType = !normalizedTypeFilter || logType === normalizedTypeFilter;

      if (!matchesSearch) return false;
      if (!matchesSourceParam) return false;
      if (!matchesType) return false;
      if (effectiveSeverityFilter && alert.severity?.toUpperCase() !== effectiveSeverityFilter) return false;

      if (effectiveTimeFilter) {
        const createdAt = alert.created_at || alert.CreatedAt;
        if (!createdAt) return false;
        const createdTime = new Date(createdAt).getTime();
        if (Number.isNaN(createdTime)) return false;
        const windowMs = timeWindowMs[effectiveTimeFilter];
        if (windowMs && now - createdTime > windowMs) return false;
      }

      return true;
    });
  }, [alerts, searchParams, searchTerm, severityFilter, timeFilter, typeFilter]);

  const hasActiveFilters = searchTerm || severityFilter || timeFilter || typeFilter;

  // DROPDOWN STYLE: Native select optionlarinda className yerine inline style daha tutarli
  const optionStyle = { backgroundColor: '#0f172a', color: '#e2e8f0' };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-2 border-b border-dark-700/50">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <ShieldAlert className="text-cyber-red" size={24} />
            </div>
            Tehdit Bildirimleri
          </h2>
          <p className="text-slate-400 mt-1 text-sm ml-1">
            Sistem tarafından yakalanan güvenlik ihlalleri ve anomali kayıtları.
          </p>
        </div>
        <div className="text-slate-500 text-xs font-mono">
           Toplam Kayıt: <span className="text-white font-bold">{filteredAlerts.length}</span> / {alerts.length}
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 flex flex-col xl:flex-row gap-4 justify-between items-center shadow-lg backdrop-blur-sm">
        
        {/* Sol Taraf: Arama */}
        <div className="relative w-full xl:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyber-blue transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="IP adresi, Mesaj veya Kural ID ara..." 
            className="w-full bg-dark-900 border border-dark-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sağ Taraf: Dropdownlar ve Reset */}
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3">
          
          {/* Kritiklik Filtresi */}
          <div className="relative w-full sm:w-40 ">
            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none " size={16} />
            <select
              className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-cyber-blue appearance-none cursor-pointer hover:border-dark-500 transition-colors"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              {/* Option Classları: bg-dark-900 ile arka planı koyu yaptık */}
              <option value="" style={optionStyle}>Tüm Seviyeler</option>
              <option value="CRITICAL" style={optionStyle}>Critical</option>
              <option value="HIGH" style={optionStyle}>High</option>
              <option value="WARNING" style={optionStyle}>Warning</option> 
              <option value="MEDIUM" style={optionStyle}>Medium</option>
              <option value="LOW" style={optionStyle}>Low</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
          </div>

          {/* Zaman Filtresi */}
          <div className="relative w-full sm:w-40">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            <select
              className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-cyber-blue appearance-none cursor-pointer hover:border-dark-500 transition-colors"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="" style={optionStyle}>Tüm Zamanlar</option>
              <option value="24h" style={optionStyle}>Son 24 Saat</option>
              <option value="7d" style={optionStyle}>Son 1 Hafta</option>
              <option value="30d" style={optionStyle}>Son 1 Ay</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
          </div>

          {/* Log Tipi Filtresi */}
          <div className="relative w-full sm:w-40">
            <List className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            <select
              className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-cyber-blue appearance-none cursor-pointer hover:border-dark-500 transition-colors"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="" style={optionStyle}>Tüm Tipler</option>
              <option value="auth" style={optionStyle}>Auth</option>
              <option value="syslog" style={optionStyle}>Syslog</option>
              <option value="nginx" style={optionStyle}>Nginx</option>
              <option value="ufw" style={optionStyle}>UFW</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
          </div>

          {/* Temizle Butonu */}
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors flex items-center justify-center"
              title="Filtreleri Temizle"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* TABLO ALANI */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-[#0f172a] text-xs uppercase font-semibold text-slate-300 border-b border-dark-600 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-40">Zaman</th>
                <th className="px-6 py-4 w-32">Kritiklik</th>
                <th className="px-6 py-4 w-64">Kural Adı</th>
                <th className="px-6 py-4">Mesaj</th>
                <th className="px-6 py-4 w-48">Kaynak</th>
                <th className="px-6 py-4 w-24 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 bg-dark-800/50">
              {loading ? (
                <tr><td colSpan="6" className="py-12"><Loading /></td></tr>
              ) : filteredAlerts.length === 0 ? (
                 <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                     <Filter size={32} className="opacity-20" />
                     <span>Aradığınız kriterlere uygun kayıt bulunamadı.</span>
                     <button onClick={clearFilters} className="text-cyber-blue text-xs hover:underline mt-1">
                       Filtreleri Temizle
                     </button>
                   </td>
                 </tr>
              ) : filteredAlerts.map((alert) => {
                const createdAt = alert.created_at || alert.CreatedAt;
                return (
                <tr key={alert.ID || Math.random()} className="hover:bg-dark-700/70 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-300">
                       <Clock size={14} className="text-slate-500" />
                       <span className="font-mono text-xs">
                         {createdAt ? new Date(createdAt).toLocaleString('tr-TR') : '-'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={alert.severity} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white truncate max-w-[200px]" title={alert.rule_name}>
                      {alert.rule_name || "Bilinmeyen"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-400 max-w-md truncate cursor-help group-hover:text-slate-200 transition-colors" title={alert.message}>
                      {alert.message}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600 text-cyber-blue font-mono text-xs">
                          {alert.source_ip}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AlertReviewButton
                      alert={alert}
                      fetchAlerts={alertService.getAlerts}
                    />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;