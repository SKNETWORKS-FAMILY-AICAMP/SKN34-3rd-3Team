import React, { useState, useEffect } from 'react';
import { GOV_LISTINGS, GOV_DETAILS, ANNC_SAMPLES, ANNC_FALLBACK, GOV_RULES, GOV_CHIPS, DEFAULT_BIZ, DEFAULT_REGION } from '../constants.js';
import { scoreProgram } from '../utils.js';
import { AiConsult } from '../components/AiConsult.jsx';
import { Calendar } from './Home.jsx';

export function GovDetailModal({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const g = item.g;
  const d = GOV_DETAILS[g.id] || {};
  return (
    <div
      className="govm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="govm-title"
    >
      <div className="govm__box">
        <button type="button" className="govm__close" onClick={onClose} aria-label="닫기">×</button>
        {/* 스크롤은 안쪽에서만 — 바깥 박스가 둥근 모서리를 그대로 유지한다 */}
        <div className="govm__scroll">
        <span className="govm__tag">{g.type} · {g.region}</span>
        <h2 id="govm-title" className="govm__title">{g.title}</h2>
        <p className="govm__agency">{g.agency}</p>

        <dl className="govm__rows">
          <div><dt>지원 규모</dt><dd>{g.amount}</dd></div>
          <div><dt>지원 대상</dt><dd>{g.target} 창업자</dd></div>
          <div><dt>접수 마감</dt>
            <dd className={g.dday >= 100 ? '' : 'govm__dday'}>
              {g.dday >= 100 ? '상시 접수' : `D-${g.dday}`}
            </dd>
          </div>
        </dl>

        {d.summary && <p className="govm__summary">{d.summary}</p>}

        {item.why && item.why.length > 0 && (
          <div className="govm__sec">
            <h3>내 조건과 맞는 점</h3>
            <div className="govm__chips">
              {item.why.map((w) => <span key={w} className="govm__chip">{w}</span>)}
            </div>
          </div>
        )}

        {d.eligibility && (
          <div className="govm__sec">
            <h3>신청 자격</h3>
            <p>{d.eligibility}</p>
          </div>
        )}

        {d.support && (
          <div className="govm__sec">
            <h3>지원 내용</h3>
            <ul>{d.support.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}

        {d.documents && (
          <div className="govm__sec">
            <h3>제출 서류</h3>
            <ul>{d.documents.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}

        {d.howto && (
          <div className="govm__sec">
            <h3>신청 방법</h3>
            <p>{d.howto}</p>
          </div>
        )}

        {d.notes && (
          <div className="govm__sec">
            <h3>유의사항</h3>
            <ul>{d.notes.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementAnalyzer({ user, onRequireLogin }) {
  const [openGov, setOpenGov] = useState(null); // 상세 모달로 열어 둔 공고
  // 내 정보(업종·지역) 기준 적합도 상위 4건 — 기존 scoreProgram·GOV_LISTINGS 재사용
  const profile = user || { biz: DEFAULT_BIZ, region: DEFAULT_REGION };
  const recommended = GOV_LISTINGS
    .map((g) => ({ g, ...scoreProgram(g, profile) }))
    .sort((a, b) => b.score - a.score || a.g.dday - b.g.dday)
    .slice(0, 4);

  return (
    <div className="az2">
      <div className="az2__cols">
        <div className="az2__card">
          <h3 className="az2__cardttl">추천 공고</h3>
          <p className="az2__note">
            {profile.biz} · {profile.region} 조건에 맞는 공고를 적합도 순으로 모았어요.
          </p>
          <ul className="az2__reclist">
            {recommended.map(({ g, why }) => (
              <li key={g.id}>
                <button type="button" className="az2__recbtn" onClick={() => setOpenGov({ g, why })}>
                  <span className="az2__recmain">
                    <span className="az2__rectitle">{g.title}</span>
                    <span className="az2__recmeta">{g.agency}</span>
                  </span>
                  <b className="az2__recscore u-num">{g.dday >= 100 ? '상시' : `D-${g.dday}`}</b>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Calendar compact />
      </div>

      <div className="az2__chat">
        <div className="chatpanel__hd">공고 상담</div>
        <AiConsult
          user={profile}
          onRequireLogin={onRequireLogin}
          rules={GOV_RULES}
          suggestions={GOV_CHIPS}
          title="공고지원 AI"
          category="policy"
          compact
          noHeader
        />
      </div>

      {openGov && <GovDetailModal item={openGov} onClose={() => setOpenGov(null)} />}
    </div>
  );
}
