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
  <p class="lead" style="margin-bottom:40px !important">청년 · 1인 창업자 맞춤형 AI 행정·재정 지원 플랫폼</p>
</div>

---

<p class="eyebrow">Agenda</p>

# 목차

<div class="agenda">
  <div class="card agenda__item"><span class="agenda__n">01</span><span class="agenda__t">배경과 문제</span></div>
  <div class="card agenda__item"><span class="agenda__n">02</span><span class="agenda__t">서비스 소개</span></div>
  <div class="card agenda__item"><span class="agenda__n">03</span><span class="agenda__t">시스템 구성</span></div>
  <div class="card agenda__item"><span class="agenda__n">04</span><span class="agenda__t">LLM · RAG</span></div>
  <div class="card agenda__item"><span class="agenda__n">05</span><span class="agenda__t">평가</span></div>
  <div class="card agenda__item"><span class="agenda__n">06</span><span class="agenda__t">향후 계획</span></div>
</div>

---

<p class="eyebrow">01 · Problem</p>

# 창업자는 <em>정보를 찾는 일</em>에 너무 많은 시간을 씁니다


<div class="flow-merge">
<div class="problem problem--row problem--flow">
  <div class="card">
    <span class="card__k card__k--red"><svg viewBox="0 0 24 24"><path d="m7.5 16.5 9-9M8.5 6.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM15.5 13.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
    <h3>복잡한 세액감면 조건</h3>
  </div>
  <div class="card">
    <span class="card__k card__k--violet"><svg viewBox="0 0 24 24"><path d="M4 6h7v5H4zM13 6h7v5h-7zM4 13h7v5H4zM13 13h7v5h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
    <h3>흩어진 지원사업</h3>
  </div>
  <div class="card">
    <span class="card__k"><svg viewBox="0 0 24 24"><path d="M7 3h8l3 3v15H7zM15 3v4h4M10 12h5M10 16h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
    <h3>긴 공고문</h3>
  </div>
  <div class="card">
    <span class="card__k card__k--red"><svg viewBox="0 0 24 24"><path d="M12 4 3 20h18L12 4ZM12 10v4M12 17v.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <h3>일반 AI의 환각</h3>
  </div>
</div>
<!-- 카드 안쪽 모서리에서 가운데로 모여 하단 창업ON 박스로 향하는 연결선 (카드 380×112, 행 간격 24 기준) -->
<svg class="flow-merge__lines" viewBox="0 0 1136 304" aria-hidden="true">
  <defs><marker id="flow-merge-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z"/></marker></defs>
  <path d="M380 56H548Q568 56 568 76M756 56H588Q568 56 568 76M380 192H548Q568 192 568 212M756 192H588Q568 192 568 212"/>
  <path d="M568 76V298" marker-end="url(#flow-merge-head)"/>
</svg>
</div>

<div class="card card--wash" style="width:fit-content; margin:0 auto; display:flex; align-items:center; gap:20px; padding:22px 28px">
  <span class="brandmark" style="width:36px; height:36px; border-radius:10px; font-size:13px">ON</span>
  <p style="margin:0; font-size:19px !important; color:var(--ink)"><b>창업ON</b> — 흩어진 정보를 한 곳에 모으고, <em>근거 문서 안에서만</em> 답하는 AI로 해결</p>
</div>

---

<p class="eyebrow">02 · Solution</p>

# 문서 범위 안에서만 답하는 <em>개인화 AI 내비게이터</em>


<div style="display:flex; align-items:flex-start; margin-top:20px">
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

