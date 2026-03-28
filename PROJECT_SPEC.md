# PROJECT_SPEC.md — SRE Learning Hub 프로젝트 스펙

## 1. 라우팅 구조

```
/                          → HomePage (전체 문서 목록 + 카테고리 그리드)
/doc/:documentId           → DocumentPage (문서 뷰어)
/doc/:documentId?tab=:tabId → DocumentPage (특정 탭 활성)
/doc/:documentId?tab=:tabId&section=:sectionId → DocumentPage (특정 섹션 스크롤)
/bookmarks                 → BookmarksPage (북마크 모아보기)
/memos                     → MemosPage (메모 모아보기)
/*                         → NotFoundPage (404)
```

### react-router-dom 설정

```typescript
// src/App.tsx
import { createHashRouter, RouterProvider } from 'react-router-dom';

// HashRouter 사용 — pnpm preview에서 SPA fallback 없이도 라우팅 동작
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'doc/:documentId', element: <DocumentPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'memos', element: <MemosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

> **HashRouter 선택 이유**: `pnpm preview` (Vite preview server)는 SPA fallback을 지원하지 않으므로,
> `createBrowserRouter` 대신 `createHashRouter`를 사용하여 `/#/doc/sre-concepts-guide` 형태로 라우팅.
> 서버 설정 없이 로컬에서 바로 동작한다.

## 2. 화면별 상세 기능 명세

### 2.1 Layout (공통 레이아웃)

```
┌─────────────────────────────────────────────────────┐
│ TopBar [≡] [🔍 Cmd+K로 검색...]     [📑] [📝]      │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Content Area                            │
│          │                                          │
│ SRE 기초 │  (각 페이지의 콘텐츠가 렌더링됨)           │
│  ├ DORA  │                                          │
│  ├ SRE   │                                          │
│  └ SLO   │                                          │
│          │                                          │
│ Linux/OS │                                          │
│  ├ LVM   │                                          │
│  └ ...   │                                          │
│          │                                          │
│ ...      │                                          │
└──────────┴──────────────────────────────────────────┘
```

#### TopBar
- 높이: 56px (`var(--topbar-height)`)
- 왼쪽: 모바일 햄버거 버튼 (데스크톱에서 숨김)
- 중앙: 검색 트리거 (클릭 또는 `Cmd+K`/`Ctrl+K`로 SearchModal 열기)
- 오른쪽: 북마크 페이지 링크, 메모 페이지 링크

#### Sidebar
- 너비: 260px (데스크톱), 전체 화면 오버레이 (모바일)
- 9개 카테고리를 토글 가능한 트리로 표시
- 카테고리 헤더: 아이콘 + 라벨 + 문서 개수 배지 + 접기/펼치기 화살표
- 문서 항목: 클릭 시 해당 문서로 라우팅, 현재 문서 하이라이트
- 하단: 앱 버전 표시

#### Content Area
- `margin-left: var(--sidebar-width)` (데스크톱)
- `padding-top: var(--topbar-height)`
- 최대 너비: `960px` (중앙 정렬)

### 2.2 HomePage

```
┌─────────────────────────────────────────────┐
│  🎯 SRE Learning Hub                        │
│  30개 문서 · 9개 카테고리                      │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ SRE 기초 │ │ Linux/OS│ │   K8s   │        │
│  │  4 docs  │ │  4 docs │ │  5 docs │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ 네트워킹 │ │  관측/DB │ │ 분산시스템│        │
│  │  4 docs  │ │  3 docs │ │  5 docs │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│  ...                                         │
│                                              │
│  📄 최근 본 문서                               │
│  ┌──────────────────────────────────┐        │
│  │ SRE 핵심 개념  ·  3시간 전         │        │
│  │ K8s Operations · 어제             │        │
│  └──────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

- 카테고리 카드 그리드: 클릭 시 사이드바에서 해당 카테고리 펼치고 첫 문서로 이동
- 최근 본 문서: `localStorage`에 최근 10개 문서 ID + 타임스탬프 저장
- 통계: 전체 문서 수, 북마크 수, 메모 수 표시

### 2.3 DocumentPage (문서 뷰어)

```
┌──────────────────────────────────────────────────────┐
│  📄 SRE 핵심 개념                   [★ 북마크] [📝+]  │
│  SRE 기초 · 예상 읽기 시간 15분                        │
├──────────────────────────────────────────────────────┤
│  [개요] [핵심 원칙] [SLI/SLO] [On-Call] [문화]         │  ← TabBar
├──────────────────────────────────────────────────────┤
│                                                       │
│  ## SRE란 무엇인가                                     │
│                                                       │
│  SRE(Site Reliability Engineering)는...               │
│                                                       │
│  ### 핵심 원칙                                         │
│  ...                                                  │
│                                                       │
│  ```yaml                                      [복사]  │
│  apiVersion: v1                                       │
│  kind: Service                                        │
│  ```                                                  │
│                                                       │
│  💬 메모 (2)                                           │
│  ┌──────────────────────────────────┐                 │
│  │ 실무에서 error budget 계산 방법...  │                 │
│  │ 2024-01-15                       │                 │
│  └──────────────────────────────────┘                 │
│                                                       │
│  [◀ 이전: DORA Metrics]   [다음: SLO Engineering ▶]   │
└──────────────────────────────────────────────────────┘
```

#### 문서 로딩 플로우
1. URL에서 `documentId` 추출
2. `documents-meta.json`에서 메타데이터 조회 (탭 목록, 카테고리 등)
3. `fetch('/docs/{filename}.html')` 로 원본 HTML 로드
4. `DOMParser`로 파싱:
   - `<style>` 추출 → `.doc-content` 스코프로 감싸 DOM에 주입
   - `.sidebar`, `.top-tabs`, `.mobile-toggle`, `<script>` 제거
   - `.tab-panel` (=`#panel-*`) 별로 innerHTML 분리
   - `.tab-panel { display: none }` 규칙 제거/오버라이드
