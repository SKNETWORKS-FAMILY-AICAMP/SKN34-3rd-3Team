/**
 * 라벨 + 인풋 래퍼. as="select" / as="textarea" 지원.
 * 실제 폼 검증은 추후 react-hook-form 등으로 교체 예정.
 */
export default function Field({
  label,
  hint,
  error,
  as = 'input',
  children,
  id,
  ...rest
}) {
  const Control = as;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <Control id={id} className="field__control" {...rest}>
        {children}
      </Control>
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
