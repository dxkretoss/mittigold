import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export const MobileSidebar = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-3/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex flex-col w-[260px] max-w-[85vw] h-full bg-gradient-to-b from-navy via-navy-2 to-navy-3 z-10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="h-full overflow-y-auto">
          <Sidebar onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
};
