import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectWallet } from '../services/blockchainClient';
import toast from 'react-hot-toast';
import { Wallet, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [role, setRole] = useState('PATIENT');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const walletAddress = await connectWallet();
      
      const user = {
        id: walletAddress,
        name: `${role} User`,
        walletAddress,
      };

      login(user, walletAddress, role);
      toast.success(`Logged in as ${role}`);

      // Redirect based on role
      if (role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (role === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else if (role === 'SYS_ADMIN') {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Wallet className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Connect your wallet and select your role
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
