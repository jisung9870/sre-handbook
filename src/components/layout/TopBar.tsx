import { Search, Bookmark, FileText, Menu, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '@/contexts/AppContext';

export function TopBar() {
  const { setSidebarOpen, setSearchOpen, isDark, toggleTheme } = useApp();
  const navigate = useNavigate();

  return (
    <header className="h-topbar fixed top-0 right-0 left-0 lg:left-sidebar z-30 bg-surface border-b border-border flex items-center px-4 gap-3">
      {/* 모바일 햄버거 */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-surface-alt text-text-secondary transition-colors"
        onClick={() => setSidebarOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu size={18} />
      </button>

      {/* 검색 트리거 */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-alt border border-border text-text-muted hover:border-border-strong text-sm transition-colors max-w-md"
      >
        <Search size={14} />
        <span className="flex-1 text-left text-[13px]">Cmd+K로 검색...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-text-muted bg-surface border border-border rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        {/* 다크 모드 토글 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors"
          title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={() => navigate('/bookmarks')}
          className="p-2 rounded-lg hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors"
          title="북마크"
        >
          <Bookmark size={16} />
        </button>
        <button
          onClick={() => navigate('/memos')}
          className="p-2 rounded-lg hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors"
          title="메모"
        >
          <FileText size={16} />
        </button>
      </div>
    </header>
  );
}
