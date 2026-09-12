# LLM LangGraph 250건 로직 수정 후 재평가 — 2026-09-12

## 한눈에 보는 결론

**이번 수정만으로 정책 검색과 세금 답변은 목표 70%에 도달하지 못했다.** 정책 검색은 최초 평가와 거의 같고, 세금 답변은 오히려 2턴 감소했다. 반면 로드맵과 Guardrail은 안정적으로 목표를 통과했다.

| 영역 | 최초 평가 | 수정 후 | 변화 | 목표 70% 기준 | 지금 할 판단 |
| --- | ---: | ---: | ---: | --- | --- |
| **정책 검색 R@5** | 64.3% | **63.5%** | -0.8%p | 미달 | 검색 경로 분리만으로는 개선되지 않음. 후보·Rerank·최종 인용을 분리 진단해야 함 |
| **세금 턴 통과율** | 41/62, 66.1% | **39/62, 62.9%** | -3.2%p | 미달 | 기본값 UX보다 법적 근거 답변이 여전히 가장 큰 병목 |
| **로드맵 턴 통과율** | 57/62, 91.9% | **58/62, 93.5%** | +1.6%p | 통과 | 현 로직 유지, 회귀 검사만 수행 |
| **Guardrail 정확도** | 63/63, 100% | **63/63, 100%** | 동일 | 통과 | 현 로직 유지 |

결론적으로 **우선순위는 ① 정책 검색의 순수 검색 단계 관찰, ② 세금 법적 근거 검색·판정 개선**이다. 이번에 추가한 세금 기본값은 사용자 경험을 개선할 수 있지만, 현재 자동 평가에서는 세금 전체 통과율 상승으로 이어지지 않았다.

> 이번 평가는 새 블라인드 평가가 아니라 기존 `holdout250` 재사용 평가다. 수정 전후 회귀 비교에는 사용할 수 있지만, 처음 보는 질문에 대한 독립적인 일반화 성능으로 해석하지 않는다.

## 무엇이 좋아졌고 무엇이 남았나

| 판단 항목 | 결과 | 해석 |
| --- | --- | --- |
| 정책·세금 문서 경로 분리 | 동작 확인 | 정책은 정책 ID가 연결된 정책·공고, 세금은 세법 문서만 후보 검색에 사용한다 |
| 정책 검색 성능 개선 | 확인되지 않음 | R@5가 64.3%에서 63.5%로 사실상 제자리다 |
| 잘못된 중간 버전 회복 | 확인 | 공고·중복 제거 문제가 있던 중간 실행 56.3%에서 63.5%로 회복했다 |
| 세금 기본값으로 질문 감소 | 자동 점수 개선 없음 | `need_more_info`는 이전과 동일한 9/12턴이다 |
| 세금 계산 흐름 | 소폭 하락 | `calculation`이 16/20에서 15/20턴으로 감소했다 |
| 세금 법적 근거 | 여전히 취약 | `legal_evidence`가 4/18턴으로 변함없이 가장 낮다 |
| 로드맵·Guardrail | 안정적 | 각각 93.5%, 100%로 유지 가능한 수준이다 |

## 정책 검색: 70%까지 6.5%p 부족

| 지표 | 최초 | 수정 후 | 변화 |
| --- | ---: | ---: | ---: |
| P@5 | 16.5% | **16.5%** | 동일 |
| R@5 | 64.3% | **63.5%** | -0.8%p |
| MRR | 66.4% | **66.7%** | +0.3%p |
| MAP | 56.5% | **57.5%** | +1.1%p |
| 정답 전부 검색 | 34/63 | **34/63** | 동일 |
| 정답 일부 검색 | 13/63 | **12/63** | -1건 |
| 정답 전부 누락 | 16/63 | **17/63** | +1건 |

상위에서 찾은 정답의 순위 품질인 MRR·MAP은 조금 좋아졌지만, **정답을 후보에 남기는 범위인 R@5는 좋아지지 않았다.** 따라서 지금은 RRF 상수나 청크 크기를 바로 바꾸기보다, 정답이 Dense/BM25 후보에 없었던 것인지, RRF 또는 Rerank에서 빠졌는지, 마지막 LLM 인용에서 빠졌는지를 먼저 구분해야 한다.

현재 정책 평가는 API의 전체 검색 결과가 아니라 **최종 답변에서 LLM이 인용한 `answer_sources`의 정책 ID**를 사용한다. 이번 실행에서도 `holdout-policy-techbiz-clinic`은 출처 번호 검증 실패로 `generation_validation_failed`가 발생해 정책 ID가 0개로 관찰됐다. 따라서 현재 R@5에는 순수 검색 성능과 답변 생성·인용 안정성이 함께 섞여 있다.

