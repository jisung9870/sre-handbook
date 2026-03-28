#!/usr/bin/env node
/**
 * prepare-offline-build.mjs
 * SRE Handbook — iPad/Safari file:// 오프라인 빌드 생성
 *
 * Usage: node scripts/prepare-offline-build.mjs
 *        (또는 pnpm build:offline)
 *
 * 출력:
 *   dist-offline/
 *   ├── index.html          카테고리별 문서 목록
 *   └── docs/
 *       ├── dora-metrics-guide.html
 *       └── ...
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseHtml } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = resolve(__dirname, '..');
const META     = resolve(ROOT, 'public/data/documents-meta.json');
const DOCS_DIR = resolve(ROOT, 'public/docs');
const OUT      = resolve(ROOT, 'dist-offline');
const OUT_DOCS = resolve(OUT, 'docs');

// ─── 가드 ────────────────────────────────────────────────────────────────────────
if (!existsSync(META)) {
  console.error('❌  public/data/documents-meta.json not found.');
  console.error('   Run "pnpm extract" first.');
  process.exit(1);
}

// ─── 메타데이터 ──────────────────────────────────────────────────────────────────
const { documents, categories } = JSON.parse(readFileSync(META, 'utf-8'));
const docMap = new Map(documents.map(d => [d.id, d]));
const catMap = new Map(categories.map(c => [c.id, c]));

// 카테고리 순서 기준 정렬된 문서 목록
const orderedDocs = [];
for (const cat of categories) {
  for (const docId of cat.documents) {
    const doc = docMap.get(docId);
    if (doc) orderedDocs.push({ doc, cat });
  }
}

mkdirSync(OUT_DOCS, { recursive: true });

// ─── 유틸 ────────────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Google Fonts 제거 + 웹폰트 → 시스템 폰트 */
function fixFonts(css) {
  return css
    .replace(/@import\s+url\([^)]*fonts\.googleapis[^)]*\)\s*;?\n?/g, '')
    .replace(/@import\s+url\([^)]*fonts\.gstatic[^)]*\)\s*;?\n?/g, '')
    .replace(/'JetBrains Mono'(\s*,\s*[^;{},\n]+)?/g, 'monospace')
    .replace(/'Noto Sans KR'(\s*,\s*[^;{},\n]+)?/g, 'system-ui, -apple-system, sans-serif');
}

// ─── 공통 CSS — 앱 디자인 시스템 변수 ────────────────────────────────────────────
const DESIGN_VARS = `
:root {
  --color-bg:#f8f9fb; --color-surface:#fff; --color-surface-alt:#f0f2f5;
  --color-border:#e2e6eb; --color-border-strong:#c9cdd4;
  --color-text-primary:#1a1d23; --color-text-secondary:#5c6370; --color-text-muted:#8b929e;
  --color-blue:#0969b2; --color-green:#1a7f37; --color-orange:#c2600c;
  --color-red:#cf222e; --color-purple:#7c3aed; --color-teal:#0e7c6b; --color-indigo:#4f46e5;
}
[data-theme="dark"] {
  --color-bg:#0d1117; --color-surface:#161b22; --color-surface-alt:#1c2128;
  --color-border:#30363d; --color-border-strong:#484f58;
  --color-text-primary:#e6edf3; --color-text-secondary:#8b949e; --color-text-muted:#6e7681;
  --color-blue:#58a6ff; --color-green:#3fb950; --color-orange:#f0883e;
  --color-red:#f85149; --color-purple:#a371f7; --color-teal:#2ea043; --color-indigo:#818cf8;
}`;

