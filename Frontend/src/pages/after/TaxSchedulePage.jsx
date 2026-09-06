import { useState } from 'react';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import { MOCK_TAX_SCHEDULE } from '../../data/mockData.js';

const TYPE_COLORS = {
  부가세: 'var(--color-primary)',
  종합소득세: 'var(--color-success)',
  기타: 'var(--color-text-tertiary)',
};

export default function TaxSchedulePage() {
  const [bizType, setBizType] = useState('개인 일반과세자');

  // TODO: 사업자 유형·설립일 기준으로 개인화된 일정 계산 (GET /api/tax/schedule)
  const schedule = [...MOCK_TAX_SCHEDULE].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Page>
      <PageHeader
        crumb="창업 후"
        title="세금 일정 안내"
        desc="부가가치세 · 종합소득세 등 사업자가 챙겨야 할 신고·납부 기한을 한눈에 확인하세요. 알림 신청 시 마감 7일 전 안내해드려요."
      />

      <Card style={{ marginBottom: 24, maxWidth: 320 }}>
        <Field id="bizType" as="select" label="내 사업자 유형" value={bizType} onChange={(e) => setBizType(e.target.value)}>
          <option>개인 일반과세자</option>
          <option>개인 간이과세자</option>
          <option>개인 면세사업자</option>
          <option>법인사업자</option>
        </Field>
      </Card>

      <div className="stack">
        {schedule.map((item) => (
          <Card key={item.id} hover>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  minWidth: 64,
                  textAlign: 'center',
                  fontWeight: 800,
                  color: TYPE_COLORS[item.type],
                }}
              >
                {item.date.replace('-', '/')}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>{item.name}</p>
                <p className="muted" style={{ fontSize: 13 }}>
                  대상: {item.target}
                </p>
              </div>
              <span className="tag" style={{ background: 'transparent', border: `1px solid ${TYPE_COLORS[item.type]}`, color: TYPE_COLORS[item.type] }}>
                {item.type}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <p className="todo" style={{ marginTop: 16 }}>
        TODO: 캘린더 뷰, 구글 캘린더 · iCal 내보내기, 신고 유형별 준비서류 체크리스트, 푸시/이메일 알림 설정
      </p>
    </Page>
  );
}
