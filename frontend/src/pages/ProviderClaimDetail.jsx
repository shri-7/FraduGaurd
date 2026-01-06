import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getClaimById } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ProviderClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useAuthStore();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClaim = async () => {
    try {
      const response = await getClaimById(id, walletAddress);
      setClaim(response.data);
    } catch (error) {
      toast.error('Failed to load claim details');
      navigate('/provider/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 1:
        return { text: 'Approved', cls: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle className="w-5 h-5"/> };
      case 'REJECTED':
      case 2:
        return { text: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="w-5 h-5"/> };
      case 'PENDING':
      case 0:
      default:
        return { text: 'Pending', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="w-5 h-5"/> };
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4"><div className="max-w-5xl mx-auto"><p className="text-gray-600">Loading...</p></div></div>
    );
  }

  if (!claim) {
    return (
      <div className="py-12 px-4"><div className="max-w-5xl mx-auto"><p className="text-gray-600">Claim not found</p></div></div>
    );
  }

  const badge = getBadge(claim.status);

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/provider/dashboard')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4"/>
          Back to Provider Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-8 pb-6 border-b">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Claim #{claim.id?.slice(0,8)}</h1>
                <p className="text-gray-600 mt-1">Submitted on {new Date(claim.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 font-semibold flex items-center gap-2 ${badge.cls}`}>
              {badge.icon}
              {badge.text}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Patient Wallet</p>
              <p className="text-base font-mono text-gray-900">{claim.patientAddress?.slice(0,10)}...{claim.patientAddress?.slice(-8)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Claim Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹ {claim.amountInr?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Claim Type</p>
              <p className="text-2xl font-bold text-gray-900">{claim.claimType}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fraud Score</p>
              <p className="text-2xl font-bold text-gray-900">{claim.fraudScore}/100 ({claim.fraudLevel})</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-800 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{claim.description}</p>
          </div>

          {claim.attachments && claim.attachments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h2>
              <ul className="list-disc list-inside">
                {claim.attachments.map((a, i) => (
                  <li key={i} className="text-sm text-gray-800">{a.name} ({a.mimeType})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
