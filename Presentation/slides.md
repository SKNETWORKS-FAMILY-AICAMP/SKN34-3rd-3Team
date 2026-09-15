---
theme: default
title: 창업ON — 청년 창업 & 세금 내비게이터
colorSchema: light
aspectRatio: 16/9
canvasWidth: 1280
transition: fade
fonts:
  sans: IBM Plex Sans KR
  mono: Space Grotesk
  weights: '400,500,600,700'
  provider: google
# 화면 컨트롤은 이전/다음 버튼(global-top.vue)만 사용 — 기본 기능 비활성
record: false
drawings:
  enabled: false
presenter: false
browserExporter: false
download: false
editor: false
contextMenu: false
twoslash: false
monaco: false
layout: cover
---

<div style="max-width: 760px">
  <p class="badge"><span class="badge__dot"></span>SKN34기 3차 프로젝트 3Team</p>
  <div style="display:flex; align-items:center; gap:18px; margin: 30px 0 18px">
    <span class="brandmark" style="width:64px; height:64px; border-radius:18px; font-size:22px">ON</span>
    <h1 style="margin:0; font-size:72px; letter-spacing:-0.05em">창업ON</h1>
  </div>
  <p style="margin:0 0 14px; font-size:34px; font-weight:700; letter-spacing:-0.04em; line-height:1.35">
    청년 창업 지원사업과 세무 업무를<br><em>근거 있는 AI</em>로 한 곳에서
  </p>
  <p class="lead" style="margin-bottom:40px !important">청년·1인 창업자 맞춤형 AI 행정·재정 지원 플랫폼</p>
  <div style="display:flex; gap:40px">
    <div><b class="num" style="font-size:28px">10,892</b><div class="faint" style="font-size:13px">RAG 색인 문서</div></div>
    <div><b class="num" style="font-size:28px">100%</b><div class="faint" style="font-size:13px">Guardrail 정확도</div></div>
    <div><b class="num pos" style="font-size:28px">−29.6%</b><div class="faint" style="font-size:13px">세금 응답 시간</div></div>
  </div>
</div>

---

<p class="eyebrow">Agenda</p>

# 목차

<div class="agenda">
  <div class="card agenda__item"><span class="agenda__n">01</span><span class="agenda__t">배경과 문제</span></div>
  <div class="card agenda__item"><span class="agenda__n">02</span><span class="agenda__t">서비스 소개</span></div>
  <div class="card agenda__item"><span class="agenda__n">03</span><span class="agenda__t">시스템 구성</span></div>
  <div class="card agenda__item"><span class="agenda__n">04</span><span class="agenda__t">LLM · RAG</span></div>
  <div class="card agenda__item"><span class="agenda__n">05</span><span class="agenda__t">성과</span></div>
  <div class="card agenda__item"><span class="agenda__n">06</span><span class="agenda__t">회고</span></div>
</div>

---

<p class="eyebrow">01 · Problem</p>

# 창업자는 <em>정보를 찾는 일</em>에 너무 많은 시간을 씁니다


<div class="grid-4 problem">
  <div class="card">
    <span class="card__k card__k--red"><svg viewBox="0 0 24 24"><path d="m7.5 16.5 9-9M8.5 6.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM15.5 13.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
    <h3>복잡한 세액감면 조건</h3>
    <p>나이·업종·지역·창업 시점별로 감면율이 달라 판단이 어려움</p>
  </div>
  <div class="card">
    <span class="card__k card__k--violet"><svg viewBox="0 0 24 24"><path d="M4 6h7v5H4zM13 6h7v5h-7zM4 13h7v5H4zM13 13h7v5h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
    <h3>흩어진 지원사업</h3>
    <p>정부24 · K-Startup · 기업마당 · 지자체 등 기관마다 따로 공고</p>
  </div>
  <div class="card">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M7 3h8l3 3v15H7zM15 3v4h4M10 12h5M10 16h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
    <h3>긴 공고문</h3>
    <p>지원 대상·자격·서류를 긴 공고문에서 직접 찾아야 함</p>
  </div>
  <div class="card">
    <span class="card__k card__k--red"><svg viewBox="0 0 24 24"><path d="M12 4 3 20h18L12 4ZM12 10v4M12 17v.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <h3>일반 AI의 환각</h3>
    <p>없는 정책이나 틀린 세무 정보를 근거 없이 답변</p>
  </div>
</div>

<div class="card card--wash" style="margin-top:28px; display:flex; align-items:center; gap:20px; padding:22px 28px">
  <span class="brandmark" style="width:36px; height:36px; border-radius:10px; font-size:13px">ON</span>
  <p style="margin:0; font-size:19px !important; color:var(--ink)"><b>창업ON</b> — 흩어진 정보를 한 곳에 모으고, <em>근거 문서 안에서만</em> 답하는 AI로 해결</p>