5. React TabBar + TabPanel로 렌더링 (활성 탭만 dangerouslySetInnerHTML)
6. 후처리 (useEffect): 코드 블록 복사 버튼, heading 앵커 링크 추가

#### TabBar
- `.top-tab[data-tab]` 에서 추출한 탭 목록 렌더링
- 탭별 accent 색상은 원본 CSS에서 추출 (예: `overview` → `--c-teal`, `metrics` → `--c-speed`)
- URL 쿼리 파라미터(`?tab=`)와 양방향 동기화
- 탭 전환 시 스크롤 위치 최상단으로 리셋

#### 코드 블록
- 원본 HTML이 인라인 `<span class="cm/kw/str/fn/num">` 으로 구문 강조를 내장하고 있으므로 **별도 하이라이터 불필요**
- 원본 CSS(`.code-block .cm { color: #8b949e }` 등)만 보존하면 자동 동작
- 우상단 복사 버튼 (useEffect로 동적 추가, 클릭 시 "복사됨!" 피드백)
- 긴 코드 블록: `overflow-x: auto` (원본 CSS에 이미 포함)

#### 이전/다음 네비게이션
- 같은 카테고리 내 이전/다음 문서로 이동
- 카테고리 마지막 문서 → 다음 카테고리 첫 문서 (선택적)

### 2.4 SearchModal (Cmd+K 검색)

```
┌────────────────────────────────────────┐
│  🔍 검색어 입력...                  [ESC] │
├────────────────────────────────────────┤
│                                         │
│  📂 SRE 기초                            │
│    📄 SRE 핵심 개념 > 개요 > SRE란 무엇인가│
│       "...SRE는 소프트웨어 엔지니어링..."   │
│                                         │
│  📂 Kubernetes                          │
│    📄 K8s Operations > 운영 > 롤링 업데이트│
│       "...무중단 배포를 위한..."           │
│                                         │
│  ↑↓ 탐색  ↵ 이동  ESC 닫기              │
└────────────────────────────────────────┘
```

- `Cmd+K` (Mac) / `Ctrl+K` (Windows)로 열기
- 디바운스 300ms 적용
- Fuse.js 검색: 문서 제목, 탭 라벨, 섹션 제목, 섹션 내용
- 결과를 카테고리별로 그룹핑
- 키보드 네비게이션: `↑`/`↓` 이동, `Enter` 선택, `ESC` 닫기
- 선택 시 해당 문서의 탭 + 섹션으로 바로 이동

### 2.5 BookmarksPage

```
┌─────────────────────────────────────────┐
│  ★ 북마크 (12)                    [정렬 ▾] │
│                                          │
│  📂 SRE 기초                             │
│  ┌───────────────────────────────┐       │
│  │ ★ SRE 핵심 개념 > 개요         [✕]    │
│  │   2024-01-15                   │       │
│  ├───────────────────────────────┤       │
│  │ ★ SLO Engineering > 번 레이트  [✕]    │
│  │   2024-01-12                   │       │
│  └───────────────────────────────┘       │
│                                          │
│  📂 Kubernetes                           │
│  ┌───────────────────────────────┐       │
│  │ ★ K8s Autoscaling > HPA       [✕]    │
│  │   2024-01-10                   │       │
│  └───────────────────────────────┘       │
└─────────────────────────────────────────┘
```

