import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPatientClaims } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Plus, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export default function PatientDashboard() {
  const { walletAddress } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, [walletAddress]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await getPatientClaims(walletAddress);
      setClaims(response.data);
    } catch (error) {
      toast.error('Failed to load claims');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 0: // PENDING
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 1: // APPROVED
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 2: // REJECTED
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getFraudLevelColor = (level) => {
    switch (level) {
      case 0: // LOW
        return 'bg-green-100 text-green-800';
      case 1: // MEDIUM
        return 'bg-yellow-100 text-yellow-800';
      case 2: // HIGH
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFraudLevelText = (level) => {
    switch (level) {
      case 0:
        return 'Low';
      case 1:
        return 'Medium';
      case 2:
        return 'High';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Claims</h1>
            <p className="text-gray-600 mt-2">
              Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </p>
          </div>
          <Link
            to="/patient/claims/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" />
            New Claim
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Total Claims</p>
            <p className="text-3xl font-bold text-gray-900">{claims.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {claims.filter((c) => c.status === 0).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {claims.filter((c) => c.status === 1).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {claims.filter((c) => c.status === 2).length}
            </p>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No claims yet</p>
              <Link
                to="/patient/claims/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Create Your First Claim
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Claim ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Fraud Level
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {claim.id?.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(claim.amount / 1e18).toFixed(2)} ETH
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {claim.claimType}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getFraudLevelColor(
                            claim.fraudLevel
                          )}`}
                        >
                          {getFraudLevelText(claim.fraudLevel)} ({claim.fraudScore})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(claim.status)}
                          <span className="text-sm text-gray-900">
                            {getStatusText(claim.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {claim.ipfsUrl && (
                          <a
                            href={claim.ipfsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
