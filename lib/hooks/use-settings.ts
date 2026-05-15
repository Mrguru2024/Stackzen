import { useSettingsStore } from '../stores/settings-store';

export const useSettings = () => {
  const { settings, updateSettings } = useSettingsStore();

  return {
    settings,
    updateSettings,
  };
};
