# 프론트엔드 수정 기록

내가 "이렇게 바꿔줘" 라고 요청한 내용과, 그에 따라 실제로 바뀐 파일을 정리한 로그.
최신 항목이 위로 온다.

## 새 요청을 추가하는 방법

아래 템플릿을 복사해 **맨 위 `---` 바로 아래**에 붙여넣는다.

```
## YYYY-MM-DD · <한 줄 제목>
**요청**: <내가 부탁한 내용 그대로 / 요약>
**변경**:
- `<파일경로>` — <무엇을 어떻게>
**메모**: <선택 - 트레이드오프, 되돌리는 법 등>
```

---

## 2026-09-10 · 로드맵·AI 상담 폭 1300px → 1200px

(요청에 따라 `.fp--wideplus` max-width 를 최종 `1200px` 로 조정)

## 2026-09-10 · 로드맵·AI 상담 폭 1300px (구)

**요청**: 창업 로드맵·AI 상담 페이지 폭 `1180 → 1300px`, 가운데 정렬.

**변경**:
- `src/App.jsx` `SubPage` — `pageKey==='roadmap' || pageKey==='ai'` 이면 `.fp` 에 `fp--wideplus`
- `src/styles.css` `.fp--wideplus .fp__head-in`/`.fp__body` — `max-width: 1600 → 1300px` (`width:100%; margin:0 auto` 유지)

**메모**: 세무·공고는 1180px 유지. `npx vite build` 통과.

## 2026-09-10 · 로드맵·AI 상담 폭을 세무 AI(1180px)로 통일

**요청**: 창업 로드맵·AI 상담 페이지 폭을 세무 AI 페이지와 동일하게.

**변경**:
- `src/App.jsx` `SubPage` — `pageKey==='ai' → fp--full`, `pageKey==='roadmap' → fp--wideplus` 클래스 부여 제거. 4개 슬림 서브페이지 모두 `fp--wide`(max-width 1180px) 로 통일
- `.fp--full` / `.fp--wideplus` CSS 는 미사용으로 남겨둠

**메모**: `npx vite build` 통과.

## 2026-09-10 · 창업 로드맵 기능 영역 폭 확대 (1180 → 1600)

**요청**: 로드맵 페이지 기능부분 폭을 (표시한) 빨간 선까지.

**변경**:
- `src/App.jsx` `SubPage` — `pageKey==='roadmap'` 이면 `.fp` 에 `fp--wideplus`
- `src/styles.css` `.fp--wideplus .fp__head-in`/`.fp__body` — `max-width: 1180 → 1600px`, `width: 100%; margin: 0 auto`(플렉스 자식이 `margin:0 auto` 로 콘텐츠 폭에 수축하던 문제 해결 → 1600px 가운데 정렬로 확실히 확대). `.fp--full` 도 `width: 100%` 추가
- 헤더·스텝 탭·진행률·체크리스트·대화창이 모두 넓어진 영역을 사용 (1920 화면에서 좌우 약 160px 여백)

**메모**: 다른 서브페이지(세무/공고)는 1180px 유지, AI 상담은 전체 폭. `npx vite build` 통과.

## 2026-09-10 · 말풍선 테두리 + AI 상담 전체 폭 레이아웃

**요청**: (1) AI 대화 말풍선에 테두리 (2) AI 상담 페이지를 이미지처럼(전체 폭).

**변경**:
- `src/styles.css` `.msg--ai` — 배경 `--ground → --surface-solid`, `border: 1px solid --line-strong`. `.msg--user` — `border: 1px solid --blue-deep`. 전 대화(홈 데모·로드맵·세무·공고·AI상담)에 적용. 로드맵 전용 `.msg--ai` 오버라이드도 `--line-strong` 로 통일
- `src/App.jsx` `SubPage` — `pageKey==='ai'` 일 때 `.fp` 에 `fp--full` 클래스
- `src/styles.css` `.fp--full .fp__head-in`/`.fp__body` — `max-width: none; margin: 0`(플렉스 자식의 `margin:0 auto` 로 인한 가운데 정렬 제거 → 전체 폭). `.fp--wide .cvx__side` 오른쪽 구분선 제거

**메모**: AI 상담만 전체 폭, 나머지 서브페이지는 1180px 유지. `npx vite build` 통과.

## 2026-09-10 · 창업 로드맵 대화 패널 — 회색 패널 + 흰 말풍선 (첨부 이미지)

**요청**: 로드맵 페이지를 첨부 이미지처럼.

**변경** (`src/styles.css` `.fp--wide .rg2__chat` 계열):
- `.rg2__chat .ai` 배경 `--surface-solid → --ground`(회색 패널)
- `.rg2__chat .ai__bar` / `.ai__foot` / `.ai__foot input` 은 흰색으로 고정
- `.rg2__chat .msg--ai` 배경 `--ground → --surface-solid` + `border 1px --line`(회색 패널 위 흰 말풍선으로 대비)

**메모**: 레이아웃(가로 스텝 탭 + 체크리스트 | 대화창)은 그대로. 대화창 색 처리만 이미지에 맞춤. `npx vite build` 통과.

## 2026-09-10 · AI 상담 클린 패널 · 홈으로 버튼 제거 · 홈 축소 · 메뉴 글자 축소

**요청 4건**:
1. AI 상담을 이미지처럼(카드 테두리 없는 전체 패널)
2. "홈으로" 버튼 전부 제거
3. 메인(홈)을 지금에서 다시 90%(→ 누적 81%)
4. 메뉴 글씨크기 현재의 80%로

**변경**:
- `src/styles.css` `.fp--wide .cvx__main` — `border`/`border-radius`/`box-shadow` 제거(테두리 없는 패널). `.cvx__main .ai__body` 회색 틴트 제거(흰 배경 유지). `.cvx__side` 오른쪽 구분선만
- `src/App.jsx` `SubPage` — 슬림 헤더 `← 홈으로`(`.rmhead__back`) 제거, 햄버거만. 비-슬림 `fp__head` 의 `← 홈으로`(`.fp__back`) 렌더 제거. (로고 클릭 홈 이동은 유지)
- `src/styles.css` `.home-scale` `zoom: 0.9 → 0.81`
- `src/styles.css` `.drawer__link` font `clamp(20,5vw,27) → clamp(16,4vw,21.5)`, padding `20 → 15`, gap `16 → 13`. `.drawer__num` `12 → 10`, `.drawer__desc` `11.5 → 9.5`

**메모**: `.rmhead__back`/`.fp__back`/`.rmhead__actions` CSS는 미사용이지만 남겨둠. `npx vite build` 통과.

## 2026-09-10 · 뒤로가기/메뉴 버튼 · 홈 90% · 공고지원 좌우 반전 · 한 화면

**요청 6건**:
1. 서브페이지 뒤로가기 버튼 복구(눌리게)
2. 메인(홈) 90% 크기
3. 공고지원 AI: 대화창 오른쪽 / 카드 왼쪽 (높이 맞춤)
4. 모든 페이지 한 화면(레이아웃 유지)
5. 마이페이지에도 메뉴(햄버거) 버튼
6. 홈 AI 데모 대화창이 늘어나지 않게

