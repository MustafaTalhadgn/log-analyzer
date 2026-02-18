import React, { useEffect, useMemo, useState } from 'react';
import { UploadCloud, FileText, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { offlineService } from '../api/offlineService';
import Loading from '../../../shared/components/Loading';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    icon: Clock,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    className: 'text-red-400 bg-red-500/10 border-red-500/30',
    icon: XCircle,
  },
};

const OfflinePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [logType, setLogType] = useState('nginx');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const optionStyle = useMemo(() => ({ backgroundColor: '#0f172a', color: '#e2e8f0' }), []);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const data = await offlineService.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Is listesi getirilemedi:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Lutfen bir dosya secin.');
      return;
    }

    try {
      setUploadError('');
      setUploading(true);
      await offlineService.uploadLog(file, logType);
      setFile(null);
      await fetchJobs();
    } catch (err) {
      const apiMessage = err?.response?.data?.error;
      const fallback = err?.message || 'Dosya yukleme basarisiz. Tekrar deneyin.';
      setUploadError(apiMessage || fallback);
      console.error('Upload hatasi:', err);
    } finally {
      setUploading(false);
    }
  };

  const renderStatus = (status) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.className}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Bu işi ve tüm alert geçmişini silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await offlineService.deleteJob(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('İş silinemedi:', err);
      alert('İş silinirken hata oluştu. Tekrar deneyin.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UploadCloud size={22} className="text-cyber-blue" />
            Offline Log Analizi
          </h2>
          <p className="text-slate-400">Dosya yukleyerek gecmis loglari analiz edebilirsiniz.</p>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Log Dosyasi *</label>
            <input
              type="file"
              accept=".log,.txt,.csv,.gz"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-slate-200 file:mr-4 file:rounded-md file:border-0 file:bg-cyber-blue file:px-3 file:py-1 file:text-white hover:file:bg-blue-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Log Type *</label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="mt-1 w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white"
              required
            >
              <option value="nginx" style={optionStyle}>nginx</option>
              <option value="auth" style={optionStyle}>auth</option>
              <option value="syslog" style={optionStyle}>syslog</option>
              <option value="ufw" style={optionStyle}>ufw</option>
            </select>
          </div>
          <div className="md:col-span-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 rounded-lg bg-cyber-blue text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {uploading ? 'Yukleniyor...' : 'Yukle ve Analiz Et'}
            </button>
            {uploadError && <span className="text-sm text-red-400">{uploadError}</span>}
          </div>
        </form>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText size={18} className="text-cyber-blue" />
            Yukleme Gecmisi
          </h3>
          <button
            onClick={fetchJobs}
            className="text-xs text-slate-400 hover:text-white"
          >
            Yenile
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900 text-xs uppercase font-medium text-slate-300">
              <tr>
                <th className="px-6 py-4">Dosya Adi</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">Yukleme Tarihi</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loadingJobs ? (
                <tr><td colSpan="4" className="py-10"><Loading /></td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-slate-500">Kayit bulunamadi.</td></tr>
              ) : jobs.map((job) => (
                <tr key={job.job_id} className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{job.filename}</td>
                  <td className="px-6 py-4">{renderStatus(job.status)}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                    {job.upload_date ? new Date(job.upload_date).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <Link
                      to={`/offline/${job.job_id}`}
                      className="text-cyber-blue hover:text-blue-400 text-xs px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                    >
                      Raporu Gör
                    </Link>
                    <button
                      onClick={() => handleDeleteJob(job.job_id)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors flex items-center gap-1"
                      title="İşi Sil"
                    >
                      <Trash2 size={14} />
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
