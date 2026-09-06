import { useState } from 'react';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { TAX_RELIEF_QUESTIONS } from '../../data/mockData.js';

export default function TaxReliefCheckPage() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = (id, value) => setAnswers((p) => ({ ...p, [id]: value }));
  const allAnswered = TAX_RELIEF_QUESTIONS.every((q) => answers[q.id] !== undefined);

  // TODO: 판정은 백엔드(POST /api/diagnosis/tax-relief)로. 조세특례제한법 개정 반영 필요.
  const eligible = TAX_RELIEF_QUESTIONS.every((q) => answers[q.id] === true);
  const reduceRate = eligible
    ? answers.r4
      ? '5년간 소득세 100% 감면 (수도권 과밀억제권역 외)'
      : '5년간 소득세 50% 감면'
    : null;

  return (
    <Page width={640}>
      <PageHeader
        crumb="창업 준비"
        title="청년 창업 세액 감면 대상 판정"
        desc="조세특례제한법상 청년 창업 중소기업 세액 감면(제6조) 요건을 간단히 자가진단합니다. 실제 적용은 세무 전문가 확인이 필요해요."
      />

      <Card className="stack">
        {TAX_RELIEF_QUESTIONS.map((q, idx) => (
          <div key={q.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontWeight: 600 }}>
              {idx + 1}. {q.question}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button
                variant={answers[q.id] === true ? 'primary' : 'ghost'}
                onClick={() => setAnswer(q.id, true)}
              >
                예
              </Button>
              <Button
                variant={answers[q.id] === false ? 'primary' : 'ghost'}
                onClick={() => setAnswer(q.id, false)}
              >
                아니요
              </Button>
            </div>
          </div>
        ))}

        <Button block disabled={!allAnswered} onClick={() => setSubmitted(true)}>
          판정 결과 보기
        </Button>

        {submitted && (
          <div
            className="result-banner"
            style={
              eligible
                ? undefined
                : { background: '#fdecee', color: 'var(--color-danger)' }
            }
          >
            <h3>{eligible ? '감면 대상 가능성이 높아요' : '감면 대상이 아닐 수 있어요'}</h3>
            <p>
              {eligible
                ? `예상 혜택: ${reduceRate}`
                : '한 가지 이상 요건을 충족하지 못했습니다. 업종·지역·창업 형태를 다시 확인해보세요.'}
            </p>
          </div>
        )}

        <p className="todo">
          TODO: 요건별 근거 조문·예외 안내, "예" 선택 시 하위 질문 분기, 감면 신청 서식 안내 추가
        </p>
      </Card>
    </Page>
  );
}
