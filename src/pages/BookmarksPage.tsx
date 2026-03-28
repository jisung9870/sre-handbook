import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Terminal,
  Network,
  BarChart3,
  GitBranch,
  Layers,
  Users,
  Cpu,
  Container,
  ChevronRight,
  Trash2,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

import { useBookmarks } from '@/hooks/useBookmarks';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { db } from '@/lib/db';
import { cn } from '@/lib/cn';
import type { Bookmark as BookmarkType } from '@/types/bookmark';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Terminal, Network, BarChart3, GitBranch, Layers, Users, Cpu, Container,
};

interface UndoState {
  bookmark: BookmarkType;
  timeoutId: ReturnType<typeof setTimeout>;
}

export function BookmarksPage() {
  const { bookmarks, loading, removeBookmark, refresh } = useBookmarks();
  const { documents, categories } = useDocumentMeta();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState<'newest' | 'alpha'>('newest');
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (undoState) clearTimeout(undoState.timeoutId);
    };
  }, [undoState]);

  function handleDelete(bm: BookmarkType) {
    if (bm.id === undefined) return;

    if (undoState) clearTimeout(undoState.timeoutId);

    removeBookmark(bm.id);

    const timeoutId = setTimeout(() => {
      setUndoState(null);
    }, 4500);

    setUndoState({ bookmark: bm, timeoutId });
  }

  async function handleUndo() {
    if (!undoState) return;
    clearTimeout(undoState.timeoutId);
    const { bookmark: bm } = undoState;

    await db.bookmarks.add({
      documentId: bm.documentId,
      tabId: bm.tabId,
      sectionId: bm.sectionId,
      title: bm.title,
      createdAt: bm.createdAt,
    });

    setUndoState(null);
    await refresh();
  }

  function handleNavigate(bm: BookmarkType) {
    const params = new URLSearchParams();
    if (bm.tabId) params.set('tab', bm.tabId);
    if (bm.sectionId) params.set('section', bm.sectionId);
    const qs = params.toString();
    navigate(`/doc/${bm.documentId}${qs ? `?${qs}` : ''}`);
  }

  // 카테고리별 그룹핑
  const groupedBookmarks = useMemo(() => {
    const sorted = [...bookmarks].sort((a, b) =>
      sortBy === 'newest'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : a.title.localeCompare(b.title, 'ko'),
    );

    const order: string[] = [];
    const map = new Map<string, { bm: BookmarkType; docTitle: string }[]>();

    for (const bm of sorted) {
      const doc = documents.find((d) => d.id === bm.documentId);
      const catId = doc?.category ?? 'unknown';
      if (!map.has(catId)) {
        map.set(catId, []);
        order.push(catId);
      }
      map.get(catId)!.push({ bm, docTitle: doc?.title ?? bm.documentId });
    }

    return order.map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        catId,
        catLabel: cat?.label ?? catId,
        catIcon: cat?.icon ?? 'BookOpen',
        catColor: cat?.color ?? 'var(--color-blue)',
        items: map.get(catId)!,
      };
    });
  }, [bookmarks, documents, categories, sortBy]);

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Bookmark size={20} className="text-amber-500" />
          북마크
          <span className="font-mono text-sm font-normal text-text-muted">({bookmarks.length})</span>
        </h1>

        {/* 정렬 토글 */}
        <div className="flex items-center gap-1 text-xs">
          {(['newest', 'alpha'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                sortBy === opt
                  ? 'bg-surface-alt border-border-strong text-text-primary font-medium'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {opt === 'newest' ? '최신순' : '이름순'}
            </button>
          ))}
        </div>
      </div>

      {/* 빈 상태 */}
      {bookmarks.length === 0 && (
        <div className="text-center py-20">
          <Bookmark size={36} className="text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">아직 북마크가 없습니다</p>
          <p className="text-text-muted text-xs mt-1 opacity-60">
            문서를 읽으면서 중요한 탭을 북마크해보세요
          </p>
        </div>
      )}

      {/* 카테고리별 그룹 */}
      {groupedBookmarks.map(({ catId, catLabel, catIcon, catColor, items }) => {
        const Icon = iconMap[catIcon] ?? BookOpen;
        return (
          <section key={catId}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={13} style={{ color: catColor }} />
              <span className="text-[12px] font-semibold text-text-secondary">{catLabel}</span>
              <span className="font-mono text-[10px] text-text-muted">({items.length})</span>
            </div>

            <div className="rounded-[10px] border border-border bg-surface overflow-hidden divide-y divide-border">
              {items.map(({ bm }) => (
                <div
                  key={bm.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt transition-colors group"
                >
                  <Bookmark size={12} className="text-amber-400 flex-shrink-0" />

                  <button
                    onClick={() => handleNavigate(bm)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="text-[13px] font-medium text-text-primary truncate">
                      {bm.title}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {formatDate(bm.createdAt)}
                    </div>
                  </button>

                  <ChevronRight
                    size={12}
                    className="text-text-muted opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0"
                  />

                  <button
                    onClick={() => handleDelete(bm)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Undo Toast */}
      {undoState && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a1d23] text-white px-5 py-3 rounded-xl shadow-2xl text-[13px] border border-white/10 whitespace-nowrap">
          <Trash2 size={13} className="text-white/50 flex-shrink-0" />
          <span className="text-white/70">
            <span className="font-semibold text-white">"{undoState.bookmark.title}"</span> 삭제됨
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 ml-2 text-[#60a5fa] hover:text-blue-300 font-semibold transition-colors"
          >
            <Undo2 size={13} />
            실행 취소
          </button>
        </div>
      )}
    </div>
  );
}