### 질문 유형별 R@5

| 유형 | 문항 | 최초 | 수정 후 | 판단 |
| --- | ---: | ---: | ---: | --- |
| 짧은 질문 | 16 | 84.4% | **81.2%** | 소폭 하락 |
| 일반 질문 | 16 | 53.1% | **53.1%** | 동일, 취약 |
| 긴 문맥 | 16 | 68.8% | **68.8%** | 동일 |
| 노이즈 포함 | 15 | 50.0% | **50.0%** | 동일, 취약 |
| 프로필 직접 명시 | 32 | 76.6% | **75.0%** | 목표 통과 |
| 프로필 암묵 사용 | 31 | 51.6% | **51.6%** | 최우선 개선 대상 |
| 정답 정책 1개 | 42 | 69.0% | **66.7%** | 하락 |
| 정답 정책 여러 개 | 21 | 54.8% | **57.1%** | 개선됐지만 취약 |

문항별로는 63개 중 59개가 이전과 동일했고 2개가 개선, 2개가 악화됐다. 개선은 `holdout-policy-anyang-interest-support`, `holdout-policy-export-translation-shipping`, 악화는 `holdout-policy-techbiz-clinic`, `holdout-policy-small-business-special-guarantee`다. 변화 문항 수가 적고 생성형 답변의 출처 선택도 포함되므로, -0.8%p만으로 경로 분리 자체가 해롭다고 단정할 수는 없다. 다만 **성능 개선 효과가 확인되지 않은 것은 분명하다.**

## 세금: 기본값 UX는 추가됐지만 통과율은 하락

| 세금 유형 | 최초 턴 통과 | 수정 후 턴 통과 | 수정 후 시나리오 통과 | 판단 |
| --- | ---: | ---: | ---: | --- |
| 계산 | 16/20 | **15/20 (75.0%)** | 7/10 | 계산 자체는 70% 이상이나 1턴 감소 |
| 법적 근거 | 4/18 | **4/18 (22.2%)** | 1/9 | 세금 전체 성능을 가장 크게 낮추는 병목 |
| 추가 정보 필요 | 9/12 | **9/12 (75.0%)** | 3/6 | 기본값 변경 후 자동 통과 수는 동일 |
| 지원하지 않는 연도 | 6/6 | **5/6 (83.3%)** | 2/3 | 1턴 회귀 |
| 범위 밖 질문 | 6/6 | **6/6 (100%)** | 3/3 | 정상 |
| **세금 전체** | **41/62 (66.1%)** | **39/62 (62.9%)** | **16/31 (51.6%)** | 목표 70% 미달 |

새로 실패한 세금 턴은 다음 두 개다.

- `holdout-tax-general-vat-adjustments` 2턴: 기대 status 불일치, 관찰 사유 `insufficient_evidence`
- `holdout-tax-future-2027` 2턴: 기대 status 불일치

세금 기본값의 실제 계산 금액과 가정 문구는 로직·단위 테스트로 검증했지만, `/rag/chat` 응답과 현재 평가 결과에는 구조화된 계산 유형·입력·결과가 없다. 따라서 이 자동 평가는 **금액 정확도나 기본값 안내 품질을 직접 채점하지 못한다.** 이번 62.9%를 세금 계산 정확도라고 읽으면 안 된다.

## 로드맵과 공통 Graph: 유지 가능한 영역

| 로드맵 단계 | 최초 턴 통과 | 수정 후 턴 통과 |
| --- | ---: | ---: |
| A | 10/10 | **10/10** |
| B | 7/8 | **7/8** |
| C | 10/10 | **9/10** |
| D | 7/8 | **8/8** |
| E | 5/8 | **6/8** |
| F | 8/8 | **8/8** |
| Z | 10/10 | **10/10** |
| **전체** | **57/62 (91.9%)** | **58/62 (93.5%)** |

Graph 전체 124턴은 97턴 통과로 78.2%였고, 최초 98턴보다 1턴 감소했다. Route는 124/124로 모두 맞았으며, 실패는 주로 status에서 발생했다.

| 공통 check | 수정 후 |
| --- | ---: |
| route | 124/124 |
| status | 97/124 |
| block | 120/124 |
| grounded | 110/124 |
| 필수 문구 | 17/19 |
| 답변 길이 | 62/62 |

## 최종 판단과 다음 작업

### 지금 유지할 것

