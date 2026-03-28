# 기여 가이드

개인 학습 프로젝트이므로 본인이 나중에 참고하기 위한 가이드입니다.

---

## 새 문서 추가 워크플로

### 1. HTML 파일 복사

```bash
cp ~/path/to/your-new-guide.html public/docs/your-new-guide.html
```

파일명은 `kebab-case`로, 확장자는 `.html`입니다.
이 slug가 URL과 문서 ID로 사용됩니다: `/doc/your-new-guide`

### 2. docs-config.yaml 등록

```yaml
categories:
  - id: sre-basics
    label: SRE 기초
    icon: BookOpen
    color: blue
    docs:
      - dora-metrics-guide
      - your-new-guide   # ← 여기에 추가 (순서 = 사이드바 순서)
```

`color` 값: `blue` | `green` | `orange` | `red` | `purple` | `teal` | `indigo`

`icon` 값: lucide-react 아이콘명 (`BookOpen`, `Terminal`, `Container`, `Network`, `BarChart3`, `GitBranch`, `Layers`, `Users`, `Cpu`)

### 3. 자동 반영

```bash
pnpm dev
# 또는 이미 dev 서버가 실행 중이라면:
pnpm extract && pnpm search-index
```

`pnpm extract` 출력에서 새 문서가 `✅`로 표시되면 반영 완료입니다.

---

## HTML 문서 작성 규칙

### 탭 구조

```html
<!-- 상단 탭 버튼 (두 가지 패턴 중 하나) -->
<button class="top-tab active" data-t="overview">● 개요</button>
<button class="top-tab" data-t="details">● 세부 내용</button>

<!-- 탭 패널 -->
<div class="tab-panel active" id="p-overview">
  <div class="sub" id="what-is-sre"><h3>SRE란?</h3>...</div>
</div>
<div class="tab-panel" id="p-details">...</div>
```

또는 `data-tab` + `#panel-{id}` 패턴을 사용해도 됩니다.

### 코드 블록 구문 강조

별도 라이브러리 없이 인라인 `<span>` 태그로 강조합니다:

```html
<div class="code-block">
  <span class="cm"># 주석</span>
  <span class="kw">kubectl</span> <span class="fn">get pods</span>
  <span class="str">"value"</span> <span class="num">42</span>
</div>
```

| 클래스 | 색상 | 용도 |
|--------|------|------|
| `.cm` | 회색 | 주석 |
| `.kw` | 빨강 | 키워드 |
| `.str` | 파랑 | 문자열 |
| `.fn` | 보라 | 함수/변수 |
| `.num` | 청록 | 숫자 |

### CSS 변수

문서 내 `<style>` 태그에서 CSS 변수를 정의합니다:

```css
:root {
  --surface: #ffffff;
  --text: #1a1d23;
  --blue: #0969b2;
  --blue-bg: rgba(9, 105, 178, 0.08);
  /* 다크 모드 오버라이드는 document.css에서 자동 처리 */
}
```

다크 모드 CSS 변수 오버라이드는 `src/styles/document.css`의
`[data-theme="dark"] .doc-content` 블록에서 처리합니다.
새 CSS 변수 패턴을 사용하면 해당 블록에 추가가 필요할 수 있습니다.

### 필수 보존 CSS 클래스

| 클래스 | 설명 |
|--------|------|
| `.cg` | 카드 그리드 (2컬럼 grid) |
| `.card` | 카드 컴포넌트 |
| `.code-block` | 코드 블록 배경 |
| `.note`, `.note-warn` | 콜아웃 박스 |
| `.gauge-row`, `.gauge-fill` | 프로그레스 바 |
| `.flow`, `.flow-node`, `.flow-arrow` | 플로우 다이어그램 |
| `.analogy` | 개념 매핑 카드 |
| `.level-table`, `.cmd-table` | 스타일드 테이블 |

---

## 새 카테고리 추가

`docs-config.yaml`에 새 카테고리 항목을 추가하면 됩니다:

```yaml
categories:
  # ... 기존 카테고리
  - id: my-new-category      # 고유 ID (kebab-case)
    label: 새 카테고리        # 사이드바 표시 이름
    icon: BookOpen            # lucide-react 아이콘명
    color: blue               # 대표 색상
    docs:
      - my-first-doc
```

`pnpm extract` 실행 시 자동으로 사이드바에 추가됩니다.

---

## 트러블슈팅

### 레이아웃이 깨질 때

1. **콘텐츠가 왼쪽으로 밀림** — 원본 CSS에 `margin-left: var(--sidebar-w)` 등 레이아웃 규칙이 있고 스코핑에서 제거되지 않은 경우. `html-parser.ts`의 제거 패턴에 해당 선택자 추가.

2. **탭 콘텐츠가 안 보임** — 원본 CSS의 `.tab-panel { display: none }` 규칙이 `.doc-content` 스코프로 주입된 경우. `html-parser.ts`의 `SKIP_SELECTORS`에 `.tab-panel` 추가 여부 확인.

3. **다크 모드에서 배경이 흰색** — 문서 CSS가 새 변수 패턴을 사용하는 경우. `src/styles/document.css`의 `[data-theme="dark"] .doc-content` 블록에 해당 변수 추가.

4. **탭이 인식 안 됨** — `pnpm extract` 출력에서 `0 tabs`이 표시되는 경우. HTML의 탭 버튼이 `data-t` 또는 `data-tab` 속성을 가지는지, 패널 ID가 `#p-{tabId}` 또는 `#panel-{tabId}` 형식인지 확인.

### 검색 결과가 없을 때

`pnpm search-index`를 다시 실행하여 인덱스를 재생성합니다.
브라우저 DevTools → Application → Cache Storage에서 `data-json` 캐시를 삭제하면 최신 인덱스가 적용됩니다.
