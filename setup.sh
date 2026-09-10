#!/usr/bin/env bash
#
# 청년·1인 창업 지원 플랫폼 로컬 실행 스크립트 (macOS / Linux / Windows Git Bash)
#
#   ./setup.sh                 전체 기동 후 Frontend 개발 서버까지 실행
#   ./setup.sh --no-frontend   컨테이너만 기동하고 종료 (CI·헤드리스용)
#
# db·backend·llm 은 Docker Compose 로 띄우고 Frontend 만 호스트에서 돈다.
# Frontend 가 호스트인 이유: vite.config.js 의 /api 프록시 대상이 호스트 주소
# (http://localhost:8000) 이고 compose 에 frontend 서비스가 없기 때문이다.
#
# .env 는 만들지 않는다. 비밀키가 들어 있어 git 으로 공유되지 않으므로
# 팀에서 파일로 받아 저장소 루트에 두어야 한다.

set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(pwd)"

RUN_FRONTEND=1
for arg in "$@"; do
  case "$arg" in
    --no-frontend) RUN_FRONTEND=0 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "알 수 없는 옵션: $arg (사용 가능: --no-frontend)" >&2
      exit 2 ;;
  esac
done

# --------------------------------------------------------------------------
# 출력 도우미
# --------------------------------------------------------------------------
step() { echo; echo "[$1/7] $2"; }
ok()   { echo "  OK  $*"; }
warn() { echo "  *   $*"; }
die()  { echo; echo "  X   $*" >&2; echo >&2; exit 1; }

# 컨테이너가 끝내 안 뜰 때 원인을 바로 보여준다
dump_logs() {
  echo
  echo "  --- $1 최근 로그 ---"
  $COMPOSE logs --tail=40 "$1" 2>&1 | sed 's/^/  /'
  echo "  --------------------"
}

# .env 에서 KEY 값을 읽는다. 주석(#)으로 시작하는 줄은 매칭되지 않는다.
env_value() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" .env 2>/dev/null \
    | tail -n 1 | tr -d '\r' \
    | sed -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

# --------------------------------------------------------------------------
step 1 "사전 요구사항 확인"
# --------------------------------------------------------------------------
need() {
  command -v "$1" >/dev/null 2>&1 || die "$1 이(가) 없습니다. 설치 후 다시 실행하세요.
      $2"
}
need docker "https://docs.docker.com/get-docker/"
need curl   "https://curl.se/download.html"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  die "docker compose 를 찾을 수 없습니다. Docker Desktop 을 설치하거나 업데이트하세요.
      https://docs.docker.com/get-docker/"
fi

docker info >/dev/null 2>&1 || die "Docker 데몬이 실행 중이 아닙니다. Docker Desktop 을 먼저 켜세요."

if [ "$RUN_FRONTEND" -eq 1 ]; then
  need node "https://nodejs.org/  (18 이상, 20 LTS 권장)"
  need npm  "https://nodejs.org/"
fi

ok "docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo '?') / $($COMPOSE version --short 2>/dev/null || echo '?')"
[ "$RUN_FRONTEND" -eq 1 ] && ok "node $(node -v) / npm $(npm -v)"

# compose 컨테이너가 아닌 프로세스가 포트를 먼저 잡고 있으면, 컨테이너를 띄워도
# 그쪽으로 요청이 가서 원인 찾기가 어려워진다(직접 띄운 uvicorn 등). 미리 알린다.
# 이미 우리 컨테이너가 떠 있는 재실행 상황에서는 경고하지 않는다.
svc_running() {
  cid="$($COMPOSE ps -q "$1" 2>/dev/null)"
  [ -n "$cid" ] && [ "$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null)" = "true" ]
}
check_port() { # $1=포트 $2=compose 서비스명
  svc_running "$2" && return 0
  if curl -fsS --max-time 2 "http://127.0.0.1:$1/health" >/dev/null 2>&1; then
    warn "compose 컨테이너가 아닌 프로세스가 :$1 에서 응답하고 있습니다."
    warn "  컨테이너를 띄워도 그쪽이 응답합니다. 직접 실행한 서버를 먼저 종료하세요."
  fi
}
check_port 8000 backend
check_port 8001 llm

# --------------------------------------------------------------------------
step 2 ".env 확인"
# --------------------------------------------------------------------------
if [ ! -f .env ]; then
  cat >&2 <<EOF

  X   저장소 루트에 .env 가 없습니다.

      .env 는 비밀키가 들어 있어 git 으로 공유되지 않습니다.
      팀 담당자에게 .env 파일을 받아 아래 경로에 두고 다시 실행하세요.

         $ROOT/.env

      필요 키: POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
               OPENAI_API_KEY / LLM_MODEL / EMBEDDING_MODEL

EOF
  exit 1
fi

# 이 셋이 비면 db 컨테이너의 pg_isready 헬스체크가 통과하지 못하고
# backend·llm 이 depends_on: service_healthy 에서 영원히 대기한다.
# docker-compose.yml 이 이 값들에 :- 기본값을 두지 않기 때문이다.
MISSING=""
for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  [ -z "$(env_value "$key")" ] && MISSING="$MISSING $key"
done
if [ -n "$MISSING" ]; then
  die ".env 의 다음 필수 값이 비어 있습니다:$MISSING
      이 값이 없으면 db 컨테이너가 기동하지 못하고 backend·llm 이 무한 대기합니다.
      팀에서 받은 .env 가 맞는지 확인하세요."
fi

PG_USER="$(env_value POSTGRES_USER)"
PG_DB="$(env_value POSTGRES_DB)"
ok ".env 확인됨 (POSTGRES_DB=$PG_DB)"

