import { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { RECENT_DOCS_KEY, MAX_RECENT_DOCS, THEME_KEY } from '@/lib/constants';

interface RecentDoc {
  documentId: string;
  visitedAt: number;
}

interface AppState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  currentDocumentId: string | null;
  recentDocuments: RecentDoc[];
  isDark: boolean;
}

interface AppContextValue extends AppState {
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCurrentDocumentId: (id: string | null) => void;
  addRecentDocument: (id: string) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadRecentDocs(): RecentDoc[] {
  try {
    const raw = localStorage.getItem(RECENT_DOCS_KEY);
    return raw ? (JSON.parse(raw) as RecentDoc[]) : [];
  } catch {
    return [];
  }
}

function saveRecentDocs(docs: RecentDoc[]) {
  localStorage.setItem(RECENT_DOCS_KEY, JSON.stringify(docs));
}

function getInitialIsDark(): boolean {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light') return false;
  if (stored === 'dark') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDoc[]>(loadRecentDocs);
  const [isDark, setIsDark] = useState(getInitialIsDark);

  // data-theme 속성을 <html>에 동기화
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // OS 다크 모드 변경 감지 (사용자가 명시적으로 선택하지 않은 경우만)
  useEffect(() => {
    if (localStorage.getItem(THEME_KEY)) return; // 저장된 설정 있으면 무시
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handler(e: MediaQueryListEvent) {
      setIsDark(e.matches);
    }
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const addRecentDocument = useCallback((id: string) => {
    setRecentDocuments((prev) => {
      const filtered = prev.filter((d) => d.documentId !== id);
      const updated = [{ documentId: id, visitedAt: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT_DOCS,
      );
      saveRecentDocs(updated);
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        searchOpen,
        currentDocumentId,
        recentDocuments,
        isDark,
        setSidebarOpen,
        setSearchOpen,
        setCurrentDocumentId,
        addRecentDocument,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
