# CLAUDE.md — SRE Learning Hub

## 프로젝트 개요

SRE 전환 학습용 HTML 가이드 문서 30개를 하나의 웹 플랫폼으로 통합하는 프로젝트.
독스 사이트 스타일(사이드바 + 콘텐츠)의 PWA로, 문서 탐색·검색·북마크·메모 기능을 제공한다.
본인 전용(비공개)이므로 인증/권한/백엔드 없이 클라이언트 사이드만으로 동작한다.

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 빌드/번들러 | Vite | ^6 |
| UI 프레임워크 | React | ^18.3 |
| 언어 | TypeScript | ^5.6 |
| 라우팅 | react-router-dom | ^7 |
| 스타일링 | Tailwind CSS | ^3.4 |
| 검색 | Fuse.js | ^7 |
| 로컬 DB | Dexie.js | ^4 |
| PWA | vite-plugin-pwa | ^0.21 |
| 코드 하이라이팅 | 불필요 (원본 HTML이 인라인 span으로 구문 강조 내장) | — |
| 린터/포매터 | ESLint + Prettier | 최신 |
| 패키지 매니저 | pnpm | ^9 |

## 디렉토리 구조

```
sre-learning-hub/
├── CLAUDE.md                    # 이 파일
├── PROJECT_SPEC.md              # 프로젝트 스펙 문서
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html                   # Vite 엔트리포인트
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest     # PWA manifest
│   └── docs/                    # 원본 HTML 문서 30개 (빌드 시 복사)
│       ├── sre-concepts-guide.html
│       ├── dora-metrics-guide.html
│       └── ...
├── scripts/
│   ├── extract-metadata.ts      # HTML → JSON 메타데이터 추출 스크립트
│   └── generate-search-index.ts # Fuse.js 검색 인덱스 생성
├── src/
│   ├── main.tsx                 # React 엔트리포인트
│   ├── App.tsx                  # 라우터 설정 & 레이아웃
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # 카테고리 트리 사이드바
│   │   │   ├── SidebarItem.tsx      # 사이드바 개별 항목
│   │   │   ├── TopBar.tsx           # 상단 검색바 + 액션
│   │   │   ├── MobileNav.tsx        # 모바일 햄버거 메뉴
│   │   │   └── Layout.tsx           # 사이드바 + 콘텐츠 래퍼
│   │   ├── viewer/
│   │   │   ├── DocumentViewer.tsx   # 문서 콘텐츠 렌더러
│   │   │   ├── TabBar.tsx           # 문서 내부 탭 네비게이션
│   │   │   ├── TabPanel.tsx         # 탭 콘텐츠 패널
│   │   │   ├── TableOfContents.tsx  # 우측 TOC (선택적)
│   │   │   └── CodeBlock.tsx        # 코드 블록 + 복사 버튼
│   │   ├── search/
│   │   │   ├── SearchModal.tsx      # Cmd+K 검색 모달
│   │   │   ├── SearchResult.tsx     # 검색 결과 항목
│   │   │   └── SearchHighlight.tsx  # 검색어 하이라이트
│   │   ├── bookmark/
│   │   │   ├── BookmarkButton.tsx   # 북마크 토글 버튼
│   │   │   └── BookmarkList.tsx     # 북마크 목록 패널
│   │   └── memo/
│   │       ├── MemoEditor.tsx       # 메모 에디터 (인라인)
│   │       ├── MemoList.tsx         # 문서별 메모 목록
│   │       └── MemoCard.tsx         # 메모 카드 컴포넌트
│   ├── pages/
│   │   ├── HomePage.tsx             # 대시보드 / 전체 문서 목록
│   │   ├── DocumentPage.tsx         # 문서 뷰어 페이지
│   │   ├── BookmarksPage.tsx        # 북마크 모아보기
│   │   ├── MemosPage.tsx            # 메모 모아보기
│   │   └── NotFoundPage.tsx         # 404
│   ├── hooks/
│   │   ├── useSearch.ts             # Fuse.js 검색 훅
│   │   ├── useBookmarks.ts          # 북마크 CRUD 훅
│   │   ├── useMemos.ts              # 메모 CRUD 훅
│   │   ├── useDocumentMeta.ts       # 문서 메타데이터 로드
│   │   └── useKeyboardShortcut.ts   # 키보드 단축키
│   ├── lib/
│   │   ├── db.ts                    # Dexie.js DB 스키마 정의
│   │   ├── documents.ts             # 문서 목록 & 카테고리 데이터
│   │   ├── search-index.ts          # 검색 인덱스 로더
│   │   ├── html-parser.ts           # 런타임 HTML 탭/섹션 파서
│   │   └── constants.ts             # 상수 정의
│   ├── types/
│   │   ├── document.ts              # Document, Category, Tab 타입
│   │   ├── bookmark.ts              # Bookmark 타입
│   │   ├── memo.ts                  # Memo 타입
│   │   └── search.ts                # SearchResult 타입
│   └── styles/
│       ├── globals.css              # Tailwind directives + CSS 변수
│       └── document.css             # 문서 콘텐츠 렌더링 스타일
```

