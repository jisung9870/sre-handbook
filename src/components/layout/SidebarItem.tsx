import { useNavigate, useParams } from 'react-router-dom';

import { cn } from '@/lib/cn';

interface SidebarItemProps {
  documentId: string;
  title: string;
  accentColor: string;
  onClick?: () => void;
}

export function SidebarItem({ documentId, title, accentColor, onClick }: SidebarItemProps) {
  const navigate = useNavigate();
  const { documentId: currentId } = useParams<{ documentId: string }>();
  const isActive = currentId === documentId;

  function handleClick() {
    navigate(`/doc/${documentId}`);
    onClick?.();
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-2 px-5 py-2 text-left text-xs transition-all duration-150',
        'border-l-2 font-medium',
        isActive
          ? 'border-l-[var(--active-color)] text-text-primary font-semibold'
          : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-alt',
      )}
      style={
        isActive
          ? ({
              '--active-color': accentColor,
              backgroundColor: `${accentColor}18`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: accentColor }}
      />
      <span className="truncate">{title}</span>
    </button>
  );
}
