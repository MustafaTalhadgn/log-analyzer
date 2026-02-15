import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Shield } from 'lucide-react';
import { ruleService } from '../api/ruleService';

const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Silindikten sonra listeyi güncelle (veya state'den filtrele)
      setRules(rules.filter(r => r.rule_id !== id));
    } catch (err) {
      alert("Silme işlemi başarısız!");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Tespit Kuralları</h2>
          <p className="text-slate-400">Sistemin saldırıları nasıl algılayacağını yönetin.</p>
        </div>
        <button className="bg-cyber-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} /> Yeni Kural Ekle
        </button>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-dark-900 text-xs uppercase font-medium text-slate-300">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Kural Adı</th>
              <th className="px-6 py-4">Log Tipi</th>
              <th className="px-6 py-4">Seviye</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {loading ? (
               <tr><td colSpan="5" className="text-center py-8">Yükleniyor...</td></tr>
            ) : rules.map((rule) => (
              <tr key={rule.ID} className="hover:bg-dark-700/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{rule.rule_id.substring(0,8)}...</td>
                <td className="px-6 py-4 text-white font-medium flex items-center gap-2">
                   <Shield size={14} className="text-cyber-blue"/> {rule.description}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-dark-900 px-2 py-1 rounded text-xs border border-dark-700">{rule.log_type}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    rule.severity === 'CRITICAL' ? 'text-red-500 bg-red-500/10' : 'text-yellow-500 bg-yellow-500/10'
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(rule.rule_id)}
                    className="text-slate-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full"
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