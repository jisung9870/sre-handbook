import { Bookmark, BookmarkCheck } from 'lucide-react';

import { useBookmarks } from '@/hooks/useBookmarks';
import { cn } from '@/lib/cn';
import type { DocumentMeta } from '@/types/document';

interface BookmarkButtonProps {
  doc: DocumentMeta;
  activeTabId: string;
  activeTabLabel: string;
}

export function BookmarkButton({ doc, activeTabId, activeTabLabel }: BookmarkButtonProps) {
  const { isBookmarkedTab, getBookmarkForTab, addBookmark, removeBookmark } = useBookmarks(doc.id);

  const bookmarked = isBookmarkedTab(activeTabId);
  const existing = getBookmarkForTab(activeTabId);

  async function handleToggle() {
    if (bookmarked && existing?.id !== undefined) {
      await removeBookmark(existing.id);
    } else {
      const title = activeTabLabel ? `${doc.title} > ${activeTabLabel}` : doc.title;
      await addBookmark({ documentId: doc.id, tabId: activeTabId, title });
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
        bookmarked
          ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
          : 'bg-surface-alt text-text-secondary border-border hover:border-border-strong hover:text-text-primary',
      )}
      title={bookmarked ? '북마크 해제' : '이 탭 북마크'}
    >
      {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
      <span>{bookmarked ? '북마크됨' : '북마크'}</span>
    </button>
  );
}
