import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const { t } = useTranslation();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);

  if (isOnline) return null;

  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-2 text-xs ${
      darkMode ? 'bg-amber-500/10 border-b border-amber-500/20 text-amber-400' : 'bg-amber-50 border-b border-amber-200 text-amber-700'
    }`}>
      <WifiOff className="w-3.5 h-3.5" />
      <span>{t('offline.title')}</span>
      <span className="opacity-60">— {t('offline.desc')}</span>
    </div>
  );
}
