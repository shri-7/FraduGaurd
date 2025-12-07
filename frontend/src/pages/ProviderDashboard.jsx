import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getProviderClaims, approveClaim, rejectClaim } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function ProviderDashboard() {
  const { walletAddress } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, [walletAddress]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await getProviderClaims(walletAddress);
      setClaims(response.data);
    } catch (error) {
      toast.error('Failed to load claims');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    setActionLoading(claimId);
    try {
      await approveClaim(claimId);
      toast.success('Claim approved');
      fetchClaims();
    } catch (error) {
      toast.error('Failed to approve claim');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClaim = async (claimId) => {
    setActionLoading(claimId);
    try {
      await rejectClaim(claimId);
      toast.success('Claim rejected');
      fetchClaims();
    } catch (error) {
      toast.error('Failed to reject claim');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 0:
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 2:
        return <XCircle className="w-5 h-5 text-red-500" />;
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
      case 0:
        return 'bg-green-100 text-green-800';
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
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

  // Calculate statistics
  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === 0).length,
    approved: claims.filter((c) => c.status === 1).length,
    rejected: claims.filter((c) => c.status === 2).length,
    flagged: claims.filter((c) => c.flagged).length,
    highRisk: claims.filter((c) => c.fraudLevel === 2).length,
    mediumRisk: claims.filter((c) => c.fraudLevel === 1).length,
    lowRisk: claims.filter((c) => c.fraudLevel === 0).length,
  };

  const fraudLevelData = [
    { name: 'Low Risk', value: stats.lowRisk, fill: '#10b981' },
    { name: 'Medium Risk', value: stats.mediumRisk, fill: '#f59e0b' },
    { name: 'High Risk', value: stats.highRisk, fill: '#ef4444' },
  ];

  const statusData = [
    { name: 'Pending', value: stats.pending },
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
  ];

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Total Claims</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Flagged for Fraud</p>
            <p className="text-3xl font-bold text-red-600">{stats.flagged}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Approval Rate</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Fraud Level Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Claims by Fraud Risk Level
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fraudLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fraudLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Claims by Status
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Claims Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Claims ({stats.pending})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading claims...</p>
            </div>
          ) : claims.filter((c) => c.status === 0).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No pending claims</p>
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
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Fraud Risk
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {claims
                    .filter((c) => c.status === 0)
                    .map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {claim.id?.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {claim.patient?.slice(0, 6)}...
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveClaim(claim.id)}
                              disabled={actionLoading === claim.id}
                              className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClaim(claim.id)}
                              disabled={actionLoading === claim.id}
                              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
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
