/**
 * 얇은 fetch 래퍼. 실제 API 연동 시 각 페이지의 목 데이터를 이 함수 호출로 교체한다.
 * 개발 중에는 vite.config.js 의 /api 프록시가 http://localhost:8000 으로 전달한다.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${message}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

/* ------------------------------------------------------------------
 * 엔드포인트 초안 (백엔드와 협의 후 확정)
 * ------------------------------------------------------------------
 * auth
 *   POST   /auth/signup            회원가입
 *   POST   /auth/login             로그인
 *   POST   /auth/find-id           아이디(이메일) 찾기
 *   POST   /auth/reset-password    비밀번호 재설정 링크 발송
 *   POST   /users/consents         개인정보 수집 동의 저장
 *   PUT    /users/me/profile       개인정보 입력/수정
 * 창업 전
 *   GET    /subsidies              청년 지원금 목록/검색
 *   GET    /subsidies/recommend    맞춤 지원금 추천
 *   GET    /industries/compare     업종별 창업률/폐업률
 * 창업 준비
 *   POST   /diagnosis/biz-type     사업자등록 유형 진단
 *   POST   /diagnosis/tax-relief   청년 창업 세액 감면 판정
 *   GET    /support-programs       창업 지원 사업 목록/검색
 * 창업 후
 *   GET    /tax/schedule           세금 일정(사업자 유형별)
 *   GET    /policies               기업 지원 정책 목록/추천
 *   POST   /agent/expense          경비처리/절세 에이전트(대화)
 * ------------------------------------------------------------------ */
