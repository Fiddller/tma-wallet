import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

function getWebApp() {
  return (window as any).Telegram?.WebApp;
}

export function useTelegram() {
  const { activeModal, closeModal } = useAppStore();

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
  }, []);

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;

    if (activeModal) {
      webApp.BackButton.show();
      const handler = () => closeModal();
      webApp.BackButton.onClick(handler);
      return () => {
        webApp.BackButton.offClick(handler);
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [activeModal, closeModal]);

  const getTheme = useCallback((): 'light' | 'dark' => {
    const webApp = getWebApp();
    return webApp?.colorScheme === 'dark' ? 'dark' : 'light';
  }, []);

  const getThemeParams = useCallback(() => {
    const webApp = getWebApp();
    return webApp?.themeParams ?? {};
  }, []);

  const getUser = useCallback(() => {
    const webApp = getWebApp();
    return webApp?.initDataUnsafe?.user ?? null;
  }, []);

  return {
    webApp: getWebApp(),
    getTheme,
    getThemeParams,
    getUser,
  };
}
