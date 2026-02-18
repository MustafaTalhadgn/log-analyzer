import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Shield } from 'lucide-react';
import { ruleService } from '../api/ruleService';

const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    rule_id: '',
    description: '',
    log_type: 'nginx',
    severity: 'MEDIUM',
    match_type: 'regex',
    match_value: '',
    threshold_count: 1,
    threshold_seconds: 0,
    alert_message: '',
  });

  // Verileri Servisten Çek
  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await ruleService.getRules();
      setRules(data);
    } catch (err) {
      console.error("Kurallar çekilemedi");
    } finally {
      setLoading(false);
    }
  };

  // Kural Silme
  const handleDelete = async (id) => {
    if(!window.confirm("Bu kuralı silmek istediğine emin misin?")) return;
    try {
      await ruleService.deleteRule(id);
      setRules(rules.filter(r => r.rule_id !== id));
    } catch (err) {
      alert("Silme işlemi başarısız!");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openModal = () => {
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  // Bu class sadece SELECT kutusunun kendisi için, optionlar için değil.
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'HIGH':     return 'text-orange-500 border-orange-500/50 bg-orange-500/10';
      case 'MEDIUM':   return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      case 'LOW':      return 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
      case 'INFO':     return 'text-sky-500 border-sky-500/50 bg-sky-500/10';
      default:         return 'text-slate-300 border-dark-600 bg-dark-900';
    }
  };

  const validateForm = () => {
    const requiredFields = ['rule_id', 'description', 'log_type', 'severity', 'match_type', 'match_value', 'alert_message'];
    const hasEmpty = requiredFields.some((field) => {
      const value = formData[field];
      return !value || String(value).trim().length === 0;
    });

    if (hasEmpty) {
      setFormError('Lütfen tüm zorunlu alanları doldurun.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        rule_id: formData.rule_id.trim(),
        description: formData.description.trim(),
        log_type: formData.log_type,
        severity: formData.severity,
        alert_message: formData.alert_message.trim(),
        match: { type: formData.match_type, value: formData.match_value.trim() },
        threshold: { count: Number(formData.threshold_count) || 1, within_seconds: Number(formData.threshold_seconds) || 0 },
        extract: { ip_regex: '', user_regex: '' },
      };

      await ruleService.createRule(payload);
      await fetchRules();
      closeModal();
      setFormData({
        rule_id: '', description: '', log_type: 'nginx', severity: 'MEDIUM',
        match_type: 'regex', match_value: '', threshold_count: 1, threshold_seconds: 0, alert_message: '',
      });
    } catch (err) {
      setFormError('Kayıt işlemi başarısız. Tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dropdown seçenekleri için ortak stil (Ghost text engellemek için)
  const optionStyle = "bg-[#0f172a] text-slate-200 py-2";
  // Inputlar için ortak stil
  const inputStyle = "mt-1 w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue transition-colors";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Tespit Kuralları</h2>
          <p className="text-slate-400">Sistemin saldırıları nasıl algılayacağını yönetin.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-cyber-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-cyber-blue/20"
        >
          <Plus size={18} /> Yeni Kural Ekle
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative w-full max-w-3xl bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-900/50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">Yeni Kural Ekle</h3>
                <p className="text-sm text-slate-400">Güvenlik kuralını tanımlayın.</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Rule ID <span className="text-red-400">*</span></label>
                  <input
                    name="rule_id"
                    value={formData.rule_id}
                    onChange={handleChange}
                    placeholder="Örn: SQL-INJECTION-01"
                    className={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Description <span className="text-red-400">*</span></label>
                  <input
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Kural açıklaması"
                    className={inputStyle}
                    required
                  />
                </div>
                
                {/* LOG TYPE SELECT */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Log Type <span className="text-red-400">*</span></label>
                  <select
                    name="log_type"
                    value={formData.log_type}
                    onChange={handleChange}
                    className={inputStyle}
                    required
                  >
                    <option value="nginx" className={optionStyle}>nginx</option>
                    <option value="auth" className={optionStyle}>auth</option>
                    <option value="syslog" className={optionStyle}>syslog</option>
                    <option value="ufw" className={optionStyle}>ufw</option>
                  </select>
                </div>

                {/* SEVERITY SELECT (GHOST TEXT DÜZELTİLDİ) */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Severity <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                      // Burası seçili olanın rengi
                      className={`mt-1 w-full border rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-offset-0 ${getSeverityClass(formData.severity)}`}
                      required
                    >
                      {/* Burası açılan listenin rengi (Koyu zemin, açık yazı) */}
                      <option value="CRITICAL" className={optionStyle}>CRITICAL</option>
                      <option value="HIGH" className={optionStyle}>HIGH</option>
                      <option value="MEDIUM" className={optionStyle}>MEDIUM</option>
                      <option value="LOW" className={optionStyle}>LOW</option>
                      <option value="INFO" className={optionStyle}>INFO</option>
                    </select>
                    {/* Custom Arrow because dynamic class might hide default one */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Match Type <span className="text-red-400">*</span></label>
                  <select
                    name="match_type"
                    value={formData.match_type}
                    onChange={handleChange}
                    className={inputStyle}
                    required
                  >
                    <option value="regex" className={optionStyle}>regex</option>
                    <option value="keyword" className={optionStyle}>keyword</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Match Value <span className="text-red-400">*</span></label>
                  <input
                    name="match_value"
                    value={formData.match_value}
                    onChange={handleChange}
                    placeholder="(SELECT|UNION|DROP)"
                    className={`${inputStyle} font-mono text-sm`}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Threshold Count</label>
                  <input
                    type="number"
                    min="1"
                    name="threshold_count"
                    value={formData.threshold_count}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400">Threshold Seconds</label>
                  <input
                    type="number"
                    min="0"
                    name="threshold_seconds"
                    value={formData.threshold_seconds}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-slate-400">Alert Message <span className="text-red-400">*</span></label>
                <textarea
                  name="alert_message"
                  value={formData.alert_message}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Alarm oluştuğunda görünecek mesaj"
                  className={inputStyle}
                  required
                />
              </div>

              {formError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
                   <Shield size={16} /> {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-dark-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-lg border border-dark-600 text-slate-300 hover:text-white hover:bg-dark-700 transition-colors text-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-cyber-blue text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyber-blue/20 text-sm font-medium"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kuralı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLO KISMI (Değişmedi ama bütünlük için eklendi) */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-[#0f172a] text-xs uppercase font-semibold text-slate-300 border-b border-dark-600">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Kural Adı</th>
              <th className="px-6 py-4">Log Tipi</th>
              <th className="px-6 py-4">Seviye</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/50">
            {loading ? (
               <tr><td colSpan="5" className="text-center py-8">Yükleniyor...</td></tr>
            ) : rules.map((rule) => (
              <tr key={rule.rule_id || Math.random()} className="hover:bg-dark-700/50 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-slate-500 group-hover:text-slate-300">
                    {rule.rule_id ? rule.rule_id.substring(0,12) + (rule.rule_id.length>12 ? '...':'') : '-'}
                </td>
                <td className="px-6 py-4 text-white font-medium flex items-center gap-2">
                   <div className="p-1.5 bg-blue-500/10 rounded-md">
                       <Shield size={14} className="text-cyber-blue"/> 
                   </div>
                   {rule.description}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-dark-900 px-2 py-1 rounded text-xs border border-dark-600 font-mono text-cyber-blue">
                      {rule.log_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    rule.severity === 'CRITICAL' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                    rule.severity === 'HIGH' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' :
                    rule.severity === 'MEDIUM' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
                    rule.severity === 'WARNING' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                    'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(rule.rule_id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                    title="Kuralı Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RulesPage;