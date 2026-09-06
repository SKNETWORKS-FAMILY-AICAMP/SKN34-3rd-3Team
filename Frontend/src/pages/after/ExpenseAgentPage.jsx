import { useRef, useState } from 'react';
import Page from '../../components/layout/Page.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';

const SEED_MESSAGES = [
  {
    role: 'bot',
    text: '안녕하세요! 경비처리·절세 에이전트예요. 지출 내역을 알려주시면 경비 인정 여부와 절세 팁을 알려드릴게요. 예) "노트북 150만원 구매했는데 비용처리 되나요?"',
  },
];

export default function ExpenseAgentPage() {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      // TODO: POST /api/agent/expense (스트리밍 응답) 결과로 교체
      {
        role: 'bot',
        text: '(에이전트 응답 자리) LLM 백엔드 연동 후 경비 계정과목 분류 · 증빙 요건 · 예상 절세액을 답변합니다.',
      },
    ]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <Page width={760}>
      <PageHeader
        crumb="창업 후"
        title="경비처리 · 절세 에이전트"
        desc="지출 내역·영수증을 입력하면 경비 인정 여부, 적정 계정과목, 절세 방법을 대화형으로 안내합니다."
      />

      <div className="chat">
        <div className="chat__log">
          {messages.map((m, i) => (
            <div key={i} className={`chat__msg chat__msg--${m.role}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form className="chat__input" onSubmit={send}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="지출 내역을 입력하세요"
          />
          <Button type="submit">전송</Button>
        </form>
      </div>

      <p className="todo" style={{ marginTop: 16 }}>
        TODO: 영수증 이미지 업로드(OCR/Vision 연동), 대화 히스토리 저장, 월별 경비 요약 리포트, 세무 고지 문구 상시 노출
      </p>
    </Page>
  );
}