**변경**:
- `src/App.jsx` `SubPage` 슬림 헤더 — 햄버거 옆에 `← 홈으로`(`.rmhead__back`) 버튼 복구 (`.rmhead__actions` 그룹)
- `src/App.jsx` `App` 홈 분기 — `Nav`+`Home`+`footer` 를 `<div className="home-scale">` 로 감쌈 → `zoom: 0.9`
- `src/App.jsx` `App` — `MyPage` 에 `onNavigate`/`onLoginClick` 전달
- `src/App.jsx` `MyPage` — `mp-head` 우측에 햄버거 + `<MenuDrawer>` 추가(`siteMenuOpen` state)
- `src/App.jsx` `AnnouncementAnalyzer` — JSX 순서 반전: `.az2__cols`(카드) 먼저, `.az2__chat` 나중
- `src/styles.css`
  - `.chatbox` `min-height:440` + `.chatbox__body { max-height:420 }` → `.chatbox { height: 520px }` **고정**(메시지 쌓여도 안 늘어남)
  - `.rmhead__actions`, `.rmhead__back`(패딩), `.mp-head__actions`, `.home-scale { zoom: 0.9 }`
  - `.fp--wide .az2` → `display:grid; grid-template-columns: 348px minmax(0,1fr)`(카드|챗), `align-items:stretch`. `.az2__cols` 는 세로 1열 + `grid-template-rows: auto 1fr`(체크리스트가 남는 높이 채워 챗과 바닥 맞춤). 체크리스트 카드는 flex column + `.az2__docs { flex:1; overflow-y:auto; align-content:start }`
  - `.fp--wide .rg2__chat { display:flex; flex-direction:column }` 추가 → 로드맵 챗도 높이 꽉 채움
  - `@media (max-height: 680px → 600px)` — fit 모드를 더 낮은 높이까지 유지

**메모**: 1366×740 기준 홈 포함 전 페이지 한 화면. `zoom` 은 크로미움/파폭126+/사파리 지원(데모 허용). `npx vite build` 통과.

## 2026-09-10 · 서브페이지 대화 패널 재구성 (첨부 이미지 기준)

**요청**: 이미지처럼 + (1) 세무 AI 오른쪽 카드 축소·대화창 확대·좌우 높이 맞춤 (2) 공고지원 AI 대화창 확대·아래 카드 축소 (3) AI 상담 마지막 이미지처럼(전체 높이 대화 패널).

**변경**:
- `src/App.jsx` — 세무/공고 페이지의 `<h2 class="tax2__h/az2__h">` → `<div class="chatpanel__hd">`(대화 박스 헤더바). AiConsult props는 그대로
- `src/styles.css`
  - `.chatpanel__hd` + `.tax2__chat`/`.az2__chat`/`.cvx__main` 을 **테두리 컨테이너**로, 내부 `.ai` 는 테두리 제거하고 `flex:1` 로 꽉 채움, `.ai__body` 는 연한 회색(`--ground`) 틴트 — 3개 페이지 대화 박스 통일
  - `.fp--wide .fp__body` = flex column, 자식이 `flex:1` 로 남는 높이 채움 → 4개 페이지 모두 대화창이 세로를 꽉 채우고 입력창이 바닥 고정
  - 세무: `.tax2 { align-items: stretch }` + `.tax2__side { grid-template-rows: auto 1fr }` → 오른쪽 카드가 대화창과 바닥 정렬. 카드 패딩/폰트/`.tax2__rate`(24→22)/행 간격 추가 축소
  - 공고: `.az2` flex column, `.az2__chat` `flex:1`(대화창 최대), `.az2__cols` `flex:none`(카드는 압축 유지). `.az2__draft` 배경 `#14181f` → `var(--blue)`(파란 버튼, 이미지 기준)
  - AI 상담: `.cvx { align-items: stretch }`, `.cvx__side` 오른쪽 구분선, `.cvx__main` 테두리 패널 + 대화창 전체 높이

**메모**: 1366×768/720/1600×900 모두 한 화면. 680px 미만은 기존대로 문서 스크롤 폴백. `npx vite build` 통과.

## 2026-09-10 · 서브페이지 한 화면 맞춤 — 페이지별 재조정

**요청**: (1) 로드맵은 기존 레이아웃 + 한 화면 (2) 세무 AI는 대화창·카드 모두 축소 (3) 공고지원 AI는 대화창 키우고 아래 카드 축소 (4) AI 상담은 기존 레이아웃 + 한 화면.

**변경** (`src/styles.css` 뷰포트-맞춤 블록 재작성):
- 이전엔 `.ai` 를 `flex:1` 로 세로를 꽉 채워 배치가 어색했음 → **페이지별 고정 높이 + `align-items: start`(자연 높이)** 로 전환. `.fp__body` 는 `overflow: hidden → overflow-y: auto`(안전망)
- 로드맵: 레이아웃 그대로, 챗 `min(52vh, 400px)`, 스텝/진행률/체크박스 간격만 축소
- 세무 AI: `.tax2` `align-items: start`, `.tax2__chat` flex 해제, 챗 `min(46vh, 360px)`, 판정서·신고일정 카드 패딩·`.tax2__rate`(30→24)·행 간격 축소
- 공고지원 AI: 챗 `clamp(220px, 44vh, 380px)`(상대적으로 크게), 아래 `.az2__cols` 카드는 패딩·폰트·바 높이·행 간격·버튼 패딩 전부 축소. `meta.gov.lead` 도 한 줄로 단축(`src/App.jsx`)
- AI 상담: `.cvx` `align-items: start`, 챗 `min(56vh, 440px)`
- `@media (max-height: 640px → 680px)` 로 상향 — 680px 미만 화면은 일반 문서 스크롤로 폴백

**메모**: 1366×720(노트북 100% 유효 높이)에서 4개 페이지 모두 스크롤 없이 한 화면. `npx vite build` 통과.

## 2026-09-10 · 홈 AI 어시스턴트 데모 — "세액 감면도 되나요?" 답변까지 재생 유지

**요청**: 메인페이지 세금 어시스턴트 애니메이션에서 "세액 감면도 되나요?" 질문의 답변까지 나오게.

**원인**: `ChatDemo` 의 `useInView(..., true)`(repeat) 때문에 섹션이 화면에서 벗어나면 `shown` 이 0으로 리셋됨 → 스크롤로 지나가면 앞 1~2개 말풍선만 보이고 세액감면 답변(`CHAT[3]`)까지 못 감.

**변경** (`src/App.jsx` `ChatDemo`):
- `useInView({ threshold: 0.3 }, true)` → `useInView({ threshold: 0.25 })` (one-shot). 한 번 보이면 `inView` 가 계속 true (실패 대비 2.8s 후 자동 시작)
- `if (!inView) { setShown(0); ... }` 리셋 블록 제거 → `if (!inView) return;` 만. 스크롤 아웃해도 진행 상태 유지
- 재생 간격 소폭 단축(950/560 → 900/520ms)으로 6개 말풍선(질문·답변 3쌍) 약 4.3초에 완주

