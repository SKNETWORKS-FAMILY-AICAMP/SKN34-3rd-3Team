/**
 * 화면 뼈대 확인용 목(mock) 데이터.
 * 실제 연동 시 /api 엔드포인트 응답으로 교체한다. (src/services/* 참고)
 */

export const MOCK_SUBSIDIES = [
  {
    id: 'sub-001',
    name: '청년창업사관학교',
    agency: '중소벤처기업진흥공단',
    target: '만 39세 이하, 창업 3년 이내',
    amount: '최대 1억 원',
    period: '2026-03-01 ~ 2026-03-31',
    tags: ['사업화자금', '교육', '멘토링'],
  },
  {
    id: 'sub-002',
    name: '청년 창업 지원금 (예비창업패키지)',
    agency: '창업진흥원',
    target: '예비창업자 (만 39세 이하 우대)',
    amount: '평균 5,000만 원',
    period: '상시 (연 1회 정기 공고)',
    tags: ['예비창업', '사업화'],
  },
  {
    id: 'sub-003',
    name: '지역주도형 청년일자리 사업',
    agency: '행정안전부 · 지자체',
    target: '지역 거주 미취업 청년',
    amount: '인건비 월 200만 원 내외',
    period: '지자체별 상이',
    tags: ['인건비', '지역'],
  },
];

export const MOCK_INDUSTRIES = [
  { code: 'I56', name: '음식점 · 카페', startupRate: 14.2, closureRate: 11.8, count: 706000 },
  { code: 'G47', name: '소매업 (전자상거래 포함)', startupRate: 12.6, closureRate: 9.4, count: 991000 },
  { code: 'S96', name: '미용 · 뷰티 서비스', startupRate: 9.1, closureRate: 7.2, count: 178000 },
  { code: 'J62', name: '소프트웨어 개발 · IT', startupRate: 10.4, closureRate: 5.1, count: 92000 },
];

export const MOCK_SUPPORT_PROGRAMS = [
  {
    id: 'prog-001',
    name: '창업기업 R&D 바우처',
    field: '기술개발',
    support: 'R&D 자금 최대 2억 원',
    deadline: '2026-04-15',
  },
  {
    id: 'prog-002',
    name: '1인 창조기업 마케팅 지원',
    field: '마케팅',
    support: '온라인 광고비 70% 지원',
    deadline: '2026-05-30',
  },
];

export const MOCK_POLICIES = [
  {
    id: 'pol-001',
    name: '중소기업 특별세액감면',
    category: '세제',
    benefit: '소득세 · 법인세 5~30% 감면',
    condition: '업종 · 지역 · 규모 요건 충족 시',
  },
  {
    id: 'pol-002',
    name: '두루누리 사회보험료 지원',
    category: '고용',
    benefit: '국민연금 · 고용보험료 최대 80% 지원',
    condition: '월 보수 260만 원 미만 근로자 고용',
  },
  {
    id: 'pol-003',
    name: '노란우산공제 소득공제',
    category: '세제',
    benefit: '연 최대 500만 원 소득공제',
    condition: '소기업 · 소상공인 대표자',
  },
];

/** 창업 후 세금 일정 (연간 반복) */
export const MOCK_TAX_SCHEDULE = [
  { id: 'tax-01', name: '부가가치세 1기 예정신고', type: '부가세', date: '04-25', target: '법인' },
  { id: 'tax-02', name: '부가가치세 1기 확정신고', type: '부가세', date: '07-25', target: '법인 · 개인 일반' },
  { id: 'tax-03', name: '종합소득세 신고 · 납부', type: '종합소득세', date: '05-31', target: '개인사업자' },
  { id: 'tax-04', name: '부가가치세 2기 예정신고', type: '부가세', date: '10-25', target: '법인' },
  { id: 'tax-05', name: '부가가치세 2기 확정신고', type: '부가세', date: '01-25', target: '법인 · 개인 일반' },
  { id: 'tax-06', name: '사업장현황신고 (면세사업자)', type: '기타', date: '02-10', target: '개인 면세' },
];

/** 사업자등록 유형 진단 문항 (뼈대) */
export const BIZ_TYPE_QUESTIONS = [
  {
    id: 'q1',
    question: '연간 예상 매출액이 얼마인가요?',
    options: ['4,800만 원 미만', '4,800만 원 ~ 1억 원', '1억 원 이상'],
  },
  {
    id: 'q2',
    question: '외부 투자 유치나 동업 계획이 있나요?',
    options: ['없음 (1인 운영)', '동업자와 함께', '법인 전환 · 투자 유치 예정'],
  },
  {
    id: 'q3',
    question: '주요 거래처가 세금계산서 발행을 요구하나요?',
    options: ['아니요', '가끔', '예, 필수'],
  },
];

/** 청년 창업 세액 감면 판정 문항 (뼈대 - 조세특례제한법 제6조 취지) */
export const TAX_RELIEF_QUESTIONS = [
  { id: 'r1', question: '창업 당시 만 15세 이상 34세 이하였나요?', type: 'boolean' },
  { id: 'r2', question: '2018년 5월 29일 이후 최초로 창업했나요?', type: 'boolean' },
  { id: 'r3', question: '감면 대상 업종(제조·정보통신 등)에 해당하나요?', type: 'boolean' },
  { id: 'r4', question: '수도권 과밀억제권역 밖에서 창업했나요?', type: 'boolean' },
  { id: 'r5', question: '기존 사업의 승계·법인 전환·업종 변경이 아닌가요?', type: 'boolean' },
];
