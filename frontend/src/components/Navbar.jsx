import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectWallet, getCurrentAccount } from '../services/blockchainClient';
import { Wallet, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { walletAddress, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [displayAddress, setDisplayAddress] = useState('');

  useEffect(() => {
    if (walletAddress) {
      setDisplayAddress(`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
    }
  }, [walletAddress]);

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      toast.success('Wallet connected!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
            <Wallet className="w-6 h-6" />
            <span>SecureChain</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {walletAddress ? (
              <>
                <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
                  {displayAddress}
                </span>
                {role && (
                  <span className="text-sm bg-blue-500 px-3 py-1 rounded-full">
                    {role}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {walletAddress ? (
              <>
                <div className="text-sm bg-blue-700 px-3 py-2 rounded">
                  {displayAddress}
                </div>
                {role && (
                  <div className="text-sm bg-blue-500 px-3 py-2 rounded">
                    {role}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-1 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="w-full flex items-center space-x-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