**메모**: `CHAT` 스크립트는 그대로(세액감면 답변 다음에 부가세 신고 일정 등록 시연이 이어짐 — "신고 일정 등록" 태그 시연 유지). `npx vite build` 통과.

## 2026-09-10 · 고정 다크모드 버튼 + 앱 화면 한 화면에 담기

**요청**:
1. 다크모드 버튼을 어느 페이지에서나 보이도록 고정
2. 100% 배율에서 전체 페이지가 한 화면에 들어오도록

**변경**:
- `src/App.jsx` (신규) `FloatingThemeToggle` — `position: fixed` 우하단 원형 버튼(`.theme-fab`). App 의 3개 return(홈/서브페이지/마이페이지) 모두에 렌더 → 항상 보임. `Nav` 안에 있던 `◐` 아이콘 버튼은 중복이라 제거(홈에서 두 개 겹침 방지)
- `src/styles.css` — `.theme-fab` 신규
- `src/App.jsx` `SubPage` — 슬림 페이지를 `<div className="slim-shell">`(100vh flex column, overflow hidden)로 감싸고 그 안에 `rmhead`(flex:none) + `.fp--wide`(flex:1). 기존엔 `.fp--wide` 가 `100vh` 라 위의 `rmhead` 높이만큼 아래가 잘렸음
- `src/styles.css` (파일 끝에 블록 추가) — 앱 화면 뷰포트 맞춤:
  - `.slim-shell` 100vh flex, `.fp--wide` flex:1 + overflow hidden, `.fp__head--plain`/`.fp__title`/`.fp__lead`/`.fp__body` 패딩·폰트 축소
  - `.fp__body` = flex column, 자식 페이지가 `flex:1; min-height:0` 로 남는 높이 채움
  - `.rg2`/`.tax2`/`.az2`/`.cvx` 를 flex/그리드로 높이 채우고 `.ai` 는 `flex:1` 로 늘려 입력창까지 보이게. 목록(`.rg2__list`, `.cvx__side`, `.tax2__side`)은 내부 스크롤
  - `.mp` = `height:100vh; overflow:hidden`, `.mp-main` 내부 스크롤, 대시보드 카드·달력 셀 살짝 압축
  - `@media (max-height: 640px)` 에서는 다시 문서 스크롤 허용(내용 잘림 방지)
- `src/App.jsx` `SubPage` — 슬림 페이지에서 하단 `footer.foot` 숨김(이전 커밋)

**메모**: 홈 랜딩은 스크롤 스토리라 대상 제외. 1366×768(노트북 100%) 기준 5개 앱 화면(마이페이지/로드맵/세무/공고/AI상담) 문서 스크롤 없이 한 화면에 들어옴. 그보다 세로가 짧으면 자동으로 일반 스크롤로 폴백. `npx vite build` 통과.

## 2026-09-10 · 세무·공고지원 카드 = 진행률 대신 대화 요약

**요청**: 세무·공고지원 카드에 진행률 말고 해당 AI와 나눈 대화를 간단히 정리한 내용 표시.

**변경**:
- `src/App.jsx` — `MP_TAX_SUMMARY`(3줄), `MP_GOV_SUMMARY`(3줄) 상수 추가(각 AI 페이지 시드 대화 기준 요약)
- `src/App.jsx` `MyPage` — "세무 AI Assistant" / "공고지원 AI" 카드에서 `mp-pct`+`mp-bar`+`mp-cite` 제거하고 "최근 상담 요약" 라벨 + `.mp-rows--recap` 목록으로 교체(공고 카드는 라벨에 `저장 N건` 유지). 카드 전체 클릭 이동은 그대로
- `src/App.jsx` `MyPage` — 안 쓰게 된 `taxNext`/`govMatchCount` 계산 제거
- `src/styles.css` — `.mp-recap`, `.mp-rows--recap`(줄바꿈되는 요약 줄)

**메모**: 요약 3줄은 데모 고정(TAX_SEED/GOV_SEED 대화 내용 기준). 실제 대화에서 자동 생성하려면 chat turns 를 App 레벨로 올려야 함. 로드맵 카드는 진행률 유지. `npx vite build` 통과.

## 2026-09-10 · 마이페이지 대시보드 카드를 AI 현황 카드로 통일

**요청**: "다가오는 일정" 상자 자체를 세무 AI로 바꾸고 내용도 세무 AI 진행 상황을 표시. "추천 정책"도 공고지원 AI 현황으로.

**변경**:
- `src/App.jsx` `MyPage` — "다가오는 일정" 카드 → **"세무 AI Assistant"** 카드: 큰 `100%`(세액감면 판정) + 진행바 + `세액감면 판정 · 조특법 제6조 · 5년` / `다음 신고 · {taxNext.title} · {taxNext.when}`(= MP_SCHEDULE 의 `mark` 항목). 클릭 시 세무 페이지 (기존 `.mp-card--action` 유지)
- `src/App.jsx` `MyPage` — "추천 정책 Top 3" 카드 → **"공고지원 AI"** 카드: 큰 `92%`(내 조건 적합도) + 진행바 + `추천 {GOV_LISTINGS.length}건 · 저장 {saved.size}건`(저장 수는 "AI 추천 공고" 탭과 실시간 공유). 클릭 시 공고지원 AI 페이지
- `src/App.jsx` `MyPage` — `taxNext`, `govMatchCount` 계산 추가
- `src/styles.css` — `.mp-cite` 에 `gap`, `.mp-cite + .mp-cite { margin-top }`(2줄 인용), 값 오른쪽 정렬

**메모**: 로드맵/세무/공고 3개 카드가 이제 같은 "큰 % + 진행바 + 인용" 레이아웃. `MP_RECO` 는 미사용이 됐지만 남겨둠. 세무 카드의 100%/조특법 값은 데모 고정(세무 페이지 판정서와 동일). `npx vite build` 통과.

## 2026-09-10 · 마이페이지 "다가오는 일정"·"추천 정책" 카드를 통째로 클릭 이동

**요청**: 창업 로드맵 카드처럼 "다가오는 일정"·"추천 정책" 상자를 누르면 각각 세무 AI / 공고지원 AI 페이지로 이동.

**변경**:
- `src/App.jsx` `MyPage` — 두 카드를 로드맵 카드와 동일 패턴으로: `mp-card mp-card--action` + `role="button"` + `tabIndex={0}` + `onClick`(다가오는 일정 → `onOpenTax`, 추천 정책 → `onOpenGov`) + Enter/Space `onKeyDown`. 카드 안에 있던 개별 행 `<button>` 제거(중첩 인터랙티브 방지) → 행은 일반 텍스트로. 헤더 우측은 클릭 큐 문구(`<span className="mp-card__link">` "세무 AI Assistant ›" / "공고지원 AI ›")
- `src/styles.css` — `.mp-card--action:hover .mp-card__link { text-decoration: underline }` 추가(카드 hover 시 큐 강조)