<div class="grid-3 principle" style="margin-top:80px">
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
  <circle cx="206" cy="56" r="20" style="fill:var(--surface-solid); stroke:var(--blue-deep); stroke-opacity:0.35; stroke-width:1.5"/>
  <g style="fill:var(--blue-deep)"><rect x="195" y="51" width="6" height="6"/><rect x="203" y="51" width="6" height="6"/><rect x="211" y="51" width="6" height="6"/><rect x="203" y="43" width="6" height="6"/><path d="M191 59h32c-1.7 8.5-7.3 12.8-16.7 12.8S192 67.5 191 59z"/></g>
  <text x="238" y="64" class="arch-h">Docker Compose</text>
  <rect x="1000" y="41" width="96" height="30" rx="15" style="fill:var(--surface-solid); stroke:var(--line-strong)"/>
  <text x="1048" y="61" text-anchor="middle" class="arch-s">Laptop 1</text>
  <rect x="200" y="95" width="270" height="80" rx="18" style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="244" cy="135" r="24" style="fill:var(--blue-wash); stroke:var(--blue-deep); stroke-opacity:0.35; stroke-width:1.5"/>
  <path transform="translate(231.5 120)" d="M0 7.5 12.5 0 25 7.5v13.75L12.5 28.75 0 21.25zm0 0 12.5 7.5L25 7.5m-12.5 7.5v13.75" style="fill:none; stroke:var(--blue-deep); stroke-width:2.2; stroke-linejoin:round; stroke-linecap:round"/>
  <text x="282" y="143" class="arch-t">Frontend</text>
  <rect x="530" y="95" width="250" height="80" rx="18" style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="574" cy="135" r="24" style="fill:var(--blue-wash); stroke:var(--blue-deep); stroke-opacity:0.35; stroke-width:1.5"/>
  <path transform="translate(561.5 120)" d="M0 7.5 12.5 0 25 7.5v13.75L12.5 28.75 0 21.25zm0 0 12.5 7.5L25 7.5m-12.5 7.5v13.75" style="fill:none; stroke:var(--blue-deep); stroke-width:2.2; stroke-linejoin:round; stroke-linecap:round"/>
  <text x="612" y="143" class="arch-t">Backend</text>
  <rect x="860" y="95" width="236" height="80" rx="18" style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5"/>
  <circle cx="904" cy="135" r="24" style="fill:var(--violet-wash); stroke:var(--violet); stroke-opacity:0.35; stroke-width:1.5"/>
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
  <rect x="901" y="336" width="96" height="30" rx="15" style="fill:var(--surface-solid); stroke:var(--line-strong)"/>
  <text x="949" y="356" text-anchor="middle" class="arch-s">Laptop 2</text>
</svg>

---

<p class="eyebrow">03 · Data</p>

# 공공 데이터 수집부터 <em>벡터 색인</em>까지

<div class="grid-2" style="grid-template-columns: 1fr 1.1fr; align-items:stretch">
<div class="card">
  <h3>수집 소스 5종</h3>
  <div style="display:grid; gap:9px; margin-top:24px">
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:18px">국가법령 · 세법</b><span class="chip chip--blue">tax_documents</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:18px">정부24</b><span class="chip chip--violet">policies</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:18px">K-Startup</b><span class="chip chip--violet">policies · announcements</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:18px">기업마당</b><span class="chip chip--violet">policies · announcements</span></div>
    <div class="node" style="text-align:left; display:flex; justify-content:space-between; align-items:center; padding:10px 14px"><b style="font-size:18px">온통청년</b><span class="chip chip--violet">policies · announcements</span></div>
  </div>
</div>
<div style="display:grid; grid-template-rows:auto 1fr; gap:16px">
  <div class="grid-3" style="gap:14px">
    <div class="card" style="padding:18px"><div class="faint" style="font-size:13px">색인 문서</div><b class="num" style="font-size:34px">10,892</b></div>
    <div class="card" style="padding:18px"><div class="faint" style="font-size:13px">청크</div><b class="num" style="font-size:34px">12,613</b></div>
    <div class="card" style="padding:18px"><div class="faint" style="font-size:13px">임베딩</div><b class="num" style="font-size:34px">1,536<span style="font-size:16px">d</span></b></div>
  </div>
  <div class="card">
    <h3>핵심 테이블</h3>
    <div class="chips" style="margin:10px 0 16px">
      <span class="chip">users</span><span class="chip">business_profiles</span><span class="chip">chat_messages</span><span class="chip">answer_sources</span><span class="chip">calendar_events</span><span class="chip">saved_policies</span><span class="chip">reminders</span><span class="chip">tax_reduction_results</span>
      <span class="chip chip--blue">rag_documents · VECTOR(1536) HNSW</span><span class="chip chip--blue">tax_rag_cache</span>
    </div>
  </div>
</div>
</div>

<style>
.chip { font-size: 16px; font-weight: 600; padding: 5px 13px; border-color: var(--line-strong); }
.chip--blue { border-color: rgba(36, 103, 230, 0.35); }
.chip--violet { border-color: rgba(124, 92, 240, 0.35); }
.chips { gap: 8px; }
.node { border-color: rgba(31, 45, 90, 0.24); }
</style>

---

<p class="eyebrow">04 · LangGraph</p>

