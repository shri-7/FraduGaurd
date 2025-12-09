import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectWallet } from '../services/blockchainClient';
import * as api from '../services/api';
import toast from 'react-hot-toast';
import { Wallet, LogIn } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [role, setRole] = useState('PATIENT');
  const [loading, setLoading] = useState(false);
  
  // Patient credentials
  const [patientEmail, setPatientEmail] = useState('');
  const [patientDoB, setPatientDoB] = useState('');
  
  // Provider/Admin credentials
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handlePatientLogin = async () => {
    if (!patientEmail || !patientDoB) {
      toast.error('Please enter email and date of birth');
      return;
    }

    setLoading(true);
    try {
      const walletAddress = await connectWallet();

      // Validate patient credentials with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/patient-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientEmail,
          dateOfBirth: patientDoB,
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Invalid login details');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const user = {
        id: data.patient.id,
        name: data.patient.name,
        email: data.patient.email,
        walletAddress,
      };

      login(user, walletAddress, 'PATIENT', patientEmail, patientDoB);
      toast.success('Logged in as Patient');
      navigate('/patient/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const walletAddress = await connectWallet();

      // Validate provider credentials with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/provider-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast.error('Your registration is still pending admin approval.');
        } else {
          toast.error(errorData.error || 'Provider not found');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      const user = {
        id: data.provider.id,
        name: data.provider.name,
        email: data.provider.contactEmail,
        walletAddress,
      };

      login(user, walletAddress, 'PROVIDER', email);
      toast.success('Logged in as Provider');
      navigate('/provider/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);

    const correctPassword = "Sit@1234";

    // 1. Check empty password
    if (!adminPassword || adminPassword.trim() === "") {
      toast.error("Please enter admin password");
      setLoading(false);
      return;
    }

    // 2. Validate password
    if (adminPassword.trim() !== correctPassword) {
      toast.error("Incorrect admin password");
      setAdminPassword("");
      setLoading(false);
      return;
    }

    // 3. Connect wallet and login
    try {
      const wallet = await connectWallet();
      if (!wallet) {
        toast.error("Please connect your wallet");
        setLoading(false);
        return;
      }

      // Login with admin role (password already validated)
      login({ role: "SYS_ADMIN" }, wallet, "SYS_ADMIN");
      toast.success("Admin login successful");
      navigate("/admin/dashboard");

    } catch (err) {
      console.error("Admin login error:", err);
      toast.error(err.message || "Admin login failed");
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    if (role === 'PATIENT') {
      await handlePatientLogin();
    } else if (role === 'PROVIDER') {
      await handleProviderLogin();
    } else if (role === 'SYS_ADMIN') {
      await handleAdminLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Wallet className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to your account
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PATIENT">Patient</option>
              <option value="PROVIDER">Insurance Provider</option>
              <option value="SYS_ADMIN">System Administrator</option>
            </select>
          </div>

          {/* Patient Login Fields */}
          {role === 'PATIENT' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={patientDoB}
                  onChange={(e) => setPatientDoB(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Provider Login Fields */}
          {role === 'PROVIDER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="provider@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Admin Login Fields */}
          {role === 'SYS_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                autoFocus
              />
              <p className="text-xs text-red-600 mt-1 font-semibold">
                ⚠️ Required: Enter password to access admin panel
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Make sure you have Metamask installed and configured for the local Ethereum network (Ganache/Hardhat).
            </p>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          {loading ? 'Connecting...' : 'Connect Wallet & Login'}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-4">
            Don't have an account?
          </p>
          <div className="space-y-2">
            <a
              href="/patient/register"
              className="block w-full text-center bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2 rounded-lg transition"
            >
              Register as Patient
            </a>
            <a
              href="/provider/register"
              className="block w-full text-center bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-2 rounded-lg transition"
            >
              Register as Provider
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