/** 문서 원본 CSS 변수 3패턴 다크 모드 오버라이드 (originalCss 뒤에 배치해야 함) */
const DOC_DARK_VARS = `
[data-theme="dark"] {
  /* ── Pattern A: dora 계열 ── */
  --bg:#0d1117; --surface:#161b22; --s2:#1c2128; --surface-2:#1c2128; --sidebar-bg:#161b22;
  --text:#e6edf3; --text-dim:#8b949e; --text-muted:#6e7681;
  --border:#30363d; --border-strong:#484f58; --bd:#30363d; --bs:#484f58;
  --c-speed:#58a6ff;   --c-speed-bg:rgba(88,166,255,.1);   --c-speed-border:rgba(88,166,255,.25);
  --c-stable:#a371f7;  --c-stable-bg:rgba(163,113,247,.1); --c-stable-border:rgba(163,113,247,.25);
  --c-green:#3fb950;   --c-green-bg:rgba(63,185,80,.1);    --c-green-border:rgba(63,185,80,.25);
  --c-teal:#2ea043;    --c-teal-bg:rgba(46,160,67,.1);     --c-teal-border:rgba(46,160,67,.25);
  --c-orange:#f0883e;  --c-orange-bg:rgba(240,136,62,.1);  --c-orange-border:rgba(240,136,62,.25);
  --c-red:#f85149;     --c-red-bg:rgba(248,81,73,.1);      --c-red-border:rgba(248,81,73,.25);
  --c-purple:#a371f7;  --c-purple-bg:rgba(163,113,247,.1); --c-purple-border:rgba(163,113,247,.25);
  --shadow-sm:0 1px 3px rgba(0,0,0,.4); --shadow-md:0 2px 8px rgba(0,0,0,.5);
  /* ── Pattern B: k8s/distributed 계열 ── */
  --sf:#161b22; --tx:#e6edf3; --td:#8b949e; --tm:#6e7681;
  --blue:#58a6ff;   --bbg:rgba(88,166,255,.1);   --bbd:rgba(88,166,255,.25);
  --purple:#a371f7; --pbg:rgba(163,113,247,.1);  --pbd:rgba(163,113,247,.25);
  --green:#3fb950;  --gbg:rgba(63,185,80,.1);    --gbd:rgba(63,185,80,.25);
  --teal:#2ea043;   --tbg:rgba(46,160,67,.1);    --tbd:rgba(46,160,67,.25);
  --orange:#f0883e; --obg:rgba(240,136,62,.1);   --obd:rgba(240,136,62,.25);
  --red:#f85149;    --rbg:rgba(248,81,73,.1);    --rbd:rgba(248,81,73,.25);
  --indigo:#818cf8; --ibg:rgba(129,140,248,.1);  --ibd:rgba(129,140,248,.25);
  --sh:0 1px 3px rgba(0,0,0,.4); --shadow:0 1px 3px rgba(0,0,0,.4);
  /* ── Pattern C: mixed 계열 ── */
  --blue-bg:rgba(88,166,255,.1);   --blue-bd:rgba(88,166,255,.25);
  --purple-bg:rgba(163,113,247,.1); --purple-bd:rgba(163,113,247,.25);
  --green-bg:rgba(63,185,80,.1);   --green-bd:rgba(63,185,80,.25);
  --teal-bg:rgba(46,160,67,.1);    --teal-bd:rgba(46,160,67,.25);
  --orange-bg:rgba(240,136,62,.1); --orange-bd:rgba(240,136,62,.25);
  --red-bg:rgba(248,81,73,.1);     --red-bd:rgba(248,81,73,.25);
}`;

// ─── 다크 모드 + 테마 버튼 동기화 JS ─────────────────────────────────────────────
const THEME_INIT_JS = `(function(){
  try{var t=localStorage.getItem('sre-hub:theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}
})();`;

const THEME_FN_JS = `
function toggleTheme(){
  var h=document.documentElement,n=h.getAttribute('data-theme')==='dark'?'light':'dark';
  h.setAttribute('data-theme',n);
  try{localStorage.setItem('sre-hub:theme',n);}catch(e){}
  var b=document.getElementById('theme-btn');if(b)b.textContent=n==='dark'?'☀':'◐';
}`;

const SYNC_THEME_BTN_JS = `(function(){
  var t=document.documentElement.getAttribute('data-theme');
  var b=document.getElementById('theme-btn');if(b&&t==='dark')b.textContent='☀';
})();`;

// ─── 탭 전환 JS ───────────────────────────────────────────────────────────────────
const TAB_JS = `
function switchTab(id){
  document.querySelectorAll('.ol-tab').forEach(function(b){
    b.classList.toggle('ol-tab-active',b.getAttribute('data-tab')===id);
  });
  document.querySelectorAll('.ol-panel').forEach(function(p){
    p.style.display=p.getAttribute('data-panel')===id?'block':'none';
  });
}`;

