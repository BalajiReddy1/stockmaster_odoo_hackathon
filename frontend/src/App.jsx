import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

// Import pages
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import OTPVerificationPage from '@/pages/auth/OTPVerificationPage';
import DashboardPage from '@/pages/DashboardPage';
import DeliveryPage from '@/pages/DeliveryPage';
import DeliveryDetailPage from '@/pages/DeliveryDetailPage';
import WarehousePage from '@/pages/WarehousePage';
import StockOverviewPage from '@/pages/StockOverviewPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Wrap authenticated content with Layout
  return (
    <Layout>
      {children}
    </Layout>
  );
};

// App Routes Component (inside AuthProvider)
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/delivery" element={
        <ProtectedRoute>
          <DeliveryPage />
        </ProtectedRoute>
      } />
      <Route path="/delivery/:id" element={
        <ProtectedRoute>
          <DeliveryDetailPage />
        </ProtectedRoute>
      } />
      
      {/* Inventory Management routes */}
      <Route path="/warehouses" element={
        <ProtectedRoute>
          <WarehousePage />
        </ProtectedRoute>
      } />
      
      <Route path="/stock" element={
        <ProtectedRoute>
          <StockOverviewPage />
        </ProtectedRoute>
      } />
      
      {/* Legacy Operations routes */}
      <Route path="/operations" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Operations</h1>
            <p>Operations page coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/operations/receipt" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Receipt Operations</h1>
            <p>Receipt operations page coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/operations/delivery" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Delivery Operations</h1>
            <p>Delivery operations page coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/stock" element={
        <ProtectedRoute>
          <StockOverviewPage />
        </ProtectedRoute>
      } />
      
      <Route path="/move-history" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Move History</h1>
            <p>Move history page coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p>Settings page coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          
          {/* Toast notifications */}
          <Toaster position="top-right" richColors />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;