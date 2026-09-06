import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { MOCK_SUBSIDIES } from '../../data/mockData.js';

export default function SubsidyExplorePage() {
  const [filters, setFilters] = useState({ keyword: '', region: '', category: '' });
  const onChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  // TODO: GET /api/subsidies?keyword=&region=&category= 로 교체 (현재는 목 데이터 필터)
  const results = useMemo(() => {
    return MOCK_SUBSIDIES.filter((s) =>
      filters.keyword ? s.name.includes(filters.keyword) : true,
    );
  }, [filters.keyword]);

  return (
    <Page>
      <PageHeader
        crumb="창업 전"
        title="청년 지원금 탐색 · 추천"
        desc="내 나이 · 지역 · 관심 업종에 맞는 청년 창업 지원금을 찾아보세요. 로그인하면 조건에 맞는 항목이 상단에 추천돼요."
      />

      <Card className="stack" style={{ marginBottom: 24 }}>
        <div className="grid grid--3">
          <Field
            id="keyword"
            name="keyword"
            label="키워드"
            placeholder="예: 사관학교, 패키지"
            value={filters.keyword}
            onChange={onChange}
          />
          <Field id="region" name="region" as="select" label="지역" value={filters.region} onChange={onChange}>
            <option value="">전체</option>
            <option>서울</option>
            <option>경기</option>
            <option>비수도권</option>
          </Field>
          <Field id="category" name="category" as="select" label="지원 유형" value={filters.category} onChange={onChange}>
            <option value="">전체</option>
            <option>사업화자금</option>
            <option>인건비</option>
            <option>교육 · 멘토링</option>
          </Field>
        </div>
        <div>
          <Button>검색</Button>
        </div>
      </Card>

      <p className="muted" style={{ marginBottom: 12 }}>
        총 {results.length}건
      </p>

      <div className="stack">
        {results.map((s) => (
          <Card key={s.id} hover>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3 className="card__title">{s.name}</h3>
                <p className="card__desc">{s.agency}</p>
                <div style={{ marginTop: 12 }}>
                  {s.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 160 }}>
                <p style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{s.amount}</p>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {s.period}
                </p>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              지원 대상: {s.target}
            </p>
          </Card>
        ))}
      </div>
    </Page>
  );
}
