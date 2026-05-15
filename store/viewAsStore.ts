import { create } from 'zustand';

type ViewAsRole = 'admin' | 'super_admin' | 'pro' | 'trial' | null;

interface ViewAsState {
  viewAs: ViewAsRole;
  setViewAs: (role: ViewAsRole) => void;
}

export const useViewAsStore = create<ViewAsState>(set => ({
  viewAs: null,
  setViewAs: (role: ViewAsRole) => set({ viewAs: role }),
}));