**메모**: 직전 커밋에서 넣었던 헤더 링크버튼/행버튼 방식을 카드 전체 클릭으로 교체. `npx vite build` 통과.

## 2026-09-10 · 마이페이지 카드 연동 + AI 추천 공고 + 로그인 유지

**요청**:
1. "다가오는 일정" 상자를 세무 AI Assistant와 연동
2. "추천 정책" 상자를 공고지원 AI와 연동
3. 지원정책의 "탐색"을 공고지원 AI가 맞는 공고를 저장해주는 메뉴로
4. 로그인하면 로그아웃 누를 때까지 유지

**변경**:
- `src/App.jsx` `App` — `localStorage('changeup:user')` 로 로그인 세션 유지: `useState(loadStoredUser)` + `useEffect([user])`(있으면 저장, 없으면 삭제). 로그아웃(`setUser(null)`)하면 자동으로 지워짐
- `src/App.jsx` `App` — `MyPage` 에 `onOpenTax`/`onOpenGov`(= `handleNavigate('tax'|'gov')`) 전달
- `src/App.jsx` `MyPage` "다가오는 일정" 카드 — 헤더에 "세무 AI에게 묻기 ›" 링크, 각 행을 버튼으로 만들어 클릭 시 세무 페이지로
- `src/App.jsx` `MyPage` "추천 정책 Top 3" 카드 — 헤더에 "공고지원 AI ›" 링크, 행 클릭 → 공고지원 AI 페이지(기존 `setMenu('explore')` → `onOpenGov`)
- `src/App.jsx` `MP_MENU` — `탐색` → **`AI 추천 공고`** (key `explore` 유지)
- `src/App.jsx` (신규) `MatchedGov` — `scoreProgram(user)` 로 `GOV_LISTINGS` 를 적합도순 정렬, 매칭 이유 칩 + "☆ 저장하기"(=`saved` set 토글, "저장한 정책" 과 공유). `menu==='explore'` 렌더를 `GovExplorer` → `MatchedGov` 로 교체
- `src/App.jsx` `SavedPolicies` — 안내문 "탐색" → "AI 추천 공고"
- `src/styles.css` — `.mp-card__link`, `.mg*`

**메모**: `GovExplorer`/`GOV_REGIONS`/`GOV_TYPES` 는 이제 미사용이지만 남겨둠. 로그인 유지는 localStorage 라 같은 브라우저에서만 유효(시크릿창/다른 브라우저는 재로그인). `npx vite build` 통과.

## 2026-09-10 · 마이페이지 ↔ AI 상담 / 창업 로드맵 연동

**요청**:
1. 마이페이지의 AI 상담을 메뉴의 AI 상담과 이어지게
2. 마이페이지 "세액감면 판정 요약" 카드를 창업 로드맵 진행률로 연동

**변경**:
- `src/App.jsx` `App` — `roadmapDone` state 신설(로드맵 페이지 ↔ 마이페이지 공유). `MyPage` 에 `roadmapDone` + `onOpenRoadmap={() => handleNavigate('roadmap')}`, `SubPage` 에 `roadmapDone`/`setRoadmapDone` 전달
- `src/App.jsx` `RoadmapGuide({ user })` → `({ user, done, setDone })` — 내부 `useState(done)` 제거하고 props로 받음. `setDone` 은 상위 setter(함수형 업데이트 그대로 동작)
- `src/App.jsx` `MyPage` — 시그니처에 `roadmapDone`/`onOpenRoadmap`. "세액감면 판정 요약" 카드를 **"창업 로드맵 진행률"** 카드로 교체: `rmPct`(완료 작업/28), `rmStepsDone / 7단계`, 현재 단계(첫 미완료 단계) 표시. 카드 클릭/Enter 로 로드맵 페이지 이동(`.mp-card--action`)
- `src/App.jsx` `MyPage` — `menu === 'ai'` 렌더를 `<AiConsult user>` → `<AiConsultPage user>` 로 (메뉴의 AI 상담과 동일한 화면: 대화 기록 사이드바 + 같은 rules/seed/chips). "최근 AI 상담" 카드 항목도 이 탭으로 연결됨
- `src/styles.css` — `.mp-card--action`(hover/focus)

**메모**: 진행 상태는 세션 메모리(App state)만 — 새로고침하면 초기화. 로드맵에서 체크한 게 마이페이지 카드에 실시간 반영됨(반대는 로드맵에서만 편집). AI 상담은 컴포넌트 공유라 화면·설정이 같아지는 수준이고, 두 위치의 대화 내용이 실시간으로 합쳐지진 않음(그건 turns 상위 이관 필요). `npx vite build` 통과.

## 2026-09-10 · AI 상담 페이지 — 대화 기록 사이드바 추가

**요청**: "해당 페이지를 이미지처럼 바꿔줘" (왼쪽에 대화 기록 리스트, 오른쪽에 챗).

**변경**:
- `src/App.jsx` (신규) `AiConsultPage` — `.cvx` 2열: 왼쪽 `.cvx__side`("+ 새 대화 시작" + "오늘"/"지난 7일" 그룹별 대화 목록, 활성 항목 하이라이트), 오른쪽 `.cvx__main`(`AiConsult`, 짧은 칩 3개 전달)
- `src/App.jsx` (신규) `AI_HISTORY` 상수 (대화 목록 데모 데이터)
- `src/App.jsx` `SubPage` — `pageKey==='ai'` 를 `slim` 에 추가(간결 헤더+메뉴버튼), 렌더를 `<AiConsult/>` → `<AiConsultPage/>` 로
- `src/styles.css` — `.cvx*` 신규 (860px 이하 세로 스택)

**메모**: 대화 목록은 데모 고정값이고 클릭 시 하이라이트만 바뀜(실제 대화 전환 없음). "+ 새 대화 시작" 도 현재 동작 없는 데모 버튼. `npx vite build` 통과.

## 2026-09-10 · 후속 수정 3건 (슬림 헤더 메뉴버튼 / 세무 높이 / 공고지원 챗)

**요청**:
1. 메뉴에서 들어간 서브페이지 우측 상단을 "홈으로" → 메뉴(햄버거) 버튼으로
2. AI 세무 Assistant: 챗 상자와 옆 상자 높이 맞추기
3. "공고문 AI 분석" 메뉴명을 "공고지원 AI"로, 공고문 입력부를 AI 챗봇으로