</div>

---

<p class="eyebrow">02 · Solution</p>

# 문서 범위 안에서만 답하는 <em>개인화 AI 내비게이터</em>


<div style="display:flex; align-items:flex-start">
  <FlowStep icon="user" phase="STEP 1" title="회원가입"/>
  <div class="arrow" style="margin-top:24px; flex:0 0 28px">›</div>
  <FlowStep icon="profile" phase="STEP 2" title="사업자 정보 입력"/>
  <div class="arrow" style="margin-top:24px; flex:0 0 28px">›</div>
  <FlowStep icon="spark" phase="STEP 3" title="AI 프로필 구성"/>
  <div class="arrow" style="margin-top:24px; flex:0 0 28px">›</div>
  <FlowStep icon="search" phase="STEP 4" title="세금 관리 · 정책 탐색"/>
  <div class="arrow" style="margin-top:24px; flex:0 0 28px">›</div>
  <FlowStep icon="chat" phase="STEP 5" title="AI 상담 · 근거 확인" accent />
</div>

<div class="grid-3 principle" style="margin-top:56px">
  <div class="card card--wash">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M7 3h8l3 3v15H7zM15 3v4h4M10 12l2 2 3-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <h3>근거 문서 기반 답변</h3>
  </div>
  <div class="card card--wash">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M6 3h12v18H6zM9 7h6M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <h3>계산은 코드, 설명은 LLM</h3>
  </div>
  <div class="card card--wash">
    <span class="card__k card__k--violet"><svg viewBox="0 0 24 24"><path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4.5 20c1.2-3.4 4-5 7.5-5s6.3 1.6 7.5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <h3>프로필 기반 개인화</h3>
  </div>
</div>

---

<p class="eyebrow">02 · Service ①</p>

# 창업 A → Z 로드맵과 <em>나만의 대시보드</em>


<div style="display:flex; align-items:flex-start">
  <FlowStep icon="A" phase="창업 전" title="아이디어 검증" />
  <div class="arrow" style="margin-top:24px; flex:0 0 16px">›</div>
  <FlowStep icon="B" phase="준비" title="사업자 등록" />
  <div class="arrow" style="margin-top:24px; flex:0 0 16px">›</div>
  <FlowStep icon="C" phase="준비" title="지원사업 신청" />
  <div class="arrow" style="margin-top:24px; flex:0 0 16px">›</div>
  <FlowStep icon="D" phase="준비" title="자금 조달" />
  <div class="arrow" style="margin-top:24px; flex:0 0 16px">›</div>
  <FlowStep icon="E" phase="창업 후" title="세액감면 신청" />
  <div class="arrow" style="margin-top:24px; flex:0 0 16px">›</div>
  <FlowStep icon="F" phase="창업 후" title="첫 매출 · 신고" />
  <div class="arrow" style="margin-top:24px; flex:0 0 16px">›</div>
  <FlowStep icon="Z" phase="성장" title="스케일업" accent />
</div>

<div class="mock" style="position:relative; margin-top:48px">
  <div class="mock__bar"><span class="brandmark">ON</span><b>마이페이지</b><span>사업자 정보 기준 · 정보통신업 · 대전</span></div>
  <div class="mp-dash">
    <div class="mp-col">
      <div class="mp-t"><b>창업 로드맵 진행률</b><span>2 / 7단계</span></div>
      <div class="mp-m">현재 단계 · C. 지원사업 신청</div>
      <b class="num mp-pct">43%</b>
      <div class="bar"><i style="width:43%"></i></div>
    </div>
    <div class="mp-col">
      <div class="mp-t"><b>세무 AI Assistant</b><span class="mp-link">세무 AI ›</span></div>
      <div class="mp-m">최근 질문</div>
      <div class="mp-q">청년창업 세액감면 대상 여부</div>
      <div class="mp-q">부가세 · 종합소득세 신고 시기</div>
    </div>
    <div class="mp-col">
      <div class="mp-t"><b>공고지원 AI</b><span class="mp-link">공고지원 AI ›</span></div>
      <div class="mp-m">최근 질문 · 저장 3건</div>
      <div class="mp-q">예비창업패키지 지원 자격</div>
      <div class="mp-q">지원사업 신청 서류</div>
    </div>
    <div class="mp-col">
      <div class="mp-t"><b>일정 캘린더</b></div>
      <div class="mp-m">내 일정 · 세금 신고일 · 공고 마감</div>
      <div class="mp-q"><i class="dot" style="background:var(--violet)"></i>청년창업사관학교 15기 마감</div>
      <div class="mp-q"><i class="dot" style="background:var(--blue)"></i>부가세 예정신고</div>
    </div>
  </div>
