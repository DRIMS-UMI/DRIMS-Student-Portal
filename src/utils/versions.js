const normalise = (version) =>
  String(version ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((part) => {
      const parsed = parseInt(part, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    });

// Numeric segment comparison, not string comparison. '1.2.10' sorts before
// '1.2.9' as a string, which would silently drop a release.
export const compareVersions = (a, b) => {
  const left = normalise(a);
  const right = normalise(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
};

// Entries the student skipped over, newest first: those after `from` and up to
// and including `to`. Returns nothing for a first install (no `from`) or when
// the version moved backwards.
export const getChangelogSince = (changelog, from, to) => {
  if (!from || !to) return [];
  if (compareVersions(from, to) >= 0) return [];

  return changelog
    .filter((entry) => {
      const isAfterFrom = compareVersions(entry.version, from) > 0;
      const isAtOrBeforeTo = compareVersions(entry.version, to) <= 0;
      return isAfterFrom && isAtOrBeforeTo;
    })
    .sort((a, b) => compareVersions(b.version, a.version));
};
