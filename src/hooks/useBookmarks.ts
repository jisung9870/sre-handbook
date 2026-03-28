import { useState, useEffect, useCallback } from 'react';

import { db } from '@/lib/db';
import type { Bookmark } from '@/types/bookmark';

async function fetchBookmarks(documentId?: string): Promise<Bookmark[]> {
  if (documentId) {
    return db.bookmarks.where('documentId').equals(documentId).sortBy('createdAt');
  }
  return db.bookmarks.orderBy('createdAt').reverse().toArray();
}

export function useBookmarks(documentId?: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchBookmarks(documentId);
    setBookmarks(data);
  }, [documentId]);

  useEffect(() => {
    setLoading(true);
    fetchBookmarks(documentId).then((data) => {
      setBookmarks(data);
      setLoading(false);
    });
  }, [documentId]);

  const addBookmark = useCallback(
    async (bm: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> => {
      const id = await db.bookmarks.add({ ...bm, createdAt: new Date() });
      const created = (await db.bookmarks.get(id))!;
      setBookmarks((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const removeBookmark = useCallback(async (id: number) => {
    await db.bookmarks.delete(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const getBookmarkForTab = useCallback(
    (tabId: string) => bookmarks.find((b) => b.tabId === tabId),
    [bookmarks],
  );

  const isBookmarkedTab = useCallback(
    (tabId: string) => bookmarks.some((b) => b.tabId === tabId),
    [bookmarks],
  );

  return { bookmarks, loading, addBookmark, removeBookmark, getBookmarkForTab, isBookmarkedTab, refresh };
}
