/**
 * extract-metadata.ts
 * docs-config.yaml + public/docs/*.html → public/data/documents-meta.json 생성
 *
 * 새 문서 추가 방법:
 *   1. public/docs/<slug>.html 복사
 *   2. docs-config.yaml의 해당 카테고리 docs: 목록에 slug 추가
 *   3. pnpm extract (또는 pnpm dev)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { parse as parseHtml } from 'node-html-parser';
import { glob } from 'glob';
import { load as loadYaml } from 'js-yaml';

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

interface DocsConfigCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  docs: string[];
}

interface DocsConfig {
  categories: DocsConfigCategory[];
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  documents: string[];
}

interface SectionMeta {
  id: string;
  title: string;
  level: number;
  tabId: string;
  content: string;
}

interface TabMeta {
  id: string;
  label: string;
  accentColor: string;
  sections: SectionMeta[];
}

interface DocumentMeta {
  id: string;
  title: string;
  filename: string;
  category: string;
  order: number;
  tabs: TabMeta[];
  sections: SectionMeta[];
  description?: string;
  estimatedReadTime?: number;
}

// ─── 설정 로드 ────────────────────────────────────────────────────────────────

const colorTokenMap: Record<string, string> = {
  blue: 'var(--color-blue)',
  green: 'var(--color-green)',
  orange: 'var(--color-orange)',
  red: 'var(--color-red)',
  purple: 'var(--color-purple)',
  teal: 'var(--color-teal)',
  indigo: 'var(--color-indigo)',
};

const configPath = resolve(process.cwd(), 'docs-config.yaml');
if (!existsSync(configPath)) {
  console.error('❌  docs-config.yaml not found in project root');
  console.error('   Create it to define categories and document ordering.');
  process.exit(1);
}

const config = loadYaml(readFileSync(configPath, 'utf-8')) as DocsConfig;

const categories: Category[] = config.categories.map((cat) => ({
  id: cat.id,
  label: cat.label,
  icon: cat.icon,
  color: colorTokenMap[cat.color] ?? `var(--color-${cat.color})`,
  documents: cat.docs ?? [],
}));

// doc ID → { category, order }
const docCategoryMap = new Map<string, { category: string; order: number }>();
categories.forEach((cat) => {
  cat.documents.forEach((docId, idx) => {
    docCategoryMap.set(docId, { category: cat.id, order: idx });
  });
});

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function getAccentColor(styleContent: string, tabId: string): string {
  const patterns = [
    new RegExp(`\\[data-t=["']${tabId}["']\\]\\.on\\s*\\{[^}]*color:\\s*([^;}]+)`, 'i'),
    new RegExp(`\\[data-tab=["']${tabId}["']\\]\\.active\\s*\\{[^}]*color:\\s*([^;}]+)`, 'i'),
  ];
  for (const pattern of patterns) {
    const m = styleContent.match(pattern);
    if (m) return m[1].trim();
  }
  return 'var(--blue)';
}

function resolveColor(cssColor: string): string {
  const map: Record<string, string> = {
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
  };
  return map[cssColor] ?? cssColor;
}

// ─── HTML 파싱 ────────────────────────────────────────────────────────────────

function extractSections(html: string, tabId: string): SectionMeta[] {
  const root = parseHtml(html);
  const sections: SectionMeta[] = [];

  root.querySelectorAll('h2, h3, h4').forEach((heading) => {
    const level = parseInt(heading.tagName.slice(1), 10);
    const titleText = heading.text.trim();
    const id = heading.getAttribute('id') ?? slugify(titleText);

    let content = '';
    let charCount = 0;
    let next = heading.nextElementSibling;
    while (next && !['H2', 'H3', 'H4'].includes(next.tagName) && charCount < 1000) {
      const text = next.text.trim();
      if (text) {
        content += text + ' ';
        charCount += text.length;
      }
      next = next.nextElementSibling;
    }

    sections.push({ id, title: titleText, level, tabId, content: content.trim().slice(0, 500) });
  });

  return sections;
}

function parseDocument(filePath: string): Omit<DocumentMeta, 'id' | 'filename' | 'category' | 'order'> {
  const html = readFileSync(filePath, 'utf-8');
  const root = parseHtml(html, { parseNoneClosedTags: true, lowerCaseTagName: false });

  const title =
    root.querySelector('title')?.text?.trim() ??
    root.querySelector('h1')?.text?.trim() ??
    'Untitled';

  const styleContent = root.querySelectorAll('style').map((s) => s.text).join('\n');

  // 탭 버튼 탐색 (패턴 1: data-t, 패턴 2: data-tab)
  type TabBtn = { id: string; label: string };
  let tabBtns: TabBtn[] = root.querySelectorAll('button[data-t]').map((btn) => ({
    id: btn.getAttribute('data-t') ?? '',
    label: btn.text.replace(/^●\s*/, '').trim(),
  })).filter((b) => b.id);

  if (tabBtns.length === 0) {
    tabBtns = root.querySelectorAll('button[data-tab]').map((btn) => ({
      id: btn.getAttribute('data-tab') ?? '',
      label: btn.text.replace(/^●\s*/, '').trim(),
    })).filter((b) => b.id);
  }

  let tabs: TabMeta[];
  let allSections: SectionMeta[] = [];
  let totalText = '';

  if (tabBtns.length === 0) {
    const bodyEl = root.querySelector('.main') ?? root.querySelector('body') ?? root;
    const sections = extractSections(bodyEl.innerHTML, 'main');
    allSections = sections;
    totalText = sections.map((s) => s.content).join(' ');
    tabs = [{ id: 'main', label: '전체', accentColor: 'var(--color-blue)', sections }];
  } else {
    tabs = tabBtns.map(({ id, label }) => {
      const accentColor = resolveColor(getAccentColor(styleContent, id));
      const panelEl =
        root.querySelector(`#p-${id}`) ??
        root.querySelector(`#panel-${id}`) ??
        root.querySelector(`#tab-content-${id}`);

      if (!panelEl) return { id, label, accentColor, sections: [] };

      const sections = extractSections(panelEl.innerHTML, id);
      allSections.push(...sections);
      totalText += sections.map((s) => s.content).join(' ') + ' ';
      return { id, label, accentColor, sections };
    });
  }

  const estimatedReadTime = estimateReadTime(totalText);

  const descEl = root.querySelector('.ph p') ?? root.querySelector('.panel-header p');
  const description = descEl
    ? descEl.text.trim().slice(0, 200)
    : (tabs[0]?.sections[0]?.content.slice(0, 150) ?? '');

  return { title, tabs, sections: allSections, estimatedReadTime, description };
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

