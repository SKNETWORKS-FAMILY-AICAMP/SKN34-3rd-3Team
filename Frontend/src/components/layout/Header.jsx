import { NavLink, useNavigate } from 'react-router-dom';
import { JOURNEY } from '../../data/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink to="/" className="header__logo">
          <span className="header__logo-mark">ON</span>
          창업ON
        </NavLink>

        <nav className="header__nav">
          {JOURNEY.map((group) => (
            <NavLink
              key={group.key}
              to={group.items[0].path}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {group.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          {isAuthenticated ? (
            <>
              <span className="muted" style={{ fontSize: 14 }}>
                {user?.name} 님
              </span>
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" to="/login">
                로그인
              </Button>
              <Button variant="primary" to="/signup">
                회원가입
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