- 카테고리별 그룹핑
- 정렬: 최신순 / 이름순
- 클릭 시 해당 문서/탭/섹션으로 이동
- 삭제 버튼 (확인 없이 즉시 삭제, undo toast)

### 2.6 MemosPage

```
┌─────────────────────────────────────────────┐
│  📝 메모 (8)                    [검색] [정렬 ▾] │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 📄 SRE 핵심 개념 > On-Call            │    │
│  │                                       │    │
│  │ 실무에서 PagerDuty 알림 설정 시...      │    │
│  │ Grafana alerting → PagerDuty 연동     │    │
│  │                                       │    │
│  │ 2024-01-15 · [수정] [삭제]             │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 📄 K8s Operations > 트러블슈팅         │    │
│  │                                       │    │
│  │ OOMKilled 발생 시 체크리스트:           │    │
│  │ 1. kubectl top pods 확인              │    │
│  │ 2. ...                                │    │
│  │                                       │    │
│  │ 2024-01-14 · [수정] [삭제]             │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

- 전체 메모를 최신순으로 표시
- 메모 내 검색 기능
- 인라인 수정 가능
- 삭제 시 확인 모달
- 연결된 문서로 이동 링크

## 3. 상태 관리 설계

### 전역 상태 (React Context)

앱 수준에서 관리할 상태가 적으므로 Redux/Zustand 없이 Context로 충분:

```typescript
// src/contexts/AppContext.tsx
interface AppState {
  sidebarOpen: boolean;           // 모바일 사이드바 토글
  searchOpen: boolean;            // 검색 모달 토글
  currentDocumentId: string | null; // 현재 보고 있는 문서
  recentDocuments: RecentDoc[];   // 최근 본 문서 (최대 10개)
}

interface RecentDoc {
  documentId: string;
  visitedAt: Date;
}
```

### 로컬 상태 (컴포넌트 레벨)

```
DocumentPage:
  - activeTabId: string          // 현재 활성 탭
  - htmlContent: string | null   // 로드된 HTML 콘텐츠
  - parsedTabs: ParsedTab[]      // 파싱된 탭 데이터
  - loading: boolean
  - error: string | null

SearchModal:
  - query: string
  - results: SearchResult[]
  - selectedIndex: number

MemoEditor:
  - content: string
  - editing: boolean
  - saving: boolean
```

### 영속 데이터 (IndexedDB via Dexie.js)

```
bookmarks 테이블:
  ├── id (auto-increment PK)
  ├── documentId (indexed)
  ├── tabId
  ├── sectionId
  ├── title
  └── createdAt (indexed)

memos 테이블:
  ├── id (auto-increment PK)
  ├── documentId (indexed)
  ├── tabId
  ├── sectionId
  ├── content
  ├── createdAt
  └── updatedAt (indexed)
