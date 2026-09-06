import { useState } from 'react';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import { MOCK_INDUSTRIES } from '../../data/mockData.js';

export default function IndustryComparePage() {
  const [selected, setSelected] = useState(MOCK_INDUSTRIES.map((i) => i.code));

  const toggle = (code) =>
    setSelected((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));

  const rows = MOCK_INDUSTRIES.filter((i) => selected.includes(i.code));

  return (
    <Page>
      <PageHeader
        crumb="창업 전"
        title="관심 업종 창업률 · 폐업률 비교"
        desc="관심 있는 업종의 최근 창업률과 폐업률을 나란히 비교해 진입 여부를 판단해보세요. (출처: 통계청 · 국세청 공개 데이터 연동 예정)"
      />

      <Card style={{ marginBottom: 24 }}>
        <p className="field__label" style={{ marginBottom: 12 }}>
          비교할 업종 선택
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MOCK_INDUSTRIES.map((i) => (
            <button
              key={i.code}
              onClick={() => toggle(i.code)}
              className={`btn ${selected.includes(i.code) ? 'btn--secondary' : 'btn--ghost'}`}
            >
              {i.name}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>업종</th>
                <th>사업체 수</th>
                <th>창업률</th>
                <th>폐업률</th>
                <th>순증감</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const net = (i.startupRate - i.closureRate).toFixed(1);
                const positive = Number(net) >= 0;
                return (
                  <tr key={i.code}>
                    <td style={{ fontWeight: 600 }}>{i.name}</td>
                    <td>{i.count.toLocaleString()}개</td>
                    <td>{i.startupRate}%</td>
                    <td>{i.closureRate}%</td>
                    <td style={{ color: positive ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                      {positive ? '+' : ''}
                      {net}%p
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="todo" style={{ marginTop: 16 }}>
          TODO: 막대/라인 차트 컴포넌트(recharts 등)로 시각화 · 연도별 추이 조회 · 지역별 필터 추가
        </p>
      </Card>
    </Page>
  );
}
