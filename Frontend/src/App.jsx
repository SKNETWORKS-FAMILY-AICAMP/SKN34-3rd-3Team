import { useCallback, useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_LLM_API_URL ?? "http://localhost:8001")
  .replace(/\/$/, "");
const BACKEND_URL = (import.meta.env.VITE_BACKEND_API_URL ?? "http://localhost:8000")
  .replace(/\/$/, "");

const LABELS = {
  llm: "LLM 모델",
  embedding: "Embedding 모델",
  data_source: "Vector Store",
};

const SAMPLE_QUESTIONS = {
  policy: "예비창업자가 받을 수 있는 지원 정책 알려줘.",
  notice: "서울에서 지금 신청 가능한 창업 지원사업 있어?",
  tax: "청년창업 세액감면이 뭐야?",
};

const SAMPLE_NOTICES = JSON.stringify(
  [
    {
      id: 7,
      title: "서울 청년창업 지원사업",
      region: "서울",
      applyStartDate: "2026-09-01",
      applyEndDate: "2026-09-30",
      sourceUrl: "https://example.com/notices/7",
      benefit: "사업화 자금 및 창업 교육",
    },
  ],
  null,
  2,
);

async function apiRequest(path, options = {}, baseUrl = API_URL) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body.detail === "string"
      ? body.detail
      : JSON.stringify(body.detail ?? body);
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return body;
}

