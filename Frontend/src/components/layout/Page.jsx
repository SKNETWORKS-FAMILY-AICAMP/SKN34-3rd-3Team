/** 내부 페이지 공통 래퍼: 상단 여백 + 컨테이너 폭 제한 */
export default function Page({ children, width }) {
  return (
    <div className="page">
      <div className="container" style={width ? { maxWidth: width } : undefined}>
        {children}
      </div>
    </div>
  );
}
