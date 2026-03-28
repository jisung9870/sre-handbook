import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Terminal,
  Network,
  BarChart3,
  GitBranch,
  Layers,
  Users,
  Cpu,
  Container,
  Clock,
  type LucideIcon,
} from 'lucide-react';

import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useApp } from '@/contexts/AppContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useMemos } from '@/hooks/useMemos';
import { cn } from '@/lib/cn';
import type { Category } from '@/types/document';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Terminal, Network, BarChart3, GitBranch, Layers, Users, Cpu, Container,
};

function CategoryCard({ cat, docCount }: { cat: Category; docCount: number }) {
  const navigate = useNavigate();
  const Icon = iconMap[cat.icon] ?? BookOpen;

  return (
    <button
      onClick={() => navigate(`/doc/${cat.documents[0]}`)}
      className="rounded-[10px] shadow-sm border border-border bg-surface p-5 text-left hover:border-border-strong hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${cat.color}18` }}
        >
          <Icon size={18} style={{ color: cat.color }} />
        </div>
        <div>
          <div className="font-semibold text-text-primary text-[13px] leading-tight">{cat.label}</div>
          <div className="font-mono text-[10px] text-text-muted mt-0.5">{docCount} docs</div>
        </div>
      </div>
    </button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { categories, documents, loading } = useDocumentMeta();
  const { recentDocuments } = useApp();
  const { bookmarks } = useBookmarks();
  const { memos } = useMemos();

  const recentDocs = recentDocuments
    .slice(0, 5)
    .map(({ documentId, visitedAt }) => ({
      doc: documents.find((d) => d.id === documentId),
      visitedAt,
    }))
    .filter((r) => r.doc !== undefined);

  function formatRelativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">SRE Handbook</h1>
        <p className="text-text-secondary text-sm">
          {documents.length}개 문서 · {categories.length}개 카테고리
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[10px] border border-border bg-surface px-4 py-3 text-center">
          <div className="text-2xl font-bold text-text-primary font-mono">{documents.length}</div>
          <div className="text-[11px] text-text-muted mt-1">문서</div>
        </div>
        <div className="rounded-[10px] border border-border bg-surface px-4 py-3 text-center">
          <div className="text-2xl font-bold text-accent-blue font-mono">{bookmarks.length}</div>
          <div className="text-[11px] text-text-muted mt-1">북마크</div>
        </div>
        <div className="rounded-[10px] border border-border bg-surface px-4 py-3 text-center">
          <div className="text-2xl font-bold text-accent-purple font-mono">{memos.length}</div>
          <div className="text-[11px] text-text-muted mt-1">메모</div>
        </div>
      </div>

      {/* 카테고리 그리드 */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider font-mono mb-4">
          카테고리
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const count = cat.documents.filter((id) => documents.some((d) => d.id === id)).length;
            return <CategoryCard key={cat.id} cat={cat} docCount={count} />;
          })}
        </div>
      </section>

      {/* 최근 본 문서 */}
      {recentDocs.length > 0 && (
        <section>
          <h2 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Clock size={13} />
            최근 본 문서
          </h2>
          <div className="rounded-[10px] border border-border bg-surface overflow-hidden divide-y divide-border">
            {recentDocs.map(({ doc, visitedAt }) => {
              if (!doc) return null;
              const cat = categories.find((c) => c.id === doc.category);
              return (
                <button
                  key={doc.id}
                  onClick={() => navigate(`/doc/${doc.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt transition-colors text-left"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cat?.color ?? 'var(--color-text-muted)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-primary truncate">{doc.title}</div>
                    <div className="text-[11px] text-text-muted">{cat?.label ?? doc.category}</div>
                  </div>
                  <span className="text-[11px] text-text-muted whitespace-nowrap">
                    {formatRelativeTime(visitedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 전체 문서 목록 */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider font-mono mb-4">
          전체 문서
        </h2>
        <div className="space-y-6">
          {categories.map((cat) => {
            const catDocs = cat.documents
              .map((id) => documents.find((d) => d.id === id))
              .filter(Boolean);
            if (catDocs.length === 0) return null;
            const Icon = iconMap[cat.icon] ?? BookOpen;

            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} style={{ color: cat.color }} />
                  <span className="text-[12px] font-semibold text-text-secondary">{cat.label}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catDocs.map((doc) => {
                    if (!doc) return null;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => navigate(`/doc/${doc.id}`)}
                        className={cn(
                          'w-full text-left rounded-[8px] border border-border bg-surface px-4 py-3',
                          'hover:border-border-strong hover:bg-surface-alt transition-all duration-150',
                        )}
                      >
                        <div className="text-[13px] font-medium text-text-primary truncate">{doc.title}</div>
                        {doc.estimatedReadTime && (
                          <div className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {doc.estimatedReadTime}분
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
