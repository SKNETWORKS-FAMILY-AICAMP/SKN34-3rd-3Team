import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/auth/login → 토큰 저장
    login({ name: form.email.split('@')[0] || '사용자' });
    navigate('/');
  };

  return (
    <Page width={440}>
      <PageHeader crumb="온보딩" title="로그인" />

      <form className="form-card card" onSubmit={onSubmit}>
        <div className="stack">
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
            value={form.password}
            onChange={onChange}
            required
          />
          <Button type="submit" block>
            로그인
          </Button>
        </div>
      </form>

      <div className="form-links">
        <Link to="/signup">회원가입</Link>
        <Link to="/find-account">아이디 / 비밀번호 찾기</Link>
      </div>
    </Page>
  );
}
