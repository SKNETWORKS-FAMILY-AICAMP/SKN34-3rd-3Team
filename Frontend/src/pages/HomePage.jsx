import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { JOURNEY } from '../data/navigation.js';

const COIN_COLORS = ['#7ee3d5', '#8fd16b', '#9b5fb0', '#4c6ef5', '#f0a35e', '#5b7cfa'];

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="container">
          <h1 className="hero__title">
            청년 창업, 지원금부터 세금까지
            <br />한 곳에서
          </h1>
          <p className="hero__subtitle">
            내 조건에 맞는 지원금을 찾고, 세액 감면 대상인지 확인하고, 세금 일정을 놓치지 않도록
            창업ON이 함께합니다.
          </p>
          <div className="hero__cta">
            <Button size="lg" variant="primary" to="/signup">
              무료로 시작하기
            </Button>
            <Button size="lg" variant="ghost" to="/before/subsidies">
              지원금 먼저 둘러보기
            </Button>
          </div>
          <div className="hero__coins">
            {COIN_COLORS.map((c) => (
              <span key={c} className="hero__coin" style={{ background: c }} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 핵심 가치 ---------- */}
      <section className="section">
        <div className="container text-center">
          <span className="eyebrow">모두를 위한 창업 안내</span>
          <h2 className="headline" style={{ marginTop: 16 }}>
            창업 단계마다 필요한 정보가 다릅니다
          </h2>
          <p className="subtext" style={{ marginTop: 12 }}>
            창업 전 · 준비 · 후, 각 단계에 맞춰 지원 정책과 세무 정보를 안내해요
          </p>

          <div className="grid grid--3" style={{ marginTop: 48, textAlign: 'left' }}>
            <Card
              hover
              title="내 조건 맞춤 추천"
              desc="나이 · 지역 · 업종 정보를 바탕으로 받을 수 있는 지원금과 정책만 골라 보여줘요."
            />
            <Card
              hover
              title="세액 감면 자가진단"
              desc="청년 창업 세액 감면 대상인지, 사업자 유형은 무엇이 유리한지 몇 가지 질문으로 확인해요."
            />
            <Card
              hover
              title="세금 일정 알림"
              desc="부가세 · 종합소득세 신고 기한을 미리 안내하고, 경비처리·절세 팁을 제공해요."
            />
          </div>
        </div>
      </section>

      {/* ---------- 여정별 기능 ---------- */}
      <section className="section section--subtle">
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">서비스 구성</span>
            <h2 className="headline" style={{ marginTop: 16 }}>
              온보딩부터 창업 후까지, 4단계 여정
            </h2>
          </div>

          <div className="grid grid--2" style={{ marginTop: 48 }}>
            {JOURNEY.map((group) => (
              <Card key={group.key} className="journey-card">
                <p className="journey-card__label">{group.label}</p>
                <p className="journey-card__summary">{group.summary}</p>
                <div className="journey-card__list">
                  {group.items.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <span>{item.label}</span>
                      <span aria-hidden>→</span>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section section--dark">
        <div className="container text-center">
          <h2 className="headline">지금 내 조건으로 확인해보세요</h2>
          <p className="subtext" style={{ color: '#b0b8c1', marginTop: 12 }}>
            회원가입 후 개인정보를 입력하면 맞춤 추천이 시작됩니다
          </p>
          <div style={{ marginTop: 32 }}>
            <Button size="lg" variant="primary" to="/signup">
              무료로 시작하기
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
