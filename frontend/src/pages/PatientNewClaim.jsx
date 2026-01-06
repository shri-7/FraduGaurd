import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { createClaim, getAllProviders, scoreClaim } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, AlertCircle, CheckCircle, Upload } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function PatientNewClaim() {
  const navigate = useNavigate();
  const { walletAddress } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [claimResult, setClaimResult] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [predictedRisk, setPredictedRisk] = useState(null);

  React.useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await getAllProviders();
      const approvedProviders = response.data.filter((p) => p.approvalStatus === 'APPROVED');
      setProviders(approvedProviders);
    } catch (error) {
      toast.error('Failed to load providers');
    }
  };

  const handlePredictRisk = async () => {
    try {
      const form = document.querySelector('form');
      const providerWallet = form?.elements?.providerWallet?.value || '';
      const claimType = form?.elements?.claimType?.value || '';
      const amountInr = Number(form?.elements?.amountInr?.value || 0);
      const description = form?.elements?.description?.value || '';

      if (!providerWallet || !claimType || !amountInr || !description) {
        toast.error('Fill provider, claim type, amount and description to predict risk');
        return;
      }

      const payload = {
        patientWallet: walletAddress,
        providerWallet,
        amountInr,
        claimType,
        description,
        attachments: uploadedFiles,
        createdAt: new Date().toISOString(),
      };
      const res = await scoreClaim(payload);
      setPredictedRisk({
        score: res.data?.score,
        decision: res.data?.decision,
        explanation: res.data?.explanation || [],
      });
      toast.success('Predicted fraud risk computed');
    } catch (e) {
      setPredictedRisk(null);
      toast.error('Could not compute predicted risk');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setUploadingFiles(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedFiles([...uploadedFiles, ...data.attachments]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const onSubmit = async (data) => {
    if (!data.amountInr || parseInt(data.amountInr) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await createClaim({
        patientWallet: walletAddress,
        providerWallet: data.providerWallet,
        amountInr: parseInt(data.amountInr),
        claimType: data.claimType,
        description: data.description,
        attachments: uploadedFiles,
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
                  <option value="ACCIDENT">Accident</option>
                  <option value="SURGERY">Surgery</option>
                  <option value="HOSPITALIZATION">Hospitalization</option>
                </select>
                {errors.claimType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.claimType.message}
                  </p>
                )}
              </div>

              {/* Amount in INR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Amount (₹ INR) *
                </label>
                <input
                  {...register('amountInr', {
                    required: 'Amount is required',
                    pattern: {
                      value: /^\d+$/,
                      message: 'Amount must be a number',
                    },
                  })}
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000"
                  min="1"
                />
                {errors.amountInr && (
                  <p className="text-red-500 text-sm mt-1">{errors.amountInr.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Enter amount in Indian Rupees (₹)
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

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploadingFiles}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-sm text-gray-600">
                      {uploadingFiles ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (Max 5MB each)
                    </p>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Uploaded Files ({uploadedFiles.length}):
                    </p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePredictRisk}
                  className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Predict Fraud Risk (Preview)
                </button>
                {predictedRisk && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-semibold">Predicted Score:</span>{' '}
                    {predictedRisk.score === null || predictedRisk.score === undefined
                      ? 'N/A'
                      : `${Math.round(predictedRisk.score * 100)}/100`}
                    <span className="ml-3 font-semibold">Decision:</span>{' '}
                    {predictedRisk.decision}
                    {predictedRisk.explanation?.length > 0 && (
                      <ul className="list-disc list-inside mt-1">
                        {predictedRisk.explanation.map((e, i) => (
                          <li key={i}>{e.feature}: {e.contribution?.toFixed ? e.contribution.toFixed(3) : e.contribution}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
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
