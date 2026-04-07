export const THEME_CLASSES = [
  'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
  'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
  'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800',
  'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
];

export const getGroupTheme = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return THEME_CLASSES[Math.abs(hash) % THEME_CLASSES.length];
};
