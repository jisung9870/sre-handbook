import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Home } from 'lucide-react';

import { DocumentViewer } from '@/components/viewer/DocumentViewer';
import { BookmarkButton } from '@/components/bookmark/BookmarkButton';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useApp } from '@/contexts/AppContext';

export function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { documents, categories, loading, getDocument } = useDocumentMeta();
  const { setCurrentDocumentId, addRecentDocument } = useApp();

  const doc = documentId ? getDocument(documentId) : undefined;

  useEffect(() => {
    if (!documentId) return;
    setCurrentDocumentId(documentId);
    addRecentDocument(documentId);
  }, [documentId, setCurrentDocumentId, addRecentDocument]);

  // URL에서 현재 활성 탭 읽기 (DocumentViewer와 동기화됨)
  const activeTabId = searchParams.get('tab') ?? doc?.tabs[0]?.id ?? 'main';
  const activeTab = doc?.tabs.find((t) => t.id === activeTabId) ?? doc?.tabs[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        로딩 중...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-muted text-sm">문서를 찾을 수 없습니다: {documentId}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-accent-blue text-sm underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 이전/다음 문서
  const cat = categories.find((c) => c.id === doc.category);
  const catDocIds = cat?.documents ?? [];
  const currentIdx = catDocIds.indexOf(doc.id);
  const prevDocId = currentIdx > 0 ? catDocIds[currentIdx - 1] : undefined;
  const nextDocId = currentIdx < catDocIds.length - 1 ? catDocIds[currentIdx + 1] : undefined;
  const prevDoc = prevDocId ? documents.find((d) => d.id === prevDocId) : undefined;
  const nextDoc = nextDocId ? documents.find((d) => d.id === nextDocId) : undefined;

  return (
    <div>
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono mb-4">
        <button
          onClick={() => navigate('/')}
          className="hover:text-text-secondary transition-colors flex items-center gap-1"
        >
          <Home size={11} />
          홈
        </button>
        <ChevronRight size={10} className="opacity-40" />
        <span>{cat?.label ?? doc.category}</span>
        <ChevronRight size={10} className="opacity-40" />
        <span className="text-text-secondary truncate max-w-[200px] sm:max-w-none">{doc.title}</span>
      </div>

      {/* 문서 헤더 */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            {doc.estimatedReadTime && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono mb-2">
                <Clock size={11} />
                <span>{doc.estimatedReadTime}분</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-text-primary">{doc.title}</h1>
            {doc.description && (
              <p className="text-text-secondary text-[13px] mt-2 leading-relaxed max-w-2xl">
                {doc.description}
              </p>
            )}
          </div>

          {/* 북마크 버튼 */}
          <div className="flex-shrink-0 mt-1">
            <BookmarkButton
              doc={doc}
              activeTabId={activeTabId}
              activeTabLabel={activeTab?.label ?? ''}
            />
          </div>
        </div>
      </div>

      {/* 문서 뷰어 — key={doc.id}로 문서 전환 시 상태 리셋 */}
      <DocumentViewer key={doc.id} meta={doc} />

      {/* 이전/다음 네비게이션 */}
      <div className="flex items-center justify-between mt-16 pt-6 border-t border-border">
        {prevDoc ? (
          <button
            onClick={() => navigate(`/doc/${prevDoc.id}`)}
            className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-accent-blue transition-colors max-w-[45%]"
          >
            <ChevronLeft size={16} className="flex-shrink-0" />
            <span className="truncate">{prevDoc.title}</span>
          </button>
        ) : (
          <div />
        )}
        {nextDoc ? (
          <button
            onClick={() => navigate(`/doc/${nextDoc.id}`)}
            className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-accent-blue transition-colors max-w-[45%] text-right"
          >
            <span className="truncate">{nextDoc.title}</span>
            <ChevronRight size={16} className="flex-shrink-0" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
