import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldAlert, Clock, Search, Filter, X, List, Calendar, AlertTriangle, Download, CheckCircle2 } from 'lucide-react';
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
  const [pulseTick, setPulseTick] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const pulseTimeoutRef = useRef(null);
  
  
  // DİKKAT: openAlertId state'ini sildik çünkü modal kendi state'ini yönetecek.
  const [searchParams, setSearchParams] = useSearchParams();

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
      return data;
    } catch (err) {
      console.error("Alarmlar çekilemedi:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertsSilently = useCallback(async () => {
    try {
      const data = await alertService.getAlerts();
      setAlerts(data);
      return data;
    } catch (err) {
      console.error('Alarmlar sessizce cekilemedi:', err);
      return null;
    }
  }, []);

  const triggerPulse = useCallback(() => {
    setPulseTick(Date.now());
    setPulseActive(true);
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = setTimeout(() => {
      setPulseActive(false);
    }, 800);
  }, []);

  const handleWsMessage = useCallback((payload) => {
    const data = payload?.type === 'alert' ? payload.data : payload;
    if (!data || (!data.alert_id && !data.AlertId && !data.rule_id)) {
      return;
    }
    setAlerts((prev) => [data, ...prev].slice(0, 200));
    triggerPulse();
  }, [triggerPulse]);

  useWebSocket(null, { onMessage: handleWsMessage });

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => () => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
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
  const optionStyle = { backgroundColor: '#0f172a', color: '#e2e8f0' };

  const handleReviewToggle = async (alertId, isCurrentlyReviewed) => {
    try {
      if (isCurrentlyReviewed) {
        await alertService.markAsUnreviewed(alertId);
      } else {
        await alertService.markAsReviewed(alertId);
      }
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.alert_id === alertId || alert.AlertId === alertId
            ? { ...alert, reviewed: !isCurrentlyReviewed }
            : alert
        )
      );
    } catch (err) {
      console.error('Alert review işlemi başarısız:', err);
    }
  };

  const handleExport = async (format) => {
    try {
      const data = await alertService.exportAlerts(format);
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alerts_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export başarısız:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION (Aynı kaldı) */}
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
        <div className="flex items-center gap-3">
          <div className="text-slate-500 text-xs font-mono">
             Toplam Kayıt: <span className="text-white font-bold">{filteredAlerts.length}</span> / {alerts.length}
          </div>
          <div className="inline-flex items-center rounded-full border border-cyber-blue/30 bg-cyber-blue/10 px-2 py-1">
            <svg
              key={pulseTick}
              className={`h-3 w-10 ${pulseActive ? 'pulse-wave-animate' : ''}`}
              viewBox="0 0 32 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                className="pulse-wave-base"
                d="M1 6 H8 L11 2 L15 10 L19 4 L23 6 H31"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="pulse-wave-path"
                d="M1 6 H8 L11 2 L15 10 L19 4 L23 6 H31"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors text-xs"
              title="CSV olarak indir"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-colors text-xs"
              title="JSON olarak indir"
            >
              <Download size={14} />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS TOOLBAR (Aynı kaldı) */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 flex flex-col xl:flex-row gap-4 justify-between items-center shadow-lg backdrop-blur-sm">
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

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3">
          <div className="relative w-full sm:w-40 ">
            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none " size={16} />
            <select
              className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-cyber-blue appearance-none cursor-pointer hover:border-dark-500 transition-colors"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="" style={optionStyle}>Tüm Seviyeler</option>
              <option value="CRITICAL" style={optionStyle}>Critical</option>
              <option value="HIGH" style={optionStyle}>High</option>
              <option value="WARNING" style={optionStyle}>Warning</option> 
              <option value="MEDIUM" style={optionStyle}>Medium</option>
              <option value="LOW" style={optionStyle}>Low</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
          </div>

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

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400 table-fixed min-w-[1200px]">
            <thead className="bg-[#0f172a] text-xs uppercase font-semibold text-slate-300 border-b border-dark-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-48 whitespace-nowrap">Zaman</th>
                <th className="px-4 py-3 w-32 whitespace-nowrap">Kritiklik</th>
                <th className="px-4 py-3 w-3/12">Kural Adı</th> 
                <th className="px-4 py-3 w-4/12">Mesaj</th>     
                <th className="px-4 py-3 w-40">Kaynak</th>
                <th className="px-4 py-3 w-32 text-center">Durum</th>
                <th className="px-4 py-3 w-36 text-center">İncele</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 bg-dark-800/50">
              {loading ? (
                <tr><td colSpan="7" className="py-12"><Loading /></td></tr>
              ) : filteredAlerts.length === 0 ? (
                 <tr>
                   <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                     <div className="flex flex-col items-center justify-center gap-2">
                       <Filter size={32} className="opacity-20" />
                       <span>Aradığınız kriterlere uygun kayıt bulunamadı.</span>
                       <button onClick={clearFilters} className="text-cyber-blue text-xs hover:underline mt-1">
                         Filtreleri Temizle
                       </button>
                     </div>
                   </td>
                 </tr>
              ) : filteredAlerts.map((alert) => {
                const createdAt = alert.created_at || alert.CreatedAt;
                const rawAlertId = alert.alert_id || alert.AlertId || alert.ID || alert.id;
                const alertKey = rawAlertId !== null && rawAlertId !== undefined ? String(rawAlertId) : null;
                
                return (
                <tr
                  key={alertKey || Math.random()}
                  className="hover:bg-dark-700/70 transition-colors group"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                       <Clock size={14} className="text-slate-500" />
                       <span className="font-mono text-xs">
                         {createdAt ? new Date(createdAt).toLocaleString('tr-TR') : '-'}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={alert.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="truncate font-medium text-white" title={alert.rule_name}>
                      {alert.rule_name || "Bilinmeyen"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="truncate text-slate-400 group-hover:text-slate-200 transition-colors"
                      title={alert.message}
                    >
                      {alert.message}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                     <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600 text-cyber-blue font-mono text-xs whitespace-nowrap">
                       {alert.source_ip}
                     </span>
                  </td>
                 <td className="px-4 py-3 text-center whitespace-nowrap">
                    {alert.reviewed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-medium">
                        <CheckCircle2 size={12} />
                        İncelendi
                      </span>
                    ) : (
                      // DEĞİŞEN KISIM: Sarı yerine Mor kullanıldı ve ikon Clock yapıldı
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium">
                        <Clock size={12} />
                        Beklemede
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    
                    {/* DİKKAT: İşlem menüsünü yeniledim. Buton ve Menü yan yana. */}
                    <div className="flex items-center justify-center">
                      
                      {/* Görünür AlertReviewButton (Kendi haline bıraktık) */}
                      <div id={`review-wrapper-${alertKey}`} onClick={(e) => e.stopPropagation()}>
                        <AlertReviewButton
                          alert={alert}
                          fetchAlerts={fetchAlertsSilently}
                          onToggleReview={handleReviewToggle}
                        />
                      </div>
                    </div>
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