import { useRouteError } from 'react-router-dom';
import Page from '../components/layout/Page.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  const error = useRouteError();
  return (
    <Page width={560}>
      <PageHeader
        crumb="404"
        title="페이지를 찾을 수 없어요"
        desc="주소가 바뀌었거나 삭제된 페이지일 수 있습니다."
      />
      {error?.message && (
        <p className="todo" style={{ marginBottom: 24 }}>
          {String(error.statusText || error.message)}
        </p>
      )}
      <Button to="/">홈으로 돌아가기</Button>
    </Page>
  );
}
