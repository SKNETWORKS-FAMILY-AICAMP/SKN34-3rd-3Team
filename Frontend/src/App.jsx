import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApi, api } from './api.js';
const DEADLINES = [
    { id: 'ysa-15', dday: 'D-8', tone: 'urgent', title: '청년창업사관학교 15기', meta: '중소벤처기업진흥공단 · 최대 1억 원' },
    { id: 'seoul-deposit', dday: 'D-24', tone: 'soon', title: '서울 청년창업 임차보증금 지원', meta: '서울시 · 최대 3,000만 원' },
    { id: 'semas-voucher', dday: 'D-37', tone: 'normal', title: '1인 소상공인 판로개척 바우처', meta: '소상공인시장진흥공단 · 최대 500만 원' },
    { id: 'first-step', dday: '상시', tone: 'normal', title: '소상공인 첫걸음 컨설팅', meta: '소상공인시장진흥공단 · 상시 접수' },
  ];

  const HERO_TITLE = [
    ['흩어진', '청년', '창업', '지원', '공고를'],
    ['한', '곳에서', '봅니다'],
  ];

  const METRICS = [
    { value: 168, suffix: '개', label: '연동 주관 기관' },
    { value: 17, suffix: '개 시·도', label: '지역 커버리지' },
    { value: 1842, suffix: '건', label: '모집 중 공고' },
    { value: 50, suffix: '%', label: '최대 세액 감면율' },
  ];

  const CHAT = [
    { role: 'user', text: '대전에서 IT 서비스로 창업하려는데, 받을 수 있는 지원사업이 있을까요?' },
    { role: 'ai', text: "만 39세 이하 예비창업자라면 '예비창업패키지'와 '대전 청년창업 지원'을 함께 검토할 수 있어요. 둘 다 사업화 자금과 멘토링을 제공합니다." },
    { role: 'user', text: '세액 감면도 되나요?' },
    { role: 'ai', text: '창업 후 5년간 소득세를 최대 50% 감면받을 수 있어요(조특법 제6조). 대전은 수도권 밖이라 감면 폭이 더 큽니다.' },
    { role: 'user', text: '부가세 신고는 언제 하죠?' },
    { role: 'ai', text: '일반과세자는 4월·10월 예정신고, 1월·7월 확정신고예요. 다음 신고일 10월 25일을 캘린더에 등록해 둘게요.' },
  ];

  const ROADMAP = [
    { k: 'A', phase: '창업 전', t: '아이디어 검증', d: '업종 창·폐업률과 상권 확인' },
    { k: 'B', phase: '준비', t: '사업자 등록', d: '유형 진단 후 홈택스 신청' },
    { k: 'C', phase: '준비', t: '지원사업 신청', d: '조건 맞는 공고 매칭·접수' },
    { k: 'D', phase: '준비', t: '자금 조달', d: '정책자금·보증 연계' },
    { k: 'E', phase: '창업 후', t: '세액감면 신청', d: '조특법 제6조 대상 판정' },
    { k: 'F', phase: '창업 후', t: '첫 매출·신고', d: '부가세·원천세 일정 관리' },
    { k: 'Z', phase: '성장', t: '스케일업', d: 'R&D·후속 투자 지원 탐색', accent: true },
  ];

  /* 단계별 목표·소요 시간 (창업 7단계 가이드 기준) */
  const ROADMAP_GOALS = {
    A: { goal: '실제 고객이 느끼는 문제인지 확인하기', span: '약 8주' },
    B: { goal: '법적 사업 개시 — 첫 매출 신호가 보일 때', span: '약 1주' },
    C: { goal: '정부 지원금과 멘토링 확보하기', span: '약 8주' },
    D: { goal: '투자 유치로 스케일업 기반 마련하기', span: '6개월 이상' },
    E: { goal: '첫 3~5년 세금 부담 줄이기', span: '약 3주' },
    F: { goal: '0에서 1로 — 첫 매출 만들기', span: '출시 직후부터' },
    Z: { goal: '매출을 5~10배로 키우기', span: '1년 이후' },
  };

  /* 단계별 할 일: t=할 일, why=왜 필요한지, mk/mv=단계별 부가 정보(기간·준비물·시기·대상·목표) */
  const ROADMAP_TASKS = {
    A: [
      { t: '3개월 불편 기록 쌓기', why: '아이디어는 발상이 아니라 실제로 겪은 불편에서 나옵니다. 내 분야에서 매일 마주치는 불편을 기록해 두면 검증할 문제 후보가 쌓입니다.', mk: '기간', mv: '1주' },
      { t: '타깃 고객 20명 인터뷰', why: '내가 생각한 문제를 실제 고객도 문제라고 느끼는지 확인합니다. 특히 돈이 오가는 서비스일수록 수요 검증을 건너뛰면 안 됩니다.', mk: '기간', mv: '2주' },
      { t: '경쟁 서비스 5개 분석', why: '비슷한 서비스가 이미 있는지, 있다면 무엇이 다를지 명확히 합니다. 심사와 투자 자리에서 가장 많이 받는 질문이기도 합니다.', mk: '기간', mv: '1주' },
      { t: '프로토타입 v0.1 만들기', why: '말이 아니라 동작하는 화면을 보여줘야 고객의 진짜 반응이 나옵니다. 와이어프레임이나 간단한 코드로도 충분합니다.', mk: '기간', mv: '2~3주' },
      { t: '사용자 10명 테스트 + 피드백', why: '프로토타입을 보여주고 "이거 쓸래?"라는 구체적인 답을 받습니다. 여기서 모은 피드백이 이후 모든 결정의 근거가 됩니다.', mk: '기간', mv: '2주' },
    ],
    B: [
      { t: '사업 형태 결정 (개인/법인)', why: '초기 매출이 작고 혼자 시작한다면 개인사업자가 절차·비용 면에서 유리합니다. 외부 투자를 받을 계획이면 법인을 검토하세요.', mk: '준비물', mv: '결정 1시간' },
      { t: '사업명·상호 확정', why: '어떤 회사인지 한 번에 전달되어야 합니다. 나중에 바꿀 수 있지만 초기 인지도에 영향을 줍니다.', mk: '준비물', mv: '메모장' },
      { t: '국세청 사업자등록 신청', why: '정부24나 홈택스에서 온라인으로 신청하면 5분이면 끝나고 즉시 승인되는 경우가 많습니다.', mk: '준비물', mv: '신분증 · 사업장 주소' },
      { t: '사업용 통장 개설', why: '개인 돈과 사업 돈을 처음부터 분리해야 세금 신고와 경비 증빙이 깔끔해집니다.', mk: '준비물', mv: '사업자등록증 · 신분증' },
      { t: '세무 기초 정리', why: '월별 매출 기록 방식과 신고 시기를 미리 알아 둡니다. 신고 기한을 놓치면 가산세가 붙습니다.', mk: '준비물', mv: '엑셀 또는 회계앱' },
    ],
    C: [
      { t: '정부 지원 사업 리스트 정리', why: 'K-Startup, 초기창업패키지 등 내 업종과 업력에 맞는 프로그램을 먼저 추립니다. 요건이 안 맞는 공고에 시간을 쓰지 않는 게 중요합니다.', mk: '시기', mv: '1개월 차' },
      { t: '팀 구성 (혼자면 동료 최소 1명)', why: '정부 지원 사업은 팀 구성을 요건이나 가점으로 두는 경우가 많습니다. 커뮤니티·동료 네트워크를 활용하세요.', mk: '시기', mv: '1개월 차' },
      { t: '사업계획서 작성', why: '재무 예측, 시장 규모, 경쟁력을 담은 핵심 서류입니다. 준비 과정에서 가장 시간이 오래 걸리니 일찍 시작하세요.', mk: '시기', mv: '2개월 차' },
      { t: '멘토링 신청', why: '대부분의 정부 프로그램은 자금과 함께 멘토링을 제공합니다. 선정 전이라도 신청해 전문가 조언을 받아 두면 좋습니다.', mk: '시기', mv: '3개월 차' },
      { t: '선정 후 보조금 집행·정산', why: '선정되면 정해진 항목에만 집행할 수 있고 증빙을 남겨야 합니다. 정산 기한을 넘기면 환수될 수 있습니다.', mk: '시기', mv: '4개월 차 이후' },
    ],
    D: [
      { t: '엔젤 투자자 네트워크 만들기', why: '처음에는 VC보다 엔젤(개인 투자자)에게 시드를 받는 편이 현실적입니다. 커뮤니티·동문 모임에서 관계를 먼저 쌓으세요.', mk: '준비물', mv: '네트워크 · 커뮤니티' },
      { t: '피치덱 만들기 (10장 내외)', why: '사업 개요, 시장, 팀, 재무 예측, 목표 펀딩액을 담은 최소 자료입니다. 투자자를 만나기 전에 반드시 준비해야 합니다.', mk: '준비물', mv: '노션 또는 Figma' },
      { t: '프로토타입 + 초기 지표 준비', why: '무엇을 만들었는지와 사용자 수·매출 같은 숫자가 함께 있어야 설득이 됩니다. 지표 없는 계획서는 검토 대상이 되기 어렵습니다.', mk: '준비물', mv: '동작하는 제품' },
      { t: '시드 라운드 준비', why: '보통 1천만 원~1억 원대 규모입니다. 한 곳에서 크게 받기보다 여러 엔젤에게 나눠 받는 경우가 많습니다.', mk: '준비물', mv: '투자계약서 템플릿' },
      { t: '투자 유치 후 운영 계획', why: '받은 돈을 개발비·마케팅·인건비에 어떻게 쓸지 명확히 해야 합니다. 집행 계획이 다음 라운드의 근거가 됩니다.', mk: '준비물', mv: '월별 예산 계획' },
    ],
    E: [
      { t: '창업 감면 요건 확인', why: '사업자 등록 후 3년 이내에 신청할 수 있고, 기술·지식 기반 업종이 주요 대상입니다. 먼저 내가 대상인지부터 확인하세요.', mk: '대상', mv: '사업자등록증' },
      { t: '소득세 감면 신청', why: '요건을 충족하면 첫 3년 100%, 이후 2년 50% 감면을 받을 수 있습니다. 신고할 때 신청서를 함께 내야 적용됩니다.', mk: '대상', mv: '국세청 신청' },
      { t: '법인세 감면 (법인 전환 후)', why: '나중에 법인으로 전환하면 법인세도 감면 대상이 됩니다. 개인사업자 단계에서는 소득세만 해당합니다.', mk: '대상', mv: '향후 과제' },
      { t: '부가가치세 면세·간이과세 요건 확인', why: '연 매출이 기준 이하면 간이과세나 면세 적용이 가능해 세 부담이 크게 줄어듭니다.', mk: '대상', mv: '국세청 상담' },
      { t: '세무사 상담', why: '혼자 판단하기보다 전문가에게 확인하는 편이 안전합니다. 초기 상담은 무료로 제공되는 경우가 많습니다.', mk: '대상', mv: '세무 대리인' },
    ],
    F: [
      { t: '첫 고객(또는 파일럿) 확보', why: '0에서 1로 가는 구간이 가장 어렵습니다. 단 1명이라도 실제로 돈을 낸 고객을 만드는 것이 목표입니다.', mk: '시기', mv: '출시 직후' },
      { t: '매출 기록 시작', why: '매달 얼마를 벌었는지 남겨야 합니다. 나중에 투자자와 세무사에게 보여줄 가장 기본적인 지표입니다.', mk: '시기', mv: '매달' },
      { t: '첫 세금 신고', why: '부가세·종합소득세 등 정기 신고를 합니다. 기한을 넘기면 가산세가 붙으니 일정을 미리 등록해 두세요.', mk: '시기', mv: '신고 일정 확인' },
      { t: '매출 기반 다음 펀딩 준비', why: '매출이 나는 순간 투자자의 관심도가 달라집니다. 그 전까지는 검증 중이지만, 매출이 있으면 실제 비즈니스가 됩니다.', mk: '시기', mv: '3~6개월 후' },
      { t: '첫 해 결산', why: '연말에 수익·비용·세금을 정산하고 다음 해 계획을 세웁니다. 세무 대리인의 도움을 받는 편이 좋습니다.', mk: '시기', mv: '12월' },
    ],
    Z: [
      { t: '시리즈 A 펀딩 준비', why: '10억 원대 규모를 기관 투자자에게 받는 단계입니다. 매출과 사용자 지표가 뒷받침되어야 논의가 시작됩니다.', mk: '목표', mv: '매출·사용자 지표 확보' },
      { t: '팀 확장', why: '혼자에서 2~3명, 다시 10명으로 늘리며 개발·세일즈·PM 역할을 나눕니다. 채용 시점과 자금 계획을 맞춰야 합니다.', mk: '목표', mv: '시리즈 A 이후' },
      { t: '마케팅·성장 전략 전환', why: '초기 입소문 중심에서 광고·PR·파트너십으로 넓히는 단계입니다. 채널별 효율을 측정하며 늘려야 합니다.', mk: '목표', mv: '시드 3~6개월 후' },
      { t: '법인 전환', why: '개인사업자에서 주식회사로 전환합니다. 기관 투자자들이 요구하는 경우가 많아 추가 펀딩 전에 마쳐야 합니다.', mk: '목표', mv: '추가 펀딩 이전' },
      { t: 'IPO·인수 시나리오 준비', why: '어디까지 키울 것인지 목표와 출구 전략을 정합니다. 미리 생각해 둘수록 중간 의사결정이 흔들리지 않습니다.', mk: '목표', mv: '2~3년 후' },
    ],
  };

  const NAV_MENU = [
    { key: 'roadmap', label: '창업 로드맵', desc: '아이디어부터 스케일업까지' },
    { key: 'tax', label: 'AI 세무 Assistant', desc: '세액감면 자동 판정·경비처리' },
    { key: 'gov', label: '공고지원 AI', desc: '공고 적합도·서류·초안을 AI와 상담' },
    { key: 'mypage', label: '마이페이지', desc: '내 맞춤 대시보드' },
  ];

  const PAGES = {
    tax: {
      title: '세금상담',
      lead: '사업자 유형별 세액감면 판정과 부가세 · 종합소득세 신고 일정을 한눈에 정리해 드립니다.',
      body: '판정 결과에는 근거 조문(조특법 제6조 등)이 함께 표시되고, 추가로 궁금한 점은 AI 상담으로 이어집니다.',
      sections: [
        { h: '세액감면 판정', p: '창업 지역과 업종에 따라 5년간 50~100% 감면 대상 여부를 근거 조문과 함께 알려드립니다.' },
        { h: '신고 캘린더', p: '부가세 예정·확정신고, 종합소득세, 원천세 일정을 한 화면에 모아 마감 전에 알림을 보냅니다.' },
        { h: '증빙 체크리스트', p: '경비로 인정되는 지출과 필요한 증빙 서류를 거래 유형별로 정리했습니다.' },
      ],
    },
    gov: {
      title: '정부지원사업',
      lead: '중앙부처 · 지자체 · 공공기관 공고를 매일 09:00에 모아 내 조건에 맞는 사업만 골라 보여드립니다.',
      body: '현재 168개 기관 · 17개 시·도 공고를 큐레이션하고 있어요.',
      sections: [
        { h: '자금 지원', p: '창업사업화, R&D, 시설·운전자금 융자까지 지원 유형별로 분류해 제공합니다.' },
        { h: '공간 · 보육', p: '창업보육센터, 메이커스페이스, 지역 창업허브 입주 공고를 지역별로 모았습니다.' },
        { h: '마감 알림', p: '관심 공고를 저장하면 마감 3일 전 알림을 보내 접수 기한을 놓치지 않게 합니다.' },
      ],
    },
  };

  /* --- 마이페이지 데이터 (첨부 이미지 기준) --- */
  const MP_SCHEDULE = [
    { title: '예비창업패키지 마감', when: 'D-43', urgent: true },
    { title: '부가세 2기 예정신고', when: '10월 25일', mark: true },
    { title: '종소세 중간예납', when: '11월 30일' },
  ];
  const MP_RECO = [
    { title: '청년창업사관학교', score: 92 },
    { title: '초기창업패키지', score: 88 },
    { title: '대전 청년창업', score: 81 },
  ];

  /* 세무 AI / 공고지원 AI와 나눈 대화 요약 (각 AI 페이지 시드 대화 기준) */
  const MP_TAX_SUMMARY = [
    '청년창업 세액감면 100% 대상 — 조특법 제6조, 5년간',
    '부가세는 감면 대상 아님 — 1·7월 확정, 4·10월 예정 신고',
    '업무용 노트북·강의실 인테리어 경비처리 가능 (적격증빙 보관)',
  ];
  const MP_GOV_SUMMARY = [
    '예비창업패키지 — 만 24세 예비창업자 지원 가능 (D-43)',
    '우선 준비 서류: 사업계획서(PSST) · 개인정보 수집 동의서',
    '대전 청년창업 지원사업과 차이점 확인 요청',
  ];

  const MP_MENU = [
    { key: 'home', label: '상담하기' },
    { group: '내 정보' },
    { key: 'profile', label: '사업자 정보', sub: true },
    { key: 'diagnosis', label: '진단 결과', sub: true },
    { group: '저장한 것' },
    { key: 'saved', label: '공고 · 정책', sub: true },
    { key: 'chatlog', label: '상담 기록', sub: true },
    { key: 'docs', label: '서류', sub: true },
    { divider: true },
    { key: 'settings', label: '설정' },
  ];

  const CAL_START = { y: 2025, m: 9 };
  const CAL_TODAY = '2025-10-08';
  const CAL_EVENTS = {
    '2025-10-08': [{ type: 'tax', title: '원천세 신고·납부', note: '전월 급여 지급분' }],
    '2025-10-14': [{ type: 'policy', title: '청년창업사관학교 15기 마감', note: '중소벤처기업진흥공단' }],
    '2025-10-25': [
      { type: 'tax', title: '부가세 2기 예정신고', note: '홈택스 전자신고' },
      { type: 'policy', title: '초기창업패키지 실적 보고', note: '창업진흥원' },
    ],
    '2025-10-30': [{ type: 'policy', title: '서울 청년창업 임차보증금 지원 마감', note: '서울시' }],
    '2025-11-06': [{ type: 'policy', title: '1인 소상공인 판로개척 바우처 마감', note: '소상공인시장진흥공단' }],
    '2025-11-17': [{ type: 'policy', title: '예비창업패키지 서류 발표', note: '창업진흥원' }],
    '2025-11-30': [{ type: 'tax', title: '종합소득세 중간예납', note: '11월 30일까지 납부' }],
  };
  const NO_EVENTS = {}; // useApi fallback은 참조가 고정된 모듈 상수여야 한다
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const dayKey = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 공용 훅 ---------- */
  function useInView(opts, repeat) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
      if (typeof IntersectionObserver === 'undefined') {
        setInView(true);
        return;
      }
      const el = ref.current;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setInView(true);
              if (!repeat) io.disconnect();
            } else if (repeat) {
              setInView(false);
            }
          });
        },
        opts || { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
      );
      if (el) io.observe(el);
      const failsafe = repeat ? null : setTimeout(() => setInView(true), 2800);
      return () => {
        io.disconnect();
        if (failsafe) clearTimeout(failsafe);
      };
    }, [repeat]);
    return [ref, inView];
  }

  function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
    const [ref, inView] = useInView(undefined, true);
    const shown = prefersReducedMotion || inView;
    return (
      <Tag
        ref={ref}
        className={`reveal ${shown ? 'is-in' : ''} ${className}`.trim()}
        style={{ '--d': `${delay}ms` }}
      >
        {children}
      </Tag>
    );
  }

  function useCountUp(target, run, duration = 1200) {
    const [value, setValue] = useState(prefersReducedMotion ? target : 0);
    useEffect(() => {
      if (prefersReducedMotion) {
        setValue(target);
        return;
      }
      if (!run) {
        setValue(0);
        return;
      }
      let raf;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [target, run, duration]);
    return value;
  }

  function Metric({ value, suffix, label, delay }) {
    const [ref, inView] = useInView({ threshold: 0.5 }, true);
    const n = useCountUp(value, inView);
    return (
      <div className="reveal metric is-in" ref={ref} style={{ '--d': `${delay}ms` }}>
        <b className="u-num">
          {n.toLocaleString()}
          {suffix}
        </b>
        <span>{label}</span>
      </div>
    );
  }

  function ScrollProgress() {
    const ref = useRef(null);
    useEffect(() => {
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const h = document.documentElement;
          const max = h.scrollHeight - h.clientHeight;
          const p = max > 0 ? h.scrollTop / max : 0;
          if (ref.current) ref.current.style.setProperty('--p', p.toFixed(4));
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return <div className="progress" ref={ref} aria-hidden="true" />;
  }

  function useThemeToggle() {
    return useCallback(() => {
      const isDark =
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    }, []);
  }

  /* 어느 페이지에서나 보이는 고정 다크모드 토글 */
  function FloatingThemeToggle() {
    const toggleTheme = useThemeToggle();
    return (
      <button
        className="theme-fab"
        type="button"
        onClick={toggleTheme}
        aria-label="밝은 테마와 어두운 테마 전환"
        title="다크 모드 전환"
      >
        ◐
      </button>
    );
  }

  /* ---------- 메뉴 드로어 ---------- */
  function MenuDrawer({ open, onClose, onNavigate, user, onAuth }) {
    useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
      };
    }, [open, onClose]);

    const node = (
      <div className={'drawer-root' + (open ? ' is-open' : '')} aria-hidden={!open}>
        <div className="drawer-overlay" onClick={onClose} />
        <aside className="drawer" role="dialog" aria-modal="true" aria-label="전체 메뉴">
          <div className="drawer__top">
            <span className="drawer__brand">
              <span className="brand__mark" aria-hidden="true">ON</span>창업ON
            </span>
            <button className="drawer__close" type="button" onClick={onClose} aria-label="메뉴 닫기">×</button>
          </div>
          <ul className="drawer__list">
            {NAV_MENU.map((m, i) => (
              <li className="drawer__item" key={m.key} style={{ '--i': i }}>
                <button
                  className="drawer__link"
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate(m.key);
                  }}
                >
                  <span className="drawer__num">{pad2(i + 1)}</span>
                  <span>{m.label}</span>
                  <span className="drawer__desc">{m.desc}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="drawer__foot">
            {user ? (
              <React.Fragment>
                <div className="drawer__auth">
                  <span><b>{user.name}</b>님으로 로그인됨</span>
                  <button className="btn btn--ghost" type="button"
                    onClick={() => { onClose(); onAuth(); }}>로그아웃</button>
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <button className="btn btn--primary drawer__login" type="button"
                  onClick={() => { onClose(); onAuth(); }}>로그인</button>
                <p className="drawer__hint">로그인하면 맞춤 공고와 세무 대시보드가 열립니다.</p>
              </React.Fragment>
            )}
          </div>
        </aside>
      </div>
    );
    return createPortal(node, document.body);
  }

  /* ---------- 로그인 / 회원가입 모달 ---------- */
  const inputStyle = {
    width: '100%', padding: '11px 12px', font: 'inherit', fontSize: 13.5, color: 'var(--ink)',
    background: 'var(--ground)', border: '1px solid var(--line-strong)', borderRadius: 10,
  };
  const linkBtn = {
    border: 0, background: 'transparent', padding: 0, font: 'inherit', fontWeight: 700,
    color: 'var(--blue-deep)', cursor: 'pointer', textDecoration: 'underline',
  };
  const fieldLabel = { display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' };
  const socialBtn = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 12px', border: 0, borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
  };

  // Backend가 시드하는 데모 계정 (core/config.py DEMO_EMAIL/DEMO_PASSWORD와 동일)
  const DEMO_EMAIL = 'demo@demo.com';
  const DEMO_PASSWORD = 'demo123';

  // 한국표준산업분류 대분류 기준 (창업이 많은 순서로 정렬)
  const INDUSTRIES = [
    '정보통신업',
    '전문·과학 및 기술 서비스업',
    '도매 및 소매업',
    '숙박 및 음식점업',
    '교육 서비스업',
    '제조업',
    '예술·스포츠 및 여가 관련 서비스업',
    '보건업 및 사회복지 서비스업',
    '사업시설 관리 및 사업 지원 서비스업',
    '건설업',
    '운수 및 창고업',
    '금융 및 보험업',
    '부동산업',
    '농업·임업 및 어업',
    '기타 개인 서비스업',
  ];

  const REGIONS = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  ];
  // 서버에 프로필이 없는 계정(데모 등)에서 쓰는 기본값
  const DEFAULT_BIZ = '정보통신업';
  const DEFAULT_REGION = '대전';

  function LoginModal({ onClose, onSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState(DEMO_EMAIL);
    const [pw, setPw] = useState(DEMO_PASSWORD);
    const [pw2, setPw2] = useState('');
    const [biz, setBiz] = useState(DEFAULT_BIZ);
    const [region, setRegion] = useState(REGIONS[0]); // 처음엔 서울
    const [age, setAge] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // 실제로 Backend에 로그인해 토큰을 받아야 세무·AI 상담 등 인증이 필요한 API가 동작한다.
    // profile이 있으면(회원가입) 서버에 저장하고, 없으면(로그인) 서버에서 읽어와 화면에 쓴다.
    const authenticate = async (doLogin, displayName, profile) => {
      setErr('');
      setBusy(true);
      try {
        const r = await doLogin();
        let biz2 = (profile && profile.biz) || DEFAULT_BIZ;
        let region2 = (profile && profile.region) || DEFAULT_REGION;
        let age2 = profile ? profile.age : null;

        if (profile) {
          // 가입 직후: 입력한 프로필을 서버에 저장 (개인정보 / 사업자 정보 따로)
          try {
            await api.updateMe({ region: profile.region, age: profile.age });
            await api.updateBusinessProfile({ industry: profile.biz });
          } catch (e3) {
            /* 프로필 저장에 실패해도 로그인 자체는 성공 — 마이페이지에서 다시 저장할 수 있다 */
          }
        } else {
          // 로그인: 저장된 프로필을 불러와 반영 (없으면 기본값)
          try {
            const [meRes, bizRes] = await Promise.all([api.me(), api.businessProfile()]);
            if (meRes && meRes.region) region2 = meRes.region;
            if (meRes && meRes.age) age2 = meRes.age;
            if (bizRes && bizRes.industry) biz2 = bizRes.industry;
          } catch (e3) {
            /* 조회 실패 시 기본값으로 진행 */
          }
        }

        onSuccess({
          id: r.userId,
          name: displayName || r.name || name || '정석',
          email: r.email || email,
          biz: biz2,
          region: region2,
          age: age2,
        });
      } catch (e2) {
        setErr(
          e2 && e2.status === 401
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : e2 && e2.status === 409
              ? '이미 가입된 이메일입니다.'
              : 'Backend(:8000)에 연결하지 못했어요. 서버가 떠 있는지 확인해 주세요.'
        );
      } finally {
        setBusy(false);
      }
    };

    const submit = (e) => {
      e.preventDefault();
      if (mode === 'signup') {
        if (pw !== pw2) { setErr('비밀번호가 일치하지 않습니다.'); return; }
        const n = Number(age);
        if (!Number.isFinite(n) || n < 15 || n > 120) { setErr('대표자 연령을 만 나이로 입력해 주세요.'); return; }
        authenticate(() => api.signup(email, pw, name), name, { biz: biz.trim(), region, age: n });
        return;
      }
      authenticate(() => api.login(email, pw));
    };

    // 소셜 로그인은 백엔드에 대응이 없어 데모 계정으로 실제 로그인해 토큰만 받는다.
    const socialDemo = (displayName) => authenticate(() => api.login(DEMO_EMAIL, DEMO_PASSWORD), displayName);

    const isLogin = mode === 'login';

    return (
      <div onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center',
          padding: '20px', background: 'rgba(12,16,30,0.46)', backdropFilter: 'blur(3px)',
        }}>
        <div role="dialog" aria-modal="true" aria-labelledby="login-title"
          style={{
            width: '100%', maxWidth: 380, maxHeight: '90vh', background: 'var(--surface-solid)',
            border: '1px solid var(--line)', borderRadius: 22, boxShadow: 'var(--shadow)',
            // 스크롤은 안쪽에서만 — 바깥 박스가 둥근 모서리를 그대로 유지한다
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
          <div className="lgm__scroll" style={{ minHeight: 0, overflowY: 'auto', padding: '26px 24px 24px' }}>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{
              float: 'right', width: 28, height: 28, margin: '-6px -6px 0 0', border: 0,
              borderRadius: 8, background: 'transparent', color: 'var(--ink-faint)', fontSize: 18, cursor: 'pointer',
            }}>×</button>
          <h2 id="login-title" style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {isLogin ? '창업ON 로그인' : '창업ON 회원가입'}
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {isLogin ? '사업자 정보로 맞춤 대시보드를 불러옵니다.' : '3분이면 가입하고 맞춤 추천을 받아요.'}
          </p>

          <form onSubmit={submit}>
            {!isLogin && (
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={fieldLabel}>이름</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" autoComplete="name" style={inputStyle} required />
              </label>
            )}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={fieldLabel}>이메일</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" style={inputStyle} required />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={fieldLabel}>비밀번호</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'} style={inputStyle} required />
            </label>
            {!isLogin && (
              <React.Fragment>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={fieldLabel}>비밀번호 확인</span>
                  <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" style={inputStyle} required />
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={fieldLabel}>업종</span>
                  <select value={biz} onChange={(e) => setBiz(e.target.value)} style={inputStyle} required>
                    {INDUSTRIES.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={fieldLabel}>사업장 지역</span>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} style={inputStyle} required>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={fieldLabel}>대표자 연령 (만 나이)</span>
                  <input type="number" inputMode="numeric" min="15" max="120" value={age}
                    onChange={(e) => setAge(e.target.value)} placeholder="예: 32" style={inputStyle} required />
                  <span style={{ display: 'block', marginTop: 5, fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    만 15~34세면 청년창업 세액감면 대상 여부를 함께 판정해 드려요.
                  </span>
                </label>
              </React.Fragment>
            )}
            {err && <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--red)' }}>{err}</p>}
            <button type="submit" disabled={busy}
              style={{
                width: '100%', marginTop: 6, padding: 12, border: 0, borderRadius: 11,
                background: 'linear-gradient(135deg, var(--blue), var(--blue-deep))', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: busy ? 'progress' : 'pointer', opacity: busy ? 0.7 : 1,
              }}>{busy ? '확인 중…' : isLogin ? '로그인' : '가입하기'}</button>
          </form>

          {/* 소셜 로그인 (로그인 버튼 아래) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px', color: 'var(--ink-faint)', fontSize: 11 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />또는<span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <button type="button" disabled={busy} onClick={() => socialDemo('카카오 사용자')} style={{ ...socialBtn, background: '#FEE500', color: '#191919' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#191919">
                <path d="M12 3C6.48 3 2 6.54 2 10.8c0 2.76 1.86 5.18 4.66 6.55-.15.53-.7 2.5-.8 2.9-.12.48.18.47.37.35.15-.1 2.4-1.63 3.37-2.28.66.1 1.34.15 2 .15 5.52 0 10-3.54 10-7.9S17.52 3 12 3z" />
              </svg>
              카카오로 계속하기
            </button>
            <button type="button" disabled={busy} onClick={() => socialDemo('네이버 사용자')} style={{ ...socialBtn, background: '#03C75A', color: '#fff' }}>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 14 }}>N</span>
              네이버로 계속하기
            </button>
          </div>

          <p style={{ margin: '16px 0 0', fontSize: 12.5, color: 'var(--ink-soft)', textAlign: 'center' }}>
            {isLogin ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button type="button" onClick={() => { setErr(''); setMode(isLogin ? 'signup' : 'login'); }} style={linkBtn}>
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
          {isLogin && (
            <p style={{ margin: '8px 0 0', textAlign: 'center' }}>
              <button type="button" onClick={() => setErr('비밀번호 찾기는 준비 중입니다.')}
                style={{ ...linkBtn, color: 'var(--ink-faint)', fontWeight: 500 }}>
                비밀번호를 잊으셨나요?
              </button>
            </p>
          )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 마이페이지 · 실시간 AI 상담 ---------- */
  const AI_RULES =
    '너는 "창업ON"의 세무·창업 지원 상담 어시스턴트야. ' +
    '사용자는 대전광역시에서 정보통신업으로 사업을 준비/운영 중인 예비·초기 창업자야. ' +
    '한국어로 3~5문장 이내로 간결하고 실용적으로 답해. ' +
    '정부지원사업, 세액감면(조특법 제6조 등 창업중소기업 세액감면), 부가가치세·종합소득세 신고 일정, 경비처리 위주로 도와줘. ' +
    '숫자·요건은 일반적인 기준으로 안내하되, 확정 판단이 필요하면 관할 세무서나 세무대리인 확인을 함께 권해. 이 화면은 데모야.';

  const AI_SUGGESTIONS = [
    '정보통신업 창업도 세액감면 대상인가요?',
    '올해 부가세 신고 일정 알려줘',
    '초기 창업자가 받을 수 있는 정부지원사업은?',
    '노트북 구입비도 경비처리 되나요?',
  ];

  const AI_ERR = {
    not_granted: '지금은 답변을 불러올 수 없어요. 잠시 후 다시 시도해 주세요.',
    sampling_disabled: '이 계정/조직에서는 AI 응답을 사용할 수 없어요.',
    not_declared: 'AI 기능이 이 버전에 선언되어 있지 않아요.',
    rate_limited: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
    refused: '이 질문에는 답하기 어려워요. 조금 다르게 물어봐 주세요.',
    prompt_too_large: '대화가 너무 길어졌어요. 새로 시작해 주세요.',
    session_expired: '세션이 만료됐어요. 다시 로그인해 주세요.',
  };

  /**
   * 대화방 경계.
   * Backend 의 chat_messages 는 category 당 한 스레드라 대화방 구분이 없다.
   * 그래서 "새 대화 시작"을 누른 시점의 마지막 메시지 id 를 이 브라우저에 남겨 두고,
   * 기록을 불러올 때 그 id 를 기준으로 방을 나눠 보여준다.
   */
  const ROOMS_KEY = (category) => `changeup:chat-rooms:${category}`;
  const loadRooms = (category) => {
    try {
      const arr = JSON.parse(localStorage.getItem(ROOMS_KEY(category)) || '[]');
      return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
    } catch (e) {
      return [];
    }
  };
  const saveRooms = (category, arr) => {
    try {
      localStorage.setItem(ROOMS_KEY(category), JSON.stringify(arr));
    } catch (e) {
      /* 저장 못 해도 이번 세션은 동작한다 */
    }
  };
  const rowsToTurns = (rows) => {
    const out = [];
    (rows || []).forEach((row) => {
      out.push({ role: 'user', content: row.question });
      out.push({ role: 'assistant', content: row.answer });
    });
    return out;
  };

  function AiConsult({
    user,
    rules,
    title,
    suggestions,
    category,
    roadmapStep,
    allowSampleFallback = true,
    large,
    compact,
    noHeader,
    onRequireLogin,
    withSidebar,
  }) {
    const RULES = rules || AI_RULES;
    const CHIPS = suggestions || AI_SUGGESTIONS;
    const userId = user && user.id;
    // category가 지정되고 로그인 상태일 때만 DB 기록을 불러온다 — 지정하지 않은 화면(로드맵·공고지원 AI)은
    // 매번 빈 대화로 시작해서, 서로 다른 화면의 대화가 섞이지 않는다.
    const [sampleFn, setSampleFn] = useState(undefined); // undefined=연결중, null=불가, fn=사용가능
    const [turns, setTurns] = useState([]);
    const [draft, setDraft] = useState('');
    const [stream, setStream] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [histBusy, setHistBusy] = useState(false); // 기록 조회·삭제 진행 중
    const [histLoaded, setHistLoaded] = useState(false); // DB 기록 조회가 끝났는지(빈 기록 포함)
    const [rows, setRows] = useState([]); // 서버 기록 원본 (id 포함) — 대화방을 나누는 기준
    const [bounds, setBounds] = useState(() => (category ? loadRooms(category) : [])); // 방 경계 id
    const [roomIdx, setRoomIdx] = useState(0); // 지금 보고 있는 방
    const [needsLogin, setNeedsLogin] = useState(false);
    const bodyRef = useRef(null);
    const ctlRef = useRef(null);

    // 서버 기록을 경계 기준으로 방 단위로 나눈다. 마지막 방이 "현재 대화"다.
    const rooms = React.useMemo(() => {
      const groups = [[]];
      rows.forEach((row) => {
        const bi = bounds.filter((b) => row.id > b).length;
        while (groups.length <= bi) groups.push([]);
        groups[bi].push(row);
      });
      while (groups.length < bounds.length + 1) groups.push([]);
      return groups;
    }, [rows, bounds]);
    const lastRoom = rooms.length - 1;

    useEffect(() => {
      let alive = true;
      (async () => {
        try {
          const s = window.claude && (await window.claude.use('sample'));
          if (alive) setSampleFn(() => s || null);
        } catch (e) {
          if (alive) setSampleFn(() => null);
        }
      })();
      return () => {
        alive = false;
        if (ctlRef.current) ctlRef.current.abort();
      };
    }, []);

    // 로그인 + category 지정 시 이전 질문·답변을 불러와 표시한다.
    useEffect(() => {
      if (!userId || !category) {
        setHistLoaded(false);
        setTurns([]);
        setRows([]);
        return;
      }
      let alive = true;
      setHistBusy(true);
      setErr('');
      setTurns([]);
      api
        .chatHistory(category)
        .then((r) => {
          if (!alive) return;
          const fetched = (r && r.messages) || [];
          setRows(fetched);
          // 기록보다 뒤에 있는 경계만 정리한다. (마지막 메시지 id와 같은 경계 = 아직 비어 있는 새 방)
          const maxId = fetched.length ? fetched[fetched.length - 1].id : 0;
          const kept = loadRooms(category).filter((b) => b <= maxId);
          setBounds(kept);
          saveRooms(category, kept);
          // 마지막(현재) 방을 연다.
          const groups = [[]];
          fetched.forEach((row) => {
            const bi = kept.filter((b) => row.id > b).length;
            while (groups.length <= bi) groups.push([]);
            groups[bi].push(row);
          });
          while (groups.length < kept.length + 1) groups.push([]);
          setRoomIdx(groups.length - 1);
          setTurns(rowsToTurns(groups[groups.length - 1]));
          setHistLoaded(true);
        })
        .catch(() => {
          if (!alive) return;
          setErr('이전 대화 기록을 불러오지 못했어요.');
          setHistLoaded(true);
        })
        .finally(() => {
          if (alive) setHistBusy(false);
        });
      return () => {
        alive = false;
      };
    }, [userId, category]);

    const clearHistory = async () => {
      if (histBusy || busy) return;
      if (!window.confirm('대화 기록을 모두 지울까요? 되돌릴 수 없어요.')) return;
      setHistBusy(true);
      setErr('');
      try {
        await api.clearChat(category);
        setTurns([]);
        setStream('');
        setRows([]);
        setBounds([]);
        saveRooms(category, []);
        setRoomIdx(0);
      } catch (e) {
        setErr('대화 기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요.');
      } finally {
        setHistBusy(false);
      }
    };

    useEffect(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [turns, stream, busy]);


    const ask = async (text) => {
      const q = (text || '').trim();
      if (!q || busy) return;
      setErr('');
      setNeedsLogin(false);
      // 서버에는 항상 스레드 끝에 쌓이므로, 지난 방을 보고 있었다면 현재 방으로 옮겨서 이어간다.
      const base = roomIdx === lastRoom ? turns : [];
      if (roomIdx !== lastRoom) setRoomIdx(lastRoom);
      const nextTurns = [...base, { role: 'user', content: q }];
      setTurns(nextTurns);
      setDraft('');
      setBusy(true);
      setStream('');
      const ctl = new AbortController();
      ctlRef.current = ctl;

      // 1) Backend RAG — DB(세법 4,459조문 / 정책)에서 근거 문서 검색
      let rag = null;
      let needLogin = false;
      try {
        const chatBody = { question: q, category: category || 'tax' };
        if (category === 'roadmap' && roadmapStep) chatBody.roadmapStep = roadmapStep;
        rag = await api.chat(chatBody, { signal: ctl.signal });
      } catch (e) {
        // 401은 "Backend가 안 떴다"가 아니라 "로그인이 필요하다"이다. 구분해서 안내한다.
        needLogin = e && e.status === 401;
      }
      // ChatMessageResponse에는 sources가 없다. messageId로 근거를 따로 받아온다.
      let sources = [];
      if (rag && rag.messageId) {
        try {
          const s = await api.chatSources(rag.messageId, { signal: ctl.signal });
          sources = (s && s.sources) || [];
        } catch (e) {
          /* 근거를 못 받아도 답변은 그대로 보여준다 */
        }
      }
      // 서버에 저장된 메시지를 원본 목록에도 반영해야 방 경계 계산이 계속 맞는다.
      if (rag && rag.messageId != null) {
        setRows((cur) => [...cur, { id: rag.messageId, question: q, answer: rag.answer || '' }]);
      }

      // status가 error·integration_unavailable이면 LLM이 답하긴 했지만 근거를 만들지 못한 경우다.
      // 이때는 답변 문장 대신 아래 보조 경로로 내려간다. llmUsed는 호출 성공 여부만 뜻한다.
      const ragUsable =
        rag && rag.llmUsed && rag.status !== 'error' && rag.status !== 'integration_unavailable';
      try {
        if (ragUsable) {
          // 2) 설계 경로 — LLM 서비스(OpenAI)가 근거를 읽고 만든 답변을 그대로 쓴다.
          setTurns((cur) => [
            ...cur,
            {
              role: 'assistant',
              content: rag.answer,
              sources,
              needsConfirmation: rag.needsConfirmation,
            },
          ]);
        } else if (sampleFn && allowSampleFallback) {
          // 3) Backend가 실답변을 못 준 경우에만 뷰어의 Claude로 생성한다(claude.ai 데모 보조).
          const ctx = sources.length
            ? '\n\n[DB에서 검색한 근거 문서 — 이 내용을 우선 활용하고 인용한 조문명을 답변에 표기해]\n' +
              sources
                .map((s, i) => `[${i + 1}] ${s.title}\n${(s.excerpt || '').slice(0, 500)}`)
                .join('\n\n')
            : '';
          const res = await sampleFn(
            [{ role: 'user', content: RULES + ctx }, ...nextTurns],
            {
              cache: false,
              modelTier: 'quick',
              signal: ctl.signal,
              onText: ({ text: t }) => setStream(t),
            }
          );
          setTurns((cur) => [...cur, { role: 'assistant', content: res.text, sources }]);
        } else if (rag) {
          // 4) 둘 다 안 되면 Backend의 목업 안내라도 보여준다.
          setTurns((cur) => [...cur, { role: 'assistant', content: rag.answer, sources }]);
        } else if (needLogin) {
          setNeedsLogin(true);
          setErr('로그인이 필요한 기능이에요. 로그인하면 내 사업자 정보에 맞춰 답해 드려요.');
        } else {
          setErr(
            '지금은 답변을 불러올 수 없어요. 잠시 후 다시 시도해 주세요.'
          );
        }
      } catch (e) {
        const code = e && e.code;
        if (code === 'cancelled') {
          if (e.text) setTurns((cur) => [...cur, { role: 'assistant', content: e.text + ' …(중단됨)' }]);
        } else if (rag) {
          setTurns((cur) => [...cur, { role: 'assistant', content: rag.answer, sources }]);
        } else {
          setErr(AI_ERR[code] || '응답을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
          if (e && e.text) {
            setTurns((cur) => [...cur, { role: 'assistant', content: e.text + ' …(오류로 중단됨)' }]);
          }
        }
      } finally {
        setBusy(false);
        setStream('');
        ctlRef.current = null;
      }
    };

    // 사이드바 목록: 방마다 첫 질문을 제목으로 쓴다
    const roomList = rooms.map((g, i) => ({
      i,
      title: g.length ? g[0].question : i === lastRoom ? '새 대화' : '빈 대화',
    }));

    const openRoom = (i) => {
      if (busy || histBusy || i === roomIdx) return;
      setRoomIdx(i);
      setTurns(rowsToTurns(rooms[i]));
      setErr('');
      setStream('');
    };

    // 지금 대화는 그대로 두고 빈 방을 새로 연다. 서버 기록은 지우지 않는다.
    const startNew = () => {
      if (busy || histBusy) return;
      setErr('');
      setStream('');
      if (!category || !userId) {
        setTurns([]);
        return;
      }
      const maxId = rows.length ? rows[rows.length - 1].id : 0;
      // 이미 비어 있는 새 방이면 또 만들지 않는다.
      if (roomIdx === lastRoom && (rooms[lastRoom] || []).length === 0 && turns.length === 0) return;
      const next = bounds.includes(maxId) ? bounds : [...bounds, maxId].sort((a, b) => a - b);
      setBounds(next);
      saveRooms(category, next);
      setRoomIdx(next.length);
      setTurns([]);
    };

    const panel = (
      <div className={'ai' + (large ? ' ai--lg' : '') + (compact ? ' ai--compact' : '')}>
        {!noHeader && (
          <div className="ai__bar">
            <span className="chatbox__ava" aria-hidden="true">ON</span>
            <span className="chatbox__who">
              <b>{title || 'AI 세무·창업 상담'}</b>
            </span>
          </div>
        )}

        {category && userId && histLoaded && turns.length > 0 && (
          <div className="ai__histrow">
            <button
              type="button"
              style={{ ...linkBtn, opacity: histBusy || busy ? 0.5 : 1 }}
              disabled={histBusy || busy}
              onClick={clearHistory}
            >
              대화 기록 지우기
            </button>
          </div>
        )}

        <div className="ai__body" ref={bodyRef}>
          {histBusy && turns.length === 0 && (
            <div className="ai__hint">이전 대화를 불러오는 중…</div>
          )}
          {!histBusy && turns.length === 0 && !busy && (
            <div className="ai__hint">
              <b className="ai__hintttl">어떤 게 궁금하신가요?</b>
              <span className="ai__hintsub">{user.biz} · {user.region} 기준으로 답해 드려요. 아래를 눌러 시작해 보세요.</span>
              <div className="ai__chips">
                {CHIPS.map((s) => (
                  <button key={s} type="button" className="ai__chip"
                    onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {turns.map((m, i) => (
            <React.Fragment key={i}>
              <div className={`msg msg-in msg--${m.role === 'assistant' ? 'ai' : 'user'}`}>
                {m.content}
              </div>
              {m.needsConfirmation && (
                <div className="msg-src">
                  <b>확인 필요 · 근거가 충분하지 않은 답변이에요</b>
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="msg-src">
                  <b>근거 문서 {m.sources.length}건 (DB 검색)</b>
                  {m.sources.map((s, si) => (
                    <a key={si} href={s.url || '#'} target="_blank" rel="noreferrer">
                      [{si + 1}] {s.lawName ? `${s.lawName} · ` : ''}{s.title}
                    </a>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
          {busy &&
            (stream ? (
              <div className="msg msg--ai">{stream}</div>
            ) : (
              <div className="typing" aria-label="응답 생성 중"><i /><i /><i /></div>
            ))}
        </div>

        {err && (
          <p className="ai__err">
            {err}
            {needsLogin && onRequireLogin && (
              <button type="button" onClick={onRequireLogin}
                style={{
                  marginLeft: 8, padding: '3px 10px', border: 0, borderRadius: 8,
                  background: 'var(--blue)', color: '#fff', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }}>로그인</button>
            )}
          </p>
        )}

        <form className="ai__foot" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="메시지를 입력하세요"
            aria-label="메시지 입력"
            disabled={busy}
          />
          {busy ? (
            <button type="button" className="ai__send" onClick={() => ctlRef.current && ctlRef.current.abort()}>
              중지
            </button>
          ) : (
            <button type="submit" className="ai__send" disabled={!draft.trim()}>
              전송
            </button>
          )}
        </form>
      </div>
    );

    if (!withSidebar) return panel;

    return (
      <div className="cvx">
        <aside className="cvx__side">
          <button type="button" className="cvx__new" onClick={startNew} disabled={busy || histBusy}>
            + 새 대화 시작
          </button>
          <nav className="cvx__list" aria-label="대화 목록">
            {histBusy ? (
              <p className="cvx__empty">기록을 불러오는 중…</p>
            ) : (
              <React.Fragment>
                <div className="cvx__group">대화 {roomList.length}개</div>
                {roomList
                  .slice()
                  .reverse()
                  .map((room) => (
                    <button
                      key={room.i}
                      type="button"
                      className={'cvx__conv' + (room.i === roomIdx ? ' is-active' : '')}
                      aria-current={room.i === roomIdx ? 'true' : undefined}
                      onClick={() => openRoom(room.i)}
                    >
                      {room.title}
                    </button>
                  ))}
              </React.Fragment>
            )}
          </nav>
        </aside>
        <div className="cvx__main">{panel}</div>
      </div>
    );
  }

  /* ---------- 마이페이지 ---------- */
  /* ===== 마이페이지: 일정 캘린더 (확인 + 추가/삭제) ===== */
  function MpCalendar({ full }) {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
    const [sel, setSel] = useState(todayKey);
    const [ftitle, setFtitle] = useState('');
    const [ftype, setFtype] = useState('tax');
    const [reload, setReload] = useState(0); // 등록·삭제 후 서버 일정을 다시 불러오기 위한 카운터
    const [calErr, setCalErr] = useState('');

    // Backend: GET /api/calendar → 세금·정책 일정 + 내가 등록한 일정(USER).
    // 내 일정을 서버에 저장하므로 공고지원 AI 화면의 달력에서도 같은 일정이 보인다.
    const { data: fetched } = useApi(
      `/calendar?year=${cur.y}&month=${cur.m + 1}&limit=200&r=${reload}`,
      NO_EVENTS,
      eventsByDate
    );

    // 이 달력은 "내가 등록한 일정"만 보여준다 (공고 마감·세금 신고일은 공고지원 AI 화면에서 확인)
    const events = React.useMemo(() => {
      const o = {};
      for (const [k, arr] of Object.entries(fetched || {})) {
        const mine = arr.filter((e) => e.mine);
        if (mine.length) o[k] = mine;
      }
      return o;
    }, [fetched]);

    const startDow = new Date(cur.y, cur.m, 1).getDay();
    const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const monthPrefix = `${cur.y}-${pad2(cur.m + 1)}`;
    const monthCount = Object.keys(events).filter((k) => k.startsWith(monthPrefix) && events[k].length).length;
    const shift = (delta) => {
      const nd = new Date(cur.y, cur.m + delta, 1);
      setCur({ y: nd.getFullYear(), m: nd.getMonth() });
    };
    const selEvents = events[sel] || [];
    const [sy, sm, sd] = sel.split('-').map(Number);
    const selLabel = `${sm}월 ${sd}일 (${WEEKDAYS[new Date(sy, sm - 1, sd).getDay()]})`;

    // 내 일정은 서버에 저장한다 → 공고지원 AI 화면의 달력에서도 그대로 보인다.
    const addEvent = async (e) => {
      e.preventDefault();
      const t = ftitle.trim();
      if (!t) return;
      setCalErr('');
      try {
        await api.calendarCreate({
          title: t,
          dueDate: sel,
          description: ftype === 'tax' ? '세금 일정' : '지원사업 일정',
        });
        setFtitle('');
        setReload((n) => n + 1);
      } catch (err) {
        setCalErr(
          err && err.status === 401
            ? '일정을 저장하려면 로그인이 필요해요.'
            : '일정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
        );
      }
    };

    const delEvent = async (idx) => {
      const target = (events[sel] || [])[idx];
      if (!target || target.id == null) return;
      setCalErr('');
      try {
        await api.calendarDelete(target.id);
        setReload((n) => n + 1);
      } catch (err) {
        setCalErr('일정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    };

    return (
      <div className="cal" role="group" aria-label="일정 캘린더" style={full ? { maxWidth: 520 } : undefined}>
        <div className="cal__head">
          <h3 className="cal__title">일정 관리</h3>
          <div className="cal__nav">
            <button type="button" onClick={() => shift(-1)} aria-label="이전 달">‹</button>
            <span className="cal__month">{cur.y}.{pad2(cur.m + 1)}</span>
            <button type="button" onClick={() => shift(1)} aria-label="다음 달">›</button>
          </div>
        </div>
        <p className="cal__sub">이번 달 일정 {monthCount}건</p>
        <div className="cal__grid">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={'cal__dow' + (i === 0 ? ' cal__dow--sun' : '')}>{w}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="cal__day cal__day--out" />;
            const k = dayKey(cur.y, cur.m, d);
            const types = [...new Set((events[k] || []).map((e) => e.type))];
            const isSel = k === sel;
            return (
              <button key={k} type="button"
                className={'cal__day' + (isSel ? ' cal__day--sel' : '') + (k === todayKey && !isSel ? ' cal__day--today' : '')}
                aria-pressed={isSel} onClick={() => setSel(k)}>
                {d}
                {types.length > 0 && (
                  <span className="cal__dot">
                    {types.map((t) => <i key={t} className={t === 'tax' ? 't-tax' : 't-policy'} />)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="cal__legend">
          <span><i className="t-tax" /> 세금</span>
          <span><i className="t-policy" /> 지원사업</span>
        </div>
        <div className="cal__events">
          <h4>{selLabel} 일정</h4>
          {selEvents.length === 0 ? (
            <p className="cal__empty">등록된 일정이 없어요.</p>
          ) : (
            selEvents.map((e, idx) => (
              <div key={idx} className="cal__ev">
                <i className={e.type === 'tax' ? 't-tax' : 't-policy'} />
                <div style={{ flex: 1 }}>
                  <b>{e.title}</b>
                  <span>{e.note}</span>
                </div>
                <button className="cal__ev-del" type="button" onClick={() => delEvent(idx)} aria-label="일정 삭제">✕</button>
              </div>
            ))
          )}
          <form className="cal__add" onSubmit={addEvent}>
            <input type="text" value={ftitle} onChange={(e) => setFtitle(e.target.value)}
              placeholder={`${selLabel}에 일정 추가`} aria-label="일정 제목" />
            <button type="submit">추가</button>
            <div className="cal__add-row">
              <select value={ftype} onChange={(e) => setFtype(e.target.value)} aria-label="분류" style={{ flex: 'none' }}>
                <option value="tax">세금</option>
                <option value="policy">지원사업</option>
              </select>
            </div>
          </form>
          {calErr && <p className="cal__err">{calErr}</p>}
        </div>
      </div>
    );
  }

  /* ===== 사업자 유형 진단 ===== */
  function BizTypeDiagnosis() {
    const [rev, setRev] = useState('mid');
    const [taxInvoice, setTaxInvoice] = useState('no');
    const [excluded, setExcluded] = useState('no');

    let vat;
    if (excluded === 'yes' || rev === 'high' || taxInvoice === 'yes') vat = '일반과세자';
    else if (rev === 'low') vat = '간이과세자';
    else vat = '간이과세자 (연 매출 1억 400만 원 미만 유지 시)';
    const corp = rev === 'high'
      ? '법인 전환 검토 — 외부 투자 유치, 대표자 급여 비용화, 낮은 세율 구간 활용에 유리'
      : '개인사업자 유지 — 초기 설립·행정 부담이 작고 폐업도 간단';

    const seg = (val, set, opts) => (
      <div className="seg">
        {opts.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={val === v} onClick={() => set(v)}>{l}</button>
        ))}
      </div>
    );

    return (
      <div className="tool">
        <div className="tool__panel">
          <h2>사업자 유형 진단</h2>
          <div className="field-col">
            <label className="fld"><span>예상 연 매출</span>
              {seg(rev, setRev, [['low', '8천만 원 미만'], ['mid', '8천만 ~ 1.5억'], ['high', '1.5억 초과']])}
            </label>
            <label className="fld"><span>세금계산서 발행이 자주 필요한가요? (B2B 거래)</span>
              {seg(taxInvoice, setTaxInvoice, [['no', '아니오'], ['yes', '예']])}
            </label>
            <label className="fld"><span>간이과세 배제 업종인가요? (변호사·병원·도매 등)</span>
              {seg(excluded, setExcluded, [['no', '아니오'], ['yes', '예']])}
            </label>
          </div>
          <div className="result">
            <p className="result__label">추천 과세 유형</p>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue-deep)', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>{vat}</div>
            <p className="result__note"><b>개인 / 법인</b> · {corp}</p>
            <p className="result__note">
              창업 초기에는 개인사업자로 시작하고, 매출·투자 규모가 커지면 법인 전환을 검토하는 흐름이 일반적입니다.
              간이과세자는 세금계산서 발행이 제한되므로 거래처 요구가 많으면 일반과세가 유리합니다.
            </p>
            <p className="result__cite">참고용 안내 · 실제 등록 전 관할 세무서·세무대리인 확인을 권장합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ===== AI 추천 공고 — 공고지원 AI가 조건 맞는 공고를 골라 저장 ===== */
  function MatchedGov({ user, saved, onToggleSave }) {
    const profile = user || { biz: '정보통신업', region: '대전' };
    const ranked = GOV_LISTINGS
      .map((g) => ({ g, ...scoreProgram(g, profile) }))
      .sort((a, b) => b.score - a.score || a.g.dday - b.g.dday);

    return (
      <div className="tool mg">
        <div className="tool__panel" style={{ marginBottom: 12 }}>
          <h2>AI 추천 공고</h2>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)' }}>
            공고지원 AI가 <b>{profile.biz} · {profile.region}</b> 조건으로 적합한 공고를 골랐어요.
            ★ 를 누르면 <b>저장한 정책</b>에 담기고 마감일이 캘린더에 표시됩니다. (저장 {saved.size}건)
          </p>
        </div>
        <ul className="mg__list">
          {ranked.map(({ g, score, why }) => (
            <li className="mg__card" key={g.id}>
              <div className="mg__top">
                <h3>{g.title}</h3>
                <span className="mg__score u-num">{score}%</span>
              </div>
              <p className="mg__meta">
                {g.agency} · {g.amount} · {g.dday >= 100 ? '상시' : `D-${g.dday}`}
              </p>
              <div className="mg__why">
                {why.map((w) => <span key={w} className="mg__chip">{w}</span>)}
              </div>
              <button
                className={'mg__save' + (saved.has(g.id) ? ' is-saved' : '')}
                type="button"
                aria-pressed={saved.has(g.id)}
                onClick={() => onToggleSave(g.id)}
              >
                {saved.has(g.id) ? '★ 저장됨' : '☆ 저장하기'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  /* ===== 저장한 정책 ===== */
  /* ===== 공고 · 정책: [저장한 것 | AI 추천 공고] 탭 ===== */
  function SavedGov({ user, saved, onToggleSave }) {
    const [tab, setTab] = useState('saved');
    return (
      <div>
        <div className="mp-tabs" role="tablist" aria-label="공고 · 정책">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'saved'}
            className={'mp-tab' + (tab === 'saved' ? ' is-active' : '')}
            onClick={() => setTab('saved')}
          >
            저장한 공고 {saved.size}건
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reco'}
            className={'mp-tab' + (tab === 'reco' ? ' is-active' : '')}
            onClick={() => setTab('reco')}
          >
            AI 추천 공고
          </button>
        </div>
        {tab === 'saved' ? (
          <SavedPolicies saved={saved} onToggleSave={onToggleSave} onExplore={() => setTab('reco')} />
        ) : (
          <MatchedGov user={user} saved={saved} onToggleSave={onToggleSave} />
        )}
      </div>
    );
  }

  function SavedPolicies({ saved, onToggleSave, onExplore }) {
    const list = GOV_LISTINGS.filter((g) => saved.has(g.id)).sort((a, b) => a.dday - b.dday);
    return (
      <div className="tool">
        <div className="tool__panel" style={{ marginBottom: 12 }}>
          <h2>저장한 정책 {list.length}건</h2>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)' }}>
            <b>AI 추천 공고</b>에서 ★ 를 누르면 여기에 모이고, 마감일은 캘린더에도 표시됩니다.
          </p>
        </div>
        {list.length === 0 ? (
          <div className="gov__empty">
            저장한 정책이 없어요.{' '}
            <button type="button" onClick={onExplore} style={linkBtn}>AI 추천 공고 보기</button>
          </div>
        ) : (
          <ul className="gov__list">
            {list.map((g) => (
              <li className="gov__card" key={g.id}>
                <h3>{g.title}</h3>
                <span className={'gov__dday' + (g.dday <= 10 ? ' gov__dday--urgent' : '')}>
                  {g.dday >= 100 ? '상시' : `D-${g.dday}`}
                </span>
                <p>{g.agency} · {g.amount}</p>
                <div className="gov__tags">
                  <span className="gov__tag">{g.region}</span>
                  <span className="gov__tag">{g.type}</span>
                  <span className="gov__tag">{g.target}</span>
                </div>
                <button className="star gov__star" type="button" aria-pressed onClick={() => onToggleSave(g.id)}
                  aria-label={`${g.title} 저장 해제`}>★</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* ===== 지출관리 ===== */
  const EXP_CATS = ['사무용품', '식대', '교통', '통신', '광고', '기타'];

  function ExpenseTracker() {
    const [items, setItems] = useState([
      { id: 1, date: '2025-10-04', name: '노트북 주변기기', amount: 89000, cat: '사무용품' },
      { id: 2, date: '2025-10-07', name: '거래처 미팅 식대', amount: 44000, cat: '식대' },
    ]);
    const [f, setF] = useState({ date: '', name: '', amount: '', cat: '사무용품' });
    const add = (e) => {
      e.preventDefault();
      if (!f.name.trim() || !f.amount) return;
      setItems((p) => [...p, {
        id: Date.now(),
        date: f.date || new Date().toISOString().slice(0, 10),
        name: f.name.trim(), amount: Number(f.amount), cat: f.cat,
      }]);
      setF({ date: '', name: '', amount: '', cat: '사무용품' });
    };
    const del = (id) => setItems((p) => p.filter((x) => x.id !== id));
    const total = items.reduce((s, x) => s + x.amount, 0);

    return (
      <div className="tool">
        <div className="tool__panel">
          <h2>지출관리 <span className="mp-tag" style={{ verticalAlign: 'middle' }}>BETA</span></h2>
          <form className="exp-form" onSubmit={add}>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="날짜" />
            <input type="text" placeholder="지출 항목" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="항목" />
            <input type="number" min="0" placeholder="금액" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} aria-label="금액" />
            <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} aria-label="분류">
              {EXP_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button type="submit">추가</button>
          </form>
          <ul className="exp-list">
            {items.map((x) => (
              <li key={x.id}>
                <span className="u-num" style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{x.date.slice(5)}</span>
                <span>{x.name}</span>
                <span className="exp-cat">{x.cat}</span>
                <span className="u-num">{x.amount.toLocaleString()}원</span>
                <button className="cal__ev-del" type="button" onClick={() => del(x.id)} aria-label="삭제">✕</button>
              </li>
            ))}
          </ul>
          <div className="exp-total"><span>합계</span><span className="u-num">{total.toLocaleString()}원</span></div>
          <p className="result__cite" style={{ marginTop: 10 }}>
            영수증 OCR·경비 인정 판정은 준비 중입니다. 지금은 직접 입력한 지출을 분류·합산합니다.
          </p>
        </div>
      </div>
    );
  }

  /* ===== 상담 기록: 서버에 저장된 내 질문·답변 ===== */
  function ChatLog({ user }) {
    const [rows, setRows] = useState([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const userId = user && user.id;

    useEffect(() => {
      if (!userId) return;
      let alive = true;
      setBusy(true);
      setErr('');
      api
        .chatHistory('tax')
        .then((r) => {
          if (alive) setRows((r && r.messages) || []);
        })
        .catch(() => {
          if (alive) setErr('상담 기록을 불러오지 못했어요.');
        })
        .finally(() => {
          if (alive) setBusy(false);
        });
      return () => {
        alive = false;
      };
    }, [userId]);

    return (
      <div className="tool">
        <div className="tool__panel">
          <h2>상담 기록</h2>
          {!userId ? (
            <p className="cvx__empty">로그인하면 저장된 상담 기록을 볼 수 있어요.</p>
          ) : busy ? (
            <p className="cvx__empty">기록을 불러오는 중…</p>
          ) : err ? (
            <p className="ai__err">{err}</p>
          ) : rows.length === 0 ? (
            <p className="cvx__empty">아직 저장된 상담 기록이 없어요.</p>
          ) : (
            <ul className="clog">
              {rows
                .slice()
                .reverse()
                .map((row) => (
                  <li key={row.id} className="clog__item">
                    <p className="clog__q">{row.question}</p>
                    <p className="clog__a">{row.answer}</p>
                    {row.created_at && (
                      <span className="clog__at">{String(row.created_at).slice(0, 10)}</span>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* ===== 사업자 정보 / 설정 (only='profile' | 'notif') ===== */
  // REGIONS 는 users.region 의 CHECK 제약(DB/app_extras.sql)이 허용하는 17개 시·도와 같다.
  function ProfileSettings({ user, only, onSaved }) {
    // 저장된 값이 목록에 없으면(예전 '대전광역시' 형식 등) 첫 항목으로 맞춰 준다
    const pick = (list, v) => (list.indexOf(v) >= 0 ? v : list[0]);
    const [form, setForm] = useState({
      name: user.name,
      email: user.email || '',
      biz: pick(INDUSTRIES, user.biz),
      region: pick(REGIONS, user.region),
      age: user.age ? String(user.age) : '',
    });
    const [notif, setNotif] = useState({ tax: true, deadline: true, news: false });
    const [savedMsg, setSavedMsg] = useState('');
    const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const save = async (e) => {
      e.preventDefault();
      // age 는 '청년(만 15~34세)' 같은 분류 문자열이라 int 필드인 PUT /users/me 로 보내지 않는다.
      const patch = { name: form.name };
      if (form.region) patch.region = form.region;
      try {
        await api.updateMe(patch);
        if (onSaved) onSaved(patch);
        setSavedMsg('저장되었습니다.');
      } catch {
        setSavedMsg('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setTimeout(() => setSavedMsg(''), 2500);
    };
    const showProfile = only !== 'notif';
    const showNotif = only !== 'profile';
    return (
      <div className="tool">
        {showProfile && (
        <form className="tool__panel" onSubmit={save} style={{ marginBottom: 12 }}>
          <h2>사업자 정보</h2>
          <div className="field-col">
            <label className="fld"><span>이름</span><input style={inputStyle} value={form.name} onChange={upd('name')} /></label>
            <label className="fld"><span>이메일</span><input style={inputStyle} type="email" value={form.email} onChange={upd('email')} /></label>
            <label className="fld"><span>업종</span>
              <select style={inputStyle} value={form.biz} onChange={upd('biz')}>
                {INDUSTRIES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label className="fld"><span>사업장 지역</span>
              <select style={inputStyle} value={form.region} onChange={upd('region')}>
                {REGIONS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label className="fld"><span>대표자 연령 (만 나이)</span>
              <input style={inputStyle} type="number" inputMode="numeric" min="15" max="120"
                value={form.age} onChange={upd('age')} placeholder="예: 32" />
            </label>
          </div>
          <button type="submit" style={{
            marginTop: 14, padding: '10px 20px', border: 0, borderRadius: 11,
            background: 'linear-gradient(135deg, var(--blue), var(--blue-deep))', color: '#fff',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
          }}>저장</button>
          {savedMsg && <p className="pf-saved">{savedMsg}</p>}
        </form>
        )}
        {showNotif && (
        <div className="tool__panel">
          <h2>알림 설정</h2>
          {[['tax', '세금 신고 마감 알림'], ['deadline', '관심 공고 마감 3일 전 알림'], ['news', '창업 뉴스레터']].map(([k, label]) => (
            <div className="pf-toggle" key={k}>
              <span>{label}</span>
              <button type="button" className="pf-switch" aria-pressed={notif[k]} aria-label={label}
                onClick={() => setNotif((p) => ({ ...p, [k]: !p[k] }))} />
            </div>
          ))}
        </div>
        )}
      </div>
    );
  }

  function MyPage({ user, onHome, onLogout, onNavigate, onLoginClick, roadmapDone = {}, onOpenRoadmap, onOpenTax, onOpenGov, onProfileSaved }) {
    const [siteMenuOpen, setSiteMenuOpen] = useState(false);
    const [menu, setMenu] = useState('home');
    const [saved, setSaved] = useState(() => new Set());
    const toggleSave = (id) =>
      setSaved((p) => {
        const n = new Set(p);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    const activeLabel = (MP_MENU.find((m) => m.key === menu) || {}).label || '';

    // 창업 로드맵 진행률 (로드맵 페이지와 공유되는 roadmapDone 기반)
    const rmStepDone = (k) => {
      const t = ROADMAP_TASKS[k] || [];
      return t.length > 0 && t.every((_, i) => roadmapDone[`${k}:${i}`]);
    };
    const rmTotal = ROADMAP.reduce((n, s) => n + (ROADMAP_TASKS[s.k] || []).length, 0);
    const rmDoneCount = Object.values(roadmapDone).filter(Boolean).length;
    const rmPct = rmTotal ? Math.round((rmDoneCount / rmTotal) * 100) : 0;
    const rmStepsDone = ROADMAP.filter((s) => rmStepDone(s.k)).length;
    const rmCurrent = ROADMAP.find((s) => !rmStepDone(s.k)) || ROADMAP[ROADMAP.length - 1];

    return (
      <div className="mp">
        <aside className="mp-side">
          <button className="mp-brand" type="button" onClick={onHome}>
            <span className="brand__mark" aria-hidden="true">ON</span>
            창업ON
          </button>
          <nav className="mp-nav" aria-label="마이페이지 메뉴">
            {MP_MENU.map((m, i) => {
              if (m.group) return <div className="mp-group" key={`g-${i}`}>{m.group}</div>;
              if (m.divider) return <div className="mp-side__div" key={`d-${i}`} />;
              return (
                <button
                  key={m.key}
                  type="button"
                  className={
                    'mp-link' +
                    (m.sub ? ' mp-link--sub' : '') +
                    (menu === m.key ? ' mp-link--active' : '')
                  }
                  aria-current={menu === m.key ? 'page' : undefined}
                  onClick={() => setMenu(m.key)}
                >
                  <span>{m.label}</span>
                  {m.tag && <span className="mp-tag">{m.tag}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="mp-main">
          <div className="mp-head">
            <div>
              <h1 className="mp-hello">안녕하세요, {user.name}님</h1>
              <p className="mp-basis">사업자 정보 기준 · {user.biz} · {user.region}</p>
            </div>
            <div className="mp-head__actions">
              <button className="mp-logout" type="button" onClick={onLogout}>로그아웃</button>
              <button
                className="hamburger"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={siteMenuOpen}
                aria-label="메뉴 열기"
                onClick={() => setSiteMenuOpen(true)}
              >
                <span /><span /><span />
              </button>
            </div>
          </div>
          <MenuDrawer
            open={siteMenuOpen}
            onClose={() => setSiteMenuOpen(false)}
            onNavigate={onNavigate}
            user={user}
            onAuth={onLoginClick}
          />

          {menu === 'home' ? (
            <div className="mp-dash">
              <div className="mp-grid">
              <section
                className="mp-card mp-card--action mp-card--wide"
                role="button"
                tabIndex={0}
                onClick={onOpenRoadmap}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenRoadmap && onOpenRoadmap();
                  }
                }}
              >
                <div className="mp-card__head">
                  <h2 className="mp-card__title">창업 로드맵 진행률</h2>
                  <span className="mp-card__tag">{rmStepsDone} / {ROADMAP.length}단계</span>
                </div>
                <p className="mp-pct u-num">{rmPct}%</p>
                <div className="mp-bar"><i style={{ width: rmPct + '%' }} /></div>
                <p className="mp-cite">
                  <span>{rmPct === 100 ? '완료' : '현재 단계'}</span>
                  <span>{rmCurrent.k}. <b>{rmCurrent.t}</b></span>
                </p>
              </section>

              <section
                className="mp-card mp-card--action"
                role="button"
                tabIndex={0}
                onClick={onOpenTax}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenTax && onOpenTax();
                  }
                }}
              >
                <div className="mp-card__head">
                  <h2 className="mp-card__title">세무 AI Assistant</h2>
                  <span className="mp-card__link">세무 AI ›</span>
                </div>
                <p className="mp-recap">최근 상담 요약</p>
                <ul className="mp-rows mp-rows--recap">
                  {MP_TAX_SUMMARY.map((t) => (
                    <li key={t}><span className="mp-consult">{t}</span></li>
                  ))}
                </ul>
              </section>

              <section
                className="mp-card mp-card--action"
                role="button"
                tabIndex={0}
                onClick={onOpenGov}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenGov && onOpenGov();
                  }
                }}
              >
                <div className="mp-card__head">
                  <h2 className="mp-card__title">공고지원 AI</h2>
                  <span className="mp-card__link">공고지원 AI ›</span>
                </div>
                <p className="mp-recap">최근 상담 요약 · 저장 {saved.size}건</p>
                <ul className="mp-rows mp-rows--recap">
                  {MP_GOV_SUMMARY.map((t) => (
                    <li key={t}><span className="mp-consult">{t}</span></li>
                  ))}
                </ul>
              </section>

              </div>
              <MpCalendar />
            </div>
          ) : menu === 'profile' ? (
            <ProfileSettings user={user} only="profile" />
          ) : menu === 'diagnosis' ? (
            /* 사업자유형 진단 + 세액감면 판정을 한 화면에 */
            <React.Fragment>
              <BizTypeDiagnosis />
              <TaxTool />
            </React.Fragment>
          ) : menu === 'saved' ? (
            <SavedGov user={user} saved={saved} onToggleSave={toggleSave} />
          ) : menu === 'chatlog' ? (
            <ChatLog user={user} />
          ) : menu === 'settings' ? (
            <ProfileSettings user={user} only="notif" onSaved={onProfileSaved} />
          ) : (
            <div className="mp-stub">
              <b>{activeLabel}</b> 화면은 준비 중입니다.
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ---------- 상단 내비 ---------- */
  function Nav({ user, onLoginClick, onNavigate }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const close = useCallback(() => setMenuOpen(false), []);

    return (
      <React.Fragment>
        <header className="nav">
          <div className="wrap nav__row">
            <button className="brand" type="button" onClick={() => onNavigate('home')}>
              <span className="brand__mark" aria-hidden="true">ON</span>
              창업ON
            </button>
            <span className="nav__spacer" />
            {user && <span className="nav__user"><b>{user.name}</b>님</span>}
            <button className="hamburger" type="button"
              aria-haspopup="dialog" aria-expanded={menuOpen}
              aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}>
              <span /><span /><span />
            </button>
          </div>
        </header>
        <MenuDrawer open={menuOpen} onClose={close} onNavigate={onNavigate}
          user={user} onAuth={onLoginClick} />
      </React.Fragment>
    );
  }

  /* ---------- 서브 페이지 ---------- */
  /* ===== 정부지원사업 탐색 ===== */
  const GOV_LISTINGS = [
    { id: 'g1', title: '예비창업패키지', agency: '창업진흥원', region: '전국', type: '자금', target: '예비', amount: '최대 1억 원', dday: 12 },
    { id: 'g2', title: '청년창업사관학교 15기', agency: '중소벤처기업진흥공단', region: '전국', type: '자금', target: '예비·초기', amount: '최대 1억 원', dday: 8 },
    { id: 'g3', title: '대전 청년창업 지원사업', agency: '대전창조경제혁신센터', region: '대전', type: '자금', target: '예비·초기', amount: '최대 3,000만 원', dday: 19 },
    { id: 'g4', title: '초기창업패키지', agency: '창업진흥원', region: '전국', type: '자금', target: '초기', amount: '최대 1억 원', dday: 26 },
    { id: 'g5', title: '1인 창조기업 마케팅 지원', agency: '소상공인시장진흥공단', region: '전국', type: '판로', target: '초기', amount: '최대 500만 원', dday: 37 },
    { id: 'g6', title: '대전 창업보육센터 입주기업 모집', agency: '대전테크노파크', region: '대전', type: '공간', target: '예비·초기', amount: '사무공간 · 보육', dday: 44 },
    { id: 'g7', title: '창업성장기술개발(디딤돌)', agency: '중소벤처기업부', region: '전국', type: 'R&D', target: '초기', amount: '최대 1.2억 원', dday: 53 },
    { id: 'g8', title: '재도전 성공패키지', agency: '창업진흥원', region: '전국', type: '자금', target: '재도전', amount: '최대 6,000만 원', dday: 15 },
    { id: 'g9', title: '대전 IT 스타트업 전문가 멘토링', agency: '정보통신산업진흥원', region: '대전', type: '멘토링', target: '초기', amount: '전문가 매칭', dday: 9 },
    { id: 'g10', title: '소상공인 첫걸음 컨설팅', agency: '소상공인시장진흥공단', region: '전국', type: '멘토링', target: '예비·초기', amount: '상시 접수', dday: 120 },
  ];
  const GOV_REGIONS = ['전체', '전국', '대전', '서울', '경기'];
  const GOV_TYPES = ['자금', '공간', '멘토링', '판로', 'R&D'];

  function GovExplorer({ saved: savedProp, onToggleSave } = {}) {
    const [region, setRegion] = useState('전체');
    const [types, setTypes] = useState([]);
    const [q, setQ] = useState('');
    const [savedLocal, setSavedLocal] = useState(() => new Set());
    const saved = savedProp || savedLocal;

    const toggleType = (t) =>
      setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
    const toggleSave =
      onToggleSave ||
      ((id) =>
        setSavedLocal((p) => {
          const n = new Set(p);
          n.has(id) ? n.delete(id) : n.add(id);
          return n;
        }));

    // Backend: GET /api/announcements → 마감 남은 실제 공고 (DB)
    const { data: remote, source: listSrc } = useApi('/announcements?limit=60', null, (raw) =>
      (raw.announcements || []).map((x) => ({
        id: String(x.id),
        title: x.title,
        agency: x.industry || '기타',
        region: x.region || '전국',
        type: x.industry || '기타',
        target: x.target || '',
        amount: x.benefit || '',
        dday: x.dday === null || x.dday === undefined ? 999 : x.dday,
        url: x.sourceUrl,
      }))
    );
    const base = remote && remote.length ? remote : GOV_LISTINGS;
    const live = !!(remote && remote.length);

    const kw = q.trim().toLowerCase();
    const list = base
      .filter((g) => {
        const regionOk =
          region === '전체' ||
          (g.region || '').includes(region) ||
          (g.region || '') === '전국';
        const typeOk = types.length === 0 || types.some((t) => (g.type || '').includes(t));
        const textOk =
          !kw || `${g.title}${g.agency}${g.target}`.toLowerCase().includes(kw);
        return regionOk && typeOk && textOk;
      })
      .sort((a, b) => a.dday - b.dday);

    return (
      <div className="tool">
        <div className="tool__panel">
          <div className="gov__bar">
            <input
              className="gov__search"
              type="text"
              placeholder="공고명 · 기관 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="공고 검색"
            />
            <label className="fld" style={{ minWidth: 120 }}>
              <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="지역">
                {GOV_REGIONS.map((r) => (
                  <option key={r} value={r}>{r === '전체' ? '지역 전체' : r}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="seg" role="group" aria-label="지원 유형">
            {GOV_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={types.includes(t)}
                onClick={() => toggleType(t)}
              >
                {t}
              </button>
            ))}
            {(types.length > 0 || region !== '전체' || q) && (
              <button type="button" onClick={() => { setTypes([]); setRegion('전체'); setQ(''); }}>
                초기화
              </button>
            )}
          </div>
        </div>

        <p className="gov__count">
          {list.length}건 · 저장 {saved.size}건
          {live ? ' · ● DB 실시간' : ' · ○ 데모 데이터'}
        </p>

        {list.length === 0 ? (
          <div className="gov__empty">조건에 맞는 공고가 없어요. 필터를 줄여보세요.</div>
        ) : (
          <ul className="gov__list">
            {list.map((g) => (
              <li className="gov__card" key={g.id}>
                <h3>{g.title}</h3>
                <span className={'gov__dday' + (g.dday <= 10 ? ' gov__dday--urgent' : '')}>
                  {g.dday >= 100 ? '상시' : `D-${g.dday}`}
                </span>
                <p>{g.agency} · {g.amount}</p>
                <div className="gov__tags">
                  <span className="gov__tag">{g.region}</span>
                  <span className="gov__tag">{g.type}</span>
                  <span className="gov__tag">{g.target}</span>
                </div>
                <button
                  className="star gov__star"
                  type="button"
                  aria-pressed={saved.has(g.id)}
                  aria-label={`${g.title} 관심 공고 저장`}
                  onClick={() => toggleSave(g.id)}
                >
                  {saved.has(g.id) ? '★' : '☆'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* ===== 세금상담: 세액감면 판정 ===== */
  const TAX_SCHEDULE = [
    { when: '매월 10일', what: '원천세 신고·납부 (전월 급여 지급분)' },
    { when: '1월 25일', what: '부가가치세 2기 확정신고' },
    { when: '4월 25일', what: '부가가치세 1기 예정신고' },
    { when: '5월 31일', what: '종합소득세 확정신고' },
    { when: '7월 25일', what: '부가가치세 1기 확정신고' },
    { when: '10월 25일', what: '부가가치세 2기 예정신고' },
    { when: '11월 30일', what: '종합소득세 중간예납' },
  ];

  function TaxTool() {
    const [area, setArea] = useState('outside'); // outside | metro | declining
    const [youth, setYouth] = useState('yes'); // yes | no
    const [eligible, setEligible] = useState('yes'); // yes | no
    const [srv, setSrv] = useState(null); // Backend Rule Engine 판정 결과

    // Backend: POST /api/tax/tax-reduction/check → 서버 Rule Engine + 근거 조문(DB)
    useEffect(() => {
      let alive = true;
      const ctl = new AbortController();
      api
        .taxCheck(
          {
            region: area === 'metro' ? '서울' : '대전',
            age: youth === 'yes' ? 32 : 45,
            industry: eligible === 'yes' ? '정보통신업' : '부동산업',
          },
          { signal: ctl.signal }
        )
        .then((r) => alive && setSrv(r))
        .catch(() => alive && setSrv(null));
      return () => {
        alive = false;
        ctl.abort();
      };
    }, [area, youth, eligible]);

    let rate = 0;
    let note = '';
    if (eligible === 'no') {
      rate = 0;
      note = '일반음식점·부동산업 등 일부 업종은 창업중소기업 세액감면 대상에서 제외돼요. 업종코드로 대상 여부를 먼저 확인하세요.';
    } else if (area === 'declining') {
      rate = 100;
      note = '인구감소지역에서 창업한 중소기업은 최초 소득 발생 과세연도부터 5년간 100% 감면됩니다.';
    } else if (youth === 'yes' && area === 'outside') {
      rate = 100;
      note = '만 15~34세 청년이 수도권 과밀억제권역 밖에서 창업하면 5년간 소득세·법인세 100% 감면됩니다.';
    } else if (youth === 'yes' && area === 'metro') {
      rate = 50;
      note = '청년 창업이라도 수도권 과밀억제권역 안이면 5년간 50% 감면됩니다.';
    } else if (youth === 'no' && area === 'outside') {
      rate = 50;
      note = '청년 외 창업자가 수도권 과밀억제권역 밖에서 창업하면 5년간 50% 감면됩니다.';
    } else {
      rate = 0;
      note = '청년 외 창업자가 수도권 과밀억제권역 안에서 창업하면 일반적으로 창업 세액감면 대상이 아니에요. (연 수입금액 8,000만 원 이하 등 별도 요건은 추가 확인이 필요합니다.)';
    }

    return (
      <div className="tool">
        <div className="tool__panel">
          <h2>세액감면 판정</h2>
          <div className="field-col">
            <label className="fld">
              <span>창업 지역</span>
              <div className="seg">
                {[
                  ['outside', '수도권 과밀억제권역 밖'],
                  ['metro', '수도권 과밀억제권역 안'],
                  ['declining', '인구감소지역'],
                ].map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={area === v} onClick={() => setArea(v)}>{l}</button>
                ))}
              </div>
            </label>
            <label className="fld">
              <span>대표자 연령</span>
              <div className="seg">
                <button type="button" aria-pressed={youth === 'yes'} onClick={() => setYouth('yes')}>청년 (만 15~34세)</button>
                <button type="button" aria-pressed={youth === 'no'} onClick={() => setYouth('no')}>그 외</button>
              </div>
            </label>
            <label className="fld">
              <span>감면 대상 업종</span>
              <div className="seg">
                <button type="button" aria-pressed={eligible === 'yes'} onClick={() => setEligible('yes')}>해당 (제조·정보통신 등)</button>
                <button type="button" aria-pressed={eligible === 'no'} onClick={() => setEligible('no')}>제외 업종</button>
              </div>
            </label>
          </div>

          <div className="result">
            <p className="result__label">예상 세액감면율</p>
            <div className="result__rate u-num">
              {rate}%{rate > 0 && <small>· 5년간</small>}
            </div>
            <p className="result__note">
              {note}
              {rate > 0 && ' 감면 기간은 최초 소득이 발생한 과세연도와 그 다음 4개 과세연도입니다.'}
            </p>
            <p className="result__cite">
              근거 · 조세특례제한법 제6조(창업중소기업 등에 대한 세액감면) · 실제 적용은 세무대리인 확인이 필요합니다.
            </p>

            {/* Backend TaxReductionResponse: legalBasis는 문자열, reasons는 문자열 배열.
                서버 판정은 로그인 사용자의 온보딩 프로필(나이·창업일·업종) 기준이라
                위 라디오 선택과 다를 수 있다. */}
            {srv && srv.legalBasis && (
              <div className="msg-src" style={{ maxWidth: 'none', marginTop: 12 }}>
                <b>
                  서버 판정 · {srv.eligible ? '감면 대상' : '감면 대상 아님'}
                  {srv.llmUsed ? ' (AI 근거 설명)' : ''}
                </b>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.6 }}>{srv.legalBasis}</p>
                {Array.isArray(srv.reasons) && srv.reasons.length > 0 && (
                  <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 12, lineHeight: 1.6 }}>
                    {srv.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
                <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  내 프로필 기준 판정입니다. 위 선택값과 다를 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="tool__panel">
          <h2>주요 신고 일정</h2>
          <ul className="cal-list">
            {TAX_SCHEDULE.map((s) => (
              <li key={s.when}>
                <span>{s.what}</span>
                <b className="u-num">{s.when}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /* ===== 창업 로드맵 가이드 (AI 도움말 포함) ===== */
  /* 단계별로 연결되는 지원사업 (GOV_LISTINGS id) */
  const ROADMAP_PROGRAMS = {
    A: ['g10', 'g9'],
    B: ['g10'],
    C: ['g1', 'g2', 'g3'],
    D: ['g4', 'g8', 'g3'],
    E: ['g10'],
    F: ['g5'],
    Z: ['g7', 'g6'],
  };
  const progById = (id) => GOV_LISTINGS.find((g) => g.id === id);
  const ddayLabel = (g) => (g.dday >= 100 ? '상시' : `D-${g.dday}`);

  /* 프로필 기준 매칭 점수 + 이유 */
  /* 추천 공고 상세 (모달에서 보여 주는 데모 내용) */
  const GOV_DETAILS = {
    g1: { summary: '사업자등록 이력이 없는 예비창업자에게 사업화 자금과 창업교육·멘토링을 함께 지원하는 대표적인 초기 창업 프로그램입니다.',
      eligibility: '공고일 기준 사업자등록(개인·법인) 이력이 없는 만 39세 이하 예비창업자',
      support: ['사업화 자금 최대 1억 원 (평균 5천만 원 내외, 총사업비의 70% 이내)', '창업교육 및 전담 멘토링', '시제품 제작·마케팅 비용 집행 가능'],
      documents: ['사업신청서', '사업계획서(PSST 양식)', '대표자 신분증 사본', '개인정보 수집·이용 동의서'],
      howto: 'K-Startup 누리집 온라인 접수', notes: ['국세·지방세 체납 시 선정 취소', '타 정부 창업사업화 지원사업과 중복 수혜 불가'] },
    g2: { summary: '청년 창업자를 대상으로 사업화 자금과 함께 입주 공간, 코칭을 1년간 패키지로 제공하는 프로그램입니다.',
      eligibility: '만 39세 이하, 창업 3년 이내 기업의 대표자 (예비창업자 포함)',
      support: ['사업화 자금 최대 1억 원 (총사업비의 70% 이내)', '사관학교 입주 공간 및 제작 인프라', '전담 코치 밀착 코칭·판로 지원'],
      documents: ['사업신청서', '사업계획서', '사업자등록증(해당 시)', '대표자 신분증 사본'],
      howto: '중소벤처기업진흥공단 청년창업사관학교 누리집 접수', notes: ['총사업비의 30%는 자부담(현금·현물)', '입주 의무가 있어 사업장 이전이 필요할 수 있음'] },
    g3: { summary: '대전에 사업장을 두고 있거나 둘 예정인 청년 창업자를 지원하는 지역 특화 사업입니다.',
      eligibility: '대전 소재(예정 포함) 만 19~39세, 창업 3년 이내 청년기업',
      support: ['기업당 최대 3,000만 원 (자부담 20%)', '시제품 제작·마케팅·지식재산권 출원비', '임차료 월 최대 50만 원'],
      documents: ['참여신청서', '사업계획서', '사업자등록증(해당 시)', '주민등록초본', '청년 확인 서류'],
      howto: '대전창조경제혁신센터 이메일 접수', notes: ['대전 외 지역 사업자는 선정 후 3개월 이내 대전 이전 조건', '유흥·사행성 업종 및 부동산업 제외'] },
    g4: { summary: '이미 사업자등록을 마친 초기 창업기업의 사업 고도화와 시장 진입을 돕는 프로그램입니다.',
      eligibility: '창업 3년 이내 기업 (업력 산정은 사업자등록일 기준)',
      support: ['사업화 자금 최대 1억 원', '주관기관 프로그램(투자유치·판로개척) 참여', '분야별 전문가 멘토링'],
      documents: ['사업신청서', '사업계획서(PSST 양식)', '사업자등록증', '최근 결산 재무제표'],
      howto: 'K-Startup 누리집 온라인 접수', notes: ['총사업비의 30% 자부담 필요', '예비창업패키지와 중복 지원 불가'] },
    g5: { summary: '1인 창조기업이 온라인 판로를 넓힐 수 있도록 마케팅 비용을 지원합니다.',
      eligibility: '1인 창조기업 확인서를 보유했거나 발급 가능한 사업자',
      support: ['마케팅 비용 최대 500만 원', '온라인 광고·상세페이지 제작·콘텐츠 촬영', '입점 수수료 일부 지원'],
      documents: ['지원신청서', '1인 창조기업 확인서', '사업자등록증', '마케팅 추진 계획서'],
      howto: '소상공인시장진흥공단 온라인 신청', notes: ['집행 후 증빙 제출 방식(선집행·후정산)', '대표자 본인 명의 카드로 집행 권장'] },
    g6: { summary: '대전 지역 창업보육센터의 사무공간과 보육 프로그램을 함께 제공하는 입주기업 모집입니다.',
      eligibility: '대전 소재 예비창업자 또는 창업 7년 이내 기업',
      support: ['개별 사무공간 (시세보다 낮은 임차료)', '회의실·시제품 제작실 등 공용시설', '입주기업 대상 경영·기술 자문'],
      documents: ['입주신청서', '사업계획서', '사업자등록증(해당 시)', '재무 관련 증빙'],
      howto: '대전테크노파크 누리집 접수 후 심사·면접', notes: ['입주 기간은 기본 1년, 심사 후 연장 가능', '관리비·보증금은 별도 부담'] },
    g7: { summary: '창업기업의 기술 개발을 지원하는 R&D 과제로, 시제품 단계 기술을 제품화하는 데 쓰입니다.',
      eligibility: '창업 7년 이내이면서 직전 연도 매출 20억 원 미만인 중소기업',
      support: ['개발비 최대 1.2억 원 (개발기간 최대 12개월)', '인건비·재료비·외주용역비 집행 가능', '기술 전문가 자문'],
      documents: ['사업계획서(연구개발계획서)', '사업자등록증', '연구개발인력 현황', '기술 관련 증빙(특허 등)'],
      howto: '중소기업 기술개발사업 종합관리시스템 접수', notes: ['정부출연금 외 민간부담금 필요', '과제 종료 후 기술료 납부 의무 발생 가능'] },
    g8: { summary: '사업 실패 경험이 있는 창업자의 재창업을 돕는 프로그램으로, 자금과 재기 교육을 함께 제공합니다.',
      eligibility: '폐업 경험이 있는 예비 재창업자 또는 재창업 3년 이내 기업',
      support: ['사업화 자금 최대 6,000만 원', '재기 교육 및 심리 상담', '채무조정·신용회복 연계 상담'],
      documents: ['사업신청서', '사업계획서', '폐업 사실 증명원', '신용 관련 확인 서류'],
      howto: 'K-Startup 누리집 온라인 접수', notes: ['고의 부도·사기 등 부정 폐업은 제외', '기존 채무 상환 용도로는 사용 불가'] },
    g9: { summary: '대전 지역 IT 창업기업에 분야별 전문가를 매칭해 기술·사업 자문을 제공합니다.',
      eligibility: '대전 소재 정보통신 분야 창업 7년 이내 기업',
      support: ['전문가 1:1 매칭 멘토링 (회차별 진행)', '기술 검증·개발 방향 자문', '후속 지원사업 연계 안내'],
      documents: ['참여신청서', '사업자등록증', '기업 소개 자료'],
      howto: '정보통신산업진흥원 지역 사업 담당 부서 접수', notes: ['자금 지원이 아닌 자문 중심 프로그램', '멘토링 일정은 기업·전문가 협의로 조정'] },
    g10: { summary: '창업을 준비 중이거나 막 시작한 소상공인에게 기본 경영·세무 컨설팅을 제공합니다.',
      eligibility: '예비창업자 또는 창업 초기 소상공인',
      support: ['기본 경영 진단 및 컨설팅', '세무·노무 기초 상담', '정책자금·지원사업 안내'],
      documents: ['신청서', '사업자등록증(해당 시)'],
      howto: '소상공인마당 누리집 상시 신청', notes: ['상시 접수라 마감일은 없으나 예산 소진 시 조기 종료', '업종별 배정 컨설턴트에 따라 일정이 달라짐'] },
  };

  function scoreProgram(g, u) {
    let s = 40;
    const why = [];
    if (u && u.region && g.region !== '전국' && u.region.includes(g.region)) {
      s += 30;
      why.push(`${g.region} 지역 사업`);
    } else if (g.region === '전국') {
      s += 18;
      why.push('전국 대상');
    }
    if (/예비|초기/.test(g.target)) {
      s += 18;
      why.push(`${g.target} 창업자 대상`);
    }
    if (g.dday >= 100) {
      s += 6;
      why.push('상시 접수');
    } else if (g.dday <= 30) {
      s += 12;
      why.push(`마감 D-${g.dday}`);
    }
    if (g.type === '자금') {
      s += 8;
      why.push('사업화 자금');
    }
    return { score: Math.min(99, s), why };
  }

  const RG_CHAT_RULES =
    '너는 "창업ON"의 창업 로드맵 코치야. 사용자는 대전광역시에서 정보통신업으로 창업을 준비/운영 중인 초기 창업자야. ' +
    '창업 로드맵 7단계(A 아이디어 검증 → B 사업자 등록 → C 지원사업 신청 → D 자금 조달 → E 세액감면 신청 → F 첫 매출·신고 → Z 스케일업) ' +
    '기준으로, 지금 무엇을 어떤 순서로 해야 하는지 실용적으로 안내해. ' +
    '한국어로 간결하게(필요하면 불릿), 담당 기관·서류명이 있으면 괄호로 덧붙여. 이 화면은 데모야.';
  const RG_CHAT_CHIPS = [
    '아이디어만 있는 단계인데 뭐부터 해야 하나요?',
    '사업자 등록은 어떤 순서로 하나요?',
    '초기 창업자가 받을 수 있는 자금 지원은?',
    'PSST 사업계획서가 뭔가요?',
  ];

  function RoadmapGuide({ user, done = {}, setDone, onRequireLogin }) {
    const [active, setActive] = useState('A');
    const [openTask, setOpenTask] = useState(null); // 설명을 펼친 체크리스트 항목
    // 추천 질문은 서버에서 받아오고, 없으면 화면 기본값을 쓴다
    const { data: roadmapSuggestions } = useApi(
      '/chat/categories/roadmap/suggested-questions',
      RG_CHAT_CHIPS,
      (response) => (response && response.questions && response.questions.length ? response.questions : RG_CHAT_CHIPS),
    );

    const step = ROADMAP.find((s) => s.k === active);
    const tasks = ROADMAP_TASKS[active] || [];
    const goal = ROADMAP_GOALS[active];
    const totalTasks = ROADMAP.reduce((n, s) => n + (ROADMAP_TASKS[s.k] || []).length, 0);
    const totalDone = Object.values(done).filter(Boolean).length;
    const overallPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

    const toggle = (i) =>
      setDone((d) => ({ ...d, [`${active}:${i}`]: !d[`${active}:${i}`] }));
    const stepDone = (k) => {
      const t = ROADMAP_TASKS[k] || [];
      return t.length > 0 && t.every((_, i) => done[`${k}:${i}`]);
    };

    return (
      <div className="rg2">
        <div className="rz rz--nav is-in">
          <div className="rz__row" role="tablist" aria-label="창업 단계">
            {ROADMAP.map((s, i) => (
              <React.Fragment key={s.k}>
                {i > 0 && <div className="rz__sep" aria-hidden="true">›</div>}
                <button
                  type="button"
                  role="tab"
                  aria-selected={s.k === active}
                  className={
                    'rz__step' +
                    (s.k === active ? ' is-active' : '') +
                    (stepDone(s.k) ? ' is-done' : '')
                  }
                  onClick={() => { setActive(s.k); setOpenTask(null); }}
                >
                  <span className="rz__ico">{stepDone(s.k) ? rmDoneIcon() : rmIcon(s.k)}</span>
                  <span className="rz__phase">{s.phase}</span>
                  <span className="rz__t">{s.t}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <p className="rg2__prog">
          전체 진행률 <b className="u-num">{overallPct}%</b> · {totalDone} / {totalTasks} 작업 완료
        </p>

        <div className="rg2__cols">
          <section className="rg2__list">
            {goal && (
              <div className="rg2__goal">
                <span className="rg2__goallabel">이 단계 목표</span>
                <b className="rg2__goaltext">{goal.goal}</b>
                <span className="rg2__goalspan">{goal.span}</span>
              </div>
            )}
            <ul className="rg2__tasks">
              {tasks.map((t, i) => {
                const d = !!done[`${active}:${i}`];
                const open = openTask === i;
                return (
                  <li key={i} className={'rg2__task' + (d ? ' is-done' : '')}>
                    <div className="rg2__taskrow">
                      {/* 체크는 네모를 눌렀을 때만, 제목을 누르면 설명이 열린다 */}
                      <input
                        type="checkbox"
                        checked={d}
                        onChange={() => toggle(i)}
                        aria-label={`${t.t} 완료 표시`}
                      />
                      <button
                        type="button"
                        className="rg2__taskbtn"
                        aria-expanded={open}
                        onClick={() => setOpenTask(open ? null : i)}
                      >
                        <span>{t.t}</span>
                        <i className="rg2__taskcaret" aria-hidden="true">{open ? '−' : '+'}</i>
                      </button>
                    </div>
                    {open && (
                      <div className="rg2__taskinfo">
                        <p className="rg2__tasklabel">왜 필요한가요?</p>
                        <p className="rg2__taskwhy">{t.why}</p>
                        {t.mk && (
                          <p className="rg2__taskmeta">
                            <span>{t.mk}</span>
                            <b>{t.mv}</b>
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="rg2__chat">
            <AiConsult
              user={user || { biz: DEFAULT_BIZ, region: DEFAULT_REGION }}
              rules={RG_CHAT_RULES}
              suggestions={roadmapSuggestions}
              title="로드맵 AI 코치"
              category="roadmap"
              roadmapStep={active}
              allowSampleFallback={false}
              onRequireLogin={onRequireLogin}
              compact
            />
          </aside>
        </div>
      </div>
    );
  }

  /* ===== AI 세무 Assistant (예시 대화 + 실시간) ===== */
  const TAX_RULES =
    '너는 "창업ON"의 AI 세무 Assistant야. 청년·1인 창업자의 세무를 돕는다. ' +
    '주요 영역: 청년창업 세액감면 자동 판정(조세특례제한법 제6조), 사업자 유형(개인/법인, 간이/일반), ' +
    '부가가치세·종합소득세 신고 일정, 경비처리·절세. ' +
    '한국어로 간결하게(필요하면 불릿) 답하고, 판정·수치에는 근거(법령 조문명 등)를 함께 제시해. ' +
    '확정 판단이 필요하면 관할 세무서·세무대리인 확인을 권해. 이 화면은 데모다.';

  const TAX_CHIPS = [
    '청년창업 세액감면 대상인지 알려주세요',
    '간이과세자와 일반과세자 차이가 뭔가요?',
    '부가세·종합소득세 신고는 언제 하나요?',
    '업무용 노트북도 경비처리 되나요?',
  ];

  function TaxAssistantPage({ user, onRequireLogin }) {
    return (
      <AiConsult
        user={user || { biz: DEFAULT_BIZ, region: DEFAULT_REGION }}
        rules={TAX_RULES}
        suggestions={TAX_CHIPS}
        title="AI 세무 Assistant"
        category="tax"
        onRequireLogin={onRequireLogin}
        compact
        withSidebar
      />
    );
  }

  /* ===== 지원사업 공고문 AI 분석·구조화 ===== */
  const ANNC_SAMPLES = [
    {
      id: 'pre',
      label: '예비창업패키지',
      text:
        '2025년 예비창업패키지 창업사업화 지원 공고\n\n' +
        '1. 지원대상: 공고일 기준 사업자등록(개인·법인) 이력이 없는 만 39세 이하 예비창업자\n' +
        '2. 지원내용\n - 사업화 자금: 최대 1억 원(평균 5천만 원 내외), 총사업비의 70% 이내\n - 창업교육 및 전담멘토링 제공\n' +
        '3. 신청기간: 2025. 3. 10.(월) 10:00 ~ 3. 31.(월) 16:00\n' +
        '4. 신청방법: K-Startup 누리집(www.k-startup.go.kr) 온라인 접수\n' +
        '5. 제출서류: 사업신청서, 사업계획서(PSST 양식), 대표자 신분증 사본, 개인정보 수집·이용 동의서\n' +
        '6. 유의사항\n - 접수 마감 직전 신청 폭주로 인한 접속 지연 대비 사전 제출 권장\n - 국세·지방세 체납 시 선정 취소\n - 타 정부 창업사업화 지원사업과 중복 수혜 불가',
    },
    {
      id: 'dj',
      label: '대전 청년창업 지원',
      text:
        '2025년 대전형 청년창업 지원사업 참여기업 모집\n\n' +
        '□ 모집대상: 대전에 사업장을 둔(예정 포함) 만 19~39세, 창업 3년 이내 청년기업\n' +
        '□ 지원규모: 기업당 최대 3,000만 원(자부담 20%), 30개사 내외\n' +
        '□ 지원항목: 시제품 제작, 마케팅, 지식재산권 출원, 임차료(월 최대 50만 원)\n' +
        '□ 접수기간: 2025. 4. 1.(화) ~ 4. 21.(월) 18:00까지\n' +
        '□ 접수방법: 대전창조경제혁신센터 이메일 접수(startup@dcei.kr)\n' +
        '□ 구비서류: 참여신청서, 사업계획서, 사업자등록증(해당 시), 주민등록초본, 청년 확인 서류\n' +
        '□ 참고사항\n - 대전 외 지역 사업자는 선정 후 3개월 이내 대전 이전 조건\n - 유흥·사행성 업종 및 부동산업 제외\n - 최종 선정 후 협약 미체결 시 지원 포기로 간주',
    },
  ];

  const ANNC_FALLBACK = {
    pre: {
      target: '사업자등록 이력이 없는 만 39세 이하 예비창업자 (개인·법인 공통)',
      benefit: '사업화 자금 최대 1억 원(평균 약 5천만 원, 총사업비의 70% 이내) + 창업교육·전담멘토링',
      period: '2025. 3. 10. 10:00 ~ 2025. 3. 31. 16:00',
      method: 'K-Startup 누리집(www.k-startup.go.kr) 온라인 접수',
      documents: ['사업신청서', '사업계획서(PSST 양식)', '대표자 신분증 사본', '개인정보 수집·이용 동의서'],
      notes: ['마감 직전 접속 지연 대비 사전 제출 권장', '국세·지방세 체납 시 선정 취소', '타 정부 창업사업화 지원사업과 중복 수혜 불가'],
      source: '2025년 예비창업패키지 창업사업화 지원 공고 · K-Startup',
    },
    dj: {
      target: '대전 소재(예정 포함) 만 19~39세, 창업 3년 이내 청년기업',
      benefit: '기업당 최대 3,000만 원(자부담 20%) · 시제품 제작, 마케팅, IP 출원, 임차료(월 최대 50만 원)',
      period: '2025. 4. 1. ~ 2025. 4. 21. 18:00',
      method: '대전창조경제혁신센터 이메일 접수(startup@dcei.kr)',
      documents: ['참여신청서', '사업계획서', '사업자등록증(해당 시)', '주민등록초본', '청년 확인 서류'],
      notes: ['대전 외 사업자는 선정 후 3개월 이내 대전 이전 조건', '유흥·사행성 업종 및 부동산업 제외', '협약 미체결 시 지원 포기로 간주'],
      source: '2025년 대전형 청년창업 지원사업 모집 공고 · 대전창조경제혁신센터',
    },
  };

  const GOV_RULES =
    '너는 "창업ON"의 공고지원 AI야. 사용자는 대전광역시에서 정보통신업으로 창업을 준비/운영 중인 초기 창업자야. ' +
    '정부·지자체 지원사업 공고문을 붙여넣거나 물어보면 (1) 내 조건 적합 여부와 근거 (2) 지원 대상·내용·접수기간 요약 ' +
    '(3) 필요 서류와 준비 우선순위 (4) 사업계획서(PSST) 초안 방향을 한국어로 간결하게(필요하면 불릿) 안내해. ' +
    '담당 기관·서류명이 있으면 괄호로 덧붙여. 이 화면은 데모야.';
  const GOV_CHIPS = [
    '예비창업패키지 지원 자격이 어떻게 되나요?',
    '지원사업 신청에 필요한 서류를 알려주세요',
    '사업계획서(PSST) 초안 방향 잡아주세요',
    '예비창업패키지와 초기창업패키지 차이가 뭔가요?',
  ];

  /** 추천 공고 상세 모달 */
  function GovDetailModal({ item, onClose }) {
    useEffect(() => {
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const g = item.g;
    const d = GOV_DETAILS[g.id] || {};
    return (
      <div
        className="govm"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="govm-title"
      >
        <div className="govm__box">
          <button type="button" className="govm__close" onClick={onClose} aria-label="닫기">×</button>
          {/* 스크롤은 안쪽에서만 — 바깥 박스가 둥근 모서리를 그대로 유지한다 */}
          <div className="govm__scroll">
          <span className="govm__tag">{g.type} · {g.region}</span>
          <h2 id="govm-title" className="govm__title">{g.title}</h2>
          <p className="govm__agency">{g.agency}</p>

          <dl className="govm__rows">
            <div><dt>지원 규모</dt><dd>{g.amount}</dd></div>
            <div><dt>지원 대상</dt><dd>{g.target} 창업자</dd></div>
            <div><dt>접수 마감</dt>
              <dd className={g.dday >= 100 ? '' : 'govm__dday'}>
                {g.dday >= 100 ? '상시 접수' : `D-${g.dday}`}
              </dd>
            </div>
          </dl>

          {d.summary && <p className="govm__summary">{d.summary}</p>}

          {item.why && item.why.length > 0 && (
            <div className="govm__sec">
              <h3>내 조건과 맞는 점</h3>
              <div className="govm__chips">
                {item.why.map((w) => <span key={w} className="govm__chip">{w}</span>)}
              </div>
            </div>
          )}

          {d.eligibility && (
            <div className="govm__sec">
              <h3>신청 자격</h3>
              <p>{d.eligibility}</p>
            </div>
          )}

          {d.support && (
            <div className="govm__sec">
              <h3>지원 내용</h3>
              <ul>{d.support.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}

          {d.documents && (
            <div className="govm__sec">
              <h3>제출 서류</h3>
              <ul>{d.documents.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}

          {d.howto && (
            <div className="govm__sec">
              <h3>신청 방법</h3>
              <p>{d.howto}</p>
            </div>
          )}

          {d.notes && (
            <div className="govm__sec">
              <h3>유의사항</h3>
              <ul>{d.notes.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  function AnnouncementAnalyzer({ user, onRequireLogin }) {
    const [openGov, setOpenGov] = useState(null); // 상세 모달로 열어 둔 공고
    // 내 정보(업종·지역) 기준 적합도 상위 4건 — 기존 scoreProgram·GOV_LISTINGS 재사용
    const profile = user || { biz: DEFAULT_BIZ, region: DEFAULT_REGION };
    const recommended = GOV_LISTINGS
      .map((g) => ({ g, ...scoreProgram(g, profile) }))
      .sort((a, b) => b.score - a.score || a.g.dday - b.g.dday)
      .slice(0, 4);

    return (
      <div className="az2">
        <div className="az2__cols">
          <div className="az2__card">
            <h3 className="az2__cardttl">추천 공고</h3>
            <p className="az2__note">
              {profile.biz} · {profile.region} 조건에 맞는 공고를 적합도 순으로 모았어요.
            </p>
            <ul className="az2__reclist">
              {recommended.map(({ g, why }) => (
                <li key={g.id}>
                  <button type="button" className="az2__recbtn" onClick={() => setOpenGov({ g, why })}>
                    <span className="az2__recmain">
                      <span className="az2__rectitle">{g.title}</span>
                      <span className="az2__recmeta">{g.agency}</span>
                    </span>
                    <b className="az2__recscore u-num">{g.dday >= 100 ? '상시' : `D-${g.dday}`}</b>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Calendar compact />
        </div>

        <div className="az2__chat">
          <div className="chatpanel__hd">공고 상담</div>
          <AiConsult
            user={profile}
            onRequireLogin={onRequireLogin}
            rules={GOV_RULES}
            suggestions={GOV_CHIPS}
            title="공고지원 AI"
            category="policy"
            compact
            noHeader
          />
        </div>

        {openGov && <GovDetailModal item={openGov} onClose={() => setOpenGov(null)} />}
      </div>
    );
  }

  function SubPage({ pageKey, user, onHome, onLoginClick, onNavigate, roadmapDone, setRoadmapDone }) {
    const meta =
      {
        roadmap: { title: '창업 로드맵' },
        tax: { title: 'AI 세무 Assistant' },
        gov: { title: '공고지원 AI' },
      }[pageKey] || { title: '창업ON' };

    const slim = pageKey === 'roadmap' || pageKey === 'tax' || pageKey === 'gov';
    const [menuOpen, setMenuOpen] = useState(false);

    const body = (
      <React.Fragment>
        <div className={'fp' + (slim ? ' fp--wide' : '') + (pageKey === 'roadmap' ? ' fp--wideplus' : '')}>
          <div className={'fp__head' + (slim ? ' fp__head--plain' : '')}>
            <div className="fp__head-in">
              <h1 className="fp__title">{meta.title}</h1>
            </div>
          </div>
          <div className="fp__body">
            {pageKey === 'roadmap' && (
              <RoadmapGuide
                user={user}
                done={roadmapDone}
                setDone={setRoadmapDone}
                onRequireLogin={onLoginClick}
              />
            )}
            {pageKey === 'gov' && <AnnouncementAnalyzer user={user} onRequireLogin={onLoginClick} />}
            {pageKey === 'tax' && <TaxAssistantPage user={user} onRequireLogin={onLoginClick} />}
          </div>
        </div>
        {!slim && (
          <footer className="foot">
            <div className="wrap">창업ON</div>
          </footer>
        )}
      </React.Fragment>
    );

    if (slim) {
      return (
        <React.Fragment>
          <div className="slim-shell">
            <header className="rmhead">
              <div className="rmhead__in">
                <button className="brand" type="button" onClick={onHome}>
                  <span className="brand__mark" aria-hidden="true">ON</span>
                  창업ON
                </button>
                <button
                  className="hamburger"
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={menuOpen}
                  aria-label="메뉴 열기"
                  onClick={() => setMenuOpen(true)}
                >
                  <span /><span /><span />
                </button>
              </div>
            </header>
            {body}
          </div>
          <MenuDrawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onNavigate={onNavigate}
            user={user}
            onAuth={onLoginClick}
          />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <Nav user={user} onLoginClick={onLoginClick} onNavigate={onNavigate} />
        {body}
      </React.Fragment>
    );
  }

  /* ---------- 홈: Hero ---------- */
  function DeadlinePanel() {
    // Backend: GET /api/announcements → 마감 임박 공고 (DB의 실제 공고)
    const { data: deadlines, source } = useApi('/announcements?limit=4', DEADLINES, (raw) =>
      (raw.announcements || []).slice(0, 4).map((x) => ({
        id: String(x.id),
        dday: x.dday === null || x.dday === undefined ? '상시' : `D-${x.dday}`,
        tone: x.dday <= 7 ? 'urgent' : x.dday <= 30 ? 'soon' : 'normal',
        title: x.title,
        meta: [x.region, x.industry, x.benefit].filter(Boolean).join(' · ').slice(0, 60),
        url: x.sourceUrl,
      }))
    );

    const [saved, setSaved] = useState(() => new Set());
    const toggle = (id) =>
      setSaved((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });

    return (
      <aside className="panel" aria-labelledby="panel-title">
        <div className="panel__head">
          <h2 id="panel-title" className="panel__title">마감 임박 공고</h2>
          <span className="panel__more">전체 보기</span>
        </div>
        <ul className="deadlines">
          {deadlines.map((item) => (
            <li key={item.id} className="deadline">
              <span className={`deadline__dday u-num is-${item.tone}`}>{item.dday}</span>
              <div>
                <p className="deadline__title">{item.title}</p>
                <p className="deadline__meta">{item.meta}</p>
              </div>
              <button className="star" type="button" aria-pressed={saved.has(item.id)}
                aria-label={`${item.title} 관심 공고 저장`} onClick={() => toggle(item.id)}>
                {saved.has(item.id) ? '★' : '☆'}
              </button>
            </li>
          ))}
        </ul>
        <p className="panel__foot">
          {saved.size > 0
            ? `관심 공고 ${saved.size}건 저장됨 · 마감 3일 전 알림을 보내드려요`
            : '★ 를 눌러 관심 공고를 저장하면 마감 알림을 받아요'}
        </p>
      </aside>
    );
  }

  function Hero({ onNavigate }) {
    // Backend: GET /api/stats → 실제 모집 중 공고 수
    const { data: stats, source: statsSrc } = useApi('/stats', null, (raw) => raw);
    const total = (stats && stats.openAnnouncements) || 1842;
    const count = useCountUp(total, true);
    let wi = 0;
    return (
      <section className="hero" id="top">
        <div className="glow glow--blue" aria-hidden="true" />
        <div className="glow glow--violet" aria-hidden="true" />
        <div className="wrap hero__inner">
          <div>
            <p className="badge">
              <span className="badge__dot" aria-hidden="true" />
              매일 09:00 자동 갱신
            </p>
            <p className="figure u-num">
              {count.toLocaleString()}
              <span className="figure__unit">건 모집 중</span>
            </p>
            <h1 className="title">
              {HERO_TITLE.map((line, li) => (
                <React.Fragment key={li}>
                  {line.map((w) => (
                    <span className="w" style={{ '--i': wi++ }} key={w + wi}>
                      {w}
                      {' '}
                    </span>
                  ))}
                  {li === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="lede">
              중앙부처 · 지자체 · 공공기관 공고를 모아 내 조건에 맞는 것만 골라
              드립니다. 세액 감면 대상 여부와 신고 일정까지 함께요.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary btn--lg" href="#onboarding">내 조건으로 찾기</a>
              <button className="btn btn--ghost btn--lg" type="button" onClick={() => onNavigate('roadmap')}>
                창업 로드맵 보기
              </button>
            </div>
            <dl className="stats">
              <div className="stat">
                <dt className="stat__label">수집 정책</dt>
                <dd className="stat__value u-num">
                  {stats ? `${stats.policies.toLocaleString()}건` : '2,907건'}
                </dd>
              </div>
              <div className="stat">
                <dt className="stat__label">세법 조문</dt>
                <dd className="stat__value u-num">
                  {stats ? `${stats.taxDocuments.toLocaleString()}건` : '4,459건'}
                </dd>
              </div>
              <div className="stat">
                <dt className="stat__label">최대 세액 감면</dt>
                <dd className="stat__value stat__value--pos u-num">
                  {stats ? `${stats.maxReductionRate}%` : '100%'}
                </dd>
              </div>
            </dl>
            <p style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-faint)' }}>
              {statsSrc === 'api'
                ? '● 실시간 DB 연동 중 (Backend :8000 → Postgres)'
                : '○ 데모 데이터 (Backend 미실행 — cd Backend && uv run uvicorn main:app --port 8000)'}
            </p>
          </div>
          <DeadlinePanel />
        </div>
      </section>
    );
  }

  /* ---------- 홈 2: 창업 일정 달력 ---------- */
  /**
   * Backend 의 /api/calendar 응답을 { 'YYYY-MM-DD': [{id,type,title,note,mine}] } 로 변환.
   * 서버는 dueDate·eventType(TAX/POLICY/USER)로 내려주고, 목데이터는 date·type을 쓴다.
   */
  function eventsByDate(raw) {
    const map = {};
    (raw.events || []).forEach((e) => {
      const date = e.dueDate || e.date;
      if (!date) return;
      const kind = String(e.eventType || e.type || '').toLowerCase();
      (map[date] = map[date] || []).push({
        id: e.id,
        // 내가 등록한 일정(USER)도 지원사업과 같은 색으로 묶어서 보여준다.
        type: kind === 'tax' ? 'tax' : 'policy',
        title: e.title,
        note: e.description || e.note || '',
        mine: !!e.mine,
      });
    });
    return map;
  }

  /** 홈 캘린더는 전부가 아니라 "중요 일정"만: 세금 신고일·내 일정 전부 + 가까운 지원사업 마감 몇 개 */
  function pickImportant(map, maxPolicy = 2) {
    const out = {};
    const policyItems = [];
    Object.entries(map || {}).forEach(([date, arr]) => {
      // 내가 직접 등록한 일정은 마감 임박 순서와 무관하게 항상 남긴다.
      const keep = arr.filter((e) => e.type === 'tax' || e.mine);
      if (keep.length) out[date] = keep.slice(0, 2);
      arr
        .filter((e) => e.type === 'policy' && !e.mine)
        .forEach((e) => policyItems.push({ date, e }));
    });
    policyItems
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .slice(0, maxPolicy)
      .forEach(({ date, e }) => {
        (out[date] = out[date] || []).push(e);
      });
    return out;
  }

  function Calendar({ compact }) {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
    const [sel, setSel] = useState(todayKey);

    // Backend: GET /api/calendar?year&month → 세금 신고일 + 지원사업 마감일 통합
    const { data: rawEvents } = useApi(
      `/calendar?year=${cur.y}&month=${cur.m + 1}&limit=200`,
      CAL_EVENTS,
      eventsByDate
    );
    // 홈에서는 모든 공고 마감이 아니라 "중요 일정"만 표시 (전체는 마이페이지 → 세금 일정)
    const events = pickImportant(rawEvents);

    const startDow = new Date(cur.y, cur.m, 1).getDay();
    const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const monthPrefix = `${cur.y}-${pad2(cur.m + 1)}`;
    const monthCount = Object.keys(events).filter((k) => k.startsWith(monthPrefix)).length;
    const shift = (delta) => {
      const nd = new Date(cur.y, cur.m + delta, 1);
      setCur({ y: nd.getFullYear(), m: nd.getMonth() });
    };
    const selEvents = events[sel] || [];
    const [sy, sm, sd] = sel.split('-').map(Number);
    const selLabel = `${sm}월 ${sd}일 (${WEEKDAYS[new Date(sy, sm - 1, sd).getDay()]})`;

    return (
      <div className={'cal' + (compact ? ' cal--compact' : '')} role="group" aria-label="창업 일정 달력">
        <div className="cal__head">
          <h3 className="cal__title">창업 일정</h3>
          <div className="cal__nav">
            <button type="button" onClick={() => shift(-1)} aria-label="이전 달">‹</button>
            <span className="cal__month">{cur.y}.{pad2(cur.m + 1)}</span>
            <button type="button" onClick={() => shift(1)} aria-label="다음 달">›</button>
          </div>
        </div>
        <p className="cal__sub">
          이번 달 주요 일정 {monthCount}건 · 전체 일정은 마이페이지에서 확인하세요
        </p>
        <div className="cal__grid">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={'cal__dow' + (i === 0 ? ' cal__dow--sun' : '')}>{w}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="cal__day cal__day--out" />;
            const k = dayKey(cur.y, cur.m, d);
            const types = [...new Set((events[k] || []).map((e) => e.type))];
            const isSel = k === sel;
            return (
              <button
                key={k}
                type="button"
                className={
                  'cal__day' +
                  (isSel ? ' cal__day--sel' : '') +
                  (k === todayKey && !isSel ? ' cal__day--today' : '')
                }
                aria-pressed={isSel}
                onClick={() => setSel(k)}
              >
                {d}
                {types.length > 0 && (
                  <span className="cal__dot">
                    {types.map((t) => <i key={t} className={t === 'tax' ? 't-tax' : 't-policy'} />)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="cal__legend">
          <span><i className="t-tax" /> 세금 신고</span>
          <span><i className="t-policy" /> 지원사업</span>
        </div>
        {!compact && (
          <div className="cal__events">
            <h4>{selLabel} 일정</h4>
            {selEvents.length === 0 ? (
              <p className="cal__empty">등록된 일정이 없어요.</p>
            ) : (
              /* 목록이 길어지면 달력이 한 화면을 넘어가므로 2건까지만 보여준다 */
              <React.Fragment>
                {selEvents.slice(0, 2).map((e) => (
                  <div key={e.title} className="cal__ev">
                    <i className={e.type === 'tax' ? 't-tax' : 't-policy'} />
                    <div>
                      <b>{e.title}</b>
                      <span>{e.note}</span>
                    </div>
                  </div>
                ))}
                {selEvents.length > 2 && (
                  <p className="cal__more">외 {selEvents.length - 2}건 · 전체는 마이페이지에서 확인하세요</p>
                )}
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    );
  }

  function Schedule() {
    return (
      <section className="sec">
        <div className="wrap stmt__grid">
          <Reveal><Calendar /></Reveal>
          <div>
            <Reveal as="p" className="eyebrow">창업 일정 관리</Reveal>
            <h2 className="stmt__head">
              <Reveal as="span" className="stmt__line">마감일을 놓치지 않게</Reveal>
              <Reveal as="span" className="stmt__line" delay={120}>
                <em>한 캘린더</em>로 관리합니다
              </Reveal>
            </h2>
            <Reveal as="p" className="stmt__sub" delay={200}>
              지원사업 접수 마감일과 부가세 · 종합소득세 신고일을 한 달력에 모았어요.
              관심 공고를 저장하면 마감 3일 전에 알림을 보내드립니다.
            </Reveal>
            <Reveal as="ul" className="stmt__mini" delay={260}>
              <li><b>D-8</b><span>청년창업사관학교 15기 마감<em>중소벤처기업진흥공단</em></span></li>
              <li><b>D-17</b><span>부가세 2기 예정신고<em>홈택스 전자신고</em></span></li>
              <li><b>D-22</b><span>서울 청년창업 임차보증금 지원 마감<em>서울시</em></span></li>
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- 홈 3: AI 대화 ---------- */
  function ChatDemo() {
    // 한 번 화면에 들어오면 끝까지 재생하고 그대로 유지 (스크롤해도 리셋 안 함)
    const [ref, inView] = useInView({ threshold: 0.25 });
    const [shown, setShown] = useState(0);
    const [typing, setTyping] = useState(false);
    const [extra, setExtra] = useState([]);
    const [draft, setDraft] = useState('');
    const bodyRef = useRef(null);

    useEffect(() => {
      if (!inView) return;
      if (prefersReducedMotion) {
        setShown(CHAT.length);
        return;
      }
      if (shown >= CHAT.length) return;
      const next = CHAT[shown];
      let t;
      if (next.role === 'ai') {
        setTyping(true);
        t = setTimeout(() => {
          setTyping(false);
          setShown((s) => s + 1);
        }, 900);
      } else {
        t = setTimeout(() => setShown((s) => s + 1), 520);
      }
      return () => clearTimeout(t);
    }, [inView, shown]);

    useEffect(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [shown, typing, extra]);

    const send = (e) => {
      e.preventDefault();
      const q = draft.trim();
      if (!q) return;
      setDraft('');
      setExtra((x) => [...x, { role: 'user', text: q }]);
      setTimeout(() => {
        setExtra((x) => [
          ...x,
          { role: 'ai', text: '실제 서비스에서는 국세청 해석사례와 관련 법령을 인용해 답변하고, 필요한 일정을 캘린더에 등록해 드려요.' },
        ]);
      }, 700);
    };

    const msgs = [...CHAT.slice(0, shown), ...extra];

    return (
      <section className="sec sec--alt">
        <div className="wrap chat__grid">
          <div>
            <Reveal as="p" className="eyebrow">AI 어시스턴트</Reveal>
            <Reveal as="h2" className="chat__title" delay={80}>
              대화하듯 물어보면<br />창업과 세금 업무가 정리됩니다
            </Reveal>
            <Reveal as="p" className="chat__lead" delay={160}>
              지원사업 탐색, 사업자 유형 판단, 세액감면 여부, 신고 일정 등록까지 —
              한 번의 대화로 이어서 처리할 수 있어요.
            </Reveal>
            <Reveal className="chat__tags" delay={220}>
              <span className="chat__tag">지원사업 매칭</span>
              <span className="chat__tag">세액감면 판정</span>
              <span className="chat__tag">신고 일정 등록</span>
              <span className="chat__tag">경비처리 상담</span>
            </Reveal>
          </div>

          <Reveal>
            <div className="chatbox" ref={ref}>
              <div className="chatbox__bar">
                <span className="chatbox__ava" aria-hidden="true">ON</span>
                <span className="chatbox__who">
                  <b>창업ON 어시스턴트</b>
                  <span>온라인 · 보통 몇 초 안에 응답</span>
                </span>
              </div>
              <div className="chatbox__body" ref={bodyRef}>
                {msgs.map((m, i) => (
                  <div key={i} className={`msg msg-in msg--${m.role}`}>{m.text}</div>
                ))}
                {typing && (
                  <div className="typing" aria-label="입력 중">
                    <i /><i /><i />
                  </div>
                )}
              </div>
              <form className="chatbox__input" onSubmit={send}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="메시지를 입력해 보세요"
                  aria-label="메시지 입력"
                />
                <button type="submit">전송</button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  /* ---------- 홈 4: 창업 A-Z 로드맵 ---------- */
  function rmIcon(k) {
    const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const paths = {
      A: <><path d="M9 18h6M10 21h4" {...p} /><path d="M12 3a6 6 0 0 0-4 10.4c.6.5 1 1.4 1 2.6h6c0-1.2.4-2.1 1-2.6A6 6 0 0 0 12 3Z" {...p} /></>,
      B: <><path d="M7 3h8l3 3v15H7z" {...p} /><path d="M15 3v4h4M10 12h5M10 16h5" {...p} /></>,
      C: <><circle cx="12" cy="12" r="8.5" {...p} /><path d="m8.5 12 2.5 2.5 4.5-5" {...p} /></>,
      D: <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 7.5v9M9.7 9.7c0-1 1-1.6 2.3-1.6s2.3.6 2.3 1.6-1 1.3-2.3 1.5-2.3.6-2.3 1.6 1 1.6 2.3 1.6 2.3-.6 2.3-1.6" {...p} /></>,
      E: <><path d="m7.5 16.5 9-9" {...p} /><circle cx="8.5" cy="8.5" r="2" {...p} /><circle cx="15.5" cy="15.5" r="2" {...p} /></>,
      F: <><path d="M7 3.5h10v17l-2.5-1.6-2.5 1.6-2.5-1.6L7 20.5z" {...p} /><path d="M10 8h4M10 12h4" {...p} /></>,
      Z: <><path d="m4 15 5-5 3 3 8-8" {...p} /><path d="M16 5h4v4" {...p} /></>,
    };
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {paths[k] || paths.A}
      </svg>
    );
  }

  /** 완료된 단계는 아이콘 자리에 체크 표시 */
  function rmDoneIcon() {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m5 12.5 4.5 4.5L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  function Roadmap() {
    const [ref, inView] = useInView({ threshold: 0.2 }, true);
    const on = inView || prefersReducedMotion;
    return (
      <section className="sec">
        <div className="wrap">
          <Reveal as="p" className="eyebrow">창업 A → Z</Reveal>
          <Reveal as="h2" className="sec__title" delay={80}>
            아이디어부터 스케일업까지
          </Reveal>
          <div className={'rz' + (on ? ' is-in' : '')} ref={ref}>
            <div className="rz__row">
              {ROADMAP.map((s, i) => (
                <React.Fragment key={s.k}>
                  {i > 0 && (
                    <div className="rz__sep" aria-hidden="true" style={{ '--d': `${i * 160 + 80}ms` }}>›</div>
                  )}
                  <div
                    className={'rz__step' + (s.accent ? ' rz__step--accent' : '')}
                    style={{ '--d': `${i * 160 + 150}ms` }}
                  >
                    <span className="rz__ico">{rmIcon(s.k)}</span>
                    <span className="rz__phase">{s.phase}</span>
                    <span className="rz__t">{s.t}</span>
                    <span className="rz__d">{s.d}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function Closing({ onStart, user }) {
    return (
      <section className="sec">
        <Reveal className="wrap closing">
          <div className="closing__stats">
            {METRICS.map((m, i) => (
              <Metric key={m.label} {...m} delay={i * 70} />
            ))}
          </div>
          <div className="closing__cta">
            <p className="eyebrow">지금 창업ON에서</p>
            <h2>지금, 내 조건으로 시작하세요</h2>
            <p>로그인하면 맞춤 공고와 세무 대시보드가 함께 열립니다.</p>
            <button className="btn btn--primary btn--lg" type="button" onClick={onStart}>
              {user ? '마이페이지 바로가기' : '로그인'}
            </button>
          </div>
        </Reveal>
      </section>
    );
  }

  function Home({ onNavigate, user }) {
    return (
      <main className="home-flow">
        <Hero onNavigate={onNavigate} />
        <Schedule />
        <ChatDemo />
        <Roadmap />
        <Closing onStart={() => onNavigate('mypage')} user={user} />
      </main>
    );
  }

  /* ---------- App ---------- */
  const USER_STORE_KEY = 'changeup:user';
  const loadStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem(USER_STORE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  };

  function App() {
    // 로그인 유지: 로그아웃 전까지 새로고침해도 세션 유지 (localStorage)
    const [user, setUser] = useState(loadStoredUser);
    const [view, setView] = useState('home');
    const [pageKey, setPageKey] = useState('tax');
    const [loginOpen, setLoginOpen] = useState(false);
    const [afterLogin, setAfterLogin] = useState(null);
    // 창업 로드맵 진행 상태 — 로드맵 페이지와 마이페이지가 공유
    const [roadmapDone, setRoadmapDone] = useState({});

    useEffect(() => {
      try {
        if (user) localStorage.setItem(USER_STORE_KEY, JSON.stringify(user));
        else localStorage.removeItem(USER_STORE_KEY);
      } catch (e) {
        /* 저장 불가 환경은 무시 */
      }
    }, [user]);

    // localStorage 의 user 는 화면 유지용일 뿐 토큰이 살아 있다는 보장이 아니다.
    // Backend 에 물어 실제 세션을 확인한다. 토큰이 없거나 만료면 me() 가 null 을 준다.
    useEffect(() => {
      let alive = true;
      api.me().then((u) => {
        if (!alive) return;
        if (u) {
          setUser((cur) => ({
            ...(cur || { biz: '정보통신업', region: '대전' }),
            id: u.id,
            name: u.name || (cur && cur.name) || '회원',
            email: u.email,
            region: u.region || (cur && cur.region),
          }));
        } else {
          // 저장된 화면 상태만 남고 토큰이 죽은 경우 — 로그아웃 상태로 맞춘다.
          setUser(null);
        }
      });
      return () => { alive = false; };
    }, []);

    const goMyPage = () => {
      if (user) setView('mypage');
      else {
        setAfterLogin('mypage');
        setLoginOpen(true);
      }
    };

    const handleNavigate = (key) => {
      if (key === 'home') {
        setView('home');
        window.scrollTo(0, 0);
        return;
      }
      if (key === 'mypage') {
        goMyPage();
        return;
      }
      setPageKey(key); // 'roadmap' | 'tax' | 'gov'
      setView('page');
      window.scrollTo(0, 0);
    };

    const handleLoginClick = () => {
      if (user) {
        api.logout();
        setUser(null);
        setView('home');
      } else {
        setAfterLogin(null);
        setLoginOpen(true);
      }
    };

    const handleLoginSuccess = (u) => {
      setUser(u);
      setLoginOpen(false);
      if (afterLogin === 'mypage') setView('mypage');
      setAfterLogin(null);
    };

    const modal = loginOpen && (
      <LoginModal onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />
    );

    if (view === 'mypage' && user) {
      return (
        <React.Fragment>
          <MyPage
            user={user}
            onProfileSaved={(patch) => setUser((cur) => ({ ...cur, ...patch }))}
            onHome={() => setView('home')}
            onLogout={() => {
              api.logout();
              setUser(null);
              setView('home');
            }}
            onNavigate={handleNavigate}
            onLoginClick={handleLoginClick}
            roadmapDone={roadmapDone}
            onOpenRoadmap={() => handleNavigate('roadmap')}
            onOpenTax={() => handleNavigate('tax')}
            onOpenGov={() => handleNavigate('gov')}
          />
          <FloatingThemeToggle />
        </React.Fragment>
      );
    }

    if (view === 'page') {
      return (
        <React.Fragment>
          <ScrollProgress />
          <SubPage
            pageKey={pageKey}
            user={user}
            onHome={() => setView('home')}
            onLoginClick={handleLoginClick}
            onNavigate={handleNavigate}
            roadmapDone={roadmapDone}
            setRoadmapDone={setRoadmapDone}
          />
          <FloatingThemeToggle />
          {modal}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <ScrollProgress />
        <div className="home-scale">
          <Nav user={user} onLoginClick={handleLoginClick} onNavigate={handleNavigate} />
          <Home onNavigate={handleNavigate} user={user} />
          <footer className="foot">
            <div className="wrap">창업ON · 공공데이터 기반 창업 지원 공고 큐레이션</div>
          </footer>
        </div>
        <FloatingThemeToggle />
        {modal}
      </React.Fragment>
    );
  }

export default App;
