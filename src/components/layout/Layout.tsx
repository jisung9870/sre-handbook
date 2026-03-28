import { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/search/SearchModal';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useApp } from '@/contexts/AppContext';

export function Layout() {
  const { categories, documents } = useDocumentMeta();
  const { searchOpen, setSearchOpen } = useApp();
  const location = useLocation();

  const openSearch = useCallback(() => setSearchOpen(true), [setSearchOpen]);
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  // Cmd+K / Ctrl+K로 검색 모달 열기
  useKeyboardShortcut({ key: 'k', meta: true, onTrigger: openSearch });

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:block">
        <Sidebar categories={categories} documents={documents} />
      </div>

      {/* 모바일 사이드바 */}
      <MobileNav categories={categories} documents={documents} />

      {/* TopBar */}
      <TopBar />

      {/* 메인 콘텐츠 */}
      <main className="pt-topbar lg:pl-sidebar">
        <div key={location.pathname} className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 animate-page-in">
          <Outlet />
        </div>
      </main>

      {/* 검색 모달 (전역) */}
      {searchOpen && <SearchModal onClose={closeSearch} />}
    </div>
  );
}
