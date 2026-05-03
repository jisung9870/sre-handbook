export interface ParsedTab {
  id: string;
  label: string;
  accentColor: string;
  html: string;
}

export interface ParsedDocument {
  title: string;
  tabs: ParsedTab[];
  scopedCss: string;
}

// ─── CSS Scoping ──────────────────────────────────────────────────────────────

/**
 * Shell selectors belong to the original HTML's app-shell (sidebar, tabs, etc.)
 * and must be excluded from the scoped CSS injected into .doc-content.
 */
function isShellSelector(selector: string): boolean {
  const s = selector.trim();
  if (!s) return true;

  // Universal
  if (s === '*') return true;

  // Element selectors: html, body
  if (/^(html|body)(?:[\s,:{[]|$)/i.test(s)) return true;

  // Named shell classes
  const shellClasses = [
    'layout',
    'sidebar',
    'main',
    'top-tabs',
    'top-tab',
    'tab-panel',
    'mobile-toggle',
    'pnl',
    'mn',
  ];
  for (const cls of shellClasses) {
    if (new RegExp(`^\\.${cls.replace(/-/g, '\\-')}(?:[\\s,:{\\[.]|$)`).test(s)) return true;
  }

  // Single-letter uppercase abbreviations used in minified HTML:
  // .L = layout, .M = main, .TT = top-tabs
  if (/^\.(?:L|M|TT)(?:[^a-zA-Z\d_-]|$)/.test(s)) return true;
  // .S = sidebar (but NOT .sec, .sub — content classes starting with lowercase)
  if (/^\.S(?:[^a-z]|$)/.test(s)) return true;
  // .T = tab button (but NOT .tab-panel — caught above)
  if (/^\.T(?:[^a-z]|$)/.test(s)) return true;
  // .P = panel (but NOT .ph, .panel-header — lowercase after .P)
  if (/^\.P(?:[^a-z]|$)/.test(s)) return true;

  return false;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Recursively scope CSS rules to .doc-content:
 * - :root {} → .doc-content {}
 * - .card {} → .doc-content .card {}
 * - Shell selectors (body, .sidebar, .top-tab, .T, etc.) → skipped
 * - @media / @supports → recurse inner rules
 * - @keyframes / @font-face → keep as-is
 */
function scopeCss(rawCss: string): string {
  const css = stripComments(rawCss);
  const output: string[] = [];
  let i = 0;

  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    // Find opening brace
    const braceStart = css.indexOf('{', i);
    if (braceStart === -1) break;

    const prelude = css.slice(i, braceStart).trim();

    // Find matching closing brace (handles nesting)
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    const innerContent = css.slice(braceStart + 1, j - 1);
    i = j;

    if (prelude.startsWith('@')) {
      const keyword = prelude.match(/@(\w+)/)?.[1]?.toLowerCase() ?? '';
      if (keyword === 'media' || keyword === 'supports') {
        const scopedInner = scopeCss(innerContent);
        if (scopedInner.trim()) {
          output.push(`${prelude} {\n${scopedInner}\n}`);
        }
      } else if (keyword === 'keyframes' || keyword === 'font-face') {
        // Keep animation/font rules as-is (no scoping needed)
        output.push(`${prelude} {\n${innerContent}\n}`);
      }
      // Skip other at-rules (@charset, @import, etc.)
    } else {
      // Regular rule — split by comma, filter shell selectors, prefix rest
      const selectors = prelude
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && !isShellSelector(s));

      if (selectors.length > 0) {
        const scoped = selectors
          .map((s) => (s === ':root' ? '.doc-content' : `.doc-content ${s}`))
          .join(',\n');
        output.push(`${scoped} {\n${innerContent}}`);
      }
    }
  }

  return output.join('\n');
}

// ─── Accent Color ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'var(--teal)': 'var(--color-teal)',
  'var(--blue)': 'var(--color-blue)',
  'var(--purple)': 'var(--color-purple)',
  'var(--green)': 'var(--color-green)',
  'var(--orange)': 'var(--color-orange)',
  'var(--red)': 'var(--color-red)',
  'var(--indigo)': 'var(--color-indigo)',
  'var(--c-teal)': 'var(--color-teal)',
  'var(--c-speed)': 'var(--color-blue)',
  'var(--c-stable)': 'var(--color-green)',
  'var(--c-green)': 'var(--color-green)',
  'var(--accent-raid)': 'var(--color-teal)',
  'var(--accent-lvm)': 'var(--color-blue)',
  'var(--accent-purple)': 'var(--color-purple)',
};