## 코딩 컨벤션

### TypeScript
- `strict: true` 필수. `any` 사용 금지.
- 타입은 `src/types/` 디렉토리에 분리. 컴포넌트 Props는 컴포넌트 파일 상단에 정의.
- `interface` 우선 (`type`은 유니온/인터섹션에만).
- barrel export(`index.ts`) 사용하지 않음 — 명시적 경로 import.

### React
- 함수 컴포넌트 + Hooks만 사용. 클래스 컴포넌트 금지.
- 컴포넌트 정의: `function ComponentName()` (arrow function 아님).
- 한 파일에 한 컴포넌트. 파일명 = 컴포넌트명 (PascalCase).
- Props 비구조화는 함수 시그니처에서 직접.
- `useEffect` 최소화. 이벤트 핸들러나 useMemo/useCallback 우선.

### 스타일링
- Tailwind utility class 우선. 커스텀 CSS는 `globals.css`와 `document.css`에만.
- 기존 디자인 시스템 CSS 변수를 Tailwind custom theme에 매핑:
  ```
  --bg → bg-surface-bg
  --sf → bg-surface
  --tx → text-primary
  --td → text-secondary
  --blue → accent-blue
  등
  ```
- 인라인 스타일 금지. `cn()` 유틸리티로 조건부 클래스.

### 파일 네이밍
- 컴포넌트: `PascalCase.tsx`
- 훅: `camelCase.ts` (`use` 접두사)
- 유틸/라이브러리: `kebab-case.ts`
- 타입: `kebab-case.ts`

### Import 순서
```typescript
// 1. React/외부 라이브러리
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. 내부 컴포넌트
import { Sidebar } from '@/components/layout/Sidebar';

// 3. 훅
import { useSearch } from '@/hooks/useSearch';

// 4. 라이브러리/유틸
import { db } from '@/lib/db';

// 5. 타입 (type-only import)
import type { Document } from '@/types/document';

// 6. 스타일 (있을 경우)
import '@/styles/document.css';
```

### Path Alias
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 디자인 시스템 (Light Mode)

### CSS 변수 (기존 HTML 문서에서 계승)
```css
:root {
  /* 배경 */
  --color-bg: #f8f9fb;
  --color-surface: #fff;
  --color-surface-alt: #f0f2f5;
  --color-border: #e2e6eb;

  /* 텍스트 */
  --color-text-primary: #1a1d23;
  --color-text-secondary: #5c6370;
  --color-text-muted: #8b929e;

  /* 액센트 */
  --color-blue: #0969b2;
  --color-green: #1a7f37;
  --color-orange: #c2600c;
  --color-red: #cf222e;
  --color-purple: #7c3aed;
  --color-teal: #0e7c6b;

  /* 코드 블록 */
  --color-code-bg: #1e2530;

  /* 레이아웃 */
  --sidebar-width: 260px;
  --topbar-height: 56px;
}
```

### Tailwind 커스텀 테마 매핑
```typescript
// tailwind.config.ts
export default {
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
    },
  },
};
```