</div>

---

<p class="eyebrow">02 · Service ②</p>

# 흩어진 공고를 모아 <em>내 조건</em>으로 읽어 줍니다


<div style="display:grid; grid-template-columns: 0.72fr 1.05fr 1.05fr; gap:20px; align-items:stretch">
<div class="feat" style="display:grid; gap:12px">
  <div class="card" style="padding:18px 20px">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
    <div>
      <h3 style="font-size:17px">추천 공고</h3>
      <p>개인 맞춤 적합도 기반 추천</p>
    </div>
  </div>
  <div class="card" style="padding:18px 20px">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M7 3h8l3 3v15H7zM15 3v4h4M10 12h5M10 16h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
    <div>
      <h3 style="font-size:17px">공고 상세</h3>
      <p>지원 규모 · 자격 · 서류 · 신청</p>
    </div>
  </div>
  <div class="card" style="padding:18px 20px">
    <span class="card__k card__k--violet"><svg viewBox="0 0 24 24"><path d="M4 5h16v11H10l-5 4v-4H4zM8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div>
      <h3 style="font-size:17px">공고 상담 AI</h3>
      <p>조회한 실제 공고만 답변</p>
    </div>
  </div>
</div>
<div class="mock" style="position:relative">
  <div class="mock__body" style="padding:16px 18px 8px">
    <b style="font-size:14px">추천 공고</b>
    <div class="faint" style="font-size:11.5px; margin:2px 0 6px">정보통신업 · 대전 조건에 맞는 공고를 적합도 순으로 모았어요.</div>
    <div class="rec-row"><div><p class="dl-row__t">대전 IT 스타트업 전문가 멘토링</p><p class="dl-row__m">정보통신산업진흥원</p></div><b class="num">D-9</b></div>
    <div class="rec-row"><div><p class="dl-row__t">대전 청년창업 지원사업</p><p class="dl-row__m">대전창조경제혁신센터</p></div><b class="num">D-19</b></div>
    <div class="rec-row"><div><p class="dl-row__t">청년창업사관학교 15기</p><p class="dl-row__m">중소벤처기업진흥공단</p></div><b class="num">D-8</b></div>
    <div class="rec-row"><div><p class="dl-row__t">예비창업패키지</p><p class="dl-row__m">창업진흥원</p></div><b class="num">D-12</b></div>
  </div>
</div>
<div class="mock" style="display:flex; flex-direction:column">
  <div class="mock__bar"><b>공고 상담</b></div>
  <div class="mock__body msgs" style="flex:1">
    <div class="msg msg--user">예비창업패키지 지원 자격이 어떻게 되나요?</div>
    <div class="msg msg--ai">공고일 기준 <b>사업자등록 이력이 없는 만 39세 이하 예비창업자</b>가 대상이에요. 다른 정부 창업사업화 지원사업과는 중복 수혜가 안 돼요.</div>
    <div class="msg-src"><b>근거 문서 1건</b><span>[1] 예비창업패키지 모집 공고</span></div>
  </div>
  <div class="ai-foot"><span>메시지를 입력하세요</span><span class="btn btn--primary">전송</span></div>
</div>
</div>

---

<p class="eyebrow">02 · Service ③</p>

# 세법 조문을 찾아 <em>근거와 함께</em> 답하는 세무 AI


<div style="display:grid; grid-template-columns: 0.7fr 1.3fr; gap:28px; align-items:stretch">
<div class="feat" style="display:grid; gap:12px">
  <div class="card" style="padding:18px 20px">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M7 3h8l3 3v15H7zM15 3v4h4M10 12l2 2 3-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div><h3 style="font-size:17px">근거 문서 표시</h3><p>답변마다 DB 검색 근거 링크</p></div>
  </div>
  <div class="card" style="padding:18px 20px">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M6 3h12v18H6zM9 7h6M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div><h3 style="font-size:17px">세금 계산 5종</h3><p>종소세 · 원천세 · VAT 등</p></div>
  </div>
  <div class="card" style="padding:18px 20px">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M4 5h16v11H10l-5 4v-4H4zM8 9h8M8 12.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div><h3 style="font-size:17px">대화방 관리</h3><p>새 대화 · 이름 변경 · 삭제</p></div>
  </div>
  <div class="card" style="padding:18px 20px">
    <span class="card__k card__k--violet"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18ZM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7M12 17v.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div><h3 style="font-size:17px">추가 정보 요청</h3><p>프로필로 채우고 최대 2개만 질문</p></div>
  </div>