function extractAccentColor(styleText: string, tabId: string): string {
  // Pattern A: .top-tab[data-tab="id"].active { color: ... }
  const patA = new RegExp(
    `\\.top-tab\\[data-tab=["']${tabId}["']\\]\\.active\\s*\\{[^}]*color:\\s*([^;}"'\\s]+)`,
    'i',
  );
  // Pattern B: [data-t="id"].on{color:...} or .T[data-t="id"].on{color:...}
  const patB = new RegExp(
    `\\[data-t=["']${tabId}["']\\]\\.on\\s*\\{[^}]*color:\\s*([^;}"'\\s]+)`,
    'i',
  );

  for (const pat of [patA, patB]) {
    const m = styleText.match(pat);
    if (m) {
      const raw = m[1].trim();
      return COLOR_MAP[raw] ?? raw;
    }
  }
  return 'var(--color-blue)';
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export function parseDocumentHtml(html: string): ParsedDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title =
    doc.querySelector('title')?.textContent?.trim() ??
    doc.querySelector('h1')?.textContent?.trim() ??
    'Untitled';

  // Extract raw CSS before removing anything
  const rawCss = Array.from(doc.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');

  const scopedCss = scopeCss(rawCss);

  // Remove scripts (keep styles for accent color extraction above)
  doc.querySelectorAll('script').forEach((s) => s.remove());

  // ── Tab button detection ──
  // Priority: [data-tab] (Pattern A: dora/md-lvm) → [data-t] (Pattern B: most files)
  type TabBtn = { id: string; label: string };
  let tabBtns: TabBtn[] = [];

  const btnsA = doc.querySelectorAll('button[data-tab]');
  if (btnsA.length > 0) {
    btnsA.forEach((btn) => {
      const id = btn.getAttribute('data-tab') ?? '';
      if (!id) return;
      const label = btn.textContent?.replace(/^●\s*/, '').trim() ?? id;
      tabBtns.push({ id, label });
    });
  }

  if (tabBtns.length === 0) {
    doc.querySelectorAll('button[data-t]').forEach((btn) => {
      const id = btn.getAttribute('data-t') ?? '';
      if (!id) return;
      const label = btn.textContent?.replace(/^●\s*/, '').trim() ?? id;
      tabBtns.push({ id, label });
    });
  }

  // No tabs found — render body content as single tab
  if (tabBtns.length === 0) {
    const bodyEl =
      doc.querySelector('.main') ?? doc.querySelector('main') ?? doc.body;
    return {
      title,
      tabs: [{ id: 'main', label: '전체', accentColor: 'var(--color-blue)', html: bodyEl.innerHTML }],
      scopedCss,
    };
  }

  // ── Panel detection ──
  // Priority: #panel-{id} (Pattern A) → #p-{id} (Pattern B) → #tab-content-{id}
  const tabs: ParsedTab[] = tabBtns.map(({ id, label }) => {
    const accentColor = extractAccentColor(rawCss, id);

    const panelEl =
      doc.querySelector(`#panel-${id}`) ??
      doc.querySelector(`#p-${id}`) ??
      doc.querySelector(`#tab-content-${id}`);

    if (!panelEl) {
      return { id, label, accentColor, html: '' };
    }

    panelEl.querySelectorAll('script').forEach((s) => s.remove());
    return { id, label, accentColor, html: panelEl.innerHTML };
  });

  return { title, tabs, scopedCss };
}
