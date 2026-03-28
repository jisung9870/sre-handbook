import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

import { loadSearchIndex } from '@/lib/search-index';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import type { SearchResult } from '@/types/search';

// 모듈 레벨 캐시 — 모달을 열고 닫아도 Fuse 인스턴스 유지
let fuseInstance: Fuse<SearchResult> | null = null;
let fuseInitPromise: Promise<Fuse<SearchResult>> | null = null;

async function getFuse(): Promise<Fuse<SearchResult>> {
  if (fuseInstance) return fuseInstance;
  if (fuseInitPromise) return fuseInitPromise;

  fuseInitPromise = loadSearchIndex().then((index) => {
    fuseInstance = new Fuse(index, {
      keys: [
        { name: 'documentTitle', weight: 3 },
        { name: 'sectionTitle', weight: 2 },
        { name: 'tabLabel', weight: 1.5 },
        { name: 'content', weight: 1 },
      ],
      threshold: 0.35,
      includeMatches: true,
      minMatchCharLength: 2,
    });
    return fuseInstance;
  });

  return fuseInitPromise;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!fuseInstance) setIndexLoading(true);
      const fuse = await getFuse();
      setIndexLoading(false);
      const raw = fuse.search(query, { limit: 40 });
      setResults(raw.map((r) => r.item));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function reset() {
    setQuery('');
    setResults([]);
  }

  return { query, setQuery, results, indexLoading, reset };
}
