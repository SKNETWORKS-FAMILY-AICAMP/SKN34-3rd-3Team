import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { MOCK_SUPPORT_PROGRAMS } from '../../data/mockData.js';

export default function SupportProgramPage() {
  return (
    <Page>
      <PageHeader
        crumb="창업 준비"
        title="창업 지원 사업 탐색 · 추천"
        desc="R&D, 마케팅, 공간, 판로 등 창업 준비 단계에서 신청할 수 있는 정부·지자체 지원 사업을 모아봤어요. (K-Startup 등 공공 API 연동 예정)"
      />

      <Card className="stack" style={{ marginBottom: 24 }}>
        <div className="grid grid--3">
          <Field id="field" as="select" label="지원 분야">
            <option value="">전체</option>
            <option>기술개발</option>
            <option>마케팅</option>
            <option>공간 · 입주</option>
            <option>판로 · 수출</option>
          </Field>
          <Field id="agency" as="select" label="주관 기관">
            <option value="">전체</option>
            <option>중소벤처기업부</option>
            <option>창업진흥원</option>
            <option>지자체</option>
          </Field>
          <Field id="status" as="select" label="모집 상태">
            <option value="">전체</option>
            <option>모집중</option>
            <option>마감임박</option>
          </Field>
        </div>
        <div>
          <Button>검색</Button>
        </div>
      </Card>

      <div className="grid grid--2">
        {MOCK_SUPPORT_PROGRAMS.map((p) => (
          <Card key={p.id} hover>
            <span className="tag">{p.field}</span>
            <h3 className="card__title" style={{ marginTop: 10 }}>
              {p.name}
            </h3>
            <p className="card__desc">{p.support}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              마감일 {p.deadline}
            </p>
            <div style={{ marginTop: 16 }}>
              <Button variant="secondary">상세 보기</Button>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
