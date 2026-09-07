#!/bin/bash
# =========================================================
# DB 파트 전체 데이터 수집을 순서대로 한 번에 실행
# 사용법: DB 폴더 안에서 ./run_all.sh 실행
# 사전 준비: .env 파일에 필요한 값 채워두기, Postgres 컨테이너 켜져 있어야 함
# =========================================================

set -e  # 중간에 하나라도 에러나면 즉시 멈춤

echo "===== 0. 스키마 생성 (테이블이 없을 때만 필요, 이미 있으면 생략 가능) ====="
# docker exec -i startup_db psql -U admin -d startup_platform < schema.sql
echo "  (필요 시 위 줄 주석 해제 후 실행)"

echo "===== 1. 세법 조문 수집 (국가법령정보센터) ====="
uv run python scripts/collect_tax_law.py

echo "===== 2. 정부24 공공서비스(혜택) 정책 수집 ====="
uv run python scripts/collect_gov24.py

echo "===== 3. K-Startup 지원사업 공고 수집 ====="
uv run python scripts/collect_kstartup.py

echo "===== 4. 기업마당 지원사업 공고 수집 ====="
uv run python scripts/collect_bizinfo.py

echo "===== 5. 온통청년 청년정책 수집 ====="
uv run python scripts/collect_ontong_youth.py

echo "===== 6. 세금 신고 일정 생성 (calendar_events, TAX) ====="
uv run python scripts/generate_calendar_events.py

echo "===== 7. 정책 마감일을 캘린더로 연결 (calendar_events, POLICY) ====="
docker exec -i startup_db psql -U admin -d startup_platform < scripts/link_policy_calendar.sql

echo "===== 전체 수집 완료! ====="