**변경**:
- `src/App.jsx` `SubPage` — `slim` 헤더의 `.rmhead__back`("← 홈으로") 제거, `.hamburger` 버튼 + `<MenuDrawer>` 추가(`menuOpen` state). 로고 클릭은 여전히 홈 이동
- `src/styles.css` `.tax2` — `align-items: start → stretch`, `.tax2__chat` 를 flex column + `.ai { flex:1; min-height:min(66vh,560px) }`, `.tax2__side` 에 `grid-template-rows: auto 1fr`(신고 일정 카드가 남는 높이 채움) → 좌우 상자 하단 정렬
- `src/App.jsx` `NAV_MENU` gov 항목 label `공고문 AI 분석 → 공고지원 AI`, desc 수정
- `src/App.jsx` `AnnouncementAnalyzer` — 공고문 textarea/예시/`analyze`/`result`/`cell` 등 전부 제거하고 `.az2__chat`(= `AiConsult`, `GOV_RULES`/`GOV_SEED`/`GOV_CHIPS`) 로 교체. 아래 적합도/체크리스트 카드는 유지(값은 데모 고정). `user` prop 추가
- `src/App.jsx` — `GOV_RULES`/`GOV_SEED`/`GOV_CHIPS` 신규
- `src/styles.css` — `.az2__h`, `.az2__chat .ai` 높이(min(60vh,460px))

**메모**: `ANNC_SAMPLES`/`ANNC_FALLBACK`, `.az2__paste`·`.az2__result` CSS, `.rmhead__back` CSS 는 이제 미사용이지만 남겨둠(추후 정리). 공고지원 챗의 "지원서 초안 작성하기" 검정 버튼은 현재 동작 없는 데모 버튼. `npx vite build` 통과.

## 2026-09-10 · 공고문 AI 분석 페이지 → "공고지원 AI" 로 재구성

**요청**: "해당 페이지 이미지처럼 바꿔줘" (붙여넣기 카드 + [내 조건 적합도 | 필요 서류 체크리스트] 2열).

**변경**:
- `src/App.jsx` `SubPage` meta.gov — 제목 `지원사업 공고문 AI 분석 → 공고지원 AI`, 리드 문구 교체. `slim` 대상에 `gov` 추가(간결 헤더 + `fp__head--plain`)
- `src/App.jsx` `AnnouncementAnalyzer` 반환부 교체 — `.tool az` → `.az2`:
  - `.az2__paste` 붙여넣기 카드 (예시 칩 + textarea + "AI로 분석 시작")
  - `.az2__cols` 2열:
    - 왼쪽 `.az2__card` = 내 조건 적합도 92%(초록) + 진행바 + 안내문 + 지원대상/지원내용/접수기간(D-43 빨강). 지원대상·지원내용은 분석 결과(`result`) 있으면 그 값, 없으면 데모 기본값
    - 오른쪽 `.az2__card` = 필요 서류 체크리스트(체크 토글) + 상태 뱃지(준비 필요=빨강 / AI 초안 가능=파랑 / 준비 완료=초록) + 검정 버튼 "지원서 초안 작성하기"(→ `analyze` 실행)
  - 분석을 실제로 돌리면 기존 `구조화 결과`(`az__grid`)가 아래에 그대로 표시됨(AI 기능 유지)
- `src/App.jsx` — `ANNC_DOCS` / `ANNC_STATUS` 상수 추가, `checks` state 추가
- `src/styles.css` — `.az2*` 신규 (860px 이하 세로 스택). 적합도 진행바 초록 그라디언트, 검정 버튼

**메모**: 적합도 92%와 체크리스트 항목/상태는 데모 고정값(이미지 기준). 기존 `.az*` CSS와 `ANNC_FALLBACK`·`cell()` 은 결과 표시에 계속 쓰여서 유지. `npx vite build` 통과.

## 2026-09-10 · AI 세무 Assistant 페이지 — 이미지대로 2열, 단 대화창을 왼쪽에

**요청**: "해당 페이지를 이미지처럼 바꾸는데 대화창이 왼쪽으로 배치해줘" (이미지는 왼쪽 판정서·일정 / 오른쪽 챗이지만, 챗을 왼쪽으로).

**변경**:
- `src/App.jsx` `TaxAssistantPage` 교체 — 세로 스택(챗 + `TaxTool`) → `.tax2` 2열:
  - 왼쪽(넓게) `.tax2__chat` = "AI와 대화하기" 제목 + `AiConsult`
  - 오른쪽(340px) `.tax2__side` = "세액감면 판정서" 요약 카드 + "주요 신고 일정" 카드(`TAX_SCHEDULE` 앞 4건)
  - 판정서는 인터랙티브 세그먼트 없이 읽기 전용 요약(업종 지역/대표자 연령/감면대상 업종/예상 감면율 100%/조특법 제6조 근거)
- `src/App.jsx` `AiConsult` — `noHeader` prop 추가: true면 내부 `.ai__bar`(ON 아바타 + 제목) 전체를 숨김. 세무 페이지 챗에 `compact noHeader` 적용
- `src/App.jsx` `SubPage` — 간결 헤더/`fp__head--plain` 적용 대상을 `roadmap` → `roadmap` + `tax` 로 확장(`slim` 플래그)
- `src/styles.css` — `.tax2*` 신규 (2열 그리드, 900px 이하 세로 스택). 오른쪽 카드 스타일

**메모**: `TaxTool`(인터랙티브 세액감면 계산기, 약 130줄)은 이제 이 페이지에서 안 쓰지만 삭제하지 않고 남겨둠([[로드맵 재구성]]과 동일한 판단 — 추후 정리). 되돌리려면 `TaxAssistantPage` 를 이전 버전(챗 `large` + `<TaxTool/>` 스택)으로 복구하고 `SubPage` 의 `slim` 을 `pageKey==='roadmap'` 으로 되돌리면 됨. `npx vite build` 통과.

## 2026-09-10 · 창업 로드맵 페이지 — 첨부 이미지대로 단순화 재구성

**요청**: "이미지처럼 해당 페이지 바꿔줘" (가로 단계 탭 + 왼쪽 체크리스트 + 오른쪽 AI 코치, 헤더는 브랜드 + "홈으로"만).

**변경**:
- `src/App.jsx` `RoadmapGuide` 전면 교체 — 기존 [전체 진행률 카드 + 맞춤 지원사업 리포트 + 세로 단계 nav + 단계별 지원사업 + "이 단계 AI에게 물어보기"] 제거하고, `.rg2` 구조로:
  - `.rg2__steps` 가로 단계 탭(A~Z, 활성=파란 원, 완료=✓)
  - `.rg2__prog` 한 줄 진행률 ("전체 진행률 N% · x / 28 작업 완료")
  - `.rg2__cols` = 왼쪽 `.rg2__list`(단계 pill + 제목 + 설명 + 체크리스트), 오른쪽 `.rg2__chat`(`AiConsult`)
  - 관련 state/함수 제거: `sampleFn`/`aiText`/`aiBusy`/`sumText`/`askAi`/`askSummary`/`stepProgs`/`matches`/`completedSteps` 등
- `src/App.jsx` `AiConsult` — `compact` prop 추가: true면 헤더의 상태줄(`{status}`)과 하단 면책문구(`.ai__note`) 숨김. `.ai--compact` 클래스 부여
- `src/App.jsx` `RG_CHAT_SEED` — 답변 말풍선을 이미지의 짧은 문장으로 교체
- `src/App.jsx` `SubPage` — `pageKey==='roadmap'` 이면 `<Nav>`(햄버거·테마 토글) 대신 `.rmhead`(브랜드 + "← 홈으로")를 쓰고, `.fp__head` 에 `fp__head--plain`(회색 배경/보더 제거, 자체 back 버튼 숨김)
- `src/styles.css` — `.rmhead*`, `.fp__head--plain`, `.rg2*` 신규. `.fp--wide` max-width `1340 → 1180`

