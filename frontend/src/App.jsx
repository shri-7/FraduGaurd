import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import { useAuthStore } from './store/authStore';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientRegister from './pages/PatientRegister';
import PatientDashboard from './pages/PatientDashboard';
import PatientNewClaim from './pages/PatientNewClaim';
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
              element={isConnected && role === 'PATIENT' ? <PatientDashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/patient/claims/new" 
              element={isConnected && role === 'PATIENT' ? <PatientNewClaim /> : <Navigate to="/login" />} 
            />

            {/* Provider Routes */}
            <Route path="/provider/register" element={<ProviderRegister />} />
            <Route 
              path="/provider/dashboard" 
              element={isConnected && role === 'PROVIDER' ? <ProviderDashboard /> : <Navigate to="/login" />} 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={isConnected && role === 'SYS_ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
