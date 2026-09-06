import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const INTERESTS = ['음식점 · 카페', '소매 · 이커머스', 'IT · 소프트웨어', '제조', '뷰티 · 미용', '교육', '콘텐츠 · 미디어', '기타'];

export default function ProfilePage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    birth: '',
    region: '',
    interest: '',
    stage: '창업 전',
    startupDate: '',
  });

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: PUT /api/users/me/profile → 이후 홈에서 맞춤 추천 노출
    login({ name: '사용자', profile: form });
    navigate('/');
  };

  return (
    <Page width={560}>
      <PageHeader
        crumb="온보딩"
        title="개인정보 입력"
        desc="입력한 정보로 받을 수 있는 지원금 · 정책만 골라서 보여드려요. 나중에 마이페이지에서 수정할 수 있어요."
      />

      <form className="card stack" onSubmit={onSubmit}>
        <Field id="birth" name="birth" type="date" label="생년월일" value={form.birth} onChange={onChange} required />

        <Field id="region" name="region" as="select" label="거주 지역" value={form.region} onChange={onChange} required>
          <option value="">선택하세요</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Field>

        <Field id="interest" name="interest" as="select" label="관심 업종" value={form.interest} onChange={onChange} required>
          <option value="">선택하세요</option>
          {INTERESTS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </Field>

        <Field id="stage" name="stage" as="select" label="창업 단계" value={form.stage} onChange={onChange}>
          <option>창업 전</option>
          <option>창업 준비 중</option>
          <option>창업 후 (사업자 보유)</option>
        </Field>

        {form.stage === '창업 후 (사업자 보유)' && (
          <Field
            id="startupDate"
            name="startupDate"
            type="date"
            label="사업자등록일"
            hint="세액 감면 대상 판정과 세금 일정 안내에 사용돼요"
            value={form.startupDate}
            onChange={onChange}
          />
        )}

        <Button type="submit" block>
          저장하고 시작하기
        </Button>
      </form>
    </Page>
  );
}