**메모**: 기존 `.rgx*` / `.rg__*` CSS(약 200줄)와 `progById`/`ddayLabel`/`scoreProgram`/`ROADMAP_PROGRAMS` 상수는 이제 로드맵에서 안 쓰지만, 다른 곳 영향 최소화를 위해 삭제하지 않고 남겨둠(추후 정리 대상). `npx vite build` 통과, JS 번들 약 6KB 감소.

## 2026-09-10 · 마이페이지 대시보드 — 첨부 이미지에 맞춰 레이아웃/크기 정리

**요청**: "이미지처럼 마이페이지를 바꿔주고 레이아웃 크기를 맞춰줘" (토스증권 톤의 대시보드 스크린샷 첨부).

**변경**:
- `src/styles.css` `.mp-dash` — 캘린더 열 `340px → 320px`, gap `18 → 20`, `max-width 1180 → 1200`
- `src/styles.css` (신규) `.mp-dash .cal__day { aspect-ratio: auto; height: 40px }` — 마이페이지 안에서 캘린더 셀이 열 너비 따라 거대해지던 문제 고정(항상 40px)
- `src/styles.css` 반응형 재구성 — 기존 `@media (max-width:1180px)` 단일 스택을 둘로 분리: `≤1080px` 은 카드만 1열(`.mp-dash .mp-grid`)로 접고 캘린더는 오른쪽 유지, `≤860px` 에서만 캘린더를 아래로 내리되 `max-width:420px` 로 폭 제한
- `src/styles.css` `.mp-rows li` 패딩 `11px → 13px`(이미지의 넉넉한 행 간격), `.mp-consult` 색 `--ink-faint → --ink-soft`(최근 AI 상담 글자가 너무 흐렸음)
- `src/styles.css` (신규) `.mp-dot`(파란 점), `.mp-rowval--urgent`(빨간 글자)
- `src/App.jsx` `MP_SCHEDULE` — `{ ..., urgent: true }`(예비창업패키지 마감 = D-43 빨강), `{ ..., mark: true }`(부가세 2기 예정신고 앞 파란 점)
- `src/App.jsx` `MyPage` "다가오는 일정" 렌더 — `s.mark` 이면 `.mp-dot`, `s.urgent` 이면 값에 `.mp-rowval--urgent`

**추가 (같은 날)**: "카드 4개 블록 높이 = 오른쪽 캘린더 높이" 요청 반영
- `src/styles.css` `.mp-dash` — `align-items: start → stretch` (카드 열이 캘린더 높이만큼 늘어남)
- `src/styles.css` `.mp-dash .mp-grid` — `grid-auto-rows: 1fr; min-height: 0` 추가 (카드 두 줄이 캘린더 높이를 균등 분할)
- `src/styles.css` `@media (max-width:1080px)` — `.mp-dash{ align-items:start }`, `.mp-grid{ grid-auto-rows:auto }` 로 되돌려 1열 스택 시 카드가 늘어나지 않게
- `.mp-dash .cal { align-self:start }` 는 유지 → 캘린더는 콘텐츠 높이 그대로, 이 높이가 기준

**메모**: 3열(카드 2×2 + 캘린더) 레이아웃이 1080px 까지 유지됨. 카드 내용은 위 정렬이라 카드가 늘어나면 아래쪽 여백이 생김(의도). 되돌리려면 위 셀렉터들을 원복하고 `.mp-dash` 브레이크포인트를 `@media (max-width:1180px){ .mp-dash{ grid-template-columns:1fr } }` 하나로 되돌리면 됨. `npx vite build` 통과 확인.

## 2026-09-09 · 창업 로드맵 페이지에 AI 코치 사이드 챗 추가

**요청**: 기존 로드맵 가이드를 왼쪽으로 밀고, 오른쪽에 AI 챗봇을 레이아웃 맞춰 배치.

**변경**:
- `src/App.jsx` `RoadmapGuide` — 반환부를 2열(`.rgx`)로 감쌈: 왼쪽 `.rgx__main`(기존 진행률·리포트·단계 가이드), 오른쪽 `.rgx__chat`(`AiConsult`)
- `RG_CHAT_RULES` / `RG_CHAT_SEED` / `RG_CHAT_CHIPS` 추가 — 7단계(A~Z) 맥락을 프롬프트에 주입한 "로드맵 AI 코치"
- `src/App.jsx` `SubPage` — `pageKey==='roadmap'` 이면 `.fp` 에 `fp--wide` 부여
- `src/styles.css` — `.fp--wide`(본문 max-width 1340), `.rgx`(`minmax(0,1fr) 380px`), `.rgx__chat`(sticky top 84), 1100px 이하 세로 스택

**메모**: 오른쪽 챗은 Backend `/api/chat`(RAG) + `window.claude.use('sample')` 를 함께 씀(기존 `AiConsult` 그대로). 근거 문서 링크도 표시됨.

## 2026-09-07 · 백엔드 연동 준비 레이어 추가 (api.js)

**요청**: 팀원들이 올린 파일들(Backend/LLM/DB)을 브랜치로 받아왔는데 내가 만든 프론트엔드랑 연결할 수 있나? → "프론트만 연결 준비(안전)" 선택.

**변경**:
- `src/api.js` (신규) — `apiGet(path)` fetch 래퍼 + `useApi(path, fallback, map)` 훅. 백엔드 없으면 실패 → `fallback`(목데이터) 사용, `/api/*` 나오면 자동 전환. BASE = `import.meta.env.VITE_API_BASE_URL || '/api'`
- `src/App.jsx` — `import { useApi } from './api.js'` 추가
- `src/App.jsx` `DeadlinePanel` — `DEADLINES` 상수 대신 `useApi('/announcements?deadline=soon&limit=4', DEADLINES, map)` 사용 (연동 예시 1곳)

**메모**: 지금은 Backend가 스텁(`print("Hello from backend!")`)이라 실제로는 목데이터가 보임. DB(Postgres)에는 데이터 적재 완료(policies 2,907 / announcements 2,045 등). Backend가 `API_SPEC.md` 대로 구현되면 `DeadlinePanel` 은 코드 수정 없이 붙고, 나머지 데이터 지점(METRICS, CAL_EVENTS, 마이페이지 카드, 챗봇)은 `api.js` 상단 주석의 목록대로 `useApi` 로 교체하면 됨.

## 2026-09-08 · 홈 캘린더 — 중요 일정만 표시

**요청**: 메인페이지 일정관리 캘린더가 전체 다 보이지 않고 몇 가지 중요 일정만.

**변경**: `src/App.jsx`
- `pickImportant(map, maxPolicy=5)` 추가 — 세금 신고일은 전부(날짜당 최대 2건), 지원사업 마감은 **가까운 순 5건**만 남김
- 홈 `Calendar` — API 응답을 `pickImportant` 로 걸러서 표시 (`MpCalendar`·`세금 일정` 메뉴는 전체 유지)
- `cal__sub` 문구 → "이번 달 주요 일정 N건 · 전체 일정은 마이페이지에서"

