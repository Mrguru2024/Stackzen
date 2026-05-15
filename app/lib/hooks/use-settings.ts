import { useSettingsStore } from '../stores/settings-store';

export function useSettings() {
  const { settings, updateSettings } = useSettingsStore();
  return { settings, updateSettings };
}
