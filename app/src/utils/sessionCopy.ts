const copySets = {
  feed: [
    'Start with whatever has your attention.',
    'Small notes become a map of your life.',
    'There is room here for the unfinished things.',
  ],
  threads: [
    'Start a thread when something deserves your attention.',
    'Give the things in motion somewhere to grow.',
    'What are you tending to lately?',
  ],
  archive: [
    'Finished chapters are still part of your story.',
    'A quiet place for what you have carried forward.',
    'Look at what you have already moved through.',
  ],
};

export function sessionCopy(section: keyof typeof copySets): string {
  const key = `lifethread-copy-${section}`;
  const stored = sessionStorage.getItem(key);
  if (stored) return stored;
  const value = copySets[section][Math.floor(Math.random() * copySets[section].length)];
  sessionStorage.setItem(key, value);
  return value;
}