## 2026-09-08 · Backend·DB·LLM 실연동 (목데이터 → 실제 API)

**요청**: 백엔드·DB·프론트·LLM 폴더 내용을 유기적으로 연결하고 홈페이지에서 구동되게.

**변경** (Frontend 쪽):
- `src/api.js` 전면 개편 — `apiGet`/`apiPost` + 엔드포인트 헬퍼 `api.{stats,announcements,policies,recommendations,calendar,taxCheck,taxDocuments,chat}` + `useApi`(실패 시 목데이터 폴백, 빈 배열도 폴백 처리)
- `Hero` — `GET /api/stats` 로 **모집 중 공고 수(860)·정책 2,907·세법 4,459** 실데이터 표시 + `● 실시간 DB 연동 중 / ○ 데모 데이터` 배지
- `DeadlinePanel` — `GET /api/announcements` 로 실제 마감 임박 공고, D-day 자동 계산
- `Calendar`(홈) / `MpCalendar`(마이페이지) — `GET /api/calendar?year&month` 로 세금 신고일 + 정책 마감일 통합. 오늘 날짜 기준으로 시작, 월 이동 시 재조회. 직접 추가/삭제는 로컬 오버레이로 유지
- `GovExplorer` — `GET /api/announcements?limit=60` 실데이터 + 지역/유형 필터, `● DB 실시간` 표시
- `TaxTool` — `POST /api/tax/tax-reduction/check` 서버 Rule Engine 병행 호출 → **DB 근거 조문 링크** 표시
- `AiConsult` — 질문 시 `POST /api/chat/messages` 로 근거 문서 검색 → 그 근거를 컨텍스트로 넣어 생성(RAG). 답변 아래 **근거 문서 목록·원문 링크**(`.msg-src`). Backend만 있어도 사용 가능하도록 입력창 활성화 조건 완화
- `styles.css` — `.msg-src` 추가

**함께 만든 것** (Frontend 외):
- `Backend/` — FastAPI 앱(`main.py`), `core/{config,db}`, `services/{policy,calendar,tax,stats,chat}_service`, `api/routes.py`, `schemas/models.py`. 지역 법정동 코드 → 시·도명 정규화 포함
- `LLM/src/serving/app.py` — 근거 기반 생성(LangChain) 또는 추출 요약
- `run_all.bat`, 루트 `README.md`(구성도·실행법·API 표·제약)

**메모**: `tax_documents.content` 평균 53자(수집 스크립트가 조문 제목만 저장) → 검색은 정확하나 답변 근거 본문이 부족. `DB/scripts/collect_tax_law.py` 보완 필요.

## 2026-09-08 · 로드맵 단계별 지원사업 + 완료 리포트 / AI 대화창 확대

**요청**: (1) 창업 로드맵에서 단계별 지원사업을 알려주고, 로드맵 완료 시 그 내용 기준으로 맞춤 지원사업을 정리해 보여주기. (2) AI 세무 Assistant 대화창을 더 크게, 글씨도 잘 보이게.

**변경**:
- `src/App.jsx` — `ROADMAP_PROGRAMS`(단계 A~Z ↔ `GOV_LISTINGS` id 매핑), `progById`, `ddayLabel`, `scoreProgram`(프로필 기반 매칭 점수+이유) 추가
- `src/App.jsx` `RoadmapGuide`
  - 각 단계 패널 하단에 **"이 단계에서 활용할 수 있는 지원사업"** 목록(기관·금액·지역·D-day)
  - 진행률 아래 **완료 리포트** — 100% 미만은 잠금 안내(남은 개수), 100% 달성 시 `추천 지원사업 Top 5(매칭 점수·이유 태그)` + `세무 체크포인트` + `다음 액션` 표시
  - **AI로 실행 계획 정리받기** 버튼 — 완료 단계·매칭 사업을 프롬프트에 넣어 `sample`로 신청 우선순위/준비서류/주의사항 생성(스트리밍·중지 지원)
- `src/App.jsx` `AiConsult` — `large` prop 추가 → `.ai--lg` 클래스 / `TaxAssistantPage` 에 `large` 적용, `tool` maxWidth 900 → 980
- `src/styles.css` — `.ai--lg`(높이 `min(74vh,760px)`, 말풍선 15px, 입력·칩·헤더 확대), 기본 `.msg` 13 → **14px**, `.rg__progs/.rg__prog/.rg__report/.rg__match/.rg__why/.rg__next` 등 추가

**메모**: 매칭 점수는 지역 일치·창업 단계 대상·마감 임박·자금 유형 가중치의 룰 기반(데모). 실서비스는 `/api/policies/recommendations` 로 교체.

## 2026-09-08 · 마이페이지 캘린더 추가 + 사이드바 메뉴 기능 구현

**요청**: (1) 대시보드 오른쪽에 일정 확인·관리 캘린더 추가. (2) 마이페이지 사이드바 메뉴별 실제 기능 구현.

**변경**: `src/App.jsx` + `src/styles.css`
- `MpCalendar` (신규) — 월 이동 · 날짜 클릭 · **일정 추가/삭제**(세금·지원사업 분류). 대시보드 우측 + `세금 일정` 메뉴에서 사용
- `MyPage` 대시보드를 `.mp-dash`(카드 4개 + 캘린더 2열) 로 재구성
- 사이드바 메뉴별 화면 연결:
  - `사업자유형 진단` → `BizTypeDiagnosis` (신규, 매출·B2B·업종 → 간이/일반 + 개인/법인 추천)
  - `세액감면 판정` → `TaxTool` (기존 재사용)
  - `세금 일정` → `MpCalendar full`
  - `탐색` → `GovExplorer` (기존, `saved` 상태를 MyPage로 리프트)
  - `저장한 정책` → `SavedPolicies` (신규, `탐색`의 ★ 저장 목록 공유)
  - `지출관리` → `ExpenseTracker` (신규, 지출 입력·분류·합산)
  - `프로필 · 설정` → `ProfileSettings` (신규, 프로필 폼 + 알림 토글)
- `GovExplorer` — `{ saved, onToggleSave }` prop 선택적으로 받도록(없으면 기존 내부 상태)
- `styles.css` — `.mp-dash` `.cal__add` `.cal__ev-del` `.exp-*` `.pf-*` 추가

**메모**: 데이터는 목/로컬 상태(추가·삭제·저장 모두 새로고침 시 초기화). 실서비스는 `/api/calendar`·`/api/policies/saved`·`/api/expenses` 연동으로 교체.

## 2026-09-08 · 창업 A-Z 로드맵 아이콘·글씨 확대

**요청**: 창업 순서(A-Z) 부분의 아이콘·글씨 등을 더 크게.