</div>
<div class="mock" style="position:relative; display:grid; grid-template-columns: 170px 1fr">
  <div style="border-right:1px solid var(--line); padding:14px 12px; background:var(--ground)">
    <div class="btn btn--primary" style="display:block; text-align:center; margin-bottom:12px">+ 새 대화 시작</div>
    <div class="cvx-g"><span>오늘</span><span>2</span></div>
    <div class="cvx-r is-on"><span>청년창업 세액감면</span><i>✎</i></div>
    <div class="cvx-r"><span>노트북 경비처리</span><i>✎</i></div>
    <div class="cvx-g"><span>어제</span><span>1</span></div>
    <div class="cvx-r"><span>간이 · 일반과세자 차이</span><i>✎</i></div>
  </div>
  <div style="display:flex; flex-direction:column">
    <div class="mock__bar"><span class="brandmark">ON</span><b>AI 세무 Assistant</b></div>
    <div class="faint" style="font-size:11px; text-align:right; padding:6px 14px 0">대화 기록 지우기</div>
    <div class="mock__body msgs" style="flex:1; padding-top:6px">
      <div class="msg msg--user">청년창업 세액감면 대상인지 알려주세요</div>
      <div class="msg msg--ai">프로필 기준으로 <b>나이 · 업종 요건은 충족</b>해요.<br>감면율 판단을 위해 두 가지만 알려주세요.<br>1. 사업장 소재지<br>2. 같은 업종으로 사업한 이력 여부</div>
      <div class="msg-src"><b>근거 문서 1건</b><span>[1] 조세특례제한법 · 제6조(창업중소기업 등에 대한 세액감면)</span></div>
    </div>
    <div class="ai-foot"><span>메시지를 입력하세요</span><span class="btn btn--primary">전송</span></div>
  </div>
</div>
</div>

---

<p class="eyebrow">03 · Tech Stack</p>

# 계층별 <em>기술 스택</em>


<div class="grid-5 stack">
  <div class="card">
    <h3><span class="card__k" style="margin:0; width:30px; height:30px; font-size:12px">FE</span>Frontend</h3>
    <ul>
      <li>React<span>UI Library</span></li>
      <li>Vite<span>Build Tool</span></li>
      <li>Node<span>JS Runtime</span></li>
    </ul>
  </div>
  <div class="card">
    <h3><span class="card__k" style="margin:0; width:30px; height:30px; font-size:12px">BE</span>Backend</h3>
    <ul>
      <li>Python<span>Language</span></li>
      <li>FastAPI<span>REST API</span></li>
      <li>psycopg<span>DB Driver</span></li>
    </ul>
  </div>
  <div class="card">
    <h3><span class="card__k card__k--violet" style="margin:0; width:30px; height:30px; font-size:12px">AI</span>LLM</h3>
    <ul>
      <li>LangGraph<span>Workflow</span></li>
      <li>LangSmith<span>Tracing</span></li>
      <li>OpenAI<span>Chat Model</span></li>
      <li>Cohere<span>Reranking</span></li>
    </ul>
  </div>
  <div class="card">
    <h3><span class="card__k card__k--green" style="margin:0; width:30px; height:30px; font-size:12px">DB</span>Database</h3>
    <ul>
      <li>PostgreSQL<span>Data Store</span></li>
      <li>pgvector<span>Vector Search</span></li>
      <li>DBeaver<span>DB Client</span></li>
    </ul>
  </div>
  <div class="card">
    <h3><span class="card__k card__k--amber" style="margin:0; width:30px; height:30px; font-size:12px">OPS</span>Infra</h3>
    <ul>
      <li>Docker<span>Container</span></li>
      <li>Compose<span>Orchestration</span></li>
      <li>nginx<span>Reverse Proxy</span></li>
      <li>uv<span>Package Manager</span></li>
    </ul>
  </div>
</div>

---

<p class="eyebrow">03 · Architecture</p>

# Docker Compose 기반 <em>시스템 아키텍처</em>

