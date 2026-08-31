import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Topbar } from './Topbar';
import { NewOrderModal } from '../orders/NewOrderModal';

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);

  return (
    <div className="shell">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main flex-1 min-w-0 flex flex-col min-h-screen">
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewOrder={() => setNewOrderModalOpen(true)}
        />

        <main className="content flex-1 page-animate">
          <Outlet context={{ openNewOrderModal: () => setNewOrderModalOpen(true) }} />
        </main>
      </div>

      {/* Global New Order Modal triggered from Topbar */}
      <NewOrderModal
        isOpen={newOrderModalOpen}
        onClose={() => setNewOrderModalOpen(false)}
        onOrderCreated={() => {
          // If current page is orders or dashboard, it will update
          window.dispatchEvent(new CustomEvent('mittigold-order-created'));
        }}
      />
    </div>
  );
};
