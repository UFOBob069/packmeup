const COLOR_WORDS = [
  "navy",
  "teal",
  "gray",
  "grey",
  "beige",
  "tan",
  "gold",
  "silver",
  "white",
  "black",
  "red",
  "blue",
  "green",
  "pink",
  "orange",
  "yellow",
  "purple",
  "brown",
] as const;

export type GearColorName = (typeof COLOR_WORDS)[number];

export function inferColorFromName(name: string): string | null {
  const lower = name.toLowerCase();
  for (const color of COLOR_WORDS) {
    if (lower.includes(color)) return color;
  }
  return null;
}

const COLOR_PILL_CLASSES: Record<string, string> = {
  red: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200",
  blue: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-200",
  green: "border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-950/40 dark:text-green-200",
  pink: "border-pink-300 bg-pink-50 text-pink-800 dark:border-pink-500/40 dark:bg-pink-950/40 dark:text-pink-200",
  orange: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-200",
  yellow: "border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-200",
  purple: "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-500/40 dark:bg-purple-950/40 dark:text-purple-200",
  brown: "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200",
  navy: "border-indigo-400 bg-indigo-50 text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200",
  teal: "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-500/40 dark:bg-teal-950/40 dark:text-teal-200",
  gray: "border-gray-300 bg-gray-50 text-gray-800 dark:border-gray-500/40 dark:bg-gray-900/40 dark:text-gray-200",
  grey: "border-gray-300 bg-gray-50 text-gray-800 dark:border-gray-500/40 dark:bg-gray-900/40 dark:text-gray-200",
  beige: "border-stone-300 bg-stone-50 text-stone-800 dark:border-stone-500/40 dark:bg-stone-950/40 dark:text-stone-200",
  tan: "border-amber-300 bg-amber-50/80 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200",
  gold: "border-yellow-400 bg-yellow-50 text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-200",
  silver: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/40 dark:bg-slate-900/40 dark:text-slate-200",
  white: "border-slate-200 bg-white text-slate-700 dark:border-slate-400/40 dark:bg-slate-950 dark:text-slate-200",
  black: "border-slate-700 bg-slate-900 text-slate-100 dark:border-slate-500 dark:bg-black dark:text-slate-100",
};

export function gearPillClassName(color: string | null | undefined): string {
  if (!color) {
    return "border-primary/30 bg-primary/5 text-foreground dark:border-primary/40 dark:bg-primary/10";
  }
  return COLOR_PILL_CLASSES[color.toLowerCase()] ?? COLOR_PILL_CLASSES.blue;
}
