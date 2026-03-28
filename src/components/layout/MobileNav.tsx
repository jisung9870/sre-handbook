import { X } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/cn';
import type { Category, DocumentMeta } from '@/types/document';

interface MobileNavProps {
  categories: Category[];
  documents: DocumentMeta[];
}

export function MobileNav({ categories, documents }: MobileNavProps) {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {/* 오버레이 */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 사이드바 */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen z-50 lg:hidden transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="relative">
          <button
            className="absolute top-4 right-[-40px] p-2 bg-surface rounded-r-lg border border-l-0 border-border text-text-secondary hover:text-text-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
          <Sidebar
            categories={categories}
            documents={documents}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
