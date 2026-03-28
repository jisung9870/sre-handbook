import { useEffect } from 'react';

interface ShortcutOptions {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  onTrigger: () => void;
}

export function useKeyboardShortcut({ key, meta, ctrl, shift, onTrigger }: ShortcutOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const metaMatch = meta ? e.metaKey || e.ctrlKey : true;
      const ctrlMatch = ctrl ? e.ctrlKey : true;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey || shift === undefined;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        (meta || ctrl ? metaMatch || ctrlMatch : true) &&
        (shift !== undefined ? shiftMatch : true)
      ) {
        if (meta && !e.metaKey && !e.ctrlKey) return;
        if (ctrl && !e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        onTrigger();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, meta, ctrl, shift, onTrigger]);
}
