import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex items-center justify-center w-full h-64 text-cyber-blue">
      <Loader2 size={48} className="animate-spin" />
    </div>
  );
};

export default Loading;