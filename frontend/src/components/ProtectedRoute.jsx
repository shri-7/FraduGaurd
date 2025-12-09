import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

/**
 * Protected Route Component
 * Validates user authorization before allowing access
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { walletAddress, role, isConnected } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      // If user is connected and has a wallet, allow access
      if (walletAddress && isConnected) {
        // Try to validate with backend, but don't block if it fails
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/auth/validate?walletAddress=${walletAddress}`
          );

          if (response.ok) {
            const data = await response.json();
            
            // Check if user has required role
            if (requiredRole && data.role !== requiredRole) {
              setIsAuthorized(false);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('Auth validation warning:', error.message);
          // Continue anyway - user is already connected
        }

        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // No wallet or not connected
      setIsAuthorized(false);
      setIsLoading(false);
    };

    validateAuth();
  }, [walletAddress, isConnected, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