<svg class="arch" viewBox="0 19 1136 431" role="img" aria-label="시스템 아키텍처: USER → Docker Compose(Frontend · Backend · LLM) ↔ 네트워크 통신 ↔ PostgreSQL">
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" style="fill:var(--ink-faint)"/></marker>
    <marker id="ahg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" style="fill:var(--green)"/></marker>
  </defs>
  <!-- USER -->
  <circle cx="60" cy="135" r="32" style="fill:var(--ink)"/>
  <circle cx="60" cy="125" r="8" style="fill:#fff"/>
  <path d="M44 152c0-10.7 5.3-16 16-16s16 5.3 16 16z" style="fill:#fff"/>
  <text x="60" y="194" text-anchor="middle" class="arch-s">USER</text>
  <!-- Docker Compose · Laptop 1 -->
  <rect x="170" y="20" width="946" height="180" rx="24" style="fill:var(--blue-wash); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="206" cy="56" r="20" style="fill:var(--surface-solid)"/>
  <g style="fill:var(--blue-deep)"><rect x="195" y="51" width="6" height="6"/><rect x="203" y="51" width="6" height="6"/><rect x="211" y="51" width="6" height="6"/><rect x="203" y="43" width="6" height="6"/><path d="M191 59h32c-1.7 8.5-7.3 12.8-16.7 12.8S192 67.5 191 59z"/></g>
  <text x="238" y="64" class="arch-h">Docker Compose</text>
  <rect x="1000" y="41" width="96" height="30" rx="15" style="fill:var(--surface-solid); stroke:var(--line-strong)"/>
  <text x="1048" y="61" text-anchor="middle" class="arch-s">Laptop 1</text>
  <rect x="200" y="95" width="270" height="80" rx="18" style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="244" cy="135" r="24" style="fill:var(--blue-wash)"/>
  <path transform="translate(231.5 120)" d="M0 7.5 12.5 0 25 7.5v13.75L12.5 28.75 0 21.25zm0 0 12.5 7.5L25 7.5m-12.5 7.5v13.75" style="fill:none; stroke:var(--blue-deep); stroke-width:2.2; stroke-linejoin:round; stroke-linecap:round"/>
  <text x="282" y="143" class="arch-t">Frontend</text>
  <rect x="530" y="95" width="250" height="80" rx="18" style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="574" cy="135" r="24" style="fill:var(--blue-wash)"/>
  <path transform="translate(561.5 120)" d="M0 7.5 12.5 0 25 7.5v13.75L12.5 28.75 0 21.25zm0 0 12.5 7.5L25 7.5m-12.5 7.5v13.75" style="fill:none; stroke:var(--blue-deep); stroke-width:2.2; stroke-linejoin:round; stroke-linecap:round"/>
  <text x="612" y="143" class="arch-t">Backend</text>
  <rect x="860" y="95" width="236" height="80" rx="18" style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="904" cy="135" r="24" style="fill:var(--violet-wash)"/>
  <path transform="translate(891.5 120)" d="M0 7.5 12.5 0 25 7.5v13.75L12.5 28.75 0 21.25zm0 0 12.5 7.5L25 7.5m-12.5 7.5v13.75" style="fill:none; stroke:var(--violet); stroke-width:2.2; stroke-linejoin:round; stroke-linecap:round"/>
  <text x="942" y="143" class="arch-t">LLM</text>
  <line x1="470" y1="135" x2="522" y2="135" marker-end="url(#ah)" style="stroke:var(--ink-faint); stroke-width:2.5"/>
  <line x1="788" y1="135" x2="852" y2="135" marker-start="url(#ah)" marker-end="url(#ah)" style="stroke:var(--ink-faint); stroke-width:2.5"/>
  <line x1="100" y1="135" x2="196" y2="135" marker-end="url(#ah)" style="stroke:var(--ink-faint); stroke-width:2.5"/>
  <!-- 네트워크 통신 -->
  <path d="M655 185v60h84M978 185v60h-83M817 260v52" style="fill:none; stroke:var(--green); stroke-width:3; stroke-dasharray:10 8; stroke-linecap:round; stroke-linejoin:round"/>
  <path d="M817 312v6" marker-end="url(#ahg)" style="stroke:var(--green); stroke-width:3"/>
  <path d="M655 185v-6" marker-end="url(#ahg)" style="stroke:var(--green); stroke-width:3"/>
  <path d="M978 185v-6" marker-end="url(#ahg)" style="stroke:var(--green); stroke-width:3"/>
  <rect x="739" y="228" width="156" height="34" rx="17" style="fill:var(--green-wash); stroke:var(--green); stroke-width:1.5"/>
  <text x="817" y="251" text-anchor="middle" class="arch-n">네트워크 통신</text>
  <!-- PostgreSQL · Laptop 2 -->
  <rect x="617" y="322" width="400" height="118" rx="24" style="fill:var(--violet-wash); stroke:var(--line-strong); stroke-width:1.5"/>
  <path d="M650 354v44c0 5.5 13.4 10 30 10s30-4.5 30-10v-44" style="fill:var(--surface-solid); stroke:var(--violet); stroke-width:2.2"/>
  <path d="M650 376c0 5.5 13.4 10 30 10s30-4.5 30-10" style="fill:none; stroke:var(--violet); stroke-width:2.2"/>
  <ellipse cx="680" cy="354" rx="30" ry="10" style="fill:var(--surface-solid); stroke:var(--violet); stroke-width:2.2"/>
  <text x="730" y="389" class="arch-t">PostgreSQL</text>
  <rect x="901" y="366" width="96" height="30" rx="15" style="fill:var(--surface-solid); stroke:var(--line-strong)"/>
  <text x="949" y="386" text-anchor="middle" class="arch-s">Laptop 2</text>
