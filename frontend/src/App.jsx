import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientRegister from './pages/PatientRegister';
import PatientDashboard from './pages/PatientDashboard';
import PatientNewClaim from './pages/PatientNewClaim';
import PatientClaimDetail from './pages/PatientClaimDetail';
import ProviderRegister from './pages/ProviderRegister';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { isConnected, role } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Patient Routes */}
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route 
              path="/patient/dashboard" 
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/claims/new" 
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientNewClaim />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/claims/:id" 
              element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientClaimDetail />
                </ProtectedRoute>
              } 
            />

            {/* Provider Routes */}
            <Route path="/provider/register" element={<ProviderRegister />} />
            <Route 
              path="/provider/dashboard" 
              element={
                <ProtectedRoute requiredRole="PROVIDER">
                  <ProviderDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="SYS_ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
