# API 명세서

`Docs/FUNCTIONAL_SPEC.md`의 기능(FS-xx)을 REST API로 설계한 문서다. Backend는 아직 스텁 코드 상태라 아래는 설계 산출물이며, 실제 구현 시 조정될 수 있다.

- Base URL: TBD
- 인증 방식: TBD (엔드포인트별 인증 필요 여부만 우선 표기)

## auth — 회원/인증

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /auth/signup | 회원가입 | 불필요 | `{ email, password }` | `{ userId }` | FS-01 |
| POST | /auth/login | 로그인 | 불필요 | `{ email, password }` | `{ accessToken }`(TBD) | FS-02 |
| POST | /auth/logout | 로그아웃 | TBD | - | `{}` | FS-02 |

## users — 사용자 프로필

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /users/me | 개인정보 조회 | TBD | - | `{ age, region, ... }` | FS-03 |
| PUT | /users/me | 개인정보 수정 | TBD | `{ age, region, ... }` | `{ updated: true }` | FS-03 |
| GET | /users/me/business-profile | 사업자 정보 조회 | TBD | - | `{ businessType, industry, foundedAt, ... }` | FS-04 |
| PUT | /users/me/business-profile | 사업자 정보 등록/수정 | TBD | `{ businessType, industry, foundedAt, ... }` | `{ updated: true }` | FS-04 |

## chat — AI 상담(챗봇)

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /chat/messages | 챗봇 질의 전송 (category: tax / expense / saving / policy) | TBD | `{ category, question }` | `{ messageId, answer }` | FS-05, FS-06, FS-07 |
| GET | /chat/messages/{messageId}/sources | 답변 근거 문서 조회 | TBD | - | `{ sources: [{ title, url, excerpt }] }` | FS-08 |

## calendar — 홈 화면 캘린더

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /calendar | 홈 화면 통합 일정 캘린더 조회(세금+지원금) | TBD | `?year&month&type`(tax,policy 선택) | `{ events: [...] }` | FS-11 |

## tax — 세무 관리

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /tax/business-type/diagnosis | 사업자 유형 진단 실행 | TBD | `{ conditions }` | `{ recommendedType, comparison }` | FS-09 |
| GET | /tax/info | 세금 정보 조회 | TBD | - | `{ taxInfo }` | FS-10 |
| PUT | /tax/info | 세금 정보 수정 | TBD | `{ taxInfo }` | `{ updated: true }` | FS-10 |
| GET | /tax/calendar | 세금 캘린더 조회(세금 전용, 홈 화면 통합 조회는 GET /calendar 참고) | TBD | `?year&month` | `{ events: [...] }` | FS-11 |
| GET | /tax/reminders | 세금/지원금 일정 리마인더 목록 조회 | TBD | - | `{ reminders: [...] }` | FS-12 |
| POST | /tax/reminders | 세금/지원금 일정 리마인더 등록 | TBD | `{ eventId, notifyAt }` | `{ reminderId }` | FS-12 |
| DELETE | /tax/reminders/{reminderId} | 리마인더 삭제 | TBD | - | `{ deleted: true }` | FS-12 |
| POST | /tax/tax-reduction/check | 청년창업 세액감면 판정 실행 | TBD | - (사용자·사업자 정보 기반) | `{ eligible, reasons, legalBasis }` | FS-13 |
| GET | /tax/tax-reduction/result | 최근 판정 결과 조회 | TBD | - | `{ eligible, reasons, legalBasis }` | FS-13 |

## expenses — 지출 분석

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /expenses/receipts | 영수증 등록(업로드, OCR 트리거) | TBD | `multipart/form-data (image)` | `{ receiptId, status }` | FS-14 |
| GET | /expenses/receipts/{receiptId} | 영수증 OCR 추출 결과 조회 | TBD | - | `{ date, vendor, amount, items }` | FS-15 |
| GET | /expenses | 지출 내역(분류 포함) 조회 | TBD | `?from&to&category` | `{ expenses: [...] }` | FS-16 |
| GET | /expenses/{expenseId}/deductibility | 경비처리 가능성 분석 결과 조회 | TBD | - | `{ deductible, confidence, basis }` | FS-17 |

## policies — 지원정책 탐색

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /policies | 지원정책 검색 | TBD | `?keyword&region&industry` | `{ policies: [...] }` | FS-18 |
| GET | /policies/recommendations | 맞춤 정책 추천 | TBD | - | `{ policies: [...] }` | FS-19 |
| GET | /policies/{policyId} | 정책 상세(신청기간·방법 포함) 조회 | TBD | - | `{ policy, applyPeriod, applyMethod }` | FS-21 |
| GET | /policies/{policyId}/eligibility | 지원 자격 확인 | TBD | - | `{ eligible, reasons }` | FS-20 |
| GET | /announcements/{announcementId}/summary | 공고문 AI 요약 조회 | TBD | - | `{ target, benefit, period, documents, notes, source }` | FS-22 |
| POST | /policies/{policyId}/save | 관심 정책 저장 | TBD | - | `{ saved: true }` | FS-23 |
| GET | /policies/saved | 저장한 정책 목록 조회 | TBD | - | `{ policies: [...] }` | FS-23 |

## admin — 관리자

| Method | Endpoint | 설명 | 인증 | Request | Response | 관련 기능ID |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /admin/auth/login | 관리자 로그인 | 불필요 | `{ email, password }` | `{ accessToken }`(TBD) | FS-24 |
| GET | /admin/users | 사용자 목록 조회 | TBD (관리자 권한) | `?page` | `{ users: [...] }` | FS-25 |
| GET | /admin/users/{userId} | 사용자 상세 조회 | TBD (관리자 권한) | - | `{ user }` | FS-25 |
| GET | /admin/tax-documents | 세법 자료 목록 조회 | TBD (관리자 권한) | - | `{ documents: [...] }` | FS-26 |
| POST | /admin/tax-documents | 세법 자료 등록 | TBD (관리자 권한) | `{ title, content, source }` | `{ documentId }` | FS-26 |
| GET | /admin/policies | 정책 데이터 목록 조회 | TBD (관리자 권한) | - | `{ policies: [...] }` | FS-26 |
| POST | /admin/policies | 정책 데이터 등록 | TBD (관리자 권한) | `{ title, content, ... }` | `{ policyId }` | FS-26 |
| GET | /admin/announcements | 공고문 데이터 목록 조회 | TBD (관리자 권한) | - | `{ announcements: [...] }` | FS-26 |
| POST | /admin/announcements | 공고문 데이터 등록 | TBD (관리자 권한) | `{ title, content, ... }` | `{ announcementId }` | FS-26 |
| POST | /admin/rag-documents/reindex | RAG 문서 재색인 | TBD (관리자 권한) | `{ documentIds }`(선택) | `{ status }` | FS-27 |
| GET | /admin/monitoring | 시스템 모니터링 대시보드 데이터 조회 | TBD (관리자 권한) | - | `{ metrics }` | FS-28 |
