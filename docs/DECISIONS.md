# 설계 결정 (ADR)

Architecture Decision Records — 주요 기술 선택의 배경과 근거를 기록합니다.

---

## ADR-001: Vite + React SPA 선택

**Status:** Accepted

**Context:**
본인 전용 로컬 학습 도구로, SSR/SEO가 불필요합니다.
30개의 정적 HTML 문서를 하나의 UI로 통합하는 것이 목표입니다.
Next.js는 SSR 복잡도가 과하고, Astro는 원본 HTML 임베드 방식과 궁합이 맞지 않습니다.

**Decision:**
Vite + React 18 SPA로 구성합니다.
빌드 설정이 단순하고, React 생태계(Router, Dexie 등)와 자연스럽게 연동됩니다.

**Consequences:**
- 빌드/설정이 단순하여 유지보수 부담이 적음
- SEO 없음 (로컬 전용이라 문제 없음)
- 초기 로드 시 JS 번들 필요 (로컬 전용이라 네트워크 무관)

---

## ADR-002: 빌드 타임 JSON 추출 + 원본 HTML 렌더링 하이브리드

**Status:** Accepted

**Context:**
30개 HTML 문서를 완전히 MDX/React로 변환하는 것은 비용이 과합니다.
`<iframe>` 임베드는 검색·북마크·메모와 연동이 불가합니다.
문서 검색과 네비게이션에는 메타데이터(제목, 탭 구조, 섹션)가 필요합니다.

**Decision:**
빌드 타임에 `extract-metadata.ts`로 메타데이터만 JSON으로 추출하고,
런타임 렌더링은 원본 HTML을 fetch하여 `dangerouslySetInnerHTML`로 주입합니다.

**Consequences:**
- 원본 문서의 시각 요소(카드, 다이어그램, 코드 블록)를 재작성 없이 보존
- 검색 인덱스와 UI 네비게이션을 JSON 기반으로 구현 가능
- 새 문서 추가 시 HTML 작성 규칙만 따르면 자동 반영

---

## ADR-003: 원본 CSS 보존 + `.doc-content` 스코핑

**Status:** Accepted

**Context:**
원본 HTML 문서는 카드 그리드(`.cg`), 코드 블록(`.code-block`), 게이지 바(`.gauge-row`),
플로우 다이어그램(`.flow`), 구문 강조(`.cm/.kw/.str`) 등 풍부한 자체 CSS를 내장하고 있습니다.
이를 Tailwind로 재작성하면 문서 수만큼의 비용이 발생합니다.

**Decision:**
원본 `<style>` 태그를 추출하여 `.doc-content` 하위로 스코핑한 뒤 동적으로 주입합니다.
앱 레이아웃 관련 CSS(`.sidebar`, `.main`, `body` 리셋 등)만 제거합니다.

**Consequences:**
- 원본 문서 시각 품질 100% 유지
- 앱 전역 스타일 오염 없음 (`.doc-content` 격리)
- 새 문서 CSS 변수가 추가될 때 `document.css`에 추가 필요 가능성

---

## ADR-004: IndexedDB (Dexie.js) for 북마크 & 메모

**Status:** Accepted

**Context:**
본인 전용이라 서버/API 없이 클라이언트 사이드만으로 동작해야 합니다.
`localStorage`는 5MB 제한이 있고 구조적 쿼리가 불편합니다.
메모 내용이 늘어나면 용량 문제가 생길 수 있습니다.

**Decision:**
Dexie.js를 통해 IndexedDB를 사용합니다.
스키마: `bookmarks (++id, documentId, tabId, sectionId)`, `memos (++id, documentId, tabId, updatedAt)`.

**Consequences:**
- 용량 제한 없음 (브라우저 저장 공간 한도까지)
- `where().equals()` 등 구조적 쿼리 지원
- 같은 브라우저 프로파일 내에서만 데이터 공유 (MacBook ↔ HP Omen 간 동기화 없음)

---

## ADR-005: HashRouter 선택

**Status:** Accepted

**Context:**
`pnpm preview`는 Vite의 정적 파일 서버로 동작하며, SPA fallback(`/index.html` 리다이렉트)을 지원하지 않습니다.
`BrowserRouter`를 사용하면 `/doc/some-guide`를 직접 접근하거나 새로고침 시 404가 발생합니다.

**Decision:**
`createHashRouter`를 사용합니다. URL 형태: `/#/doc/some-guide?tab=overview`.

**Consequences:**
- 별도 서버 설정 없이 `pnpm preview` + PWA 오프라인에서 정상 동작
- URL에 `#`이 포함되어 공유/북마크가 약간 투박함 (로컬 전용이라 허용)

---

## ADR-006: 로컬 전용 운영

**Status:** Accepted

**Context:**
SRE 전환 학습용 개인 콘텐츠로, 외부 공개가 필요 없습니다.
인증, 권한, API 서버, CI/CD 배포 파이프라인을 없애면 복잡도가 대폭 줄어듭니다.

**Decision:**
`base: '/'`, 외부 배포 없음, 클라이언트 사이드 전용으로 운영합니다.
`pnpm dev` 또는 `pnpm preview`로만 접근합니다.

**Consequences:**
- 인증/권한/백엔드 코드 불필요
- MacBook/HP Omen 양쪽에서 `pnpm preview` + PWA 홈 화면 추가로 앱처럼 사용
- 외부 배포 시 `base` 경로 변경과 서버 fallback 설정이 필요

---

## ADR-007: 별도 구문 강조 라이브러리 불사용

**Status:** Accepted

**Context:**
원본 HTML 문서는 이미 인라인 `<span>` 태그로 구문 강조가 내장되어 있습니다:

```html
<span class="cm"># 주석</span>
<span class="kw">record</span>
<span class="str">"value"</span>
```

Prism.js나 Shiki 같은 라이브러리를 추가하면 이미 강조된 코드를 중복 처리하게 됩니다.

**Decision:**
별도 구문 강조 라이브러리를 사용하지 않습니다.
원본 CSS의 `.code-block .cm/.kw/.str/.fn/.num` 색상 규칙만 `.doc-content` 스코프로 보존합니다.

**Consequences:**
- 번들 크기 절감 (Prism ~30KB, Shiki ~200KB 제거)
- 새로 작성하는 HTML 문서도 동일한 인라인 span 규칙을 따라야 함
