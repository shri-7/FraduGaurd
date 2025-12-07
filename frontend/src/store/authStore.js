import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  walletAddress: null,
  role: null,
  isConnected: false,

  setUser: (user) => set({ user }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setRole: (role) => set({ role }),
  setIsConnected: (connected) => set({ isConnected: connected }),

  login: (user, walletAddress, role) => {
    set({
      user,
      walletAddress,
      role,
      isConnected: true,
    });
  },

  logout: () => {
    set({
      user: null,
      walletAddress: null,
      role: null,
      isConnected: false,
    });
  },
}));