- 정책과 세금의 **후보 검색 전 문서 경로 분리**
- 정책 ID가 없는 공고를 정책 후보에서 제외하는 조건
- 기존 방식인 Rerank 상위 `top_k` 반환과 동일 정책 청크 허용
- 세금 선택값 기본 가정과 Python 계산 결과의 결정적 금액 표기
- 로드맵과 Guardrail 로직

### 다음 수정 전에 먼저 확인할 것

1. 정책 17개 완전 누락 문항을 `Dense → BM25 → RRF → Rerank → answer_sources` 단계별로 나눠 정답 정책이 처음 사라지는 위치를 기록한다.
2. 정책 공식 검색 지표는 가능하면 LLM 인용 결과와 분리해 Rerank 결과 자체도 함께 측정한다. 그래야 검색 문제와 답변 출처 생성 문제를 구분할 수 있다.
3. 세금은 기본값을 더 늘리기보다 `legal_evidence` 4/18의 검색 대상·근거 충분성 판정·기대 status 불일치를 우선 분석한다.
4. `general-vat-adjustments`와 `future-2027`의 새 status 회귀를 개발용 사례로 재현한 뒤 수정한다.

지금 상태에서 청크 크기나 후보 수를 다시 임의 조정하면 원인을 가릴 가능성이 크다. **정책은 목표까지 6.5%p, 세금은 7.1%p가 부족하므로, 두 영역 모두 실패 단계가 관찰된 뒤에 다음 파라미터 또는 로직 변경을 선택하는 것이 타당하다.**

## 평가 조건과 원시 결과

- 평가 구성: 정책·Guardrail 126문항 + 세금·로드맵 124턴 = 250 평가 단위
- DB 검증: 사용자 3명, 정답 정책 63개, 해당 정책 Chunk 63개 확인
- 문서/Chunk: 10,892개 / 12,613개
- 설정: Dense 20 + BM25 20, RRF `k=60`, Cohere Rerank 후보 20, 최종 `top_k=5`
- 단위·통합 테스트: 301개 통과
- 평균 지연시간: 정책 묶음 5,484ms(최초 대비 +10.2%), Graph 묶음 7,714ms(+6.1%). 외부 API 상태가 포함된 단일 실행값이므로 로직 비용만으로 단정하지 않는다.
- 보고용 엄격 합성 통과: Guardrail 63 + 정책 정답 전부 검색 34 + Graph 통과 97 = **194/250 (77.6%)**. 영역별 핵심 지표와 정의가 달라 보조 지표로만 사용한다.

실행 명령:

```powershell
python -m src.evaluation.run_evaluation --mode policy --suite holdout250 --user-source db --k 5 --base-url http://127.0.0.1:8002 --output evaluation/results/policy_guardrail_holdout250_after_logic_v2_0912.json
python -m src.evaluation.run_evaluation --mode graph --suite holdout250 --user-source db --base-url http://127.0.0.1:8002 --output evaluation/results/tax_roadmap_holdout250_after_logic_v2_0912.json
```

원시 결과:

- [정책·Guardrail 재평가](../../LLM/evaluation/results/policy_guardrail_holdout250_after_logic_v2_0912.json)
- [세금·로드맵 재평가](../../LLM/evaluation/results/tax_roadmap_holdout250_after_logic_v2_0912.json)
- [최초 250건 평가 보고서](LLM_LANGGRAPH_EVALUATION_250_0912.md)

### 정책 완전 누락 17개

`holdout-policy-online-invest-meetup`, `holdout-policy-seoul-tech-consulting`, `holdout-policy-seoul-success-school`, `holdout-policy-techbiz-clinic`, `holdout-policy-influencer-sales`, `holdout-policy-restart-guarantee`, `holdout-policy-workplace-improvement`, `holdout-policy-small-business-special-guarantee`, `holdout-policy-management-improvement`, `holdout-policy-gyeonggi-business-card`, `holdout-policy-food-export-expo`, `holdout-policy-restaurant-facility-loan`, `holdout-policy-youth-food-hub`, `holdout-policy-small-export-shipping`, `holdout-policy-regional-sme-award`, `holdout-policy-small-business-fund`, `holdout-policy-social-economy-fund`.

### 정책 일부 검색 12개

`holdout-policy-cloud-open-innovation`, `holdout-policy-software-project-finance`, `holdout-policy-seoul-tourism-tech`, `holdout-policy-seoul-incubation-space`, `holdout-policy-seoul-center-options`, `holdout-policy-ip-prototype-training`, `holdout-policy-suwon-guarantees`, `holdout-policy-startup-interest-options`, `holdout-policy-consulting-options`, `holdout-policy-stability-funds`, `holdout-policy-japan-market`, `holdout-policy-local-digital-options`.
