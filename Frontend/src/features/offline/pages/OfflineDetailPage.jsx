import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { offlineService } from '../api/offlineService';
import StatusBadge from '../../../shared/components/StatusBadge';
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
