import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StickyNote, Pencil, Trash2, Check, X, ChevronRight } from 'lucide-react';

import { useMemos } from '@/hooks/useMemos';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { cn } from '@/lib/cn';
import type { Memo } from '@/types/memo';

interface ConfirmDeleteState {
  memoId: number;
}

export function MemosPage() {
  const { memos, loading, updateMemo, deleteMemo } = useMemos();
  const { documents } = useDocumentMeta();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);

  const filteredMemos = useMemo(() => {
    if (!searchQuery.trim()) return memos;
    const q = searchQuery.toLowerCase();
    return memos.filter((m) => m.content.toLowerCase().includes(q));
  }, [memos, searchQuery]);

  function getDocTitle(documentId: string): string {
    return documents.find((d) => d.id === documentId)?.title ?? documentId;
  }

  function getTabLabel(memo: Memo): string | undefined {
    if (!memo.tabId) return undefined;
    const doc = documents.find((d) => d.id === memo.documentId);
    return doc?.tabs.find((t) => t.id === memo.tabId)?.label;
  }

  function handleNavigate(memo: Memo) {
    const params = new URLSearchParams();
    if (memo.tabId) params.set('tab', memo.tabId);
    if (memo.sectionId) params.set('section', memo.sectionId);
    const qs = params.toString();
    navigate(`/doc/${memo.documentId}${qs ? `?${qs}` : ''}`);
  }

  function handleStartEdit(memo: Memo) {
    if (memo.id === undefined) return;
    setEditingId(memo.id);
    setEditContent(memo.content);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  async function handleSubmitEdit() {
    const trimmed = editContent.trim();
    if (!trimmed || editingId === null) return;
    await updateMemo(editingId, trimmed);
    setEditingId(null);
    setEditContent('');
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitEdit();
    }
    if (e.key === 'Escape') handleCancelEdit();
  }

  function handleDeleteClick(memoId: number) {
    setConfirmDelete({ memoId });
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    await deleteMemo(confirmDelete.memoId);
    setConfirmDelete(null);
    if (editingId === confirmDelete.memoId) setEditingId(null);
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <div className="space-y-6 relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <StickyNote size={20} className="text-yellow-500" />
          메모
          <span className="font-mono text-sm font-normal text-text-muted">({memos.length})</span>
        </h1>
      </div>

      {/* 검색 */}
      {memos.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="메모 내용 검색..."
            className="w-full px-4 py-2.5 text-[13px] bg-surface border border-border rounded-xl outline-none focus:border-accent-blue/50 text-text-primary placeholder:text-text-muted transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {memos.length === 0 && (
        <div className="text-center py-20">
          <StickyNote size={36} className="text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">아직 메모가 없습니다</p>
          <p className="text-text-muted text-xs mt-1 opacity-60">
            문서를 읽으면서 메모를 남겨보세요
          </p>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {memos.length > 0 && filteredMemos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted text-sm">
            <span className="font-mono font-semibold text-text-secondary">"{searchQuery}"</span>
            에 대한 메모가 없습니다
          </p>
        </div>
      )}

      {/* 메모 목록 */}
      <div className="space-y-3">
        {filteredMemos.map((memo) => {
          const tabLabel = getTabLabel(memo);
          return (
            <div
              key={memo.id}
              className="group rounded-[10px] border border-border bg-surface overflow-hidden"
            >
              {editingId === memo.id ? (
                <>
                  <textarea
                    autoFocus
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={4}
                    className="w-full px-4 pt-3 pb-2 text-[13px] text-text-primary bg-transparent outline-none resize-none border-b border-accent-blue/30"
                  />
                  <div className="flex items-center justify-end gap-2 px-3 pb-2.5">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X size={12} />
                      취소
                    </button>
                    <button
                      onClick={handleSubmitEdit}
                      disabled={!editContent.trim()}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1 text-[12px] rounded-lg font-medium transition-colors',
                        editContent.trim()
                          ? 'bg-accent-blue text-white hover:bg-blue-700'
                          : 'bg-surface-alt text-text-muted cursor-not-allowed',
                      )}
                    >
                      <Check size={12} />
                      저장
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-3">
                  {/* 문서/탭 경로 + 이동 버튼 */}
                  <button
                    onClick={() => handleNavigate(memo)}
                    className="flex items-center gap-1.5 mb-2 text-[11px] text-text-muted hover:text-accent-blue transition-colors group/nav"
                  >
                    <span className="font-medium text-text-secondary group-hover/nav:text-accent-blue">
                      {getDocTitle(memo.documentId)}
                    </span>
                    {tabLabel && (
                      <>
                        <span className="opacity-40">›</span>
                        <span>{tabLabel}</span>
                      </>
                    )}
                    <ChevronRight
                      size={11}
                      className="opacity-0 group-hover/nav:opacity-60 transition-opacity"
                    />
                  </button>

                  <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">
                    {memo.content}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-text-muted font-mono">
                      {formatDate(memo.updatedAt)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(memo)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-blue-50 transition-colors"
                        title="수정"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => memo.id !== undefined && handleDeleteClick(memo.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-red-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl p-6 max-w-sm w-full mx-4">
            <p className="text-[14px] font-semibold text-text-primary mb-1">메모를 삭제할까요?</p>
            <p className="text-[12px] text-text-muted mb-5">삭제된 메모는 복구할 수 없습니다.</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary border border-border rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-[13px] text-white bg-accent-red hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