# 질문을 분류해 <em>도메인별 전문 경로</em>로 보냅니다

<svg class="arch" viewBox="0 -2 1136 462" role="img" aria-label="LangGraph 처리 흐름: 전처리 → Router 분기(정책 · 공고 · 세금) → LLM Unified Answer">
  <defs>
    <marker id="lg-a" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0 0 10 5 0 10z" style="fill:var(--ink-faint)"/></marker>
    <marker id="lg-b" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0 0 10 5 0 10z" style="fill:var(--blue)"/></marker>
    <linearGradient id="lg-brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--blue)"/><stop offset="1" style="stop-color:var(--violet)"/></linearGradient>
  </defs>
  <!-- 공통 전처리 -->
  <g style="stroke:var(--line-strong); stroke-width:1.5">
    <rect x="0" y="0" width="184" height="44" rx="14" style="fill:var(--blue-wash); stroke:none"/>
    <rect x="238" y="0" width="184" height="44" rx="14" style="fill:var(--surface-solid)"/>
    <rect x="476" y="0" width="184" height="44" rx="14" style="fill:var(--surface-solid)"/>
    <rect x="714" y="0" width="184" height="44" rx="14" style="fill:var(--surface-solid)"/>
    <rect x="952" y="0" width="184" height="44" rx="14" style="fill:url(#lg-brand); stroke:none"/>
    <rect x="398" y="58" width="164" height="32" rx="12" style="fill:var(--surface-solid)"/>
  </g>
  <g text-anchor="middle" style="font-size:15px; font-weight:700; fill:var(--ink)">
    <text x="92" y="27">사용자 질문</text>
    <text x="330" y="27">Initialize</text>
    <text x="568" y="27">Guardrail</text>
    <text x="806" y="27">Contextualize</text>
    <text x="1044" y="27" style="fill:#fff">Router</text>
    <text x="480" y="79" style="font-size:14px">Roadmap Coach</text>
  </g>
  <g style="fill:none; stroke:var(--ink-faint); stroke-width:2">
    <path d="M190 22H232" marker-end="url(#lg-a)"/>
    <path d="M428 22H470" marker-end="url(#lg-a)"/>
    <path d="M666 22H708" marker-end="url(#lg-a)"/>
    <path d="M904 22H946" marker-end="url(#lg-a)"/>
    <path d="M330 44V74H392" marker-end="url(#lg-a)" style="stroke-dasharray:5 5"/>
    <path d="M562 74H608" marker-end="url(#lg-a)" style="stroke-dasharray:5 5"/>
  </g>
  <rect x="614" y="60" width="100" height="28" rx="14" style="fill:var(--green-wash)"/>
  <text x="664" y="79" text-anchor="middle" style="font-size:14px; font-weight:700; fill:var(--green)">응답 종료</text>
  <text x="364" y="68" text-anchor="middle" style="font-size:12px; font-weight:600; fill:var(--ink-faint)">로드맵</text>
  <!-- Router 분기 -->
  <path d="M1044 44V104H125" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <path d="M125 104V118" marker-end="url(#lg-a)" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <path d="M395 104V118" marker-end="url(#lg-a)" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <path d="M838 104V118" marker-end="url(#lg-a)" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <!-- 도메인 패널 -->
  <g style="stroke:var(--line-strong); stroke-width:1.5">
    <rect x="0" y="120" width="250" height="262" rx="22" style="fill:var(--violet-wash)"/>
    <rect x="270" y="120" width="250" height="262" rx="22" style="fill:var(--violet-wash)"/>
    <rect x="540" y="120" width="596" height="262" rx="22" style="fill:var(--blue-wash)"/>
  </g>
  <circle cx="24" cy="146" r="5" style="fill:var(--violet)"/>
  <circle cx="294" cy="146" r="5" style="fill:var(--violet)"/>
  <circle cx="564" cy="146" r="5" style="fill:var(--blue)"/>
  <g style="font-size:17px; font-weight:700; fill:var(--ink)">
    <text x="36" y="152">정책 검색</text>
    <text x="306" y="152">공고 조회</text>
    <text x="576" y="152">세금 질의 · 계산</text>
  </g>
  <g style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5">
    <!-- 정책 -->
    <rect x="22" y="176" width="206" height="34" rx="12"/>
    <rect x="22" y="244" width="206" height="34" rx="12"/>
    <rect x="22" y="312" width="206" height="34" rx="12"/>
    <!-- 공고 -->
    <rect x="292" y="244" width="206" height="34" rx="12"/>
    <rect x="292" y="312" width="206" height="34" rx="12"/>
    <!-- 세금 -->
    <rect x="748" y="132" width="180" height="32" rx="12"/>
    <rect x="616" y="226" width="168" height="32" rx="12"/>
    <rect x="902" y="226" width="168" height="32" rx="12"/>
    <rect x="616" y="290" width="168" height="32" rx="12"/>
    <rect x="902" y="290" width="168" height="32" rx="12"/>
  </g>
  <rect x="306" y="178" width="178" height="30" rx="12" style="fill:none; stroke:var(--line-strong); stroke-width:1.5; stroke-dasharray:5 4"/>
  <rect x="778" y="182" width="120" height="26" rx="13" style="fill:var(--surface-solid); stroke:var(--blue); stroke-width:1.5"/>
  <rect x="624" y="340" width="152" height="28" rx="14" style="fill:var(--surface-solid); stroke:var(--blue); stroke-width:1.5"/>
  <rect x="906" y="340" width="160" height="28" rx="14" style="fill:var(--surface-solid); stroke:var(--blue); stroke-width:1.5"/>
  <g text-anchor="middle" style="font-size:14px; font-weight:700; fill:var(--ink)">
    <text x="125" y="198">개인화 검색어</text>
    <text x="125" y="266">Hybrid Search</text>
    <text x="125" y="334">RRF · Rerank</text>
    <text x="395" y="266">Backend 공고 결과</text>
    <text x="395" y="334">Answer Context</text>
    <text x="838" y="153">질문 의도 판별</text>
    <text x="700" y="247">근거 검색</text>
    <text x="986" y="247">계산 계획</text>
    <text x="700" y="311">근거 검증</text>
    <text x="986" y="311">Calculator</text>
    <text x="838" y="200" style="fill:var(--blue-deep)">계산 필요?</text>
    <text x="700" y="359" style="fill:var(--blue-deep)">근거 기반 답변</text>
    <text x="986" y="359" style="fill:var(--blue-deep)">계산 결과 → LLM</text>
    <text x="395" y="198" style="font-weight:600; fill:var(--ink-soft)">Vector RAG 미사용</text>
  </g>
  <g style="fill:none; stroke:var(--ink-faint); stroke-width:2" marker-end="url(#lg-a)">
    <path d="M125 212V242"/>
    <path d="M125 280V310"/>
    <path d="M395 280V310"/>
    <path d="M838 166V180"/>
    <path d="M700 260V288"/>
    <path d="M986 260V288"/>
    <path d="M700 324V338"/>
    <path d="M986 324V338"/>
    <path d="M616 306H598V242H614" style="stroke-dasharray:5 5"/>
    <path d="M902 242H788" style="stroke-dasharray:5 5"/>
  </g>
  <g style="fill:none; stroke:var(--blue); stroke-width:2" marker-end="url(#lg-b)">
    <path d="M778 195H700V224"/>
    <path d="M898 195H986V224"/>
    <path d="M784 306H900"/>
  </g>
  <g text-anchor="middle" style="font-size:12px; font-weight:700">
    <text x="739" y="189" style="fill:var(--blue)">NO</text>
    <text x="942" y="189" style="fill:var(--blue)">YES</text>
    <text x="843" y="300" style="fill:var(--blue)">근거 확인 후 계산</text>
    <text x="843" y="236" style="fill:var(--ink-faint)">법적 근거 필요</text>
    <text x="570" y="278" style="fill:var(--ink-faint)">재검색</text>
    <text x="1024" y="279" style="fill:var(--ink-faint)">직접 계산</text>
  </g>
  <!-- 공통 응답 -->
  <path d="M125 346V398H986M395 346V398M700 368V398M986 368V398" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <path d="M568 398V412" marker-end="url(#lg-a)" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <path d="M728 436H774" marker-end="url(#lg-a)" style="fill:none; stroke:var(--ink-faint); stroke-width:2"/>
  <rect x="408" y="414" width="320" height="44" rx="14" style="fill:url(#lg-brand)"/>
  <text x="568" y="442" text-anchor="middle" style="font-size:17px; font-weight:700; fill:#fff">LLM Unified Answer</text>
  <rect x="780" y="422" width="100" height="28" rx="14" style="fill:var(--green-wash); stroke:var(--green); stroke-width:1.5"/>
  <text x="830" y="441" text-anchor="middle" style="font-size:14px; font-weight:700; fill:var(--green)">응답 완료</text>
