import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  walletAddress: null,
  role: null,
  isConnected: false,
  email: null,
  dateOfBirth: null,

  setUser: (user) => set({ user }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setRole: (role) => set({ role }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setEmail: (email) => set({ email }),
  setDateOfBirth: (dob) => set({ dateOfBirth: dob }),

  login: (user, walletAddress, role, email = null, dateOfBirth = null) => {
    set({
      user,
      walletAddress,
      role,
      isConnected: true,
      email,
      dateOfBirth,
    });
  },

  logout: () => {
    set({
      user: null,
      walletAddress: null,
      role: null,
      isConnected: false,
      email: null,
      dateOfBirth: null,
    });
  },
}));
