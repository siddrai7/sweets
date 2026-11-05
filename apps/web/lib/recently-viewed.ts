/** Product ids this device viewed, newest first. */
const KEY = 'sweets.recent';
const MAX = 12;

export function recentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function recordView(productId: string) {
  try {
    const next = [productId, ...recentlyViewed().filter((id) => id !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
