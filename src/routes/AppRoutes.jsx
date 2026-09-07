import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Zones } from '../pages/zones/Zones';
import { Leads } from '../pages/leads/Leads';
import { Distributors } from '../pages/distributors/Distributors';
import { DistributorDetail } from '../pages/distributors/DistributorDetail';
import { Brokers } from '../pages/brokers/Brokers';
import { BrokerDetail } from '../pages/brokers/BrokerDetail';
import { SalesTeam } from '../pages/sales/SalesTeam';
import { Orders } from '../pages/orders/Orders';
import { Invoices } from '../pages/invoices/Invoices';
import { Products } from '../pages/products/Products';
import { Settings } from '../pages/settings/Settings';
import { Notifications } from '../pages/notifications/Notifications';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected App Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="zones" element={<Zones />} />
        <Route path="leads" element={<Leads />} />
        <Route path="distributors" element={<Distributors />} />
        <Route path="distributors/:id" element={<DistributorDetail />} />
        <Route path="brokers" element={<Brokers />} />
        <Route path="brokers/:id" element={<BrokerDetail />} />
        <Route path="sales-team" element={<SalesTeam />} />
        <Route path="employees" element={<Navigate to="/sales-team" replace />} />
        <Route path="orders" element={<Orders />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="products" element={<Products />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