### 컴포넌트 스타일 규칙
- 카드: `rounded-[10px] shadow-sm border border-border bg-surface`
- 코드 블록: `bg-[#1e2530] rounded-lg font-mono text-sm`
- 사이드바: `w-sidebar fixed left-0 top-0 h-screen border-r border-border bg-surface`
- 탭: `sticky top-[var(--topbar-height)]`, 활성 탭에 카테고리별 accent 색상 적용
- 배지/라벨: `font-mono text-xs px-2 py-0.5 rounded`

## 데이터 모델

### 문서 메타데이터 (빌드 타임 생성)

```typescript
// src/types/document.ts
interface DocumentMeta {
  id: string;                    // 파일명 기반 slug (e.g. "sre-concepts-guide")
  title: string;                 // 문서 제목
  filename: string;              // 원본 파일명 (e.g. "sre-concepts-guide.html")
  category: CategoryId;          // 카테고리 ID
  order: number;                 // 카테고리 내 정렬 순서
  tabs: TabMeta[];               // 탭 목록
  sections: SectionMeta[];       // 전체 섹션 (검색용)
  description?: string;          // 짧은 설명 (검색 결과용)
  estimatedReadTime?: number;    // 분 단위 예상 읽기 시간
}

interface TabMeta {
  id: string;                    // 탭 ID
  label: string;                 // 탭 표시 텍스트
  accentColor: string;           // 탭 accent 색상
  sections: SectionMeta[];       // 탭 내 섹션
}

interface SectionMeta {
  id: string;                    // 섹션 ID (heading ID)
  title: string;                 // 섹션 제목
  level: number;                 // heading level (2, 3, 4)
  tabId: string;                 // 소속 탭 ID
  content: string;               // 평문 텍스트 (검색 인덱스용)
}

type CategoryId =
  | 'sre-basics'
  | 'linux-os'
  | 'kubernetes'
  | 'networking'
  | 'observability-db'
  | 'distributed-systems'
  | 'iac-deploy'
  | 'culture-cost'
  | 'cs-fundamentals';

interface Category {
  id: CategoryId;
  label: string;                 // 표시 이름
  icon: string;                  // 아이콘 (lucide-react 아이콘명)
  color: string;                 // 카테고리 대표 색상
  documents: string[];           // 문서 ID 목록 (정렬순)
}
```

### 북마크 (IndexedDB)

```typescript
// src/types/bookmark.ts
interface Bookmark {
  id?: number;                   // auto-increment
  documentId: string;            // 문서 ID
  tabId?: string;                // 탭 ID (선택)
  sectionId?: string;            // 섹션 ID (선택)
  title: string;                 // 표시 제목
  createdAt: Date;
}
```

### 메모 (IndexedDB)

```typescript
// src/types/memo.ts
interface Memo {
  id?: number;                   // auto-increment
  documentId: string;            // 연결된 문서 ID
  tabId?: string;                // 연결된 탭 ID (선택)
  sectionId?: string;            // 연결된 섹션 ID (선택)
  content: string;               // 메모 내용 (plain text or markdown)
  createdAt: Date;
  updatedAt: Date;
}
```

### Dexie DB 스키마

```typescript
// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { Bookmark } from '@/types/bookmark';
import type { Memo } from '@/types/memo';

class SRELearningDB extends Dexie {
  bookmarks!: Table<Bookmark>;
  memos!: Table<Memo>;

  constructor() {
    super('sre-learning-hub');
    this.version(1).stores({
      bookmarks: '++id, documentId, tabId, sectionId, createdAt',
      memos: '++id, documentId, tabId, sectionId, updatedAt',
    });
  }
}

export const db = new SRELearningDB();
```

## 빌드 타임 추출 파이프라인

### scripts/extract-metadata.ts

이 스크립트는 `public/docs/*.html` 파일을 파싱하여:
1. `<title>` 에서 문서 제목 추출
2. `.top-tab[data-tab]` 버튼에서 탭 ID, 라벨, accent 색상 추출
3. `#panel-{tabId}` 패널에서 탭별 콘텐츠 분리
4. 각 탭 내 `.sub[id]` + heading(`h2`, `h3`)에서 섹션 트리 추출
5. `.sb-nav a[data-tab][data-section]`에서 사이드바 네비게이션 구조 추출
6. 각 섹션의 텍스트 콘텐츠 추출 (검색 인덱스용)
7. 결과를 `src/data/documents-meta.json`으로 출력

