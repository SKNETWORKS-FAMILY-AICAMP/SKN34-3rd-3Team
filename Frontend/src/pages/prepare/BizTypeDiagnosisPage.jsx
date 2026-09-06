import { useState } from 'react';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { BIZ_TYPE_QUESTIONS } from '../../data/mockData.js';

export default function BizTypeDiagnosisPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const done = step >= BIZ_TYPE_QUESTIONS.length;
  const current = BIZ_TYPE_QUESTIONS[step];

  const choose = (value) => {
    setAnswers((p) => ({ ...p, [current.id]: value }));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
  };

  // TODO: 실제 판정 로직/규칙 엔진은 백엔드(POST /api/diagnosis/biz-type)로 이전
  const recommendation = answers.q1 === '1억 원 이상' || answers.q2 === '법인 전환 · 투자 유치 예정'
    ? { type: '법인사업자', reason: '매출 규모가 크거나 투자 유치 계획이 있어 법인이 유리할 수 있어요.' }
    : answers.q1 === '4,800만 원 미만' && answers.q3 === '아니요'
      ? { type: '간이과세자', reason: '연 매출이 낮고 세금계산서 발행 부담이 적어 간이과세가 적합해요.' }
      : { type: '일반과세자 (개인사업자)', reason: '매입세액 공제와 거래처 대응을 고려하면 일반과세 개인사업자가 무난해요.' };

  return (
    <Page width={640}>
      <PageHeader
        crumb="창업 준비"
        title="사업자등록 유형 진단"
        desc="몇 가지 질문에 답하면 간이과세 · 일반과세 · 법인 중 어떤 형태가 유리한지 안내해드려요."
      />

      <div className="stepper">
        {BIZ_TYPE_QUESTIONS.map((q, idx) => (
          <span key={q.id} className={`stepper__dot ${idx < step ? 'is-done' : ''}`} />
        ))}
      </div>

      {!done ? (
        <Card>
          <p className="muted" style={{ fontSize: 13 }}>
            {step + 1} / {BIZ_TYPE_QUESTIONS.length}
          </p>
          <h3 className="card__title" style={{ marginTop: 8 }}>
            {current.question}
          </h3>
          <div className="stack" style={{ marginTop: 20 }}>
            {current.options.map((opt) => (
              <Button key={opt} variant="ghost" block onClick={() => choose(opt)}>
                {opt}
              </Button>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="result-banner">
            <h3>추천 유형: {recommendation.type}</h3>
            <p>{recommendation.reason}</p>
          </div>
          <p className="todo" style={{ marginTop: 16 }}>
            TODO: 유형별 세율·의무·전환 시점 비교표, 홈택스 사업자등록 안내 링크 연결
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={reset}>
              다시 진단하기
            </Button>
            <Button to="/prepare/tax-relief">세액 감면 대상인지 확인하기</Button>
          </div>
        </Card>
      )}
    </Page>
  );
}
