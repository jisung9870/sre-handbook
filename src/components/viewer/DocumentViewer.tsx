import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TabBar } from '@/components/viewer/TabBar';
import { TabPanel } from '@/components/viewer/TabPanel';
import { MemoEditor } from '@/components/memo/MemoEditor';
import { parseDocumentHtml } from '@/lib/html-parser';
import { DOCS_BASE_PATH } from '@/lib/constants';
import type { DocumentMeta } from '@/types/document';

interface DocumentViewerProps {
  meta: DocumentMeta;
}

export function DocumentViewer({ meta }: DocumentViewerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedTabs, setParsedTabs] = useState<{ id: string; label: string; accentColor: string; html: string }[]>([]);
  const [scopedCss, setScopedCss] = useState<string>('');

  // 탭 초기화: URL ?tab= 있으면 해당 탭, 없으면 첫 번째 탭
  const initialTabId = searchParams.get('tab') ?? meta.tabs[0]?.id ?? 'main';

  const [activeTabId, setActiveTabId] = useState(initialTabId);

  // HTML 로드 및 파싱
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${DOCS_BASE_PATH}/${meta.filename}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => {
        setHtmlContent(html);
        const parsed = parseDocumentHtml(html);
        setParsedTabs(parsed.tabs);
        setScopedCss(parsed.scopedCss);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '문서를 불러올 수 없습니다');
        setLoading(false);
      });
  }, [meta.filename]);

  // 탭 전환
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [meta.id, setSearchParams],
  );

  // URL query tab 변경 감지
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTabId) {
      setActiveTabId(tabFromUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // 원본 HTML의 CSS를 .doc-content 스코프로 주입
  useEffect(() => {
    if (!scopedCss) return;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-doc-id', meta.id);
    styleEl.textContent = scopedCss;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [scopedCss, meta.id]);

  // 섹션 스크롤 처리
  useEffect(() => {
    const sectionId = searchParams.get('section');
    if (!sectionId || loading) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [searchParams, loading]);

  const tabsToRender = parsedTabs.length > 0 ? parsedTabs : meta.tabs.map((t) => ({ ...t, html: '' }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        문서 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-accent-red text-sm font-mono">{error}</p>
        <p className="text-text-muted text-xs mt-2">{meta.filename}</p>
      </div>
    );
  }

  if (!htmlContent) return null;

  return (
    <div>
      <TabBar
        tabs={tabsToRender}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
      />
      <div className="pt-6">
        {tabsToRender.map((tab) => (
          <TabPanel
            key={tab.id}
            html={tab.html}
            isActive={tab.id === activeTabId}
          />
        ))}
      </div>
      <MemoEditor documentId={meta.id} tabId={activeTabId} />
    </div>
  );
}