</svg>

---

<p class="eyebrow">03 · Data</p>

# 공공 데이터 수집부터 <em>벡터 색인</em>까지

<div class="grid-2" style="grid-template-columns: 1fr 1.1fr; align-items:stretch">
<div class="card">
  <h3>수집 소스 5종</h3>
  <p style="margin-bottom:14px !important">DB/scripts 수집 스크립트 · 지역명 17개 시·도 정규화</p>
  <div style="display:grid; gap:9px">
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:14px">국가법령 · 세법</b><span class="chip chip--blue">tax_documents</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:14px">정부24</b><span class="chip chip--violet">policies</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:14px">K-Startup</b><span class="chip chip--violet">policies · announcements</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:14px">기업마당</b><span class="chip chip--violet">policies · announcements</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:14px">온통청년</b><span class="chip chip--violet">policies · announcements</span></div>
  </div>
</div>
<div style="display:grid; grid-template-rows:auto 1fr; gap:16px">
  <div class="grid-3" style="gap:14px">
    <div class="card" style="padding:18px"><div class="faint" style="font-size:13px">색인 문서</div><b class="num" style="font-size:34px">10,892</b></div>
    <div class="card" style="padding:18px"><div class="faint" style="font-size:13px">청크</div><b class="num" style="font-size:34px">12,613</b></div>
    <div class="card" style="padding:18px"><div class="faint" style="font-size:13px">임베딩</div><b class="num" style="font-size:34px">1536<span style="font-size:16px">d</span></b></div>
  </div>
  <div class="card">
    <h3>핵심 테이블</h3>
    <div class="chips" style="margin:10px 0 16px">
      <span class="chip">users</span><span class="chip">business_profiles</span><span class="chip">chat_messages</span><span class="chip">answer_sources</span><span class="chip">calendar_events</span><span class="chip">saved_policies</span><span class="chip">reminders</span><span class="chip">tax_reduction_results</span>
      <span class="chip chip--blue">rag_documents · VECTOR(1536) HNSW</span><span class="chip chip--blue">tax_rag_cache</span>
    </div>
    <p>청크 1,000자 · overlap 150 · 원본 갱신 시 캐시 무효화</p>
  </div>
</div>
</div>

---

<p class="eyebrow">04 · LangGraph</p>

# 질문을 분류해 <em>도메인별 전문 경로</em>로 보냅니다

<div style="display:grid; grid-template-columns: 1fr 40px 1fr 40px 1fr 40px 1fr; align-items:center;">
  <div class="node"><b>initialize</b><span>입력 · 사용자 조건 정리</span></div>
  <div class="arrow">→</div>
  <div class="node"><b>guardrail</b><span>범위 밖 질문 사전 차단</span></div>
  <div class="arrow">→</div>
  <div class="node"><b>contextualize</b><span>대화 이력 → 독립 질문</span></div>
  <div class="arrow">→</div>
  <div class="node node--accent"><b>router</b><span>Structured Output 분류</span></div>
</div>

<div class="arrow" style="margin:18px 0">↓</div>

<div class="grid-4" style="gap:16px">
  <div class="card"><h3 style="font-size:18px"><i class="dot" style="background:var(--violet)"></i>Policy</h3><p>패싯 검색어 병렬 실행<br>Hybrid 검색 · 정책별 근거</p></div>
  <div class="card"><h3 style="font-size:18px"><i class="dot" style="background:var(--violet)"></i>Notice</h3><p>RAG 없이<br>Backend 실제 공고만 사용</p></div>
  <div class="card"><h3 style="font-size:18px"><i class="dot" style="background:var(--blue)"></i>Tax</h3><p>캐시 · 검색 · 근거 판정 반복<br>최대 3 hop · 세금 계산기</p></div>
  <div class="card"><h3 style="font-size:18px"><i class="dot" style="background:var(--green)"></i>Roadmap</h3><p>범위 판정 + 답변 1회 호출<br>검색 생략</p></div>
</div>

<div class="arrow" style="margin:18px 0">↓</div>

<div class="card card--wash" style="display:flex; align-items:center; gap:24px; padding:22px 26px">
  <b style="font-size:17px; white-space:nowrap">Unified Answer</b>
  <div class="chips">
    <span class="chip chip--green">success</span><span class="chip">need_more_info</span><span class="chip">insufficient_evidence</span><span class="chip">no_result</span><span class="chip">integration_unavailable</span><span class="chip">error</span>
  </div>
  <span class="soft" style="font-size:13.5px; margin-left:auto">출처는 LLM이 아닌 검색 결과와 대조</span>
