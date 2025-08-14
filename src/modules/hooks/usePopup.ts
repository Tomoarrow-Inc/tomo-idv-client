import { useCallback } from 'react';
import { config } from '../ClientEnv';
import { useEnvironment } from './useEnvironment';

interface PopupOptions {
  width?: number;
  height?: number;
  features?: string;
  name?: string;
}

export interface UsePopupReturn {
  openTomoIDVPopup: (sessionId: string, options?: PopupOptions) => Window | null;
}

export const usePopup = (): UsePopupReturn => {
  const { isReady: isEnvironmentReady, error: envError } = useEnvironment();

  const openPopup = useCallback((url: string, options: PopupOptions = {}): Window | null => {
    if (!isEnvironmentReady) {
      console.error('Cannot open popup: Environment is not ready:', envError);
      return null;
    }

    const {
      width = 500,
      height = 600,
      features = 'popup=1,noopener,noreferrer,scrollbars=yes,resizable=yes',
      name = 'Popup'
    } = options;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popupFeatures = `${features},width=${width},height=${height},left=${left},top=${top}`;

    const popup = window.open(url, name, popupFeatures);

    if (popup) {
      console.log(`Popup opened: ${name}`);
    } else {
      console.error('Failed to open popup - popup blocked by browser');
    }

    return popup;
  }, [isEnvironmentReady, envError]);

  const openTomoIDVPopup = useCallback((sessionId: string, options: PopupOptions = {}): Window | null => {
    if (!sessionId) {
      console.error('Session ID is required to open TomoIDV popup');
      return null;
    }

    if (!isEnvironmentReady) {
      console.error('Cannot open TomoIDV popup: Environment is not ready:', envError);
      return null;
    }

    const url = `${config.tomoIdvAppUrl}?sessionId=${encodeURIComponent(sessionId)}`;
    
    return openPopup(url, {
      name: 'TomoIDV',
      ...options
    });
  }, [openPopup, isEnvironmentReady, envError]);

  return {
    openTomoIDVPopup
  };
};
