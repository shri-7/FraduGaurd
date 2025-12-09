import React, { useState, useEffect } from 'react';
import { getAdminStats, getAllProviders, approveProvider, rejectProvider } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CheckCircle, XCircle, AlertCircle, Shield, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, providersRes] = await Promise.all([
        getAdminStats(),
        getAllProviders(),
      ]);
      setStats(statsRes.data);
      setProviders(providersRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProvider = async (walletAddress) => {
    setActionLoading(walletAddress);
    try {
      await approveProvider(walletAddress);
      toast.success('Provider approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve provider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProvider = async (walletAddress) => {
    setActionLoading(walletAddress);
    try {
      await rejectProvider(walletAddress);
      toast.success('Provider rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject provider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProvider = async (walletAddress) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) {
      return;
    }
    setActionLoading(walletAddress);
    try {
      // Call delete endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/provider/${walletAddress}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        toast.success('Provider deleted');
        fetchData();
      } else {
        toast.error('Failed to delete provider');
      }
    } catch (error) {
      toast.error('Failed to delete provider');
    } finally {
      setActionLoading(null);
    }
  };

  const isInactive = (lastClaimDate) => {
    if (!lastClaimDate) return true;
    const daysSinceLastClaim = (Date.now() - new Date(lastClaimDate)) / (1000 * 60 * 60 * 24);
    return daysSinceLastClaim > 30;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const claimsData = [
    { name: 'Total', value: stats?.total || 0 },
    { name: 'Flagged', value: stats?.flagged || 0 },
    { name: 'High Risk', value: stats?.highRisk || 0 },
  ];

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">System Administration</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm mb-2">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalPatients || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm mb-2">Total Providers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalProviders || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm mb-2">Total Claims</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm mb-2">Flagged Claims</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats?.flagged || 0}
                </p>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Claims by Risk Level
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Low Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats?.total > 0
                                ? (stats?.lowRisk / stats?.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold">{stats?.lowRisk || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Medium Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats?.total > 0
                                ? (stats?.mediumRisk / stats?.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold">{stats?.mediumRisk || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">High Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats?.total > 0
                                ? (stats?.highRisk / stats?.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold">{stats?.highRisk || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Claims by Status
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">
                      {stats?.pending || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-semibold text-green-600">
                      {stats?.approved || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rejected</span>
                    <span className="font-semibold text-red-600">
                      {stats?.rejected || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Providers Management */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Provider Management
                </h2>
              </div>

              {providers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No providers registered</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Provider Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          GSTIN
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Approved
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Rejected
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {providers.map((provider) => (
                        <tr key={provider.walletAddress} className={`hover:bg-gray-50 ${isInactive(provider.lastClaimDate) ? 'bg-gray-100' : ''}`}>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {provider.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {provider.contactEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                            {provider.gstin || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                                provider.approvalStatus || provider.status
                              )}`}
                            >
                              {provider.approvalStatus || provider.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                            {provider.approvedCount || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                            {provider.rejectedCount || 0}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {isInactive(provider.lastClaimDate) ? (
                              <span className="text-red-600 font-semibold">INACTIVE</span>
                            ) : (
                              <span className="text-green-600 font-semibold">ACTIVE</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {(provider.approvalStatus || provider.status) === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApproveProvider(provider.walletAddress)
                                    }
                                    disabled={actionLoading === provider.walletAddress}
                                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectProvider(provider.walletAddress)
                                    }
                                    disabled={actionLoading === provider.walletAddress}
                                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                </>
                              )}
                              {isInactive(provider.lastClaimDate) && (
                                <button
                                  onClick={() =>
                                    handleDeleteProvider(provider.walletAddress)
                                  }
                                  disabled={actionLoading === provider.walletAddress}
                                  className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
