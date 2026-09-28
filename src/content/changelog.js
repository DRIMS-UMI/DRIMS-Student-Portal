// Release notes shown to students after the app updates.
//
// Add a new entry at the top whenever the version in package.json is bumped.
// Keep this list cumulative: a student jumping several releases sees every
// entry between their old version and the new one, so never delete old entries.
//
// Notes are bundled with the app rather than fetched, which guarantees a
// student can never see notes that disagree with the code they are running.
export const CHANGELOG = [
  {
    version: '1.2.7',
    date: '2026-09-28',
    notes: [
      'Settings now has a "Check for updates" button that tells you when a new version is ready to install.',
      'The update reminder no longer disappears for the rest of the session after you dismiss it.',
      'You now see release notes like these each time the app updates.',
      'If an update ever gets stuck, Settings has a "Clear cache & reload" option.',
    ],
  },
  {
    version: '1.2.6',
    date: '2026-09-23',
    notes: [
      'Proposal document uploads are no longer capped at 10 MB. You can now upload DOC and DOCX files of any size.',
      'The 28-page limit on proposals still applies.',
    ],
  },
  {
    version: '1.2.5',
    date: '2026-09-17',
    notes: [
      'Redesigned the dashboard layout for easier navigation.',
      'Refreshed the Recent Research Requests section.',
      'Appointment buttons now have clearer labels.',
      'Fixed the course summary showing incorrectly under My Profile, Account Settings.',
      'Documents that only have comments now show a comments-only status.',
      'On iPhone and iPad, you are prompted to re-add the app from your home screen when the app icon changes.',
    ],
  },
];
