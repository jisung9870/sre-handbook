import { useEffect, useRef } from 'react';

interface TabPanelProps {
  html: string;
  isActive: boolean;
}

export function TabPanel({ html, isActive }: TabPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 코드 블록에 복사 버튼 추가
  // <pre>: 일반 마크업 / .code-block: 원본 HTML 인라인 구문강조 div
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const codeEls = ref.current.querySelectorAll<HTMLElement>('pre, .code-block');
    codeEls.forEach((el) => {
      if (el.querySelector('.code-copy-btn')) return;

      // 복사 버튼이 absolute 포지션될 수 있도록 보장
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = '복사';
      btn.addEventListener('click', () => {
        const code = el.querySelector('code')?.textContent ?? el.textContent ?? '';
        navigator.clipboard.writeText(code.trim()).then(() => {
          btn.textContent = '복사됨!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '복사';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
      el.appendChild(btn);
    });

    // heading에 앵커 ID 보정
    ref.current.querySelectorAll('h2, h3, h4').forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-') ?? '';
      }
    });
  }, [isActive, html]);

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      className="doc-content px-0 py-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
