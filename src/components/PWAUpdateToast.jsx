import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, X, WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const APP_INFO = __APP_VERSION__;

const formatBuild = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const PWAUpdateToast = () => {
  const registrationRef = useRef(null);
  const [previousBuild] = useState(() => localStorage.getItem('umi_prev_app_version'));

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      registrationRef.current = registration;
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    const current = APP_INFO?.build;
    if (!current) return;
    const lastSeen = localStorage.getItem('umi_app_version');
    if (lastSeen && lastSeen !== current) {
      localStorage.setItem('umi_prev_app_version', lastSeen);
    }
    localStorage.setItem('umi_app_version', current);
  }, []);

  useEffect(() => {
    const checkForUpdates = () => registrationRef.current?.update();
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdates();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  const hasUpdate = needRefresh && previousBuild && previousBuild !== APP_INFO?.build;

  return (
    <>
      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[100]">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#25369B] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">A new version is available</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasUpdate ? (
                  <>Updating from build {formatBuild(previousBuild)} to {formatBuild(APP_INFO?.build)}.</>
                ) : (
                  <>A newer build of the app is ready to install.</>
                )}{' '}
                Update now to get the latest features and fixes.
              </p>
            </div>
            <button
              onClick={() => setNeedRefresh(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-[#25369B] text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-[#1d285c] transition-colors"
            >
              Update now
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {offlineReady && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[100]">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-green-700" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Ready to work offline</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                The app has been cached and will keep working without a connection.
              </p>
            </div>
            <button
              onClick={() => setOfflineReady(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAUpdateToast;
