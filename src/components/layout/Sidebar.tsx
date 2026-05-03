import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Terminal,
  Network,
  BarChart3,
  GitBranch,
  Layers,
  Users,
  Cpu,
  ChevronDown,
  ChevronRight,
  Container,
  Gamepad2,
  Joystick,
  type LucideIcon,
} from 'lucide-react';

import { SidebarItem } from '@/components/layout/SidebarItem';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/cn';
import { SIDEBAR_COLLAPSED_KEY } from '@/lib/constants';
import type { Category, DocumentMeta } from '@/types/document';

interface SidebarProps {
  categories: Category[];
  documents: DocumentMeta[];
  onClose?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Terminal,
  Network,
  BarChart3,
  GitBranch,
  Layers,
  Users,
  Cpu,
  Container,
  Gamepad2,
  Joystick,
};

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function Sidebar({ categories, documents, onClose }: SidebarProps) {
  const { currentDocumentId } = useApp();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsed((prev) => {
      const updated = { ...prev, [categoryId]: !prev[categoryId] };
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const docMap = new Map(documents.map((d) => [d.id, d]));

  return (
    <aside className="w-sidebar fixed left-0 top-0 h-screen border-r border-border bg-surface flex flex-col z-40 overflow-y-auto">
      {/* 브랜드 */}
      <Link to="/" className="px-5 py-6 border-b border-border flex-shrink-0 block hover:bg-surface-alt transition-colors">
        <div className="font-mono text-[10px] text-accent-teal uppercase tracking-widest mb-1 font-semibold">
          SRE
        </div>
        <h1 className="text-[17px] font-bold leading-tight text-text-primary">
          Hand<span className="text-accent-blue">book</span>
        </h1>
      </Link>

      {/* 카테고리 트리 */}
      <nav className="flex-1 py-2">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] ?? BookOpen;
          const isCollapsed = collapsed[cat.id] ?? false;
          const catDocs = cat.documents.map((id) => docMap.get(id)).filter(Boolean) as DocumentMeta[];
          const hasActive = catDocs.some((d) => d.id === currentDocumentId);

          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors',
                  'hover:bg-surface-alt',
                  hasActive && 'bg-surface-alt',
                )}
              >
                <Icon
                  size={14}
                  className="flex-shrink-0"
                  style={{ color: cat.color }}
                />
                <span className="flex-1 text-[12px] font-semibold text-text-primary truncate">
                  {cat.label}
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-surface-alt border border-border text-text-muted mr-1">
                  {catDocs.length}
                </span>
                {isCollapsed ? (
                  <ChevronRight size={12} className="text-text-muted flex-shrink-0" />
                ) : (
                  <ChevronDown size={12} className="text-text-muted flex-shrink-0" />
                )}
              </button>

              {!isCollapsed && (
                <ul>
                  {catDocs.map((doc) => (
                    <li key={doc.id}>
                      <SidebarItem
                        documentId={doc.id}
                        title={doc.title}
                        accentColor={cat.color}
                        onClick={onClose}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* 푸터 */}
      <div className="px-5 py-4 border-t border-border flex-shrink-0 flex items-center justify-between">
        <p className="font-mono text-[10px] text-text-muted">SRE Handbook</p>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-surface-alt border border-border text-accent-teal">
          {documents.length} docs
        </span>
      </div>
    </aside>
  );
}
