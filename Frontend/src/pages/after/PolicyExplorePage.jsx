import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { MOCK_POLICIES } from '../../data/mockData.js';

export default function PolicyExplorePage() {
  return (
    <Page>
      <PageHeader
        crumb="창업 후"
        title="기업 지원 정책 탐색 · 추천"
        desc="사업을 운영하며 활용할 수 있는 세제 · 고용 · 금융 지원 정책을 찾아보세요. 업력·업종·고용 현황을 입력하면 적용 가능한 정책을 추천해드려요."
      />

      <Card className="stack" style={{ marginBottom: 24 }}>
        <div className="grid grid--3">
          <Field id="category" as="select" label="정책 분야">
            <option value="">전체</option>
            <option>세제</option>
            <option>고용</option>
            <option>금융 · 융자</option>
          </Field>
          <Field id="years" label="업력 (년)" type="number" placeholder="예: 2" />
          <Field id="employees" label="상시 근로자 수" type="number" placeholder="예: 3" />
        </div>
        <div>
          <Button>맞춤 정책 찾기</Button>
        </div>
      </Card>

      <div className="grid grid--2">
        {MOCK_POLICIES.map((p) => (
          <Card key={p.id} hover>
            <span className="tag">{p.category}</span>
            <h3 className="card__title" style={{ marginTop: 10 }}>
              {p.name}
            </h3>
            <p className="card__desc">{p.benefit}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              적용 요건: {p.condition}
            </p>
          </Card>
        ))}
      </div>
    </Page>
  );
}
