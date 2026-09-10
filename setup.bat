@echo off
REM ---------------------------------------------------------------------------
REM  청년·1인 창업 지원 플랫폼 로컬 실행 스크립트 (Windows cmd.exe)
REM
REM    setup.bat                 전체 기동 후 Frontend 개발 서버까지 실행
REM    setup.bat --no-frontend   컨테이너만 기동하고 종료 (CI·헤드리스용)
REM
REM  db·backend·llm 은 Docker Compose 로 띄우고 Frontend 만 호스트에서 돈다.
REM  Frontend 가 호스트인 이유: vite.config.js 의 /api 프록시 대상이 호스트 주소
REM  (http://localhost:8000) 이고 compose 에 frontend 서비스가 없기 때문이다.
REM
REM  .env 는 만들지 않는다. 비밀키가 들어 있어 git 으로 공유되지 않으므로
REM  팀에서 파일로 받아 저장소 루트에 두어야 한다.
REM ---------------------------------------------------------------------------

REM 이 파일은 CP949(EUC-KR)로 저장돼 있다. cmd.exe 는 배치 파일을 OEM 코드페이지로
REM 읽으므로 UTF-8 로 저장하면 한글이 깨지면서 파싱까지 실패한다. 편집 후에는
REM 반드시 CP949 로 다시 저장할 것. chcp 는 호출하지 않는다(기본 949 그대로 사용).
REM
REM 경고 표시는 * 를 쓴다. 느낌표는 delayed expansion 이 삼키고,
REM 괄호 블록 안에서는 ^! 이스케이프마저 파싱 단계에 캐럿이 소비돼 먹힌다.
setlocal enabledelayedexpansion

cd /d "%~dp0"
set "ROOT=%CD%"

REM shift 는 괄호 블록 안에서 즉시 반영되지 않아 인자 파싱이 어긋난다.
REM for 로 한 번에 훑는다.
set RUN_FRONTEND=1
set "BADARG="
for %%a in (%*) do (
    if /i "%%~a"=="--no-frontend" (
        set RUN_FRONTEND=0
    ) else (
        set "BADARG=%%~a"
    )
)
if defined BADARG (
    echo 알 수 없는 옵션: !BADARG!  ^(사용 가능: --no-frontend^)
    exit /b 2
)

REM ---------------------------------------------------------------------------
echo.
echo [1/7] 사전 요구사항 확인
REM ---------------------------------------------------------------------------
where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo   X   docker 이^(가^) 없습니다. 설치 후 다시 실행하세요.
    echo       https://docs.docker.com/get-docker/
    echo.
    exit /b 1
)
where curl >nul 2>&1
if errorlevel 1 (
    echo.
    echo   X   curl 이^(가^) 없습니다. Windows 10 1803 이상에 기본 포함돼 있습니다.
    echo.
    exit /b 1
)

set "COMPOSE=docker compose"
docker compose version >nul 2>&1
if errorlevel 1 (
    where docker-compose >nul 2>&1
    if errorlevel 1 (
        echo.
        echo   X   docker compose 를 찾을 수 없습니다. Docker Desktop 을 설치하거나 업데이트하세요.
        echo       https://docs.docker.com/get-docker/
        echo.
        exit /b 1
    )
    set "COMPOSE=docker-compose"
)

docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo   X   Docker 데몬이 실행 중이 아닙니다. Docker Desktop 을 먼저 켜세요.
    echo.
    exit /b 1
)

