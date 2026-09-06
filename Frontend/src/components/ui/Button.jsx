import { Link } from 'react-router-dom';

/**
 * variant: 'primary' | 'secondary' | 'ghost'
 * size: 'md' | 'lg'
 * to 를 주면 라우터 Link, href 를 주면 a, 아니면 button 으로 렌더링.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size === 'lg' && 'btn--lg',
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
