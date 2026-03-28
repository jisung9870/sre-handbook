import { useState, useRef } from 'react';
import { StickyNote, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

import { useMemos } from '@/hooks/useMemos';
import { cn } from '@/lib/cn';
import type { Memo } from '@/types/memo';

interface MemoEditorProps {
  documentId: string;
  tabId: string;
}

interface ConfirmDeleteState {
  memoId: number;
}

export function MemoEditor({ documentId, tabId }: MemoEditorProps) {
  const { memos, loading, addMemo, updateMemo, deleteMemo } = useMemos(documentId, tabId);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const addTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  function handleStartAdd() {
    setIsAdding(true);
    setEditingId(null);
    setTimeout(() => addTextareaRef.current?.focus(), 0);
  }

  function handleCancelAdd() {
    setIsAdding(false);
    setNewContent('');
  }

  async function handleSubmitAdd() {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    await addMemo({ content: trimmed });
    setNewContent('');
    setIsAdding(false);
  }

  function handleStartEdit(memo: Memo) {
    if (memo.id === undefined) return;
    setEditingId(memo.id);
    setEditContent(memo.content);
    setIsAdding(false);
    setTimeout(() => editTextareaRef.current?.focus(), 0);
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

  function handleDeleteClick(memoId: number) {
    setConfirmDelete({ memoId });
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    await deleteMemo(confirmDelete.memoId);
    setConfirmDelete(null);
    if (editingId === confirmDelete.memoId) {
      setEditingId(null);
    }
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitAdd();
    }
    if (e.key === 'Escape') handleCancelAdd();
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitEdit();
    }
    if (e.key === 'Escape') handleCancelEdit();
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) return null;

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
          <StickyNote size={14} className="text-text-muted" />
          메모
          {memos.length > 0 && (
            <span className="font-mono text-[11px] font-normal text-text-muted">
              ({memos.length})
            </span>
          )}
        </h2>
        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="flex items-center gap-1 text-[12px] text-text-muted hover:text-accent-blue transition-colors"
          >
            <Plus size={13} />
            메모 추가
          </button>
        )}
      </div>

      {/* 새 메모 입력 */}
      {isAdding && (
        <div className="mb-4 rounded-[10px] border border-accent-blue/40 bg-surface overflow-hidden">
          <textarea
            ref={addTextareaRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="메모를 입력하세요... (Cmd+Enter로 저장, ESC로 취소)"
            rows={3}
            className="w-full px-4 pt-3 pb-2 text-[13px] text-text-primary bg-transparent outline-none resize-none placeholder:text-text-muted"
          />
          <div className="flex items-center justify-end gap-2 px-3 pb-2.5">
            <button
              onClick={handleCancelAdd}
              className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={12} />
              취소
            </button>
            <button
              onClick={handleSubmitAdd}
              disabled={!newContent.trim()}
              className={cn(
                'flex items-center gap-1 px-3 py-1 text-[12px] rounded-lg font-medium transition-colors',
                newContent.trim()
                  ? 'bg-accent-blue text-white hover:bg-blue-700'
                  : 'bg-surface-alt text-text-muted cursor-not-allowed',
              )}
            >
              <Check size={12} />
              저장
            </button>
          </div>
        </div>
      )}

      {/* 메모 목록 */}
      {memos.length === 0 && !isAdding && (
        <p className="text-[12px] text-text-muted opacity-60 py-2">
          이 탭에 메모가 없습니다.
        </p>
      )}

      <div className="space-y-3">
        {memos.map((memo) => (
          <div
            key={memo.id}
            className="group rounded-[10px] border border-border bg-surface overflow-hidden"
          >
            {editingId === memo.id ? (
              <>
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={3}
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
        ))}
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