파싱 전략:
- `cheerio` 또는 `node-html-parser` 사용

#### 실제 HTML 구조 패턴 (검증 완료)

```html
<!-- 상단 탭 버튼 -->
<div class="top-tabs">
  <button class="top-tab active" data-tab="overview" onclick="switchTab('overview')">● 개요</button>
  <button class="top-tab" data-tab="metrics" onclick="switchTab('metrics')">● 4대 메트릭</button>
</div>

<!-- 탭 패널 (id="panel-{tabId}") -->
<div class="tab-panel active" id="panel-overview">
  <div class="sub" id="what-is-dora"><h3>DORA Metrics란?</h3>...</div>
  <div class="sub" id="two-axes"><h3>두 축: 속도 × 안정성</h3>...</div>
</div>
<div class="tab-panel" id="panel-metrics">...</div>

<!-- 사이드바 내비게이션 -->
<ul class="sb-nav">
  <li><a data-tab="overview" data-section="what-is-dora"><span class="dot" style="background:var(--c-teal)"></span>DORA란?</a></li>
</ul>

<!-- 코드 블록 (인라인 구문 강조 — 별도 하이라이터 불필요) -->
<div class="code-block">
  <span class="cm"># 주석</span>
  <span class="kw">record</span>: <span class="fn">dora:deployment_frequency</span>
  <span class="str">"value"</span> <span class="num">142</span>
</div>

<!-- CSS 변수 (문서마다 자체 정의) -->
<style>
  :root {
    --bg: #f8f9fb; --surface: #ffffff; --surface-2: #f0f2f5;
    --c-speed: #0969b2; --c-stable: #8b5cf6; --c-green: #1a7f37;
    --c-teal: #0e7c6b; --c-orange: #c2600c; --c-red: #cf222e;
    /* ... 문서별 커스텀 변수 */
  }
</style>
```

#### 주요 CSS 클래스 매핑 (콘텐츠 렌더링에 필수)

