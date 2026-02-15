import React from 'react';
import clsx from 'clsx';

const StatusBadge = ({ status }) => {
  // Duruma göre renk belirle
  const styles = {
    CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20",
    WARNING:  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    INFO:     "bg-blue-500/10 text-blue-500 border-blue-500/20",
    SUCCESS:  "bg-green-500/10 text-green-500 border-green-500/20",
  };

  // Bilinmeyen durum gelirse gri yap
  const activeStyle = styles[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";

  return (
    <span className={clsx("px-2 py-1 rounded text-xs font-bold border uppercase tracking-wider", activeStyle)}>
      {status}
    </span>
  );
};

export default StatusBadge;