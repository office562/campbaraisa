import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Campers from "@/pages/Campers";
import CamperDetail from "@/pages/CamperDetail";
import Billing from "@/pages/Billing";
import Kanban from "@/pages/Kanban";
import Communications from "@/pages/Communications";
import Rooms from "@/pages/Rooms";
import Financial from "@/pages/Financial";
import DataCenter from "@/pages/DataCenter";
import Settings from "@/pages/Settings";
import ParentPortal from "@/pages/ParentPortal";
import PaymentSuccess from "@/pages/PaymentSuccess";

// Layout
import AdminLayout from "@/components/AdminLayout";

// Auth Context
import { AuthProvider, useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-camp-bone flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/portal/:accessToken" element={<ParentPortal />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<Navigate to="/" replace />} />
      
      {/* Protected Admin Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="campers" element={<Campers />} />
        <Route path="campers/:camperId" element={<CamperDetail />} />
        <Route path="billing" element={<Billing />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="communications" element={<Communications />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="financial" element={<Financial />} />
        <Route path="data-center" element={<DataCenter />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
