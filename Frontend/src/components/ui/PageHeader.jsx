export default function PageHeader({ crumb, title, desc, actions }) {
  return (
    <header className="page-header">
      {crumb && <p className="page-header__crumb">{crumb}</p>}
      <h1 className="page-header__title">{title}</h1>
      {desc && <p className="page-header__desc">{desc}</p>}
      {actions && <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>{actions}</div>}
    </header>
  );
}
