import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, X, Info } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const APP_INFO = __APP_VERSION__;

const UPDATE_DISMISSED_KEY = 'umi-update-dismissed-at';
const UPDATE_NAG_COOLDOWN = 24 * 60 * 60 * 1000;

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
  const [showIOSReinstall, setShowIOSReinstall] = useState(false);
  const [updateDismissedAt, setUpdateDismissedAt] = useState(
    () => Number(sessionStorage.getItem(UPDATE_DISMISSED_KEY)) || 0
  );
  const location = useLocation();

  const {
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
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const iconVersion = APP_INFO?.iconVersion;

    if (!ios || !standalone || !iconVersion) return;

    const storedIconVersion = localStorage.getItem('drims_icon_version');
    if (storedIconVersion !== iconVersion) {
      setShowIOSReinstall(true);
    }
  }, []);

  const handleDismissIOSReinstall = () => {
    setShowIOSReinstall(false);
    localStorage.setItem('drims_icon_version', APP_INFO?.iconVersion);
  };

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

  // The "Later" / close actions only reset local component state, so the toast used to stay
  // gone for the rest of the session once a student dismissed it mid-app. Re-assert it on
  // each route change, honouring a cooldown so it never nags on every click.
  useEffect(() => {
    if (Date.now() - updateDismissedAt <= UPDATE_NAG_COOLDOWN) return;
    if (registrationRef.current?.waiting) setNeedRefresh(true);
  }, [location.pathname, updateDismissedAt, setNeedRefresh]);

  const hasUpdate = needRefresh && previousBuild && previousBuild !== APP_INFO?.build;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismissUpdate = () => {
    setNeedRefresh(false);
    const dismissedAt = Date.now();
    sessionStorage.setItem(UPDATE_DISMISSED_KEY, String(dismissedAt));
    setUpdateDismissedAt(dismissedAt);
  };

  return (
    <>
      {showIOSReinstall && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[101]">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#25369B] flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">New app icon available</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                To see the updated icon, remove this app from your home screen and re-install from Safari.
              </p>
            </div>
            <button
              onClick={handleDismissIOSReinstall}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Long-press this app icon and tap <strong>Remove App</strong></span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Open <strong>Safari</strong> and visit this site</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Tap <strong>Share</strong> then <strong>Add to Home Screen</strong></span>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={handleDismissIOSReinstall}
              className="w-full bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

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
              {/* The release notes for the incoming version live in the new bundle, which is
                  not running yet, so they can only be shown once the update completes. */}
              <p className="text-xs text-gray-400 mt-1">
                We&apos;ll show you what changed once the update finishes.
              </p>
            </div>
            <button
              onClick={handleDismissUpdate}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-[#25369B] text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-[#1d285c] transition-colors"
            >
              Update now
            </button>
            <button
              onClick={handleDismissUpdate}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
            >
              Remind me tomorrow
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAUpdateToast;
