import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';

const defaultGetAlertId = (alert) => (
  alert?.alert_id || alert?.AlertId || alert?.ID || alert?.id
);

const AlertReviewButton = ({
  alert,
  fetchAlerts,
  getAlertId = defaultGetAlertId,
  buttonLabel = 'İncele',
  buttonClassName = 'text-xs bg-dark-900 hover:bg-cyber-blue hover:text-white border border-dark-600 text-slate-300 px-3 py-1 rounded transition-all',
  openKey = null,
  alertKey = null,
  onOpenHandled,
  onToggleReview,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const navigate = useNavigate();

  const openAlertModal = useCallback(async () => {
    console.debug('[AlertReviewButton] openAlertModal', { alert });
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError('');

    let resolvedAlert = alert;

    if (typeof fetchAlerts === 'function') {
      try {
        const data = await fetchAlerts();
        if (Array.isArray(data)) {
          const targetId = getAlertId(alert);
          const freshMatch = data.find((item) => getAlertId(item) === targetId);
          resolvedAlert = freshMatch || alert;
        }
      } catch (error) {
        console.error('Log detaylari getirilemedi:', error);
        setModalError('Log detaylari getirilemedi.');
      }
    } 

    setSelectedAlert(resolvedAlert || alert);
    setModalLoading(false);
  }, [alert, fetchAlerts, getAlertId]);

  useEffect(() => {
    if (openKey === null || openKey === undefined) return;
    if (alertKey === null || alertKey === undefined) return;
    if (openKey !== alertKey) return;
    console.debug('[AlertReviewButton] openKey matched', { openKey, alertKey });
    openAlertModal();
    if (typeof onOpenHandled === 'function') {
      onOpenHandled();
    }
  }, [alertKey, onOpenHandled, openAlertModal, openKey]);

  const closeAlertModal = useCallback(() => {
    console.debug('[AlertReviewButton] closeAlertModal');
    setIsModalOpen(false);
    setSelectedAlert(null);
    setModalError('');
  }, []);

  const alertCreatedAt = useMemo(() => {
    if (!selectedAlert) return null;
    return selectedAlert.created_at || selectedAlert.CreatedAt || null;
  }, [selectedAlert]);

  const isReviewed = selectedAlert?.reviewed ?? alert?.reviewed;

  const handleToggleReview = useCallback(async () => {
    if (typeof onToggleReview !== 'function') return;
    const target = selectedAlert || alert;
    const targetId = getAlertId(target);
    if (!targetId) return;
    try {
      await onToggleReview(targetId, Boolean(isReviewed));
      setSelectedAlert((prev) => (prev ? { ...prev, reviewed: !isReviewed } : prev));
    } catch (error) {
      console.error('Alert review modal toggle basarisiz:', error);
    }
  }, [alert, getAlertId, isReviewed, onToggleReview, selectedAlert]);

  const handleFilterBySource = useCallback(() => {
    const sourceIp = selectedAlert?.source_ip;
    if (!sourceIp) return;
    navigate(`/alerts?source=${encodeURIComponent(sourceIp)}`);
    closeAlertModal();
  }, [navigate, selectedAlert, closeAlertModal]);

  return (
    <>
      <button className={buttonClassName} onClick={openAlertModal}>
        {buttonLabel}
      </button>

      {isModalOpen && typeof document !== 'undefined' ? createPortal(
        /* 1. DEĞİŞİKLİK: OVERLAY (Arka Plan)
           - bg-black/50: Arkayı %50 karartır.
           - backdrop-blur-sm: Arkayı hafifçe bulanıklaştırır (Tailwind class'ı).
           - transition-all duration-300: Açılışın yumuşak olmasını sağlar.
        */
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
            onClick={closeAlertModal}
        >
          <div
            /* 2. DEĞİŞİKLİK: MODAL KUTUSU
               - bg-slate-900: Koyu ama tam siyah değil (Cyberpunk temana uygun).
               - border-white/10: Kenarlık artık keskin gri değil, %10 opaklıkta beyaz. Çok daha şık durur.
               - shadow-2xl ve shadow-cyber-blue/20: Hafif bir neon parlaması ekler (opsiyonel).
            */
            className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header Kısmı */}
            <div className="grid grid-cols-3 items-center border-b border-white/5 px-6 py-4 bg-white/5 rounded-t-2xl">
              <div />
              <h4 className="text-white font-bold text-center tracking-wide">Tehdit Log Detayları</h4>
              <button
                className="text-slate-400 hover:text-white transition-colors justify-self-end"
                onClick={closeAlertModal}
              >
                Kapat
              </button>
            </div>

            {/* İçerik Kısmı */}
            <div className="p-6 space-y-4">
              {modalLoading ? (
                <Loading />
              ) : (
                <>
                  {modalError && (
                    <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">{modalError}</div>
                  )}
                  {selectedAlert ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left items-start">
                      
                      {/* Hızlı Aksiyon Alanı */}
                      <div className="md:col-span-2 flex flex-wrap items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                        <span className="text-xs text-blue-200">Hızlı Aksiyon:</span>
                        <button
                          className="text-xs bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-300 border border-blue-500/30 px-3 py-1 rounded transition-all"
                          onClick={handleFilterBySource}
                        >
                          Kaynağa göre filtrele
                        </button>
                        {typeof onToggleReview === 'function' && (
                          <button
                            className={`text-xs border px-3 py-1 rounded transition-all ${
                              isReviewed
                                ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                : 'bg-green-500/10 hover:bg-green-500/20 text-green-300 border-green-500/30'
                            }`}
                            onClick={handleToggleReview}
                          >
                            {isReviewed ? 'Durumu Geri Al' : 'İncelendi İşaretle'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Kural Adı</div>
                        <div className="text-white font-medium">{selectedAlert.rule_name || '-'}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Kritiklik</div>
                        {/* Kritiklik rengine göre text rengi değişebilir, şimdilik beyaz */}
                        <div className="text-white font-medium">{selectedAlert.severity || '-'}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Kaynak IP</div>
                        <div className="text-white font-mono bg-slate-800 inline-block px-2 py-0.5 rounded text-xs border border-white/5">
                            {selectedAlert.source_ip || '-'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Kaynak Adı</div>
                        <div className="text-white font-medium">{selectedAlert.source_name || '-'}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Log Tipi</div>
                        <div className="text-white font-medium">{selectedAlert.log_type || '-'}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Tarih</div>
                        <div className="text-white font-medium">
                          {alertCreatedAt ? new Date(alertCreatedAt).toLocaleString('tr-TR') : '-'}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 space-y-1 pt-2 border-t border-white/5">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Mesaj</div>
                        <div className="text-slate-200">{selectedAlert.message || '-'}</div>
                      </div>
                      
                      {/* Log Konsolu */}
                      <div className="md:col-span-2 space-y-1">
                        <div className="text-slate-500 text-xs uppercase font-semibold">Ham Log</div>
                        <pre className="bg-[#0f172a] border border-white/5 rounded-lg p-4 text-xs text-green-400 font-mono whitespace-pre-wrap shadow-inner overflow-auto max-h-40">
                          {selectedAlert.log_content || '-'}
                        </pre>
                      </div>

                    </div>
                  ) : (
                    <div className="text-slate-400">Detay bulunamadı.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      , document.body) : null}
    </>
  );
};

export default AlertReviewButton;