</svg>

---

<p class="eyebrow">04 · Retrieval & Reasoning</p>

# 정책은 <em>하이브리드 검색</em>, 세금은 <em>근거 검증 후 계산</em>

<svg class="arch" viewBox="0 -2 1136 444" role="img" aria-label="Retrieval & Reasoning: 정책 Hybrid Search 흐름과 세금 근거 검증 · 계산 흐름">
  <defs>
    <marker id="rr-a" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0 0 10 5 0 10z" style="fill:var(--ink-faint)"/></marker>
    <marker id="rr-b" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0 0 10 5 0 10z" style="fill:var(--blue)"/></marker>
  </defs>
  <!-- 패널 -->
  <g style="stroke:var(--line-strong); stroke-width:1.5">
    <rect x="0" y="0" width="520" height="440" rx="22" style="fill:var(--violet-wash)"/>
    <rect x="540" y="0" width="596" height="440" rx="22" style="fill:var(--blue-wash)"/>
  </g>
  <circle cx="24" cy="30" r="5" style="fill:var(--violet)"/>
  <circle cx="564" cy="30" r="5" style="fill:var(--blue)"/>
  <g style="font-size:17px; font-weight:700; fill:var(--ink)">
    <text x="36" y="36">정책 검색 · Hybrid Search</text>
    <text x="576" y="36">세금 질의 · 계산</text>
  </g>
  <!-- 노드 -->
  <g style="fill:var(--surface-solid); stroke:var(--line-strong); stroke-width:1.5">
    <rect x="140" y="64" width="240" height="40" rx="12"/>
    <rect x="70" y="152" width="180" height="40" rx="12"/>
    <rect x="270" y="152" width="180" height="40" rx="12"/>
    <rect x="140" y="240" width="240" height="40" rx="12"/>
    <rect x="140" y="310" width="240" height="40" rx="12"/>
    <rect x="748" y="58" width="180" height="36" rx="12"/>
    <rect x="620" y="180" width="180" height="36" rx="12"/>
    <rect x="620" y="244" width="180" height="36" rx="12"/>
    <rect x="620" y="308" width="180" height="36" rx="12"/>
    <rect x="900" y="180" width="180" height="36" rx="12"/>
    <rect x="900" y="308" width="180" height="36" rx="12"/>
  </g>
  <g style="fill:var(--surface-solid); stroke:var(--blue); stroke-width:1.5">
    <rect x="773" y="118" width="130" height="28" rx="14"/>
    <rect x="170" y="380" width="180" height="32" rx="16"/>
    <rect x="630" y="376" width="160" height="30" rx="15"/>
    <rect x="905" y="376" width="170" height="30" rx="15"/>
  </g>
  <g text-anchor="middle" style="font-size:15px; font-weight:700; fill:var(--ink)">
    <text x="260" y="89">개인화 검색어</text>
    <text x="160" y="177">Dense 검색</text>
    <text x="360" y="177">BM25 검색</text>
    <text x="260" y="265">RRF 결합</text>
    <text x="260" y="335">Rerank</text>
    <text x="838" y="81">질문 의도 판별</text>
    <text x="710" y="203">Cache 확인</text>
    <text x="710" y="267">Hybrid Retrieval</text>
    <text x="710" y="331">Evidence Check</text>
    <text x="990" y="203">계산 계획</text>
    <text x="990" y="331">Calculator</text>
  </g>
  <g text-anchor="middle" style="font-size:14px; font-weight:700; fill:var(--blue-deep)">
    <text x="838" y="137">계산 필요?</text>
    <text x="260" y="401">정책별 근거 → LLM</text>
    <text x="710" y="396">근거 기반 답변</text>
    <text x="990" y="396">계산 결과 → LLM</text>
  </g>
  <!-- 정책 연결 -->
  <g style="fill:none; stroke:var(--ink-faint); stroke-width:2">
    <path d="M260 104V124H160V150" marker-end="url(#rr-a)"/>
    <path d="M260 124H360V150" marker-end="url(#rr-a)"/>
    <path d="M160 192V212H360V192"/>
    <path d="M260 212V238" marker-end="url(#rr-a)"/>
    <path d="M260 280V308" marker-end="url(#rr-a)"/>
    <path d="M260 350V378" marker-end="url(#rr-a)"/>
  </g>
  <!-- 세금 연결 -->
  <g style="fill:none; stroke:var(--ink-faint); stroke-width:2" marker-end="url(#rr-a)">
    <path d="M838 94V116"/>
    <path d="M710 216V242"/>
    <path d="M710 280V306"/>
    <path d="M710 344V374"/>
    <path d="M990 216V306"/>
    <path d="M990 344V374"/>
    <path d="M620 326H596V262H618" style="stroke-dasharray:5 5"/>
    <path d="M900 198H802" style="stroke-dasharray:5 5"/>
  </g>
  <g style="fill:none; stroke:var(--blue); stroke-width:2" marker-end="url(#rr-b)">
    <path d="M773 132H710V178"/>
    <path d="M903 132H990V178"/>
    <path d="M800 326H898"/>
  </g>
  <g text-anchor="middle" style="font-size:12px; font-weight:700">
    <text x="741" y="124" style="fill:var(--blue)">NO</text>
    <text x="946" y="124" style="fill:var(--blue)">YES</text>
    <text x="850" y="318" style="fill:var(--blue)">근거 확인 후</text>
    <text x="850" y="190" style="fill:var(--ink-faint)">법적 근거 필요</text>
    <text x="571" y="298" style="fill:var(--ink-faint)">재검색</text>
    <text x="1026" y="265" style="fill:var(--ink-faint)">직접 계산</text>
  </g>
