import { cn } from '@/lib/cn';

interface TabItem {
  id: string;
  label: string;
  accentColor: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabChange }: TabBarProps) {
  if (tabs.length <= 1) return null;

  return (
    <div className="sticky top-topbar z-20 bg-surface border-b border-border flex shadow-sm overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 min-w-[80px] px-3 py-3.5 font-mono text-[11.5px] font-semibold text-center whitespace-nowrap',
              'relative transition-all duration-200 border-none bg-transparent cursor-pointer',
              'after:content-[""] after:absolute after:bottom-0 after:left-[10%] after:right-[10%] after:h-[2.5px] after:rounded-sm after:transition-all after:duration-250',
              isActive
                ? 'text-text-primary after:opacity-100'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-alt after:opacity-0',
            )}
            style={
              isActive
                ? ({
                    color: tab.accentColor,
                    '--tab-accent': tab.accentColor,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span
              className={cn(
                'absolute bottom-0 left-[10%] right-[10%] h-[2.5px] rounded-sm transition-all duration-250',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
              style={isActive ? { background: tab.accentColor } : undefined}
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