const docsDir = resolve(process.cwd(), 'public/docs');
const outputDir = resolve(process.cwd(), 'public/data');
mkdirSync(outputDir, { recursive: true });

const htmlFiles = glob.sync('*.html', { cwd: docsDir, absolute: true });
console.log(`\n📄 Found ${htmlFiles.length} HTML files in public/docs/`);

// 미등록 파일 감지
const registeredIds = new Set(docCategoryMap.keys());
const unregistered: string[] = [];
for (const filePath of htmlFiles) {
  const id = basename(filePath).replace(/\.html$/, '');
  if (!registeredIds.has(id)) {
    unregistered.push(id);
  }
}
if (unregistered.length > 0) {
  console.log(`\n⚠️  Unregistered HTML files (not in docs-config.yaml):`);
  unregistered.forEach((id) => console.log(`     - ${id}.html`));
  console.log(`   Add them to docs-config.yaml to include in the app.\n`);
}

// config에는 있지만 HTML 파일이 없는 경우 경고
const existingIds = new Set(htmlFiles.map((f) => basename(f).replace(/\.html$/, '')));
for (const [docId] of docCategoryMap) {
  if (!existingIds.has(docId)) {
    console.log(`  ⚠️  In config but HTML not found: ${docId}.html`);
  }
}

// 파싱
const documents: DocumentMeta[] = [];
for (const filePath of htmlFiles) {
  const filename = basename(filePath);
  const id = filename.replace(/\.html$/, '');
  const catInfo = docCategoryMap.get(id);

  if (!catInfo) continue; // 미등록 — 위에서 이미 경고

  try {
    const meta = parseDocument(filePath);
    documents.push({ id, filename, category: catInfo.category, order: catInfo.order, ...meta });
    console.log(`  ✅ ${filename} — ${meta.tabs.length} tabs, ${meta.sections.length} sections`);
  } catch (err) {
    console.error(`  ❌ Error parsing ${filename}:`, err);
  }
}

// 카테고리 순서 → 문서 내 순서 정렬
documents.sort((a, b) => {
  const ai = categories.findIndex((c) => c.id === a.category);
  const bi = categories.findIndex((c) => c.id === b.category);
  return ai !== bi ? ai - bi : a.order - b.order;
});

const output = { documents, categories, buildTimestamp: new Date().toISOString() };
const outputPath = resolve(outputDir, 'documents-meta.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`\n✨ Wrote ${documents.length} documents → public/data/documents-meta.json\n`);