</svg>

---

<p class="eyebrow">05 · Evaluation</p>

# 반복 평가로 <em>정확도를 끌어올렸습니다</em>


<div class="grid-4 eval">
  <Metric label="Guardrail 정확도" after="100%" before="100%" delta="유지 · FP 0 / FN 0" />
  <Metric label="정책 검색 Recall@5" after="74.6%" before="64.3%" delta="+10.3%p"/>
  <Metric label="세금 턴 통과율" after="77.4%" before="66.1%" delta="+11.3%p"/>
  <Metric label="로드맵 턴 통과율" after="93.5%" before="91.9%" delta="+1.6%p" />
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

<div class="ts-cand">
  <b>추가 후보 · 회의 선정용</b>
  <ol>
    <li>속도↔정확도: 근거 판정 축소 −5초, 통과율 −11.3%p</li>
    <li>평가 왜곡: Rerank 한도·색인 누락이 “빠른 응답”</li>
    <li>암묵적 프로필 질문 검색 실패 (R@5 51.6%)</li>
    <li>세금 법적 근거 답변 4/18턴 통과</li>
    <li>경로 분리(V2)만으로는 성능 오히려 하락</li>
    <li>근거 확정 전 스트리밍 불가 → 진행 상태 표시</li>
    <li>감면 계산이 사용자 입력 6개 요구</li>
    <li>동기 HTTP, 동시 요청 시 서버 정지 위험</li>
  </ol>