// ─── index.html 생성 ──────────────────────────────────────────────────────────────
function buildIndex() {
  const sections = categories.map(cat => {
    const catDocs = cat.documents.map(id => docMap.get(id)).filter(Boolean);
    if (!catDocs.length) return '';
    const links = catDocs.map(doc => `
      <a href="docs/${doc.id}.html" class="doc-link">
        <span class="doc-dot" style="background:${cat.color}"></span>
        <span class="doc-title">${esc(doc.title)}</span>
        ${doc.estimatedReadTime ? `<span class="doc-time">${doc.estimatedReadTime}분</span>` : ''}
      </a>`).join('');
    return `
    <div class="cat-card">
      <div class="cat-header" style="border-left-color:${cat.color}">
        <span class="cat-label">${esc(cat.label)}</span>
        <span class="cat-badge">${catDocs.length}</span>
      </div>
      <div class="cat-body">${links}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SRE Handbook</title>
<script>${THEME_INIT_JS}<\/script>
<style>
${DESIGN_VARS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--color-bg);color:var(--color-text-primary);font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;min-height:100vh}
a{color:var(--color-blue);text-decoration:none}
a:hover{text-decoration:underline}

/* ── Header ── */
.app-header{position:sticky;top:0;z-index:10;background:var(--color-surface);border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:52px;gap:12px}
.brand{display:flex;align-items:baseline;gap:5px;text-decoration:none}
.brand:hover{text-decoration:none}
.brand-pre{font-family:monospace;font-size:10px;color:var(--color-teal);font-weight:700;text-transform:uppercase;letter-spacing:2px}
.brand-name{font-size:17px;font-weight:700;color:var(--color-text-primary)}
.brand-name b{color:var(--color-blue)}
.header-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
.total-pill{font-family:monospace;font-size:10px;color:var(--color-text-muted);background:var(--color-surface-alt);border:1px solid var(--color-border);border-radius:99px;padding:2px 8px}
.theme-btn{background:none;border:1px solid var(--color-border);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:14px;color:var(--color-text-secondary);line-height:1;transition:background .15s}
.theme-btn:hover{background:var(--color-surface-alt)}

/* ── Main ── */
.main{max-width:860px;margin:0 auto;padding:28px 20px 60px}
.page-title{font-size:22px;font-weight:700;margin-bottom:4px}
.page-sub{font-size:13px;color:var(--color-text-muted);margin-bottom:28px}
.cat-grid{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:560px){.cat-grid{grid-template-columns:1fr 1fr}}

/* ── Category card ── */
.cat-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden}
.cat-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-left:3px solid var(--color-blue);background:var(--color-surface-alt)}
.cat-label{font-size:12px;font-weight:700;color:var(--color-text-primary)}
.cat-badge{font-family:monospace;font-size:10px;color:var(--color-text-muted);background:var(--color-bg);border:1px solid var(--color-border);border-radius:99px;padding:1px 7px}
.cat-body{padding:3px 0}
.doc-link{display:flex;align-items:center;gap:9px;padding:8px 14px;color:var(--color-text-primary);font-size:13px;transition:background .1s}
.doc-link:hover{background:var(--color-surface-alt);text-decoration:none}
.doc-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.doc-title{flex:1;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doc-time{font-family:monospace;font-size:10px;color:var(--color-text-muted);white-space:nowrap}
</style>
</head>
<body>
<header class="app-header">
  <div class="brand">
    <span class="brand-pre">SRE</span>
    <span class="brand-name">Hand<b>book</b></span>
  </div>
  <div class="header-right">
    <span class="total-pill">${orderedDocs.length} docs</span>
    <button id="theme-btn" class="theme-btn" onclick="toggleTheme()" aria-label="다크 모드">◐</button>
  </div>
</header>
<main class="main">
  <h1 class="page-title">SRE Handbook</h1>
  <p class="page-sub">SRE 전환 학습 가이드 · ${orderedDocs.length}개 문서 · 오프라인 전용</p>
  <div class="cat-grid">${sections}</div>
</main>
<script>
${THEME_FN_JS}
${SYNC_THEME_BTN_JS}
<\/script>
</body>
</html>`;
}

// ─── 문서 페이지 생성 ─────────────────────────────────────────────────────────────
function buildDocPage(docId) {
  const doc = docMap.get(docId);
  const cat = catMap.get(doc.category);
  const idx = orderedDocs.findIndex(e => e.doc.id === docId);
  const prev = idx > 0 ? orderedDocs[idx - 1] : null;
  const next = idx < orderedDocs.length - 1 ? orderedDocs[idx + 1] : null;

  // 원본 HTML 파싱
  const rawHtml = readFileSync(resolve(DOCS_DIR, doc.filename), 'utf-8');
  const root = parseHtml(rawHtml, { parseNoneClosedTags: true, lowerCaseTagName: false });

  // 원본 <style> 수집 + 폰트 치환
  const originalCss = root.querySelectorAll('style').map(s => fixFonts(s.text)).join('\n');

  // 탭 버튼 추출 (data-t 우선, 없으면 data-tab)
  let tabBtns = root.querySelectorAll('button[data-t]')
    .map(b => ({ id: b.getAttribute('data-t') || '', label: b.text.replace(/^●\s*/, '').trim() }))
    .filter(b => b.id);

  if (!tabBtns.length) {
    tabBtns = root.querySelectorAll('button[data-tab]')
      .map(b => ({ id: b.getAttribute('data-tab') || '', label: b.text.replace(/^●\s*/, '').trim() }))
      .filter(b => b.id);
  }

  // 패널 추출
  let panels = [];
  if (!tabBtns.length) {
    // 탭 없음 → 앱 셸 요소 제거 후 .main 내용 전체
    root.querySelectorAll('aside, .sidebar, .top-tabs, .mobile-toggle, script').forEach(el => el.remove());
    const body = root.querySelector('.main') || root.querySelector('body') || root;
    panels = [{ id: 'main', html: body.innerHTML }];
  } else {
    panels = tabBtns.map(({ id }) => {
      const el =
        root.querySelector(`#p-${id}`) ||
        root.querySelector(`#panel-${id}`) ||
        root.querySelector(`#tab-content-${id}`);
      return { id, html: el ? el.innerHTML : '' };
    });
  }

  // 탭 바
  const tabBarHtml = tabBtns.length > 1 ? `
<div class="ol-tabbar">
  ${tabBtns.map((t, i) =>
    `<button class="ol-tab${i === 0 ? ' ol-tab-active' : ''}" data-tab="${t.id}" onclick="switchTab('${t.id}')">${esc(t.label)}</button>`
  ).join('')}
</div>` : '';

  // 패널 HTML
  const panelsHtml = panels.map((p, i) =>
    `<div class="ol-panel" data-panel="${p.id}" style="display:${i === 0 ? 'block' : 'none'}">${p.html}</div>`
  ).join('\n');

  // 이전/다음
  const prevHtml = prev
    ? `<a href="${prev.doc.id}.html" class="ol-nav-btn">← ${esc(prev.doc.title)}</a>`
    : '<span></span>';
  const nextHtml = next
    ? `<a href="${next.doc.id}.html" class="ol-nav-btn">${esc(next.doc.title)} →</a>`
    : '<span></span>';

  return `<!DOCTYPE html>
<html lang="ko" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(doc.title)} — SRE Handbook</title>
<script>${THEME_INIT_JS}<\/script>
<style>
${DESIGN_VARS}

/* ─── Shell ──────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--color-bg);color:var(--color-text-primary);font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6}
a{color:var(--color-blue);text-decoration:none}
a:hover{text-decoration:underline}

/* ─── Offline Header ─────────────────────────────── */
.ol-header{position:sticky;top:0;z-index:20;background:var(--color-surface);border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:10px;padding:0 16px;min-height:52px;flex-wrap:wrap}
.ol-back{font-size:13px;color:var(--color-blue);white-space:nowrap;flex-shrink:0;padding:14px 0}
.ol-back:hover{text-decoration:underline}
.ol-header-mid{flex:1;min-width:0;padding:8px 0}
.ol-cat{font-family:monospace;font-size:10px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:1px}
.ol-title{font-size:14px;font-weight:700;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ol-header-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.ol-time{font-family:monospace;font-size:11px;color:var(--color-text-muted)}
.theme-btn{background:none;border:1px solid var(--color-border);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:13px;color:var(--color-text-secondary);line-height:1;transition:background .15s}
.theme-btn:hover{background:var(--color-surface-alt)}

/* ─── Tab bar ────────────────────────────────────── */
.ol-tabbar{position:sticky;top:52px;z-index:15;background:var(--color-surface);border-bottom:2px solid var(--color-border);display:flex;overflow-x:auto;padding:0 12px;-webkit-overflow-scrolling:touch}
.ol-tab{background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:500;color:var(--color-text-secondary);white-space:nowrap;transition:color .15s;flex-shrink:0}
.ol-tab:hover{color:var(--color-text-primary)}
.ol-tab-active{color:var(--color-blue);border-bottom-color:var(--color-blue)}

/* ─── Content ────────────────────────────────────── */
.ol-content{max-width:960px;margin:0 auto;padding:28px 20px 60px}
.ol-panel{min-height:100px}

/* ─── Prev/Next ──────────────────────────────────── */
.ol-nav{display:flex;justify-content:space-between;align-items:center;max-width:960px;margin:0 auto;padding:20px 20px 40px;border-top:1px solid var(--color-border);gap:16px}
.ol-nav-btn{font-size:13px;color:var(--color-text-secondary);max-width:44%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s}
.ol-nav-btn:hover{color:var(--color-blue);text-decoration:none}

/* ─── Original doc CSS ───────────────────────────── */
${originalCss}

/* ─── Dark mode override (원본 CSS 변수 덮어쓰기) ─── */
${DOC_DARK_VARS}

/* ─── Layout overrides (sidebar/tabs 숨김) ───────── */
.sidebar,.top-tabs,.mobile-toggle,.sb-nav,.sb-label,.sidebar-footer{display:none!important}
.layout{display:block!important}
.main{margin-left:0!important;padding:0!important;min-height:0!important}
</style>
</head>
<body>
<header class="ol-header">
  <a href="../index.html" class="ol-back">← 목록으로</a>
  <div class="ol-header-mid">
    <div class="ol-cat">${esc(cat?.label ?? doc.category)}</div>
    <div class="ol-title">${esc(doc.title)}</div>
  </div>
  <div class="ol-header-right">
    ${doc.estimatedReadTime ? `<span class="ol-time">${doc.estimatedReadTime}분</span>` : ''}
    <button id="theme-btn" class="theme-btn" onclick="toggleTheme()" aria-label="다크 모드">◐</button>
  </div>
</header>
${tabBarHtml}
<div class="ol-content">
  ${panelsHtml}
</div>
<nav class="ol-nav">
  ${prevHtml}
  ${nextHtml}
</nav>
<script>
${THEME_FN_JS}
${TAB_JS}
${SYNC_THEME_BTN_JS}
<\/script>
</body>
</html>`;
}

// ─── 실행 ──────────────────────────────────────────────────────────────────────────
console.log('\n📦 Building offline version...\n');

writeFileSync(resolve(OUT, 'index.html'), buildIndex(), 'utf-8');
console.log('  ✅ index.html');

let ok = 0, fail = 0;
for (const { doc } of orderedDocs) {
  try {
    writeFileSync(resolve(OUT_DOCS, `${doc.id}.html`), buildDocPage(doc.id), 'utf-8');
    console.log(`  ✅ docs/${doc.id}.html`);
    ok++;
  } catch (err) {
    console.error(`  ❌ docs/${doc.id}.html — ${err.message}`);
    fail++;
  }
}

console.log(`\n✨ Done — ${ok + 1} files → dist-offline/`);
if (fail) console.warn(`   ⚠️  ${fail} file(s) failed`);
console.log('\n   Open dist-offline/index.html in Safari (or any browser) to verify.\n');
