/**
 * 서비스 정보구조(IA). 헤더 네비게이션 / 홈 여정 섹션 / 사이트맵에서 공용으로 사용.
 * path 는 라우터(src/router.jsx)와 1:1로 대응된다.
 */

export const JOURNEY = [
  {
    key: 'onboarding',
    label: '온보딩',
    summary: '회원가입하고 내 정보를 등록하면 맞춤 추천이 시작돼요',
    items: [
      { path: '/signup', label: '회원가입' },
      { path: '/login', label: '로그인' },
      { path: '/find-account', label: '아이디 / 비밀번호 찾기' },
      { path: '/privacy-consent', label: '개인정보 수집 동의' },
      { path: '/profile', label: '개인정보 입력' },
    ],
  },
  {
    key: 'before',
    label: '창업 전',
    summary: '어떤 지원을 받을 수 있는지, 이 업종이 유망한지 먼저 확인해요',
    items: [
      { path: '/before/subsidies', label: '청년 지원금 탐색 · 추천' },
      { path: '/before/industry-compare', label: '관심 업종 창업률 · 폐업률 비교' },
    ],
  },
  {
    key: 'prepare',
    label: '창업 준비',
    summary: '사업자 유형과 세액 감면 대상 여부를 진단하고 지원 사업을 찾아요',
    items: [
      { path: '/prepare/biz-type', label: '사업자등록 유형 진단' },
      { path: '/prepare/tax-relief', label: '청년 창업 세액 감면 대상 판정' },
      { path: '/prepare/support-programs', label: '창업 지원 사업 탐색 · 추천' },
    ],
  },
  {
    key: 'after',
    label: '창업 후',
    summary: '세금 일정을 놓치지 않고, 정책 지원과 절세까지 챙겨요',
    items: [
      { path: '/after/tax-schedule', label: '부가세 · 종합소득세 일정 안내' },
      { path: '/after/policies', label: '기업 지원 정책 탐색 · 추천' },
      { path: '/after/expense-agent', label: '경비처리 · 절세 에이전트' },
    ],
  },
];
