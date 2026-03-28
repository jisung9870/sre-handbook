import { useState, useEffect, useCallback } from 'react';

import { db } from '@/lib/db';
import type { Memo } from '@/types/memo';

interface AddMemoParams {
  content: string;
  sectionId?: string;
}

export function useMemos(documentId?: string, tabId?: string) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemos = useCallback(async () => {
    setLoading(true);
    try {
      let result: Memo[];
      if (documentId && tabId) {
        result = await db.memos
          .where('documentId')
          .equals(documentId)
          .filter((m) => m.tabId === tabId)
          .toArray();
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (documentId) {
        result = await db.memos.where('documentId').equals(documentId).toArray();
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } else {
        result = await db.memos.orderBy('updatedAt').reverse().toArray();
      }
      setMemos(result);
    } finally {
      setLoading(false);
    }
  }, [documentId, tabId]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const addMemo = useCallback(
    async ({ content, sectionId }: AddMemoParams) => {
      if (!documentId) return;
      const now = new Date();
      await db.memos.add({
        documentId,
        tabId,
        sectionId,
        content,
        createdAt: now,
        updatedAt: now,
      });
      await fetchMemos();
    },
    [documentId, tabId, fetchMemos],
  );

  const updateMemo = useCallback(
    async (id: number, content: string) => {
      await db.memos.update(id, { content, updatedAt: new Date() });
      await fetchMemos();
    },
    [fetchMemos],
  );

  const deleteMemo = useCallback(
    async (id: number) => {
      await db.memos.delete(id);
      await fetchMemos();
    },
    [fetchMemos],
  );

  return { memos, loading, addMemo, updateMemo, deleteMemo, refresh: fetchMemos };
}