</div>

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

# 한계와 <em>향후 계획</em>

<div class="grid-3 problem">
  <div class="card">
    <div class="card__head">
      <span class="card__k card__k--violet" style="width:64px; height:64px; font-size:21px; border-radius:16px">AI</span>
      <h3 style="font-size:28px">개선 방안</h3>
    </div>
    <ul class="soft" style="margin:18px 0 0; padding-left:24px; line-height:2">
      <li style="font-size:20px">LLM 응답 스트리밍 지원</li>
      <li style="font-size:20px">비동기식 LLM 호출</li>
    </ul>
  </div>
  <div class="card">
    <div class="card__head">
      <span class="card__k card__k--green" style="width:64px; height:64px; font-size:21px; border-radius:16px">NEW</span>
      <h3 style="font-size:28px">기능 확장</h3>
    </div>
    <ul class="soft" style="margin:18px 0 0; padding-left:24px; line-height:2">
      <li style="font-size:20px">영수증 OCR</li>
      <li style="font-size:20px">공고문 요약</li>
    </ul>
  </div>
  <div class="card">
    <div class="card__head">
      <span class="card__k card__k--amber" style="width:64px; height:64px; font-size:21px; border-radius:16px">OPS</span>
      <h3 style="font-size:28px">앱 빌드 · 배포</h3>
    </div>
    <ul class="soft" style="margin:18px 0 0; padding-left:24px; line-height:2">
      <li style="font-size:20px">앱 환경 지원</li>
      <li style="font-size:20px">AWS 실서비스 배포</li>
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