</div>

---

<p class="eyebrow">04 · Retrieval & Reasoning</p>

# 검색은 <em>하이브리드</em>로, 세무는 <em>여러 번</em> 확인합니다

<div class="grid-2-even" style="gap:28px">
<div class="card">
  <h3>Hybrid Search</h3>
  <p style="margin-bottom:14px !important">의미 검색과 키워드 검색을 합친 뒤 재정렬</p>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
    <div class="node node--wash"><b>Dense</b><span>pgvector · 후보 20</span></div>
    <div class="node node--wash"><b>BM25</b><span>키워드 · 후보 20</span></div>
  </div>
  <div class="arrow" style="margin:3px 0">↓</div>
  <div class="node"><b>RRF 결합</b><span>k = 60</span></div>
  <div class="arrow" style="margin:3px 0">↓</div>
  <div class="node"><b>Cohere Rerank</b><span>rerank-v4.0-fast · 실패 시 RRF 순서로 폴백</span></div>
  <div class="arrow" style="margin:3px 0">↓</div>
  <div class="node node--accent"><b>Top 5 근거</b></div>
</div>
<div class="card">
  <h3>Tax Multi-hop</h3>
  <p style="margin-bottom:14px !important">근거가 부족하면 다음 검색어를 만들어 다시 검색</p>
  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px">
    <div class="node"><b>tax_cache</b><span>재사용 확인</span></div>
    <div class="node"><b>retrieval</b><span>tax_document 필터</span></div>
    <div class="node"><b>evidence</b><span>근거 충분성 판정</span></div>
  </div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px">
    <div class="node node--ghost"><b style="font-size:14px">부족 → next_query</b><span>법령 참조 → 규칙 → LLM 순</span></div>
    <div class="node node--ghost"><b style="font-size:14px">종료 조건</b><span>최대 3 hop · 중복 쿼리 · 신규 근거 없음</span></div>
  </div>
  <div class="card card--wash" style="margin-top:14px; padding:16px 18px">
    <h3 style="font-size:16px">계산은 LLM이 아닌 코드로</h3>
    <p>LLM은 계획만 세우고, 계산은 Python Decimal로 수행</p>
  </div>
</div>
</div>

---

<p class="eyebrow">05 · Evaluation</p>

# 반복 평가로 <em>정확도를 끌어올렸습니다</em>


<div class="grid-4">
  <Metric label="Guardrail 정확도" after="100%" before="100%" delta="유지 · FP 0 / FN 0" />
  <Metric label="정책 검색 Recall@5" after="74.6%" before="64.3%" delta="+10.3%p" note="반복 실행 범위 71.4~74.6%" />
  <Metric label="세금 턴 통과율" after="77.4%" before="66.1%" delta="+11.3%p" note="legal_evidence 22.2% → 55.6%" />
  <Metric label="로드맵 턴 통과율" after="93.5%" before="91.9%" delta="+1.6%p" />
</div>

<div class="card" style="margin-top:28px; display:flex; gap:24px; align-items:center; padding:20px 26px">
  <b style="white-space:nowrap; font-size:15px">해석 주의</b>
  <p>holdout을 개선 과정에서 반복 사용해 일반화 성능은 미검증 · 세금 통과율은 route · status · grounded 자동 채점 기준</p>
</div>

---

<p class="eyebrow">05 · Semantic Cache</p>

# 정확도는 그대로, 세금 응답은 <em>30% 빠르게</em>


<div class="grid-3">
  <Metric label="평가셋 평균 응답 (62턴)" after="12.46s" before="17.69s" delta="−29.6% · 통과율 77.4% 유지" />
  <Metric label="실제 프론트 요청 평균" after="19.89s" before="25.60s" delta="−22.3% · 30초 이상 4건 → 2건" />
  <Metric label="표현만 다른 감면 질문" after="11.2s" before="26.0s" delta="−56.9%" />
</div>

<div class="eyebrow" style="margin-top:36px !important">3단계 Semantic Cache</div>
<div style="display:grid; grid-template-columns: 1fr 40px 1fr 40px 1fr; align-items:center">
  <div class="node"><b>① 키 정확 일치</b><span>질문 · 사용자 조건 · 이전 근거 id</span></div>
  <div class="arrow">→</div>
  <div class="node"><b>② 유사도 ≥ 0.95</b><span>질문 임베딩 코사인 상위 5건 → 근거 재사용</span></div>
  <div class="arrow">→</div>
  <div class="node node--accent"><b>③ 유사도 ≥ 0.98</b><span>판정 서명 동일 시 판정까지 재사용</span></div>
</div>

---

