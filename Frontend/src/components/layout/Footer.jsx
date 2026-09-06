import { Link } from 'react-router-dom';
import { JOURNEY } from '../../data/navigation.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__cols">
          {JOURNEY.map((group) => (
            <div className="footer__col" key={group.key}>
              <h4>{group.label}</h4>
              {group.items.map((item) => (
                <Link key={item.path} to={item.path}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <p>
          창업ON은 청년 창업자를 위한 지원금 · 세금 정보 안내 서비스입니다. 본 서비스가 제공하는
          정보는 참고용이며, 정확한 세무 처리는 관할 세무서 또는 세무 전문가와 상담하세요.
        </p>
        <p style={{ marginTop: 8 }}>© {new Date().getFullYear()} SKN34 3rd 3Team. All rights reserved.</p>
      </div>
    </footer>
  );
}
