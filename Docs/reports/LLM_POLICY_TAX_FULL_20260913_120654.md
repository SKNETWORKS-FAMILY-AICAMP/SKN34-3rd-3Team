# 정책·세금 평가 결과 — 2026-09-13 12:33

평가 범위: **전체 125건**. 기존 holdout250에서 정책·세금만 평가했습니다. Guardrail·로드맵은 포함하지 않았습니다.

| 영역 | 실행 규모 | 핵심 결과 | 평균 응답 시간 |
| --- | ---: | ---: | ---: |
| 정책 | 63문항 | R@5 77.0% | 11.25초 |
| 세금 | 31시나리오·62턴 | 47/62 통과 (75.8%) | 14.63초 |

정책 R@5와 세금 턴 통과율은 다른 지표이므로 합산하지 않습니다. 자동 채점 통과는 법률 해석이나 계산 금액의 정확성을 보증하지 않습니다.

평가 ID: 정책 `holdout-policy-ai-road-startup`, `holdout-policy-online-invest-meetup`, `holdout-policy-seoul-tech-consulting`, `holdout-policy-sw-hiring-academy`, `holdout-policy-laser-equipment-class`, `holdout-policy-seoul-success-school`, `holdout-policy-startup-center-space`, `holdout-policy-jongno-youth-center`, `holdout-policy-seoul-special-guarantee`, `holdout-policy-seoul-youth-rent`, `holdout-policy-employment-insurance`, `holdout-policy-yeongdeungpo-academy`, `holdout-policy-guro-startup-class`, `holdout-policy-techbiz-clinic`, `holdout-policy-cloud-open-innovation`, `holdout-policy-small-business-ai`, `holdout-policy-software-project-finance`, `holdout-policy-seoul-tourism-tech`, `holdout-policy-seoul-incubation-space`, `holdout-policy-seoul-center-options`, `holdout-policy-ip-prototype-training`, `holdout-policy-gyeonggi-production-sales`, `holdout-policy-youth-hiring-subsidy`, `holdout-policy-influencer-sales`, `holdout-policy-store-environment`, `holdout-policy-anyang-interest-support`, `holdout-policy-anyang-guarantee`, `holdout-policy-fashion-furniture-marketing`, `holdout-policy-gyeonggi-small-guarantee`, `holdout-policy-restart-guarantee`, `holdout-policy-online-offline-entry`, `holdout-policy-workplace-improvement`, `holdout-policy-small-business-special-guarantee`, `holdout-policy-management-improvement`, `holdout-policy-gyeonggi-business-card`, `holdout-policy-food-export-expo`, `holdout-policy-influencer-programs`, `holdout-policy-online-store-entry`, `holdout-policy-restaurant-facility-loan`, `holdout-policy-suwon-guarantees`, `holdout-policy-anyang-small-guarantees`, `holdout-policy-youth-food-hub`, `holdout-policy-jeonnam-digital-transition`, `holdout-policy-small-export-shipping`, `holdout-policy-regional-sme-award`, `holdout-policy-cooperative-consulting`, `holdout-policy-export-insurance`, `holdout-policy-youth-company-cert`, `holdout-policy-defense-venture`, `holdout-policy-youth-culture-card`, `holdout-policy-yellow-umbrella`, `holdout-policy-small-business-fund`, `holdout-policy-industry-crisis`, `holdout-policy-seafood-expo`, `holdout-policy-buyer-invitation`, `holdout-policy-social-economy-fund`, `holdout-policy-export-translation-shipping`, `holdout-policy-startup-interest-options`, `holdout-policy-consulting-options`, `holdout-policy-stability-funds`, `holdout-policy-export-risk`, `holdout-policy-japan-market`, `holdout-policy-local-digital-options`

평가 ID: 세금 `holdout-tax-income-year`, `holdout-tax-income-bracket`, `holdout-tax-general-vat-prepaid`, `holdout-tax-general-vat-adjustments`, `holdout-tax-simple-vat-food`, `holdout-tax-simple-vat-transport`, `holdout-tax-withholding-family`, `holdout-tax-withholding-children`, `holdout-tax-startup-seoul`, `holdout-tax-startup-jeonnam`, `holdout-tax-business-transfer`, `holdout-tax-common-input-tax`, `holdout-tax-bookkeeping-penalty`, `holdout-tax-business-expense`, `holdout-tax-invoice-issue`, `holdout-tax-bad-debt-credit`, `holdout-tax-withholding-deadline`, `holdout-tax-corporate-expense`, `holdout-tax-startup-reduction-law`, `holdout-tax-missing-year`, `holdout-tax-sales-vs-base`, `holdout-tax-missing-family`, `holdout-tax-missing-industry`, `holdout-tax-missing-region`, `holdout-tax-missing-input-tax`, `holdout-tax-future-2026`, `holdout-tax-old-2022`, `holdout-tax-future-2027`, `holdout-tax-movie`, `holdout-tax-translation`, `holdout-tax-route-game`

## 정책 검색

- R@5: **77.0%**, P@5: 19.7%, MRR: 74.1%
- 정답 정책을 모두 찾은 문항: **43/63**
- 일부 또는 전체를 놓친 문항: `holdout-policy-seoul-tech-consulting`, `holdout-policy-seoul-success-school`, `holdout-policy-cloud-open-innovation`, `holdout-policy-small-business-ai`, `holdout-policy-software-project-finance`, `holdout-policy-seoul-tourism-tech`, `holdout-policy-seoul-incubation-space`, `holdout-policy-seoul-center-options`, `holdout-policy-ip-prototype-training`, `holdout-policy-anyang-interest-support`, `holdout-policy-restart-guarantee`, `holdout-policy-workplace-improvement`, `holdout-policy-gyeonggi-business-card`, `holdout-policy-food-export-expo`, `holdout-policy-restaurant-facility-loan`, `holdout-policy-suwon-guarantees`, `holdout-policy-youth-food-hub`, `holdout-policy-small-business-fund`, `holdout-policy-consulting-options`, `holdout-policy-japan-market`

## 세금 답변

- 턴 통과: **47/62 (75.8%)**
- 시나리오 전체 통과: **21/31 (67.7%)**
- 실패 턴:
  - `holdout-tax-startup-seoul` 1턴: status
  - `holdout-tax-startup-seoul` 2턴: status
  - `holdout-tax-startup-jeonnam` 1턴: status
  - `holdout-tax-startup-jeonnam` 2턴: status
  - `holdout-tax-business-expense` 1턴: status, grounded
  - `holdout-tax-business-expense` 2턴: status, grounded
  - `holdout-tax-invoice-issue` 2턴: status, grounded
  - `holdout-tax-bad-debt-credit` 2턴: status, grounded
  - `holdout-tax-corporate-expense` 1턴: status, grounded
  - `holdout-tax-corporate-expense` 2턴: status, grounded
  - `holdout-tax-startup-reduction-law` 1턴: status, grounded
  - `holdout-tax-startup-reduction-law` 2턴: status, grounded
  - `holdout-tax-missing-family` 1턴: status
  - `holdout-tax-missing-region` 2턴: status
  - `holdout-tax-missing-input-tax` 1턴: status

원시 결과: [정책 JSON](../../LLM/evaluation/results/policy_20260913_120654.json) · [세금 JSON](../../LLM/evaluation/results/tax_20260913_120654.json)