<p class="eyebrow">06 · Troubleshooting</p>

# 통합 과정에서 만난 <em>주요 문제</em>

<div>
  <div class="fix-row">
    <span class="fix-row__n">01</span>
    <div><span class="fix-row__tag neg">원인</span><h4>Backend 쓰기 작업이 벡터 인덱스를 삭제</h4><p>TRUNCATE … CASCADE가 rag_documents까지 비움</p></div>
    <span class="arrow">→</span>
    <div><span class="fix-row__tag pos">조치</span><h4>덤프 경로 제거</h4><p>RAG 색인이 Backend 쓰기에 영향받지 않도록 수정</p></div>
  </div>
  <div class="fix-row">
    <span class="fix-row__n">02</span>
    <div><span class="fix-row__tag neg">원인</span><h4>병합 중 App.jsx 통합 로직 유실</h4><p>파일 단위 충돌 해결이 이전 조치를 되돌림</p></div>
    <span class="arrow">→</span>
    <div><span class="fix-row__tag pos">조치</span><h4>복구 + 병합 절차 정립</h4><p>diff3로 base 확인, 병합 직후 diff 점검</p></div>
  </div>
  <div class="fix-row">
    <span class="fix-row__n">03</span>
    <div><span class="fix-row__tag neg">원인</span><h4>빈 ids로 대화방 삭제 시 전체 기록 삭제</h4><p>쿼리 빌더가 빈 값을 빼며 전체 삭제 요청으로 변환</p></div>
    <span class="arrow">→</span>
    <div><span class="fix-row__tag pos">조치</span><h4>빈 ids는 요청 전 차단</h4><p>API 호출 없이 reject 처리</p></div>
  </div>
  <div class="fix-row">
    <span class="fix-row__n">04</span>
    <div><span class="fix-row__tag neg">원인</span><h4>세금 답변 30초 이상 지연</h4><p>근거 판정 LLM 반복 호출 · 불필요한 문맥 복원 호출</p></div>
    <span class="arrow">→</span>
    <div><span class="fix-row__tag pos">조치</span><h4>추론 강도 low · Semantic Cache</h4><p>그래프 재사용 · 커넥션 풀 · 문맥 복원 생략</p></div>
  </div>
</div>

---

<p class="eyebrow">06 · Next</p>

# 한계와 <em>향후 과제</em>

<div class="grid-3 problem">
  <div class="card">
    <span class="card__k card__k--violet">AI</span>
    <h3>LLM 품질 · 속도</h3>
    <ul class="soft" style="margin:14px 0 0; padding-left:20px; line-height:2.2">
      <li style="font-size:17px">응답 스트리밍 미지원</li>
      <li style="font-size:17px">법령 근거 유형 55.6%로 취약</li>
      <li style="font-size:17px">새 holdout 재검증 · 캐시 적중률 평가</li>
    </ul>
  </div>
  <div class="card">
    <span class="card__k">BE</span>
    <h3>Backend · 인프라</h3>
    <ul class="soft" style="margin:14px 0 0; padding-left:20px; line-height:2.2">
      <li style="font-size:17px">동기 LLM 호출의 워커 점유</li>
      <li style="font-size:17px">대화방이 브라우저 저장소에 종속</li>
      <li style="font-size:17px">HTTPS 미적용 · 단일 서버 의존</li>
    </ul>
  </div>
  <div class="card">
    <span class="card__k card__k--green">FE</span>
    <h3>기능 확장</h3>
    <ul class="soft" style="margin:14px 0 0; padding-left:20px; line-height:2.2">
      <li style="font-size:17px">영수증 OCR · 지출 분석 화면</li>
      <li style="font-size:17px">공고문 붙여넣기 요약 화면</li>
      <li style="font-size:17px">오류율 · 응답 품질 모니터링</li>
    </ul>
  </div>
</div>

---
layout: cover
---

<div style="text-align:center">
  <p class="eyebrow">Thank you</p>
  <h1 style="font-size:64px; margin:0 0 12px">Q &amp; A</h1>
  <p class="lead" style="margin:0 auto 44px !important">창업ON · 청년 창업 &amp; 세금 내비게이터</p>
  <div class="grid-4" style="max-width:960px; margin:0 auto; text-align:left">
    <div class="card" style="padding:16px 20px"><b>팀원 A</b><p>역할 · 담당 영역</p></div>
    <div class="card" style="padding:16px 20px"><b>팀원 B</b><p>역할 · 담당 영역</p></div>
    <div class="card" style="padding:16px 20px"><b>팀원 C</b><p>역할 · 담당 영역</p></div>
    <div class="card" style="padding:16px 20px"><b>팀원 D</b><p>역할 · 담당 영역</p></div>
  </div>
</div>
