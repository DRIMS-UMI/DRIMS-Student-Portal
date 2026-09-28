import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Megaphone } from 'lucide-react';
import { CHANGELOG } from '../content/changelog';
import useAppVersionTracking from '../hooks/useAppVersionTracking';
import { WhatsNewContext } from './WhatsNewContext';

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ReleaseEntry = ({ entry }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-semantic-text-primary">
        <Megaphone className="h-4 w-4 text-primary-500" />
        v{entry.version}
      </span>
      <span className="text-xs text-semantic-text-secondary">{formatDate(entry.date)}</span>
    </div>
    <ul className="space-y-1.5">
      {entry.notes.map((note) => (
        <li key={note} className="flex items-start gap-2 text-sm text-gray-600">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
          <span>{note}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const WhatsNewProvider = ({ children }) => {
  const { pending, acknowledge, currentVersion, previousVersion } = useAppVersionTracking();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Open automatically the first time a student loads a release they have not
  // seen the notes for. Runs at most once per release.
  useEffect(() => {
    if (pending.length === 0) return;
    setShowHistory(false);
    setIsOpen(true);
  }, [pending.length]);

  const openHistory = useCallback(() => {
    setShowHistory(true);
    setIsOpen(true);
  }, []);

  // Dismissing the automatic prompt marks the notes as seen. Opening the
  // history manually must not suppress a release the student has not read.
  const handleOpenChange = useCallback(
    (next) => {
      setIsOpen(next);
      if (!next && !showHistory) acknowledge();
    },
    [showHistory, acknowledge]
  );

  const value = useMemo(() => ({ openHistory }), [openHistory]);

  const entries = showHistory ? CHANGELOG : pending;
  const isSingleEntry = entries.length === 1;
  const skippedFrom = !showHistory && previousVersion && entries.length > 0;

  return (
    <WhatsNewContext.Provider value={value}>
      {children}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showHistory
                ? 'Release notes'
                : isSingleEntry
                  ? `What's new in v${entries[0].version}`
                  : "What's new"}
            </DialogTitle>
            <DialogDescription>
              {showHistory
                ? 'Everything that has changed in recent releases.'
                : skippedFrom
                  ? `Updates from v${previousVersion} to v${currentVersion}.`
                  : 'Here is what changed in this release.'}
            </DialogDescription>
          </DialogHeader>

          {entries.length > 0 ? (
            <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-1">
              {entries.map((entry) => (
                <ReleaseEntry key={entry.version} entry={entry} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-semantic-text-secondary">
              No release notes have been published yet.
            </p>
          )}

          <DialogFooter>
            <button
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto bg-[#25369B] text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-[#1d285c] transition-colors"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WhatsNewContext.Provider>
  );
};
