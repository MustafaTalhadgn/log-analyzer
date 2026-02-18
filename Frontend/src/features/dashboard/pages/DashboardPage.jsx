import React, { useCallback, useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { AlertTriangle, Shield, Activity, Database, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../api/dashboardService';

// Shared Bileşenlerimizi kullanıyoruz
import StatCard from '../../../shared/components/StatCards';
import StatusBadge from '../../../shared/components/StatusBadge';
import Loading from '../../../shared/components/Loading';
import AlertReviewButton from '../../../shared/components/AlertReviewButton';
import { useWebSocket } from '../../../shared/hooks/useWebSocket';

// Grafik Renkleri (Cyberpunk Palette)
const COLORS = {
  CRITICAL: '#ef4444', // Red
  WARNING: '#eab308',  // Yellow
  INFO: '#3b82f6',     // Blue
  SUCCESS: '#22c55e'   // Green
};

const DashboardPage = () => {
  const [stats, setStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [rawStats, setRawStats] = useState({});
  const navigate = useNavigate();

  // Verileri Çek
  const fetchDashboardData = async () => {
    try {
      const [statsData, alertsData, dailyStats] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentAlerts(),
        dashboardService.getDailyStats(7)
      ]);

      const severityKeys = ['CRITICAL', 'WARNING', 'INFO', 'SUCCESS'];
      const formattedStats = Object.keys(statsData || {})
        .filter((key) => severityKeys.includes(key))
        .map((key) => ({ name: key, value: statsData[key] }));

      setRawStats(statsData || {});
      setStats(formattedStats);
      setAlerts(alertsData);
      setActivity(dailyStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard verisi çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWsMessage = useCallback((payload) => {
    const data = payload?.type === 'alert' ? payload.data : payload;
    if (!data || (!data.alert_id && !data.AlertId && !data.rule_id)) {
      return;
    }

    const severity = data.severity;
    const createdAt = data.created_at || data.CreatedAt || new Date().toISOString();
    const dateObj = new Date(createdAt);
    const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    setAlerts((prev) => [data, ...prev].slice(0, 100));
    setStats((prev) => {
      const next = [...prev];
      const idx = next.findIndex((item) => item.name === severity);
      if (idx >= 0) {
        next[idx] = { ...next[idx], value: next[idx].value + 1 };
      } else if (severity) {
        next.push({ name: severity, value: 1 });
      }
      return next;
    });
    setRawStats((prev) => {
      const next = { ...prev };
      if (typeof next.total_intel === 'number') next.total_intel += 1;
      if (typeof next.total_alerts === 'number') next.total_alerts += 1;
      if (typeof next.active_alerts === 'number') next.active_alerts += 1;
      if (typeof next.last24h === 'number') next.last24h += 1;
      if (typeof next.last_24h === 'number') next.last_24h += 1;
      if (severity && typeof next[severity] === 'number') next[severity] += 1;
      return next;
    });
    setActivity((prev) => {
      if (!prev.length) {
        return prev;
      }
      const next = prev.map((item) =>
        item.date === dateKey ? { ...item, count: item.count + 1 } : item,
      );
      return next;
    });
    setLastUpdated(new Date());
  }, []);

  useWebSocket(null, { onMessage: handleWsMessage });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAlertId = useCallback((alert) => (
    alert?.alert_id || alert?.AlertId || alert?.ID || alert?.id
  ), []);

  // İstatistik Özetleri
  const totalCritical = stats.find(s => s.name === 'CRITICAL')?.value || 0;
  const totalWarnings = stats.find(s => s.name === 'WARNING')?.value || 0;
  const sumSeverity = stats.reduce((acc, s) => acc + (s.value || 0), 0);

  const totalIntel =
    rawStats.total_intel ??
    rawStats.total ??
    rawStats.total_alerts ??
    sumSeverity;

  const activeAlerts =
    rawStats.active_alerts ??
    rawStats.active ??
    (totalCritical + totalWarnings);

  const last24h =
    rawStats.last24h ??
    rawStats.last_24h ??
    rawStats.last24 ??
    totalIntel;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Siber Tehdit İstihbarat Paneli</h1>
          <p className="text-slate-400 text-sm">Sistem logları üzerinden toplanan verilerin anlık analizi.</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Son Güncelleme: {lastUpdated.toLocaleTimeString()}</span>
            <button 
                onClick={fetchDashboardData} 
                className="p-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg text-cyber-blue transition-colors"
                title="Yenile"
            >
                <RefreshCw size={18} />
            </button>
        </div>
      </div>

      {/* STAT CARDS (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="TOPLAM İSTİHBARAT"
          value={totalIntel}
          icon={Database}
          color="blue"
          trend={12}
          onClick={() => navigate('/alerts')}
        />
        <StatCard
          title="KRİTİK TEHDİTLER"
          value={totalCritical}
          icon={AlertTriangle}
          color="red"
          trend={-5}
          onClick={() => navigate('/alerts?severity=CRITICAL')}
        />
        <StatCard
          title="AKTİF UYARILAR"
          value={activeAlerts}
          icon={Shield}
          color="green"
          onClick={() => navigate('/alerts?severity=WARNING')}
        />
        <StatCard
          title="SON 24 SAAT"
          value={last24h}
          icon={Activity}
          color="yellow"
          onClick={() => navigate('/alerts?last24h=1')}
        />
      </div>

      {/* CHARTS AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL TARAFTAKİ GRAFİK (Activity) */}
        <div className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Activity size={18} className="text-cyber-blue"/> Tehdit Aktivitesi (Simülasyon)
            </h3>
            <div className="h-72 w-full">
                 {/* Buraya gerçek zamanlı grafik verisi gelecek, şimdilik placeholder */}
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activity.map((item) => ({ name: item.date, count: item.count }))}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#475569" />
                        <YAxis stroke="#475569" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
        </div>

        {/* SAĞ TARAFTAKİ GRAFİK (Pie) */}
        <div className="lg:col-span-1 bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-white font-bold mb-4">Kategori Dağılımı</h3>
            <div className="h-64 flex items-center justify-center">
                {stats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} itemStyle={{color:'#fff'}} />
                            <Legend verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-slate-500 text-sm">Veri yok</p>
                )}
            </div>
        </div>
      </div>

      {/* RECENT ALERTS TABLE */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-dark-700 flex justify-between items-center">
            <h3 className="text-white font-bold">Son Tehdit Akışı</h3>
            <button
              className="text-xs text-cyber-blue hover:text-blue-400 transition-colors"
              onClick={() => navigate('/alerts')}
            >
              Tümünü Gör →
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-dark-900/50 text-xs uppercase font-medium text-slate-300">
                    <tr>
                        <th className="px-6 py-4">Kural Adı</th>
                        <th className="px-6 py-4">Kaynak</th>
                        <th className="px-6 py-4">Kritiklik</th>
                        <th className="px-6 py-4">Tarih</th>
                        <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                    {alerts.slice(0, 5).map((alert) => {
                      const createdAt = alert.created_at || alert.CreatedAt;
                      return (
                        <tr key={getAlertId(alert) || Math.random()} className="hover:bg-dark-700/50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-white group-hover:text-cyber-blue transition-colors">
                                {alert.rule_name || "Bilinmeyen Tehdit"}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">
                                <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600">
                                    {alert.source_ip}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge status={alert.severity} />
                            </td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <Clock size={14} className="text-slate-500"/>
                              {createdAt ? new Date(createdAt).toLocaleString('tr-TR') : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <AlertReviewButton
                                  alert={alert}
                                  fetchAlerts={dashboardService.getRecentAlerts}
                                  getAlertId={getAlertId}
                                />
                            </td>
                        </tr>
                          );
                        })}
                    {alerts.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                <Shield size={48} className="mx-auto mb-2 opacity-20"/>
                                Henüz tespit edilen bir tehdit yok. Sistem güvenli.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;