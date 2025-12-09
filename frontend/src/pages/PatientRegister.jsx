import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerPatient, getPatient } from '../services/api';
import { connectWallet, getCurrentAccount } from '../services/blockchainClient';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, User } from 'lucide-react';

export default function PatientRegister() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [fraudResult, setFraudResult] = useState(null);
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

      // Register patient
      const response = await registerPatient({
        ...data,
        walletAddress: address,
      });

      setFraudResult(response.data);

      if (response.data.success) {
        toast.success('Patient registered successfully!');
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

  const getFraudLevelColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'HIGH':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Patient Registration
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format',
                  },
                })}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Phone must be 10 digits (India format)',
                  },
                })}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="9876543210"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* National ID / Aadhaar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                National ID / Aadhaar *
              </label>
              <input
                {...register('nationalId', {
                  required: 'National ID is required',
                  pattern: {
                    value: /^\d{12}$|^\d{4}-\d{4}-\d{4}$/,
                    message: 'Aadhaar must be 12 digits or XXXX-XXXX-XXXX format',
                  },
                })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="XXXX-XXXX-XXXX"
              />
              {errors.nationalId && (
                <p className="text-red-500 text-sm mt-1">{errors.nationalId.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Registering...' : 'Register & Connect Wallet'}
            </button>
          </form>

          {/* Fraud Result */}
          {fraudResult && (
            <div className={`mt-8 p-6 border-2 rounded-lg ${getFraudLevelColor(fraudResult.fraudLevel)}`}>
              <div className="flex items-start gap-3">
                {fraudResult.fraudLevel === 'LOW' ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Fraud Assessment: {fraudResult.fraudLevel}
                  </h3>
                  <p className="mb-3">
                    Fraud Score: <strong>{fraudResult.fraudScore}/100</strong>
                  </p>
                  
                  {fraudResult.fraudFlags.length > 0 && (
                    <div className="mb-3">
                      <p className="font-medium mb-1">Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {fraudResult.fraudFlags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {fraudResult.reasons.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Reasons:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {fraudResult.reasons.map((reason, idx) => (
                          <li key={idx} className="text-sm">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already registered?{' '}
              <a href="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