if "!RUN_FRONTEND!"=="1" (
    where node >nul 2>&1
    if errorlevel 1 (
        echo.
        echo   X   node 이^(가^) 없습니다. 설치 후 다시 실행하세요.
        echo       https://nodejs.org/  ^(18 이상, 20 LTS 권장^)
        echo.
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('docker version --format "{{.Server.Version}}" 2^>nul') do set "DOCKER_VER=%%v"
echo   OK  docker !DOCKER_VER!
if "!RUN_FRONTEND!"=="1" (
    for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
    echo   OK  node !NODE_VER!
)

REM compose 컨테이너가 아닌 프로세스가 포트를 먼저 잡고 있으면, 컨테이너를 띄워도
REM 그쪽으로 요청이 가서 원인 찾기가 어려워진다(직접 띄운 uvicorn 등). 미리 알린다.
REM 이미 우리 컨테이너가 떠 있는 재실행 상황에서는 경고하지 않는다.
call :checkport 8000 backend
call :checkport 8001 llm

REM ---------------------------------------------------------------------------
echo.
echo [2/7] .env 확인
REM ---------------------------------------------------------------------------
if not exist ".env" (
    echo.
    echo   X   저장소 루트에 .env 가 없습니다.
    echo.
    echo       .env 는 비밀키가 들어 있어 git 으로 공유되지 않습니다.
    echo       팀 담당자에게 .env 파일을 받아 아래 경로에 두고 다시 실행하세요.
    echo.
    echo          %ROOT%\.env
    echo.
    echo       필요 키: POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
    echo                OPENAI_API_KEY / LLM_MODEL / EMBEDDING_MODEL
    echo.
    exit /b 1
)

REM 이 셋이 비면 db 컨테이너의 pg_isready 헬스체크가 통과하지 못하고
REM backend·llm 이 depends_on: service_healthy 에서 영원히 대기한다.
REM docker-compose.yml 이 이 값들에 :- 기본값을 두지 않기 때문이다.
set "MISSING="
for %%k in (POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB) do (
    call :envval %%k
    if "!ENVVAL!"=="" set "MISSING=!MISSING! %%k"
)
if not "!MISSING!"=="" (
    echo.
    echo   X   .env 의 다음 필수 값이 비어 있습니다:!MISSING!
    echo       이 값이 없으면 db 컨테이너가 기동하지 못하고 backend·llm 이 무한 대기합니다.
    echo       팀에서 받은 .env 가 맞는지 확인하세요.
    echo.
    exit /b 1
)

call :envval POSTGRES_USER
set "PG_USER=!ENVVAL!"
call :envval POSTGRES_DB
set "PG_DB=!ENVVAL!"
echo   OK  .env 확인됨 ^(POSTGRES_DB=!PG_DB!^)

REM 없어도 서비스는 뜬다. AI 답변만 목업이 되므로 경고만 한다.
set AI_READY=1
for %%k in (OPENAI_API_KEY LLM_MODEL EMBEDDING_MODEL) do (
    call :envval %%k
    if "!ENVVAL!"=="" (
        echo   *   %%k 미설정
        set AI_READY=0
    ) else (
        echo !ENVVAL! | findstr /b /c:"YOUR_" >nul 2>&1
        if not errorlevel 1 (
            echo   *   %%k 미설정
            set AI_READY=0
        )
    )
)
if "!AI_READY!"=="0" (
    echo   *   AI 상담·공고 요약은 목업으로 동작합니다. 화면·DB·정책조회는 정상입니다.
)

REM ---------------------------------------------------------------------------
echo.
echo [3/7] 이미지 빌드
REM ---------------------------------------------------------------------------
echo   ^(최초 실행은 몇 분 걸립니다^)
%COMPOSE% build
if errorlevel 1 (
    echo.
    echo   X   이미지 빌드에 실패했습니다.
    echo.
    exit /b 1
)
echo   OK  빌드 완료

REM ---------------------------------------------------------------------------
echo.
echo [4/7] DB 기동 및 스키마 보정
REM ---------------------------------------------------------------------------
%COMPOSE% up -d db
if errorlevel 1 (
    echo.
    echo   X   db 컨테이너를 띄우지 못했습니다.
    echo.
    exit /b 1
)

set "DB_CID="
for /f "tokens=*" %%i in ('%COMPOSE% ps -q db 2^>nul') do set "DB_CID=%%i"
if "!DB_CID!"=="" (
    echo.
    echo   X   db 컨테이너를 찾지 못했습니다.
    echo.
    exit /b 1
)

<nul set /p "=  healthy 대기"
set DB_STATUS=starting
for /l %%i in (1,1,60) do (
    if not "!DB_STATUS!"=="healthy" (
        for /f "tokens=*" %%s in ('docker inspect --format "{{.State.Health.Status}}" !DB_CID! 2^>nul') do set "DB_STATUS=%%s"
        if not "!DB_STATUS!"=="healthy" (
            <nul set /p "=."
            ping -n 3 127.0.0.1 >nul
        )
    )
)
echo.
if not "!DB_STATUS!"=="healthy" (
    call :dumplogs db
    echo   X   db 가 60초 안에 준비되지 않았습니다 ^(상태: !DB_STATUS!^).
    echo.
    exit /b 1
)
echo   OK  db healthy

REM 01_schema.sql·app_extras.sql 은 /docker-entrypoint-initdb.d 로 마운트돼 있지만
REM initdb 는 볼륨이 비어 있을 때만 실행된다. 그 마운트가 추가되기 전에 만들어진
REM 볼륨에는 app_extras 가 적용되지 않아 backend 가 users.phone 없음으로 죽는다.
REM 전 문장이 IF NOT EXISTS 라 여러 번 실행해도 안전하고 기존 행을 지우지 않는다.
%COMPOSE% exec -T -e PGOPTIONS=--client-min-messages=warning db psql -U !PG_USER! -d !PG_DB! -v ON_ERROR_STOP=1 -q < DB\app_extras.sql
if errorlevel 1 (
    echo.
    echo   X   app_extras.sql 적용에 실패했습니다. 위 오류를 확인하세요.
    echo.
    exit /b 1
)
echo   OK  app_extras.sql 적용 ^(기존 데이터 유지^)

REM ---------------------------------------------------------------------------
echo.
echo [5/7] Backend·LLM 기동
REM ---------------------------------------------------------------------------
%COMPOSE% up -d backend llm
if errorlevel 1 (
    echo.
    echo   X   backend·llm 을 띄우지 못했습니다.
    echo.
    exit /b 1
)
echo   OK  컨테이너 기동 요청 완료

REM ---------------------------------------------------------------------------
echo.
echo [6/7] 헬스체크
REM ---------------------------------------------------------------------------
REM 표시 이름에 괄호를 쓰지 말 것. %~2 가 괄호 블록 안에서 전개되면서
REM ')' 가 블록을 조기에 닫아 구문 오류가 난다.
call :waithttp "http://127.0.0.1:8001/health" "LLM     :8001" llm
if errorlevel 1 exit /b 1
call :waithttp "http://127.0.0.1:8000/health" "Backend :8000" backend
if errorlevel 1 exit /b 1

for /f "tokens=*" %%h in ('curl -fsS --max-time 10 "http://127.0.0.1:8000/health" 2^>nul') do set "HEALTH=%%h"
echo   !HEALTH!

echo !HEALTH! | findstr /c:"\"storage\":\"postgres\"" >nul 2>&1
if errorlevel 1 (
    echo   *   Backend 가 SQLite 로 폴백했습니다. Postgres 연결을 확인하세요.
    echo   *     ^(DB 는 떠 있지만 backend 가 붙지 못한 상태입니다^)
) else (
    echo   OK  Postgres 연결됨
)

echo !HEALTH! | findstr /c:"\"ragReady\":true" >nul 2>&1
if errorlevel 1 (
    echo   *   RAG 인덱스가 비어 있어 AI 답변은 목업입니다.
    echo   *     실답변이 필요하면 rag_documents 임베딩 후 POST :8001/rag/reindex ^(OpenAI 비용 발생^)
) else (
    echo   OK  RAG 인덱스 준비됨
)

REM ---------------------------------------------------------------------------
echo.
echo [7/7] Frontend
REM ---------------------------------------------------------------------------
if "!RUN_FRONTEND!"=="0" (
    echo   OK  --no-frontend 지정: 건너뜁니다.
    echo.
    echo   Backend  http://localhost:8000/docs
    echo   LLM      http://localhost:8001/docs
    echo   종료     %COMPOSE% down
    echo.
    exit /b 0
)

cd Frontend
REM npm ci 는 node_modules 를 통째로 지우고 다시 깐다. 실행 중인 Vite 가
REM esbuild.exe 를 잠그면 EPERM 으로 실패하므로 없을 때만 돌린다.
REM git pull 로 package-lock.json 이 바뀐 뒤에는 직접 npm ci 를 실행할 것.
if not exist "node_modules" (
    echo   의존성 설치 중 ^(npm ci^)
    call npm ci
    if errorlevel 1 (
        echo.
        echo   X   npm ci 에 실패했습니다. 실행 중인 개발 서버가 있으면 종료 후 다시 시도하세요.
        echo.
        exit /b 1
    )
    echo   OK  설치 완료
) else (
    echo   OK  의존성 존재 ^(건너뜀 - git pull 후에는 npm ci 를 직접 실행하세요^)
)

echo.
echo   ============================================================
echo    준비 완료
echo.
echo      화면      http://localhost:5173   ^(브라우저 자동 실행^)
echo      Backend   http://localhost:8000/docs
echo      LLM       http://localhost:8001/docs
echo.
echo      데모 계정  demo@demo.com  / demo123
echo      관리자     admin@demo.com / admin123
echo.
echo      Ctrl+C 는 Frontend 만 멈춥니다.
echo      컨테이너까지 내리려면:  %COMPOSE% down
echo   ============================================================
echo.

call npm run dev
exit /b !errorlevel!

REM ===========================================================================
REM  서브루틴
REM ===========================================================================

REM .env 에서 키 값을 읽어 ENVVAL 에 넣는다.
REM findstr /b 로 줄 앞을 고정하므로 주석(#KEY=) 은 매칭되지 않는다.
:envval
set "ENVVAL="
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /b /c:"%~1=" "%ROOT%\.env" 2^>nul`) do set "ENVVAL=%%b"
exit /b 0

REM %1=포트 %2=compose 서비스명
REM 해당 compose 서비스가 이미 돌고 있으면 우리 컨테이너이므로 경고하지 않는다.
:checkport
set "CP_CID="
for /f "tokens=*" %%i in ('%COMPOSE% ps -q %~2 2^>nul') do set "CP_CID=%%i"
if not "!CP_CID!"=="" (
    for /f "tokens=*" %%r in ('docker inspect -f "{{.State.Running}}" !CP_CID! 2^>nul') do (
        if "%%r"=="true" exit /b 0
    )
)
curl -fsS --max-time 2 "http://127.0.0.1:%~1/health" >nul 2>&1
if not errorlevel 1 (
    echo   *   compose 컨테이너가 아닌 프로세스가 :%~1 에서 응답하고 있습니다.
    echo   *     컨테이너를 띄워도 그쪽이 응답합니다. 직접 실행한 서버를 먼저 종료하세요.
)
exit /b 0

REM 컨테이너가 끝내 안 뜰 때 원인을 바로 보여준다
:dumplogs
echo.
echo   --- %~1 최근 로그 ---
%COMPOSE% logs --tail=40 %~1 2>&1
echo   --------------------
exit /b 0

REM %1=url %2=이름 %3=서비스
:waithttp
<nul set /p "=  %~2 대기"
set HTTP_OK=0
for /l %%i in (1,1,45) do (
    if "!HTTP_OK!"=="0" (
        curl -fsS --max-time 5 "%~1" >nul 2>&1
        if not errorlevel 1 (
            set HTTP_OK=1
        ) else (
            <nul set /p "=."
            ping -n 3 127.0.0.1 >nul
        )
    )
)
echo.
if "!HTTP_OK!"=="0" (
    call :dumplogs %~3
    echo   X   %~2 가 90초 안에 응답하지 않았습니다.
    echo.
    exit /b 1
)
echo   OK  %~2 응답
exit /b 0
