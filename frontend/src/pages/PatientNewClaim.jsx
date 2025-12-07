import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { createClaim, getAllProviders } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function PatientNewClaim() {
  const navigate = useNavigate();
  const { walletAddress } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [claimResult, setClaimResult] = useState(null);

  React.useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await getAllProviders();
      const approvedProviders = response.data.filter((p) => p.status === 'APPROVED');
      setProviders(approvedProviders);
    } catch (error) {
      toast.error('Failed to load providers');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await createClaim({
        patientWallet: walletAddress,
        providerWallet: data.providerWallet,
        amount: parseInt(data.amount),
        claimType: data.claimType,
        description: data.description,
        attachments: [],
      });

      setClaimResult(response.data);
      toast.success('Claim created successfully!');

      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 3000);
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
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Submit New Claim
            </h1>
          </div>

          {!claimResult ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Provider *
                </label>
                <select
                  {...register('providerWallet', {
                    required: 'Provider is required',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a provider</option>
                  {providers.map((provider) => (
                    <option key={provider.walletAddress} value={provider.walletAddress}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                {errors.providerWallet && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.providerWallet.message}
                  </p>
                )}
              </div>

              {/* Claim Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Type *
                </label>
                <select
                  {...register('claimType', { required: 'Claim type is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select claim type</option>
                  <option value="HOSPITALIZATION">Hospitalization</option>
                  <option value="OUTPATIENT">Outpatient</option>
                  <option value="SURGERY">Surgery</option>
                  <option value="MEDICATION">Medication</option>
                  <option value="DIAGNOSTIC">Diagnostic</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.claimType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.claimType.message}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Amount (in Wei) *
                </label>
                <input
                  {...register('amount', {
                    required: 'Amount is required',
                    pattern: {
                      value: /^\d+$/,
                      message: 'Amount must be a number',
                    },
                  })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000000000000000000"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  1 ETH = 1000000000000000000 Wei
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                  })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your claim..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          ) : (
            <div className={`p-6 border-2 rounded-lg ${getFraudLevelColor(claimResult.fraudLevel)}`}>
              <div className="flex items-start gap-3">
                {claimResult.fraudLevel === 'LOW' ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Claim Submitted Successfully
                  </h3>
                  <p className="mb-3">
                    <strong>Claim ID:</strong> {claimResult.claim?.id?.slice(0, 8)}...
                  </p>
                  <p className="mb-3">
                    <strong>Fraud Assessment:</strong> {claimResult.fraudLevel}
                  </p>
                  <p className="mb-3">
                    <strong>Fraud Score:</strong> {claimResult.fraudScore}/100
                  </p>

                  {claimResult.fraudFlags.length > 0 && (
                    <div className="mb-3">
                      <p className="font-medium mb-1">Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {claimResult.fraudFlags.map((flag, idx) => (
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

                  {claimResult.reasons.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Analysis:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {claimResult.reasons.map((reason, idx) => (
                          <li key={idx} className="text-sm">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-sm mt-4 text-gray-600">
                    Redirecting to dashboard in 3 seconds...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
