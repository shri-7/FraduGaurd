import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getClaimById } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, ArrowLeft, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

export default function PatientClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useAuthStore();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaim();
  }, [id]);

  const fetchClaim = async () => {
    try {
      const response = await getClaimById(id, walletAddress);
      setClaim(response.data);
    } catch (error) {
      toast.error('Failed to load claim details');
      navigate('/patient/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading claim details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Claim not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Claims
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Claim Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Claim #{claim.id?.slice(0, 8)}</h1>
                <p className="text-gray-600 mt-1">
                  Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 font-semibold flex items-center gap-2 ${getRiskBadgeColor(claim.fraudLevel)}`}>
              {getStatusIcon(claim.status)}
              {claim.status}
            </div>
          </div>

          {/* Claim Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Claim Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹ {claim.amountInr?.toLocaleString() || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Claim Type</p>
              <p className="text-2xl font-bold text-gray-900">{claim.claimType}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fraud Risk Level</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadgeColor(claim.fraudLevel)}`}>
                {claim.fraudLevel}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fraud Score</p>
              <p className="text-2xl font-bold text-gray-900">{claim.fraudScore}/100</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{claim.description}</p>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h2>
            <div className="space-y-4">
              {/* Submitted */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                  <div className="w-1 h-8 bg-gray-300"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Submitted</p>
                  <p className="text-sm text-gray-600">{new Date(claim.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Under Review */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {claim.status !== 'PENDING' ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                  ) : (
                    <Clock className="w-6 h-6 text-yellow-600 mb-2" />
                  )}
                  {claim.status !== 'REJECTED' && <div className="w-1 h-8 bg-gray-300"></div>}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Under Review</p>
                  <p className="text-sm text-gray-600">
                    {claim.status === 'PENDING' ? 'In progress' : 'Completed'}
                  </p>
                </div>
              </div>

              {/* Final Status */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {claim.status === 'APPROVED' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : claim.status === 'REJECTED' ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {claim.status === 'APPROVED' ? 'Approved' : claim.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                  </p>
                  {claim.status !== 'PENDING' && (
                    <p className="text-sm text-gray-600">{new Date(claim.updatedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fraud Assessment */}
          {claim.fraudFlags && claim.fraudFlags.length > 0 && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-red-900 mb-3">Fraud Assessment Flags</h2>
              <div className="flex flex-wrap gap-2">
                {claim.fraudFlags.map((flag, idx) => (
                  <span key={idx} className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {claim.attachments && claim.attachments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h2>
              <div className="space-y-2">
                {claim.attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={`${PINATA_GATEWAY}${attachment.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">{attachment.name}</span>
                    <Download className="w-4 h-4 text-blue-600 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Provider Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Provider Information</h2>
            <p className="text-gray-700">
              <strong>Provider Wallet:</strong> {claim.providerAddress?.slice(0, 10)}...{claim.providerAddress?.slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
