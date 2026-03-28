import Dexie, { type Table } from 'dexie';

import type { Bookmark } from '@/types/bookmark';
import type { Memo } from '@/types/memo';

class SRELearningDB extends Dexie {
  bookmarks!: Table<Bookmark>;
  memos!: Table<Memo>;

  constructor() {
    super('sre-handbook');
    this.version(1).stores({
      bookmarks: '++id, documentId, tabId, sectionId, createdAt',
      memos: '++id, documentId, tabId, sectionId, updatedAt',
    });
  }
}

export const db = new SRELearningDB();
