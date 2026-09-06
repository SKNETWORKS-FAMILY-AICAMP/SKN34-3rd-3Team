import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '' });
  const [agree, setAgree] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/auth/signup → 이메일 인증 → 개인정보 동의(/privacy-consent)로 이동
    navigate('/privacy-consent');
  };

  return (
    <Page width={480}>
      <PageHeader crumb="온보딩" title="회원가입" desc="이메일로 3분 만에 가입하고 맞춤 추천을 받아보세요." />

      <form className="form-card card" onSubmit={onSubmit}>
        <div className="stack">
          <Field
            id="name"
            name="name"
            label="이름"
            placeholder="홍길동"
            value={form.name}
            onChange={onChange}
            required
          />
          <Field
            id="email"
            name="email"
            type="email"
            label="이메일"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange}
            required
          />
          <Field
            id="password"
            name="password"
            type="password"
            label="비밀번호"
            hint="영문·숫자·특수문자 조합 8자 이상"
            value={form.password}
            onChange={onChange}
            required
          />
          <Field
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            label="비밀번호 확인"
            value={form.passwordConfirm}
            onChange={onChange}
            required
          />

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              <Link to="/privacy-consent" style={{ color: 'var(--color-primary)' }}>
                이용약관 및 개인정보 수집·이용
              </Link>
              에 동의합니다 (필수)
            </span>
          </label>

          <Button type="submit" block disabled={!agree}>
            다음 단계로
          </Button>
        </div>
      </form>

      <div className="form-links">
        <Link to="/login">이미 계정이 있어요</Link>
        <Link to="/find-account">아이디 / 비밀번호 찾기</Link>
      </div>
    </Page>
  );
}