**변경**: `src/styles.css` `.rz*`
- `.rz__ico` 52×52 → **76×76**, radius 16 → 22 / `.rz__ico svg` 22 → **34**
- `.rz__t`(단계명) 13 → **17px** / `.rz__phase` 10.5 → 12.5px / `.rz__d`(설명) 11 → 13px, max-width 15ch → 17ch
- `.rz__sep`(화살표) 16 → **26px**, 위치 보정(margin-top 18 → 28) / `.rz__step` gap 9 → 13, `.rz` margin-top 44 → 60

## 2026-09-08 · 로그인 모달 소셜 버튼 위치 변경

**요청**: 네이버·카카오 버튼을 로그인 버튼 아래로.

**변경**: `src/App.jsx` `LoginModal` — 소셜 버튼 블록(+"또는" 구분선)을 이메일 폼 위 → **`</form>` 아래**(로그인/가입하기 버튼 밑)로 이동.

## 2026-09-08 · 로그인 모달에 소셜 로그인 + 회원가입 추가

**요청**: (1) 카카오·네이버 연동 로그인. (2) 로그인 모달에 회원가입 버튼 등 추가.

**변경**:
- `src/App.jsx` `LoginModal` 재구성
  - `mode` 상태(`login` / `signup`) — 모달 안에서 로그인 ↔ 회원가입 전환
  - 소셜 버튼: **카카오로 계속하기**(#FEE500, 말풍선 아이콘) / **네이버로 계속하기**(#03C75A, N 마크) + "또는" 구분선
  - 회원가입 모드: 이름 · 이메일 · 비밀번호 · 비밀번호 확인(불일치 시 인라인 에러) · `가입하기`
  - 하단: "아직 계정이 없으신가요? 회원가입" ↔ "이미 계정이 있으신가요? 로그인" 링크, "비밀번호를 잊으셨나요?"(데모 안내)
  - 모달에 `maxHeight: 90vh; overflowY: auto`
- `src/App.jsx` 상단 — `linkBtn` `fieldLabel` `socialBtn` 스타일 상수 추가

**메모**: 데모라 소셜/이메일/가입 **모두 예시로 바로 로그인**됨(`onSuccess`로 정석/카카오 사용자/네이버 사용자 등). 실서비스는 카카오·네이버 OAuth(`/oauth/authorize` 리다이렉트) + 백엔드 `/auth/*` 연동으로 교체.

## 2026-09-08 · 창업 A-Z 순차 애니메이션 강화 + 홈 섹션 화면 전체

**요청**: (1) 창업 순서(A-Z) 부분이 차례대로 나오는 애니메이션. (2) 메인페이지에서 각 섹션이 화면 전체에 나오게.

**변경**:
- `src/App.jsx` `Roadmap` — 스텝 stagger 간격 `i*80` → `i*160` ms 로 확대(7단계가 또렷하게 하나씩)
- `src/styles.css` `.rz__step` — 진입 모션 강화: `translateY(26px) scale(0.9)` → 0, `0.6s`. 아이콘도 `scale(0.5) rotate(-8deg)` → 0 로 팝인. reduced-motion 예외 추가
- `src/App.jsx` `Home` — `<main>` → `<main className="home-flow">`
- `src/styles.css` — `.home-flow > section { min-height: 100dvh; flex column center; scroll-snap-align:start }`, `html { scroll-padding-top: 66px }`, 데스크톱(≥768px) `scroll-snap-type: y proximity`, 모바일(<768px) 예외

**메모**: 09-06 에 넣었다가 병합으로 유실됐던 "한 화면에 한 섹션씩"을 다시 적용(이번엔 커밋 필요). "큰 모니터 zoom"(아래 항목)은 이번에 재적용 안 함 — 필요 시 별도 요청.

## 2026-09-06 · 큰 모니터에서도 노트북과 비슷한 비율로  *(유실됨 — 미재적용)*

**요청**: 큰 모니터로 보면 여백이 많고 노트북으로 보면 여백이 적다. 어느 모니터에서 보든 같은 비율로.

**변경**:
- `src/styles.css` — `.wrap` `max-width: 1160px` → `clamp(1120px, 82vw, 1500px)`
- `src/styles.css` — `:root { zoom }` 반응형 추가: `min-width` 1600→1.1 / 1920→1.22 / 2300→1.4 / 2800→1.65. 노트북(~1440px 이하)은 1.0

**메모**: `zoom` 이라 경계값에서 단계적으로 커짐. 연속 스케일 필요하면 JS로 전환. 배율·경계값 조정 가능.

## 2026-09-06 · 홈 메인, 한 화면에 한 섹션씩  *(09-08 에 재적용)*

**요청**: 홈 메인 화면이 2개 섹션이 동시에 보이지 않고 하나하나씩 떴으면 좋겠다.

**변경**:
- `src/App.jsx` — `Home` 의 `<main>` → `<main className="home-flow">`
- `src/styles.css` — `.home-flow > section { min-height: 100dvh; flex column center; scroll-snap-align:start }`, `html { scroll-padding-top: 66px }`, 데스크톱(≥768px) `scroll-snap-type: y proximity`, 모바일(<768px) 예외

**메모**: 스냅이 부담스러우면 `scroll-snap-type` 줄만 제거.

## 2026-09-06 · 리액트 실행 방법을 README에 정리

**요청**: 리액트 실행 방법을 정리해서 프론트엔드에 넣어줘.

**변경**:
- `README.md` — 맨 위 `## 빠른 시작`(3줄) 추가 + `## 실행` 섹션(사전요구사항, clone/pull 흐름, `npm ci`, API 프록시, 문제 해결) + `## 화면 구성` 표 갱신

## 2026-09-06 · Frontend를 창업ON 프로토타입으로 교체

**요청**: 로컬 5173(팀 스캐폴드)은 제거해도 되고, 5180(창업ON 프로토타입)을 메인 프론트엔드로 바꿔줘.

**변경**:
- `src/` — 기존 react-router 스캐폴드 전체 삭제(`router.jsx`, `pages/**`, `components/**`, `context/`, `data/`, `services/`, `styles/`)
- `src/App.jsx`, `src/styles.css` 신규 — 창업ON 프로토타입(홈 / 창업 로드맵 / AI 세무 Assistant / 지원사업 공고문 AI 분석 / AI 상담 / 마이페이지). 라우팅은 `App.jsx` 내부 `view` 상태 전환
- `src/main.jsx` — `createRoot` 마운트로 단순화
- `package.json` — `react-router-dom` 제거, `react`/`react-dom`만. `lint` 스크립트 제거
- `vite.config.js` — `port: 5173`, `open: true`, `/api` → `http://localhost:8000` 프록시
- `index.html` — 폰트 로드 + `favicon.svg` + 기본 리셋

**메모**: 프로토타입 원본은 Claude 아티팩트(`window.claude.use('sample')`)에서 이식. 로컬엔 `window.claude` 없어 AI 기능은 예시 데이터/비활성 폴백 → 실서비스는 `sampleFn` 호출부를 백엔드 `/api/chat`(RAG)로 교체. 삭제된 스캐폴드는 git 이력에 있어 복구 가능.
