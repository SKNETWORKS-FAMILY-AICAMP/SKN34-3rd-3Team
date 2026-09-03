import { useCallback, useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_LLM_API_URL ?? "http://localhost:8000")
  .replace(/\/$/, "");

const LABELS = {
  llm: "LLM 모델",
  embedding: "Embedding 모델",
  data_source: "데이터 계층",
};

function StatusBadge({ state }) {
  if (state === "mock") {
    return (
      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
        Mock 사용 중
      </span>
    );
  }

  const configured = state === "configured";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        configured
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {configured ? "설정 완료" : "설정 필요"}
    </span>
  );
}

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setHealth(await response.json());
    } catch (requestError) {
      setHealth(null);
      setError(`LLM 서비스에 연결하지 못했습니다. (${requestError.message})`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.18em] text-cyan-400 uppercase">
              Development tool
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              LLM RAG Test Console
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              React와 TailwindCSS로 구성한 임시 테스트 화면입니다. 현재는 LLM
              FastAPI 서비스의 실행 상태와 연동 설정을 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            disabled={loading}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "확인 중..." : "상태 새로고침"}
          </button>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">API endpoint</p>
                <p className="mt-1 font-mono text-sm text-cyan-300">
                  {API_URL}/health
                </p>
              </div>
              <span
                className={`h-3 w-3 rounded-full ${
                  health ? "bg-emerald-400" : "bg-rose-400"
                }`}
                aria-label={health ? "연결됨" : "연결 안 됨"}
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {health ? (
              <div>
                <div className="mb-5 rounded-xl bg-slate-800/70 p-4">
                  <p className="text-lg font-bold text-emerald-300">
                    서비스 정상 실행 중
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {health.service} · v{health.version}
                  </p>
                </div>
                <ul className="space-y-3">
                  {Object.entries(health.components).map(([name, state]) => (
                    <li
                      key={name}
                      className="flex items-center justify-between rounded-xl border border-slate-800 px-4 py-3"
                    >
                      <span className="text-sm font-medium">{LABELS[name]}</span>
                      <StatusBadge state={state} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-semibold text-cyan-300">다음 구현 단계</p>
            <h2 className="mt-2 text-xl font-bold">RAG 질의 테스트</h2>
            <label className="mt-6 block text-sm text-slate-400" htmlFor="question">
              질문
            </label>
            <textarea
              id="question"
              disabled
              rows="5"
              placeholder="RAG 답변 API 구현 후 활성화됩니다."
              className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm placeholder:text-slate-600 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-400"
            >
              질문 전송 준비 중
            </button>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              가짜 답변을 반환하는 임시 API는 만들지 않았습니다. Retriever와 출처
              응답 구조가 구현되면 이 영역을 연결합니다.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

export default App;
