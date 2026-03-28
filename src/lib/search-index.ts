import type { SearchResult } from '@/types/search';

let cachedIndex: SearchResult[] | null = null;

export async function loadSearchIndex(): Promise<SearchResult[]> {
  if (cachedIndex) return cachedIndex;

  try {
    const res = await fetch('/data/search-index.json');
    if (!res.ok) throw new Error('Failed to load search index');
    const data = (await res.json()) as SearchResult[];
    cachedIndex = data;
    return data;
  } catch {
    return [];
  }
}
