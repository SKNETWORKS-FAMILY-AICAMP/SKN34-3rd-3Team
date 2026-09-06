export default function Card({ title, desc, hover = false, className = '', children }) {
  const cls = ['card', hover && 'card--hover', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {title && <h3 className="card__title">{title}</h3>}
      {desc && <p className="card__desc">{desc}</p>}
      {children}
    </div>
  );
}
