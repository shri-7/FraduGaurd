import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerProvider } from '../services/api';
import { connectWallet } from '../services/blockchainClient';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';

export default function ProviderRegister() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Connect wallet if not already connected
      let address = walletAddress;
      if (!address) {
        address = await connectWallet();
        setWalletAddress(address);
      }

      // Register provider
      const response = await registerProvider({
        ...data,
        walletAddress: address,
      });

      if (response.data.success) {
        toast.success('Provider registered successfully! Awaiting admin approval.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Provider Registration
            </h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your registration will be reviewed by the system administrator. You will receive approval notification once verified.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Provider Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Name *
              </label>
              <input
                {...register('name', { required: 'Provider name is required' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Healthcare Insurance Co."
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                {...register('contactEmail', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format',
                  },
                })}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="contact@provider.com"
              />
              {errors.contactEmail && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.contactEmail.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Registering...' : 'Register & Connect Wallet'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already registered?{' '}
              <a href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
