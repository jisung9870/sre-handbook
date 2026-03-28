import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          bg: 'var(--color-bg)',
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          blue: 'var(--color-blue)',
          green: 'var(--color-green)',
          orange: 'var(--color-orange)',
          red: 'var(--color-red)',
          purple: 'var(--color-purple)',
          teal: 'var(--color-teal)',
          indigo: 'var(--color-indigo)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      height: {
        topbar: 'var(--topbar-height)',
      },
      spacing: {
        topbar: 'var(--topbar-height)',
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [],
} satisfies Config;