| 클래스 | 용도 | 반드시 보존 |
|--------|------|:-----------:|
| `.cg` | 2컬럼 카드 그리드 | ✅ |
| `.card` | 카드 컴포넌트 (border, shadow, hover) | ✅ |
| `.code-block` | 코드 블록 (#1e2530 배경) | ✅ |
| `.code-block .cm/.kw/.str/.fn/.num` | 인라인 구문 강조 색상 | ✅ |
| `.note`, `.note-warn` | 팁/주의 콜아웃 | ✅ |
| `.analogy` | 개념 매핑 카드 | ✅ |
| `.gauge-row`, `.gauge-item` | 프로그레스 바 시각화 | ✅ |
| `.flow`, `.flow-node`, `.flow-arrow` | 파이프라인/플로우 다이어그램 | ✅ |
| `.level-table`, `.cmd-table` | 스타일드 테이블 | ✅ |
| `.panel-badge`, `.lvl-badge`, `.mc-badge` | 뱃지/라벨 | ✅ |
| `.metric-card` | 메트릭 상세 카드 (번호 워터마크) | ✅ |
| `.pipeline`, `.pipe-stage` | 파이프라인 화살표 시각화 | ✅ |
| `.box`, `.box-title` | 정보 박스 | ✅ |

### scripts/generate-search-index.ts

- `documents-meta.json`에서 섹션별 content를 Fuse.js 인덱스로 변환
- 출력: `src/data/search-index.json`
- Fuse.js 옵션: `keys: ['title', 'sections.title', 'sections.content']`, `threshold: 0.3`

### package.json scripts

```json
{
  "scripts": {
    "extract": "tsx scripts/extract-metadata.ts",
    "search-index": "tsx scripts/generate-search-index.ts",
    "prebuild": "pnpm extract && pnpm search-index",
    "dev": "pnpm extract && vite",
    "build": "pnpm prebuild && vite build",
    "preview": "vite preview"
  }
}
```

## 문서 뷰어 렌더링 전략

**핵심 원칙: 원본 HTML의 CSS를 반드시 보존하고, 앱 셸 요소만 제거하여 React로 대체한다.**

원본 HTML 문서는 카드 그리드, 코드 블록 구문 강조, 게이지 바, 플로우 다이어그램 등 풍부한 시각 요소를 자체 CSS로 구현하고 있다. 이를 Tailwind로 재작성하는 것은 비현실적이므로, 원본 CSS를 `.doc-content` 스코프 안에서 그대로 살려야 한다.

### 렌더링 파이프라인 (런타임)

```
1. fetch('/docs/{filename}.html')
   ↓
2. DOMParser로 파싱
   ↓
3. 추출 & 분리:
   ├── <style> 내용 → 추출하여 .doc-content 스코프로 감싸 <style> 태그로 주입
   ├── .top-tab[data-tab] 버튼들 → 탭 메타데이터 (id, label) 추출
   ├── #panel-{tabId} 패널들 → 탭별 innerHTML 추출
   └── 제거 대상:
       ├── <aside class="sidebar"> (앱의 사이드바로 대체)
       ├── <div class="top-tabs"> (React TabBar로 대체)
       ├── <button class="mobile-toggle"> (앱의 모바일 네비로 대체)
       └── <script> 태그 (React가 탭 전환 처리)
   ↓
4. React 컴포넌트로 렌더링:
   ├── TabBar: 추출한 탭 메타데이터로 React 탭 버튼 렌더링
   ├── TabPanel: 활성 탭의 innerHTML을 dangerouslySetInnerHTML로 주입
   └── 스타일: 추출한 CSS를 .doc-content 스코프로 감싸 적용
   ↓
5. 후처리 (useEffect):
   ├── 코드 블록에 복사 버튼 추가
   ├── heading에 앵커 링크 추가
   └── 이미지 경로 보정 (필요 시)
```

### CSS 스코핑 전략

```typescript
// 원본 <style> 내용에서 셀렉터를 .doc-content 하위로 스코핑
function scopeCSS(cssText: string): string {
  // :root 변수 선언은 그대로 유지 (CSS 변수는 전역이어야 함)
  // 나머지 셀렉터는 .doc-content 하위로 변환
  // 예: .card { ... } → .doc-content .card { ... }
  // 예: .code-block .kw { ... } → .doc-content .code-block .kw { ... }
  //
  // 제외 대상 (앱 셸이 대체하므로):
  // .sidebar, .main, .layout, .top-tabs, .top-tab, .mobile-toggle
  // body, *, html 등 전역 리셋 셀렉터
}
```

**주의: 반드시 보존해야 하는 CSS 규칙들:**
- `.cg` (카드 그리드 `grid-template-columns`)
- `.card`, `.metric-card` (카드 스타일 + hover + shadow)
- `.code-block` + `.cm/.kw/.str/.fn/.num` (코드 블록 배경 + 인라인 구문 강조)
- `.note`, `.note-warn` (콜아웃)
- `.gauge-row`, `.gauge-fill` (프로그레스 바)
- `.flow`, `.flow-node`, `.flow-arrow` (플로우 다이어그램)
- `.level-table`, `.cmd-table` (테이블 스타일)
- `.analogy`, `.analogy-map` (매핑 카드)
- `.pipeline`, `.pipe-stage` (파이프라인 화살표)
- 모든 CSS 변수 (`--c-speed`, `--c-stable`, `--c-green` 등)

**반드시 제거/스킵해야 하는 CSS 규칙들:**
- `.sidebar`, `.sidebar-brand`, `.sb-nav`, `.sb-label`, `.sidebar-footer` (앱 사이드바로 대체)
- `.main`, `.layout` (앱 레이아웃으로 대체)
- `.top-tabs`, `.top-tab` (React TabBar로 대체)
- `.tab-panel` (React TabPanel이 visibility 제어)
- `.mobile-toggle` (앱 모바일 네비로 대체)
- `body`, `*`, `html` 전역 리셋 (앱 전역 스타일과 충돌)
- `@media` 규칙 중 사이드바/레이아웃 관련 (앱이 반응형 처리)

### 코드 블록 구문 강조

원본 HTML은 이미 인라인 `<span>` 태그로 구문 강조가 되어 있다:
```html
<span class="cm"># 주석</span>     → color: #8b949e
<span class="kw">record</span>     → color: #ff7b72
<span class="str">"value"</span>   → color: #a5d6ff
<span class="fn">func_name</span> → color: #d2a8ff
<span class="num">142</span>       → color: #79c0ff
```
**따라서 Prism.js/Shiki 등 별도 구문 강조 라이브러리는 불필요하다.**
원본 CSS의 `.code-block .cm`, `.code-block .kw` 등 색상 규칙만 보존하면 된다.

### 주의사항
- 원본 HTML의 `<style>` 태그 내용은 **반드시 추출하여** `.doc-content` 스코프로 감싸서 적용. 제거하면 레이아웃이 완전히 깨진다.
- 원본 HTML의 `<script>` 태그는 제거 (React가 탭 전환을 처리).
- CSS 변수(`--c-speed`, `--c-stable` 등)는 `:root` 또는 `.doc-content`에 선언하여 콘텐츠 내부에서 접근 가능해야 한다.
- 원본의 `.tab-panel { display: none }` 규칙은 제거하거나 오버라이드해야 한다. React TabPanel이 활성 탭만 렌더링하므로, 패널 콘텐츠는 항상 `display: block`이어야 한다.
- 원본 HTML에 `margin-left: var(--sidebar-w)` 등 레이아웃 규칙이 있으므로, 이를 스코핑 시 제거하지 않으면 콘텐츠가 왼쪽으로 밀린다.

## MVP 범위 & 마일스톤

### MVP (Milestone 1) — 핵심 뷰어
- [ ] 프로젝트 초기화 (Vite + React + TS + Tailwind + pnpm)
- [ ] 빌드 타임 메타데이터 추출 스크립트 (`.top-tab[data-tab]` + `#panel-*` 패턴)
- [ ] 사이드바 네비게이션 (카테고리 트리, 접기/펼치기)
- [ ] 문서 뷰어 HTML 파서 (CSS 스코핑 + 앱 셸 제거 + 탭 패널 분리)
- [ ] React 탭 렌더링 (원본 CSS 보존, dangerouslySetInnerHTML)
- [ ] 코드 블록 복사 버튼 (구문 강조는 원본 HTML 내장)
- [ ] 반응형 레이아웃 (모바일 사이드바 슬라이드)

### Milestone 2 — 검색 & 북마크
- [ ] Cmd+K 검색 모달 (Fuse.js)
- [ ] 검색 결과 하이라이트 및 문서/섹션 이동
- [ ] 북마크 CRUD (Dexie.js)
- [ ] 북마크 목록 페이지

### Milestone 3 — 메모 & PWA
- [ ] 메모 에디터 (문서/탭/섹션 단위)
- [ ] 메모 목록 페이지
- [ ] PWA 설정 (manifest, service worker, 오프라인 캐싱)

### 후속 개선
- [ ] 다크 모드
- [ ] 학습 진도 추적 (체크리스트, 진도 바)
- [ ] 스페이스드 리피티션
- [ ] 관련 문서 추천
- [ ] 문서 내 텍스트 선택 → 메모 연결
- [ ] 데이터 export/import (JSON)

## 실행 전략 (로컬 전용)

이 프로젝트는 비공개 로컬 전용으로 운영한다. 외부 배포하지 않는다.

### 개발 모드

```bash
pnpm dev          # Vite dev server (http://localhost:5173)
```

### 프로덕션 빌드 & 로컬 서빙

```bash
pnpm build        # dist/ 디렉토리에 빌드 산출물 생성
pnpm preview      # 빌드 산출물을 로컬에서 서빙 (http://localhost:4173)
```

### Vite 설정

```typescript
// vite.config.ts — 로컬 전용이므로 base는 기본값('/')
export default defineConfig({
  base: '/',
  plugins: [react(), VitePWA({ ... })],
});
```

### PWA 오프라인 사용

PWA를 설정하면 `pnpm preview`로 한 번 접속 후, 
Service Worker가 캐시한 상태에서 오프라인에서도 문서 열람 가능.
MacBook/HP Omen 양쪽 브라우저에서 홈 화면에 추가하면 앱처럼 사용 가능.

## 금지 사항 & 주의 사항

### 금지
- `any` 타입 사용 금지.
- `index.ts` barrel export 금지.
- 인라인 스타일 금지 (Tailwind 또는 CSS 변수 사용).
- 클래스 컴포넌트 금지.
- 원본 HTML 파일을 수정하지 말 것 — 읽기 전용으로 취급.
- `localStorage` 직접 사용 금지 — 모든 영속 데이터는 Dexie.js(IndexedDB) 경유.
- 외부 API 호출 금지 — 완전한 클라이언트 사이드 앱.

### 주의
- 원본 HTML의 `<script>` 태그는 반드시 제거 후 렌더링.
- CSS 스코핑: 문서 콘텐츠 스타일이 앱 전체에 누출되지 않도록 `.doc-content` 스코프 적용.
- 검색 인덱스 크기: 30개 문서의 전체 텍스트를 인덱싱하면 수 MB가 될 수 있음. 필요시 섹션 제목 + 요약만 인덱싱하고, 상세 검색은 lazy load.
- 모바일: 사이드바는 기본 숨김, 햄버거 버튼으로 슬라이드 인.
- PWA 캐싱: HTML 문서 30개(~1.3MB)는 install 시점에 precache. 앱 셸은 별도 캐싱.
- 로컬 전용 프로젝트이므로 `base: '/'` 유지. 외부 배포 시에는 base path 변경 필요.
- Fuse.js 검색은 한글 형태소 분석을 하지 않으므로 검색 품질에 한계가 있음. 후속으로 `hangul-js` 또는 초성 검색 보완 가능.

## 카테고리 & 문서 매핑

```typescript
// src/lib/documents.ts
export const categories: Category[] = [
  {
    id: 'sre-basics',
    label: 'SRE 기초',
    icon: 'BookOpen',
    color: 'var(--color-blue)',
    documents: [
      'dora-metrics-guide',
      'sre-concepts-guide',
      'slo-engineering-deep-dive',
      'prr-error-budget',
    ],
  },
  {
    id: 'linux-os',
    label: 'Linux/OS',
    icon: 'Terminal',
    color: 'var(--color-green)',
    documents: [
      'md-lvm-concepts',
      'sre-linux-networking-deep-dive',
      'linux-kernel-deep-internals',
      'filesystem-storage-internals',
    ],
  },
  {
    id: 'kubernetes',
    label: 'Kubernetes',
    icon: 'Container',
    color: 'var(--color-purple)',
    documents: [
      'k8s-operations-deep-dive',
      'k8s-security-supply-chain',
      'k8s-controller-operator',
      'k8s-autoscaling-deep-dive',
      'k8s-upgrade-lifecycle',
    ],
  },
  {
    id: 'networking',
    label: '네트워킹',
    icon: 'Network',
    color: 'var(--color-teal)',
    documents: [
      'networking-advanced',
      'ebpf-cilium-networking',
      'http2-http3-grpc',
      'container-networking-internals',
    ],
  },
  {
    id: 'observability-db',
    label: '관측/DB',
    icon: 'BarChart3',
    color: 'var(--color-orange)',
    documents: [
      'observability-engineering-deep-dive',
      'database-stateful-services',
      'systems-performance-engineering',
    ],
  },
  {
    id: 'distributed-systems',
    label: '분산시스템 & 신뢰성',
    icon: 'GitBranch',
    color: 'var(--color-red)',
    documents: [
      'distributed-systems-internals',
      'capacity-planning-reliability',
      'incident-response-oncall',
      'chaos-engineering-resilience',
      'reliability-patterns',
    ],
  },
  {
    id: 'iac-deploy',
    label: 'IaC & 배포',
    icon: 'Layers',
    color: 'var(--color-blue)',
    documents: [
      'iac-gitops-deep-dive',
      'service-mesh-istio',
    ],
  },
  {
    id: 'culture-cost',
    label: '문화 & 비용',
    icon: 'Users',
    color: 'var(--color-orange)',
    documents: [
      'finops-cloud-cost',
      'platform-engineering',
    ],
  },
  {
    id: 'cs-fundamentals',
    label: 'CS 기반',
    icon: 'Cpu',
    color: 'var(--color-purple)',
    documents: [
      'ds-algo-infrastructure',
    ],
  },
];
```