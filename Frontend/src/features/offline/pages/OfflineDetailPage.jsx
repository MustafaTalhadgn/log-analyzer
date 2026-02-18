import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { offlineService } from '../api/offlineService';
import StatusBadge from '../../../shared/components/StatusBadge';
import StatCard from '../../../shared/components/StatCards';
import Loading from '../../../shared/components/Loading';

const OfflineDetailPage = () => {
  const { jobId } = useParams();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await offlineService.getAlertsByJob(jobId);
      setAlerts(data);
    } catch (err) {
      console.error('Offline alarmlar getirilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [jobId]);

  // Severity'ye göre alert sayılarını hesapla
  const stats = useMemo(() => {
    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      WARNING: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0,
    };

    alerts.forEach((alert) => {
      const severity = alert.severity || 'INFO';
      if (severityCounts.hasOwnProperty(severity)) {
        severityCounts[severity]++;
      }
    });

    return severityCounts;
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Link to="/offline" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Geri Don
          </Link>
          <h2 className="text-2xl font-bold text-white mt-2">Offline Rapor Detayi</h2>
          <p className="text-slate-400">Job ID: {jobId}</p>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="KRİTİK ALARMLAR"
          value={stats.CRITICAL}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="YÜKSEK SEVİYE"
          value={stats.HIGH}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="UYARILAR"
          value={stats.WARNING}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="ORTA SEVİYE"
          value={stats.MEDIUM}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="TOPLAM"
          value={alerts.length}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900 text-xs uppercase font-medium text-slate-300">
              <tr>
                <th className="px-6 py-4">Zaman</th>
                <th className="px-6 py-4">Kritiklik</th>
                <th className="px-6 py-4">Kural</th>
                <th className="px-6 py-4">Mesaj</th>
                <th className="px-6 py-4">Kaynak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading ? (
                <tr><td colSpan="5" className="py-10"><Loading /></td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-500">Bu job icin alarm bulunamadi.</td></tr>
              ) : alerts.map((alert) => {
                const createdAt = alert.created_at || alert.CreatedAt;
                return (
                  <tr key={alert.alert_id || alert.AlertId || alert.ID} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      {createdAt ? new Date(createdAt).toLocaleString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={alert.severity} />
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {alert.rule_name || 'Bilinmeyen'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md truncate" title={alert.message}>{alert.message}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      {alert.source_ip || '-'}
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

export default OfflineDetailPage;
