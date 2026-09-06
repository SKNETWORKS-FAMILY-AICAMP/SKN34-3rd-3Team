# Frontend · 청년 창업 & 세금 내비게이터 (창업ON)

토스증권 랜딩 톤(넉넉한 여백 · 화이트 배경 · 블루 포인트)을 참고한 React 뼈대입니다.

## 스택

- React 18 + Vite 5
- react-router-dom 6 (`createBrowserRouter`)
- 상태: Context API (`AuthContext`) — 필요 시 Zustand/RTK 등으로 확장
- 스타일: CSS 변수 기반 디자인 토큰 (`src/styles/`)

## 실행

```bash
cd Frontend
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

개발 서버는 `/api` 요청을 `http://localhost:8000`(FastAPI)으로 프록시합니다. (`vite.config.js`)

## 폴더 구조

```
src/
├─ main.jsx                 진입점 (Router + AuthProvider)
├─ router.jsx               라우트 정의 (온보딩 / 창업 전·준비·후)
├─ styles/                  global.css(토큰) · components.css
├─ context/AuthContext.jsx  로그인 상태 뼈대 (localStorage 임시 저장)
├─ services/api.js          fetch 래퍼 + 엔드포인트 초안
├─ data/
│  ├─ navigation.js         정보구조(IA) — 헤더/푸터/홈 공용
│  └─ mockData.js           화면 확인용 목 데이터
├─ components/
│  ├─ layout/               Header · Footer · RootLayout · Page
│  └─ ui/                   Button · Card · Field · PageHeader
└─ pages/
   ├─ HomePage.jsx          랜딩 (Hero · 여정 소개 · CTA)
   ├─ onboarding/           Signup · Login · FindAccount · PrivacyConsent · Profile
   ├─ before/               SubsidyExplore · IndustryCompare
   ├─ prepare/              BizTypeDiagnosis · TaxReliefCheck · SupportProgram
   └─ after/                TaxSchedule · PolicyExplore · ExpenseAgent
```

## 라우트 맵

| 단계 | 경로 | 화면 |
|---|---|---|
| — | `/` | 홈(랜딩) |
| 온보딩 | `/signup` `/login` `/find-account` `/privacy-consent` `/profile` | 가입·로그인·계정찾기·개인정보 동의·개인정보 입력 |
| 창업 전 | `/before/subsidies` `/before/industry-compare` | 청년 지원금 탐색·추천 / 업종 창업률·폐업률 비교 |
| 창업 준비 | `/prepare/biz-type` `/prepare/tax-relief` `/prepare/support-programs` | 사업자등록 유형 진단 / 세액 감면 판정 / 지원 사업 탐색 |
| 창업 후 | `/after/tax-schedule` `/after/policies` `/after/expense-agent` | 세금 일정 안내 / 기업 지원 정책 / 경비·절세 에이전트 |

## 다음 작업 (TODO)

- [ ] 목 데이터 → 실제 API 연동 (`src/services/api.js` 엔드포인트 확정)
- [ ] 폼 검증 라이브러리 도입 (react-hook-form + zod 등)
- [ ] 인증 가드(ProtectedRoute) — `/profile` 등 로그인 필요 페이지
- [ ] 진단/판정 규칙 백엔드 이전, 근거 조문 표기
- [ ] 차트 컴포넌트(업종 비교, 세금 캘린더)
- [ ] 본인인증(휴대폰) · 소셜 로그인
- [ ] 접근성(포커스 트랩, aria) · 반응형 모바일 네비게이션
- [ ] 세무 정보 면책 문구 상시 노출
