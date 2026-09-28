import { useCallback, useEffect, useState } from 'react';
import { CHANGELOG } from '../content/changelog';
import { compareVersions, getChangelogSince } from '../utils/versions';

const APP_INFO = __APP_VERSION__;

const SEMVER_KEY = 'umi_app_semver';
const PREV_SEMVER_KEY = 'umi_prev_app_semver';
const NOTES_SEEN_KEY = 'umi_notes_seen_version';

// 0.0.0 is the placeholder version used in development builds.
const isTrackable = (version) => Boolean(version) && version !== '0.0.0';

// Tracks which app version the student is on, separately from the build
// timestamps in umi_app_version / umi_prev_app_version. Those two drive the
// "Previous build" row in Settings and the iOS icon prompt, so they are left
// untouched. Mounted once at the app root.
const useAppVersionTracking = () => {
  const [tracked] = useState(() => {
    const current = APP_INFO?.version;
    if (!isTrackable(current)) return { current: null, previous: null, pending: [] };

    const stored = localStorage.getItem(SEMVER_KEY);
    // A stored version identical to the current one means nothing changed.
    const previous = stored && stored !== current ? stored : null;
    const lastSeen = localStorage.getItem(NOTES_SEEN_KEY);

    const pending = getChangelogSince(CHANGELOG, previous, current).filter(
      (entry) => !lastSeen || compareVersions(entry.version, lastSeen) > 0
    );

    return { current, previous, pending };
  });

  const [pending, setPending] = useState(tracked.pending);
  const { current, previous } = tracked;

  useEffect(() => {
    if (!current) return;
    if (previous) localStorage.setItem(PREV_SEMVER_KEY, previous);
    localStorage.setItem(SEMVER_KEY, current);
  }, [current, previous]);

  // Marks the current version's notes as seen so the modal stays closed on
  // subsequent loads until another release ships.
  const acknowledge = useCallback(() => {
    if (current) localStorage.setItem(NOTES_SEEN_KEY, current);
    setPending([]);
  }, [current]);

  return {
    currentVersion: current,
    previousVersion: previous,
    pending,
    acknowledge,
  };
};

export default useAppVersionTracking;
