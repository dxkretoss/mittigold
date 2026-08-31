import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-ink-soft">
      <Loader2 className="w-6 h-6 animate-spin text-wheat mb-2" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
};
