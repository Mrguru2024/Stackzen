import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

interface SettingsStore {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  currency: 'USD',
  theme: 'system',
  notifications: true,
};

export const _useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      settings: defaultSettings,
      updateSettings: newSettings =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'settings-storage',
    }
  )
);
