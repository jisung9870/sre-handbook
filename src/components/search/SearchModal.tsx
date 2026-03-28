import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Loader2 } from 'lucide-react';

import { useSearch } from '@/hooks/useSearch';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { cn } from '@/lib/cn';
import type { SearchResult } from '@/types/search';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const { query, setQuery, results, indexLoading, reset } = useSearch();
  const { categories } = useDocumentMeta();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 마운트 시 input 포커스 & body 스크롤 잠금
  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      reset();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 결과 바뀌면 선택 초기화
  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = new Array(results.length).fill(null);
  }, [results]);

  // 선택된 항목 뷰포트 내 보이도록 스크롤
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  // 카테고리 label 맵
  const catLabelMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    [categories],
  );

  // 결과를 카테고리별로 그룹핑, 각 항목에 flat index 부여
  const indexedGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      if (!map.has(r.categoryId)) {
        map.set(r.categoryId, []);
        order.push(r.categoryId);
      }
      map.get(r.categoryId)!.push(r);
    }

    let idx = 0;
    return order.map((catId) => ({
      catId,
      items: (map.get(catId) ?? []).map((result) => ({ result, idx: idx++ })),
    }));
  }, [results]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      const params = new URLSearchParams({ tab: result.tabId });
      if (result.sectionId) params.set('section', result.sectionId);
      navigate(`/doc/${result.documentId}?${params.toString()}`);
      onClose();
    },
    [navigate, onClose],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        const selected = results[selectedIndex];
        if (selected) navigateToResult(selected);
        break;
      }
      case 'Escape':
        onClose();
        break;
    }
  }

  const hasQuery = query.trim().length > 0;

  return (
    // 백드롭
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      {/* 모달 다이얼로그 */}
      <div
        className="absolute left-1/2 top-[80px] lg:top-[100px] -translate-x-1/2 w-[calc(100%-24px)] max-w-[640px] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 검색 입력 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {indexLoading ? (
            <Loader2 size={16} className="text-text-muted flex-shrink-0 animate-spin" />
          ) : (
            <Search size={16} className="text-text-muted flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="문서, 섹션, 내용 검색..."
            className="flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted"
          />
          {hasQuery && (
            <button
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-primary transition-colors p-0.5"
              aria-label="지우기"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] text-text-muted bg-surface-alt border border-border rounded px-1.5 py-0.5 ml-1">
            ESC
          </kbd>
        </div>

        {/* 결과 영역 */}
        <div className="max-h-[min(60vh,480px)] overflow-y-auto overscroll-contain">
          {/* 빈 상태 */}
          {!hasQuery && (
            <div className="py-14 text-center">
              <Search size={28} className="text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-text-muted">문서 제목, 섹션, 내용으로 검색하세요</p>
              <p className="text-xs text-text-muted mt-1 opacity-60">예: "error budget", "SLO", "kubectl"</p>
            </div>
          )}

          {/* 결과 없음 */}
          {hasQuery && !indexLoading && results.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-text-muted">
                <span className="font-mono font-semibold text-text-secondary">"{query}"</span>에 대한 결과가 없습니다
              </p>
              <p className="text-xs text-text-muted mt-1 opacity-60">다른 키워드로 검색해보세요</p>
            </div>
          )}

          {/* 카테고리별 그룹 */}
          {indexedGroups.map(({ catId, items }) => (
            <div key={catId}>
              {/* 카테고리 헤더 */}
              <div className="sticky top-0 z-10 px-4 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono bg-surface-alt border-b border-border/60">
                {catLabelMap[catId] ?? catId}
              </div>

              {/* 결과 항목 */}
              {items.map(({ result, idx }) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${result.documentId}-${result.tabId}-${result.sectionId}-${idx}`}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors border-b border-border/40 last:border-0',
                      isSelected ? 'bg-surface-alt' : 'hover:bg-surface-alt',
                    )}
                  >
                    {/* 경로 */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText size={11} className="text-text-muted flex-shrink-0" />
                      <span className="text-[11px] text-text-muted font-medium truncate">
                        <span className="text-text-secondary">{result.documentTitle}</span>
                        {result.tabLabel && (
                          <>
                            <span className="mx-1.5 opacity-40">›</span>
                            {result.tabLabel}
                          </>
                        )}
                        {result.sectionTitle && (
                          <>
                            <span className="mx-1.5 opacity-40">›</span>
                            <span className="text-text-primary font-semibold">{result.sectionTitle}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* 내용 미리보기 */}
                    {result.content && (
                      <p className="text-[11.5px] text-text-muted line-clamp-1 pl-5 leading-relaxed opacity-75">
                        {result.content.slice(0, 130)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* 키보드 힌트 푸터 */}
        <div className="px-4 py-2.5 border-t border-border bg-surface-alt flex items-center gap-4 text-[10px] text-text-muted font-mono">
          <span className="flex items-center gap-1"><kbd className="bg-surface border border-border rounded px-1">↑↓</kbd> 탐색</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface border border-border rounded px-1">↵</kbd> 이동</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface border border-border rounded px-1">ESC</kbd> 닫기</span>
          {results.length > 0 && (
            <span className="ml-auto">{results.length}개 결과</span>
          )}
        </div>
      </div>
    </div>
  );
}