```

### 캐싱 전략

```
최근 본 문서: localStorage ('sre-hub:recent-docs')
사이드바 접기 상태: localStorage ('sre-hub:sidebar-collapsed')
활성 탭 기억: localStorage ('sre-hub:active-tabs') — { [docId]: tabId }
```

## 4. 빌드 타임 데이터 파이프라인

### 추출 스크립트 상세 스펙

```
Input:  public/docs/*.html (30개 파일)
Output: src/data/documents-meta.json
        src/data/search-index.json
```

#### documents-meta.json 구조

```json
{
  "documents": [
    {
      "id": "sre-concepts-guide",
      "title": "SRE 핵심 개념",
      "filename": "sre-concepts-guide.html",
      "category": "sre-basics",
      "order": 2,
      "description": "SRE의 핵심 원칙과 실천 방법을 다루는 종합 가이드",
      "estimatedReadTime": 15,
      "tabs": [
        {
          "id": "overview",
          "label": "개요",
          "accentColor": "#0969b2",
          "sections": [
            {
              "id": "what-is-sre",
              "title": "SRE란 무엇인가",
              "level": 2,
              "tabId": "overview"
            }
          ]
        }
      ]
    }
  ],
  "categories": [ ... ],
  "buildTimestamp": "2024-01-15T10:30:00Z"
}
```

#### HTML 파싱 규칙 (실제 구조 검증 완료)

기존 HTML 문서의 탭 구조 패턴:

```html
<!-- 최외곽 레이아웃 (제거 대상 — 앱 레이아웃으로 대체) -->
<div class="layout">
  <aside class="sidebar">...</aside>     <!-- 제거: 앱 사이드바로 대체 -->
  <div class="main">
    <div class="top-tabs">               <!-- 제거: React TabBar로 대체 -->
      <button class="top-tab active" data-tab="overview" onclick="switchTab('overview')">● 개요</button>
      <button class="top-tab" data-tab="metrics" onclick="switchTab('metrics')">● 4대 메트릭</button>
    </div>

    <!-- 탭 패널 (id="panel-{tabId}") — 이 안의 콘텐츠만 추출 -->
    <div class="tab-panel active" id="panel-overview">
      <div class="panel-header">
        <span class="panel-badge badge-teal">● DORA OVERVIEW</span>
        <h2>DORA Metrics란?</h2>
        <p>설명 텍스트...</p>
      </div>
      <div class="sub" id="what-is-dora">
        <h3>DORA가 뭔가요?</h3>
        <div class="cg">
          <div class="card"><h4>기원</h4><p>...</p></div>
          <div class="card"><h4>핵심 목표</h4><p>...</p></div>
        </div>
      </div>
    </div>
    <div class="tab-panel" id="panel-metrics">...</div>
    <div class="tab-panel" id="panel-levels">...</div>
    <div class="tab-panel" id="panel-practice">...</div>
  </div>
</div>
<script>function switchTab(tabName) { ... }</script> <!-- 제거: React가 처리 -->
```

추출 스크립트는 이 패턴을 파싱하여:
1. `.top-tab[data-tab]` → 탭 ID (`data-tab` 값), 라벨 (버튼 텍스트), accent 색상 (CSS에서 매칭)
2. `#panel-{tabId}` → 탭별 HTML 콘텐츠 (innerHTML)
3. `#panel-{tabId} .sub[id]` → 섹션 트리 구성 (섹션 ID = `.sub`의 `id` 속성)
4. `.sub h3` → 섹션 제목
5. `.sb-nav a[data-tab][data-section]` → 사이드바 네비 구조 (탭-섹션 매핑)
6. 각 섹션의 텍스트 콘텐츠 → 검색 인덱스용 평문 추출

> **주의**: 문서마다 탭 ID, 패널 ID, CSS 변수명이 미세하게 다를 수 있으므로,
> 스크립트는 `data-tab` 속성과 `#panel-` 접두사 패턴에 의존하여 유연하게 파싱.
> 탭이 없는 문서는 전체 `<body>` 콘텐츠를 하나의 "기본" 탭으로 처리.

## 5. 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Cmd/Ctrl + K` | 검색 모달 열기/닫기 |
| `ESC` | 모달 닫기, 사이드바 닫기 |
| `←` / `→` | 이전/다음 탭 전환 (문서 뷰어) |
| `Cmd/Ctrl + B` | 현재 문서/섹션 북마크 토글 |
| `Cmd/Ctrl + M` | 메모 에디터 열기 |
| `[` / `]` | 이전/다음 문서 이동 |

## 6. PWA 설정

### manifest.webmanifest

```json
{
  "name": "SRE Learning Hub",
  "short_name": "SRE Hub",
  "description": "SRE 전환 학습 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8f9fb",
  "theme_color": "#0969b2",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker 전략 (vite-plugin-pwa)

```typescript
// vite.config.ts — VitePWA 설정
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        // HTML 문서 파일 — Cache First (한 번 캐시되면 변경 드묾)
        urlPattern: /\/docs\/.*\.html$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'sre-docs',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // 검색 인덱스 — Stale While Revalidate
        urlPattern: /\/data\/.*\.json$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'sre-data',
        },
      },
    ],
  },
})
```

## 7. 반응형 브레이크포인트

| 브레이크포인트 | 너비 | 사이드바 | 콘텐츠 |
|--------------|------|---------|--------|
| Desktop | ≥1024px | 항상 표시 (260px) | `margin-left: 260px` |
| Tablet | 768-1023px | 오버레이 (토글) | 전체 너비 |
| Mobile | <768px | 오버레이 (토글) | 전체 너비, 패딩 축소 |

## 8. 성능 목표

| 지표 | 목표 |
|------|------|
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| 문서 전환 | < 300ms |
| 검색 응답 | < 100ms |
| 오프라인 로드 | < 2s |
| 빌드 시간 | < 30s |
| 번들 크기 (gzipped) | < 200KB (앱 코드, 문서 제외) |

### 성능 최적화 전략
- 문서 HTML: lazy load (라우트 진입 시 fetch)
- 검색 인덱스: 앱 시작 시 비동기 로드
- React.lazy로 페이지 컴포넌트 코드 스플리팅
- 폰트: `font-display: swap`, preload
- 이미지: 문서 내 이미지는 lazy loading (`loading="lazy"`)