function StatusBadge({ state }) {
  const configured = ["configured", "postgres", "in_memory"].includes(state);
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
      configured
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700"
    }`}>
      {state ?? "확인 불가"}
    </span>
  );
}

function App() {
  const [testMode, setTestMode] = useState("backend");
  const [health, setHealth] = useState(null);
  const [ready, setReady] = useState(null);
  const [category, setCategory] = useState("policy");
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS.policy);
  const [sendContext, setSendContext] = useState(true);
  const [context, setContext] = useState({
    userId: "1",
    age: "29",
    region: "서울",
    businessType: "간이과세자",
    industry: "소프트웨어",
    businessRegisteredAt: "2024-03-01",
    foundedAt: "2024-03-01",
  });
  const [noticeJson, setNoticeJson] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("demo@demo.com");
  const [password, setPassword] = useState("demo123");
  const [accessToken, setAccessToken] = useState("");

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [healthResult, readyResult] = await Promise.all([
        apiRequest("/health"),
        apiRequest("/rag/ready"),
      ]);
      setHealth(healthResult);
      setReady(readyResult);
    } catch (requestError) {
      setHealth(null);
      setReady(null);
      setError(`LLM 서비스에 연결하지 못했습니다. (${requestError.message})`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  function selectScenario(route) {
    setQuestion(SAMPLE_QUESTIONS[route]);
    setCategory(route === "tax" ? "tax" : "policy");
    setNoticeJson(route === "notice" ? SAMPLE_NOTICES : "");
    setAnswer(null);
    setError("");
  }

  function updateContext(field, value) {
    setContext((current) => ({ ...current, [field]: value }));
  }

  async function createIndex(force = false) {
    setIndexing(true);
    setError("");
    try {
      await apiRequest("/rag/reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: [], force }),
      });
      await checkStatus();
    } catch (requestError) {
      setError(`인덱스를 생성하지 못했습니다. (${requestError.message})`);
    } finally {
      setIndexing(false);
    }
  }

  async function submitQuestion(event) {
    event.preventDefault();
    setAnswering(true);
    setError("");
    setAnswer(null);
    try {
      if (testMode === "backend") {
        if (!accessToken) {
          throw new Error("먼저 Backend 데모 계정으로 로그인하세요.");
        }
        const chat = await apiRequest(
          "/chat/messages",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ category, question }),
          },
          BACKEND_URL,
        );
        const sourceResult = await apiRequest(
          `/chat/messages/${chat.messageId}/sources`,
          { headers: { "Authorization": `Bearer ${accessToken}` } },
          BACKEND_URL,
        );
        setAnswer({
          ...chat,
          route: category,
          status: chat.llmUsed
            ? (chat.grounded ? "success" : "need_more_info")
            : "backend_fallback",
          sources: sourceResult.sources ?? [],
        });
        return;
      }
      const payload = { category, question };
      if (sendContext) {
        payload.userContext = {
          ...context,
          userId: Number(context.userId),
          age: context.age ? Number(context.age) : null,
        };
      }
      if (noticeJson.trim()) {
        const parsed = JSON.parse(noticeJson);
        if (!Array.isArray(parsed)) {
          throw new Error("Notice 결과는 JSON 배열이어야 합니다.");
        }
        payload.noticeResults = parsed;
      }
      setAnswer(
        await apiRequest("/rag/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );
    } catch (requestError) {
      setError(`답변을 생성하지 못했습니다. (${requestError.message})`);
    } finally {
      setAnswering(false);
    }
  }

  async function loginBackend() {
    setError("");
    try {
      const result = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
        BACKEND_URL,
      );
      setAccessToken(result.accessToken);
    } catch (requestError) {
      setAccessToken("");
      setError(`Backend 로그인에 실패했습니다. (${requestError.message})`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-cyan-400 uppercase">
              Backend adapter test
            </p>
            <h1 className="mt-2 text-3xl font-bold">LangGraph 통합 테스트 콘솔</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Backend가 사용하는 <code>/rag/chat</code> 계약으로 Policy, Notice,
              Tax 분기와 사용자 Context 및 출처 응답을 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={checkStatus}
            disabled={loading}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
          >
            {loading ? "확인 중..." : "상태 새로고침"}
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-900 bg-rose-950/50 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-5">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">LLM API</p>
                  <p className="mt-1 font-mono text-xs text-cyan-300">LLM {API_URL}</p>
                  <p className="mt-1 font-mono text-xs text-indigo-300">Backend {BACKEND_URL}</p>
                </div>
                <span className={`h-3 w-3 rounded-full ${health ? "bg-emerald-400" : "bg-rose-400"}`} />
              </div>
              {health && (
                <ul className="mt-4 space-y-2">
                  {Object.entries(health.components).map(([name, state]) => (
                    <li key={name} className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2">
                      <span className="text-sm">{LABELS[name]}</span>
                      <StatusBadge state={state} />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-300">RAG index</p>
                  <p className="mt-2 text-lg font-bold">{ready?.index_ready ? "READY" : "NOT READY"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    문서 {ready?.document_count ?? 0} · Chunk {ready?.chunk_count ?? 0}
                  </p>
                </div>
                <StatusBadge state={ready?.index_ready ? "configured" : "not_configured"} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => createIndex(false)} disabled={indexing} className="rounded-xl bg-indigo-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
                  {indexing ? "처리 중..." : "인덱스 준비"}
                </button>
                <button type="button" onClick={() => createIndex(true)} disabled={indexing} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  전체 재임베딩
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-amber-300/80">
                전체 재임베딩은 OpenAI API 비용이 발생합니다. Notice boundary 테스트는 인덱스 없이도 가능합니다.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm font-semibold text-cyan-300">빠른 시나리오</p>
              <div className="mt-3 grid gap-2">
                {Object.keys(SAMPLE_QUESTIONS).map((route) => (
                  <button key={route} type="button" onClick={() => selectScenario(route)} className="rounded-xl border border-slate-700 px-4 py-2 text-left text-sm hover:border-cyan-500">
                    <span className="font-bold uppercase text-cyan-300">{route}</span>
                    <span className="ml-2 text-slate-400">{SAMPLE_QUESTIONS[route]}</span>
                  </button>
                ))}
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <form onSubmit={submitQuestion}>
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
                <button type="button" onClick={() => setTestMode("backend")} className={`rounded-lg px-3 py-2 text-sm font-bold ${testMode === "backend" ? "bg-cyan-400 text-slate-950" : "text-slate-400"}`}>
                  Backend E2E
                </button>
                <button type="button" onClick={() => setTestMode("llm")} className={`rounded-lg px-3 py-2 text-sm font-bold ${testMode === "llm" ? "bg-indigo-400 text-slate-950" : "text-slate-400"}`}>
                  LLM 직접 호출
                </button>
              </div>

              {testMode === "backend" && (
                <div className="mb-5 rounded-xl border border-slate-800 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="text-xs text-slate-500">
                      Backend 이메일
                      <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-slate-500">
                      비밀번호
                      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                    </label>
                    <button type="button" onClick={loginBackend} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950">
                      {accessToken ? "로그인 완료" : "로그인"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    E2E 모드는 Backend가 현재 전달하는 category/question 계약을 그대로 시험합니다.
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-400">
                  Backend category
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                    <option value="policy">policy</option>
                    <option value="tax">tax</option>
                    <option value="expense">expense</option>
                    <option value="saving">saving</option>
                  </select>
                </label>
                <label className={`flex items-end gap-3 rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-300 ${testMode === "backend" ? "opacity-40" : ""}`}>
                  <input type="checkbox" checked={sendContext} disabled={testMode === "backend"} onChange={(event) => setSendContext(event.target.checked)} />
                  userContext 직접 전달
                </label>
              </div>

              <label className="mt-4 block text-sm text-slate-400">
                질문
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows="3" required className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm outline-none focus:border-cyan-400" />
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(context).map(([field, value]) => (
                  <label key={field} className="text-xs text-slate-500">
                    {field}
                    <input value={value} disabled={!sendContext || testMode === "backend"} onChange={(event) => updateContext(field, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 disabled:opacity-40" />
                  </label>
                ))}
              </div>

              <label className="mt-4 block text-sm text-slate-400">
                Backend Notice 조회 결과 JSON
                <textarea value={noticeJson} disabled={testMode === "backend"} onChange={(event) => setNoticeJson(event.target.value)} rows="7" placeholder="비워두면 integration_unavailable, []이면 no_result" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs outline-none focus:border-cyan-400 disabled:opacity-40" />
              </label>

              <button type="submit" disabled={answering || !question.trim()} className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
                {answering ? "요청 중..." : testMode === "backend" ? "Backend E2E 실행" : "POST /rag/chat 실행"}
              </button>
            </form>

            {answer && (
              <div className="mt-6 space-y-5 border-t border-slate-800 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">route: {answer.route}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${answer.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>status: {answer.status}</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{answer.grounded ? "근거 있음" : "근거 없음"}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{answer.answer}</p>
                <div>
                  <h3 className="mb-3 font-bold">출처 {answer.sources?.length ?? 0}건</h3>
                  <ul className="space-y-3">
                    {(answer.sources ?? []).map((source, index) => (
                      <li key={`${source.url}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="font-semibold text-cyan-300">{source.title}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">{source.url}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{source.excerpt}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <details className="rounded-xl border border-slate-800 p-3">
                  <summary className="cursor-pointer text-xs text-slate-400">원본 JSON</summary>
                  <pre className="mt-3 overflow-auto text-xs text-slate-300">{JSON.stringify(answer, null, 2)}</pre>
                </details>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

export default App;
