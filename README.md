# SRE Handbook

SRE 전환 학습용 HTML 가이드 문서 33개를 통합한 로컬 전용 PWA입니다.
독스 사이트 스타일(사이드바 + 콘텐츠)로 문서 탐색, 전문 검색, 북마크, 메모 기능을 제공합니다.

<!-- screenshots -->

## 주요 기능

- **문서 뷰어** — 원본 HTML의 CSS(카드 그리드, 코드 블록, 다이어그램)를 그대로 보존하여 렌더링
- **탭 네비게이션** — 문서 내 탭 구조를 React로 재구현, URL(`?tab=`)로 상태 동기화
- **Cmd+K 검색** — Fuse.js 기반 전문 검색, 카테고리별 그룹핑, 키보드 완전 지원
- **북마크** — 문서/탭/섹션 단위 북마크, IndexedDB 영속 저장
- **메모** — 탭별 인라인 메모 에디터, IndexedDB 영속 저장
- **다크 모드** — OS 기본값 연동 + 수동 전환, FOUC 없는 즉시 적용
- **PWA 오프라인** — Service Worker로 문서 30일 캐싱, 홈 화면 추가 지원
- **iPad 오프라인 빌드** — `file://` 프로토콜로 직접 열 수 있는 독립 HTML 파일 생성 (`pnpm build:offline`)
- **반응형** — 모바일 슬라이드 사이드바, 데스크톱 고정 레이아웃

## 기술 스택

| 영역 | 기술 |
|------|------|
| 빌드/번들러 | Vite 6 |
| UI 프레임워크 | React 18 |
| 언어 | TypeScript 5 (strict) |
| 라우팅 | React Router v7 (HashRouter) |
| 스타일링 | Tailwind CSS 3.4 |
| 검색 | Fuse.js 7 |
| 로컬 DB | Dexie.js 4 (IndexedDB) |
| PWA | vite-plugin-pwa |

## 빠른 시작

```bash
# 의존성 설치
pnpm install

# 개발 서버 (메타데이터 추출 + Vite dev server)
pnpm dev
```

프로덕션 빌드:

```bash
pnpm build          # dist/ 생성
pnpm preview        # 빌드 결과 로컬 서빙
pnpm build:offline  # dist-offline/ 생성 (iPad file:// 용)
```

## 새 문서 추가

1. `public/docs/`에 HTML 파일 복사
2. `docs-config.yaml`의 해당 카테고리 `docs:` 목록에 슬러그 한 줄 추가
3. `pnpm dev` → 자동 반영

자세한 내용은 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)를 참고하세요.

## 프로젝트 구조

```
sre-handbook/
├── docs-config.yaml          # 카테고리 & 문서 순서 설정 (단일 진실 공급원)
├── public/
│   ├── docs/                 # 원본 HTML 문서 (읽기 전용)
│   ├── data/                 # 빌드 타임 생성 (documents-meta.json, search-index.json)
│   └── manifest.webmanifest
├── scripts/
│   ├── extract-metadata.ts         # HTML → documents-meta.json
│   ├── generate-search-index.ts
│   └── prepare-offline-build.mjs  # file:// 오프라인 빌드 생성
├── src/
│   ├── components/
│   │   ├── layout/           # Sidebar, TopBar, Layout, MobileNav
│   │   ├── viewer/           # DocumentViewer, TabBar, TabPanel
│   │   ├── search/           # SearchModal
│   │   ├── bookmark/         # BookmarkButton
│   │   └── memo/             # MemoEditor
│   ├── pages/                # HomePage, DocumentPage, BookmarksPage, MemosPage
│   ├── hooks/                # useDocumentMeta, useSearch, useBookmarks, useMemos
│   ├── lib/                  # db, html-parser, constants, search-index, cn
│   ├── types/                # document, bookmark, memo, search
│   ├── contexts/             # AppContext (theme, search, sidebar)
│   └── styles/               # globals.css, document.css
└── docs/                     # 프로젝트 문서
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── CHANGELOG.md
    └── CONTRIBUTING.md
```

## 문서

- [아키텍처](docs/ARCHITECTURE.md) — 데이터 흐름, 컴포넌트 계층, CSS 스코핑 전략
- [설계 결정](docs/DECISIONS.md) — 주요 기술 선택 근거 (ADR)
- [변경 이력](docs/CHANGELOG.md)
- [기여 가이드](docs/CONTRIBUTING.md) — 새 문서 추가, 트러블슈팅