# 없어도 서비스는 뜬다. AI 답변만 목업이 되므로 경고만 한다.
AI_READY=1
for key in OPENAI_API_KEY LLM_MODEL EMBEDDING_MODEL; do
  v="$(env_value "$key")"
  case "$v" in ""|YOUR_*) warn "$key 미설정"; AI_READY=0 ;; esac
done
[ "$AI_READY" -eq 0 ] && warn "AI 상담·공고 요약은 목업으로 동작합니다. 화면·DB·정책조회는 정상입니다."

# --------------------------------------------------------------------------
step 3 "이미지 빌드"
# --------------------------------------------------------------------------
echo "  (최초 실행은 몇 분 걸립니다)"
$COMPOSE build || die "이미지 빌드에 실패했습니다."
ok "빌드 완료"

# --------------------------------------------------------------------------
step 4 "DB 기동 및 스키마 보정"
# --------------------------------------------------------------------------
$COMPOSE up -d db || die "db 컨테이너를 띄우지 못했습니다."

DB_CID="$($COMPOSE ps -q db)"
[ -n "$DB_CID" ] || die "db 컨테이너를 찾지 못했습니다."

printf '  healthy 대기'
for i in $(seq 1 60); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$DB_CID" 2>/dev/null || echo starting)"
  [ "$status" = "healthy" ] && break
  printf '.'
  sleep 2
done
echo
[ "$status" = "healthy" ] || { dump_logs db; die "db 가 60초 안에 준비되지 않았습니다 (상태: $status)."; }
ok "db healthy"

# 01_schema.sql·app_extras.sql 은 /docker-entrypoint-initdb.d 로 마운트돼 있지만
# initdb 는 볼륨이 비어 있을 때만 실행된다. 그 마운트가 추가되기 전에 만들어진
# 볼륨에는 app_extras 가 적용되지 않아 backend 가 users.phone 없음으로 죽는다.
# 전 문장이 IF NOT EXISTS 라 여러 번 실행해도 안전하고 기존 행을 지우지 않는다.
if $COMPOSE exec -T -e PGOPTIONS=--client-min-messages=warning \
     db psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -q < DB/app_extras.sql; then
  ok "app_extras.sql 적용 (기존 데이터 유지)"
else
  die "app_extras.sql 적용에 실패했습니다. 위 오류를 확인하세요."
fi

# --------------------------------------------------------------------------
step 5 "Backend·LLM 기동"
# --------------------------------------------------------------------------
$COMPOSE up -d backend llm || die "backend·llm 을 띄우지 못했습니다."
ok "컨테이너 기동 요청 완료"

# --------------------------------------------------------------------------
step 6 "헬스체크"
# --------------------------------------------------------------------------
wait_http() { # $1=url $2=이름 $3=서비스
  printf '  %s 대기' "$2"
  for i in $(seq 1 45); do
    if curl -fsS --max-time 5 "$1" >/dev/null 2>&1; then echo; ok "$2 응답"; return 0; fi
    printf '.'
    sleep 2
  done
  echo
  dump_logs "$3"
  die "$2 가 90초 안에 응답하지 않았습니다."
}

wait_http http://127.0.0.1:8001/health "LLM     :8001" llm
wait_http http://127.0.0.1:8000/health "Backend :8000" backend

HEALTH="$(curl -fsS --max-time 10 http://127.0.0.1:8000/health)"
echo "  $HEALTH"

case "$HEALTH" in
  *'"storage":"postgres"'*) ok "Postgres 연결됨" ;;
  *) warn "Backend 가 SQLite 로 폴백했습니다. Postgres 연결을 확인하세요."
     warn "  (DB 는 떠 있지만 backend 가 붙지 못한 상태입니다)" ;;
esac
case "$HEALTH" in
  *'"ragReady":true'*) ok "RAG 인덱스 준비됨" ;;
  *) warn "RAG 인덱스가 비어 있어 AI 답변은 목업입니다."
     warn "  실답변이 필요하면 rag_documents 임베딩 후 POST :8001/rag/reindex (OpenAI 비용 발생)" ;;
esac

# --------------------------------------------------------------------------
step 7 "Frontend"
# --------------------------------------------------------------------------
if [ "$RUN_FRONTEND" -eq 0 ]; then
  ok "--no-frontend 지정: 건너뜁니다."
  echo
  echo "  Backend  http://localhost:8000/docs"
  echo "  LLM      http://localhost:8001/docs"
  echo "  종료     $COMPOSE down"
  echo
  exit 0
fi

cd Frontend
# npm ci 는 node_modules 를 통째로 지우고 다시 깐다. 실행 중인 Vite 가
# esbuild.exe 를 잠그면 EPERM 으로 실패하므로 필요할 때만 돌린다.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "  의존성 설치 중 (npm ci)"
  npm ci || die "npm ci 에 실패했습니다. 실행 중인 개발 서버가 있으면 종료 후 다시 시도하세요."
  ok "설치 완료"
else
  ok "의존성 최신 (건너뜀)"
fi

cat <<EOF

  ============================================================
   준비 완료

     화면      http://localhost:5173   (브라우저 자동 실행)
     Backend   http://localhost:8000/docs
     LLM       http://localhost:8001/docs

     데모 계정  demo@demo.com  / demo123
     관리자     admin@demo.com / admin123

     Ctrl+C 는 Frontend 만 멈춥니다.
     컨테이너까지 내리려면:  $COMPOSE down
  ============================================================

EOF

exec npm run dev
