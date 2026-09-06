import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';

const CONSENTS = [
  {
    key: 'terms',
    required: true,
    title: '서비스 이용약관 동의',
    body: '창업ON 서비스 이용에 관한 기본 약관입니다. (전문 링크 예정)',
  },
  {
    key: 'privacy',
    required: true,
    title: '개인정보 수집 · 이용 동의',
    body: '수집 항목: 이름, 이메일, 생년월일, 거주 지역, 관심 업종 / 목적: 맞춤 지원금·정책 추천 / 보유기간: 회원 탈퇴 시까지',
  },
  {
    key: 'thirdParty',
    required: false,
    title: '제3자 정보 제공 동의 (선택)',
    body: '지원사업 신청 연계를 위해 소관 기관에 신청 정보를 전달할 수 있습니다.',
  },
  {
    key: 'marketing',
    required: false,
    title: '마케팅 정보 수신 동의 (선택)',
    body: '새로운 지원사업 공고, 세금 일정 알림을 이메일·문자로 받아봅니다.',
  },
];

export default function PrivacyConsentPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState({});

  const allRequiredChecked = CONSENTS.filter((c) => c.required).every((c) => checked[c.key]);
  const allChecked = CONSENTS.every((c) => checked[c.key]);

  const toggle = (key) => setChecked((p) => ({ ...p, [key]: !p[key] }));
  const toggleAll = () => {
    const next = !allChecked;
    setChecked(Object.fromEntries(CONSENTS.map((c) => [c.key, next])));
  };

  const onNext = () => {
    // TODO: POST /api/users/consents 저장 후 개인정보 입력 단계로
    navigate('/profile');
  };

  return (
    <Page width={640}>
      <PageHeader
        crumb="온보딩"
        title="개인정보 수집 동의"
        desc="맞춤 추천을 위해 아래 항목에 동의가 필요합니다. 선택 항목은 동의하지 않아도 가입할 수 있어요."
      />

      <div className="card stack">
        <label
          style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 700, fontSize: 16 }}
        >
          <input type="checkbox" checked={allChecked} onChange={toggleAll} />
          전체 동의하기
        </label>

        <hr style={{ border: 0, borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

        {CONSENTS.map((c) => (
          <div key={c.key} className="stack" style={{ gap: 6 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={Boolean(checked[c.key])}
                onChange={() => toggle(c.key)}
              />
              <span>
                {c.title}{' '}
                <span className="muted" style={{ fontWeight: 400 }}>
                  {c.required ? '(필수)' : '(선택)'}
                </span>
              </span>
            </label>
            <p className="todo" style={{ marginLeft: 26 }}>
              {c.body}
            </p>
          </div>
        ))}

        <Button block disabled={!allRequiredChecked} onClick={onNext}>
          동의하고 계속하기
        </Button>
      </div>
    </Page>
  );
}
