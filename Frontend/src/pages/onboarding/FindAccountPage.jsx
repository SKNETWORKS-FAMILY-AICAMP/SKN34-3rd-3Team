import { useState } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';

const TABS = [
  { key: 'id', label: '아이디(이메일) 찾기' },
  { key: 'pw', label: '비밀번호 재설정' },
];

export default function FindAccountPage() {
  const [tab, setTab] = useState('id');

  return (
    <Page width={460}>
      <PageHeader crumb="온보딩" title="아이디 / 비밀번호 찾기" />

      <div className="card form-card">
        <div className="stepper" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`btn ${tab === t.key ? 'btn--secondary' : 'btn--ghost'}`}
              style={{ flex: 1 }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'id' ? (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: POST /api/auth/find-id (이름 + 휴대폰 본인인증)
            }}
          >
            <Field id="name" label="이름" placeholder="홍길동" required />
            <Field id="phone" label="휴대폰 번호" placeholder="010-0000-0000" required />
            <Button type="submit" block>
              인증하고 아이디 찾기
            </Button>
          </form>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: POST /api/auth/reset-password (가입 이메일로 재설정 링크 발송)
            }}
          >
            <Field id="email" type="email" label="가입 이메일" placeholder="you@example.com" required />
            <Button type="submit" block>
              재설정 링크 받기
            </Button>
          </form>
        )}
      </div>

      <div className="form-links">
        <Link to="/login">로그인</Link>
        <Link to="/signup">회원가입</Link>
      </div>
    </Page>
  );
}
