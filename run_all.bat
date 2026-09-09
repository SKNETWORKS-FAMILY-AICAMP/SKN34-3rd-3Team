@echo off
REM =========================================================
REM  창업ON 전체 스택 실행 (Windows)
REM   DB(Docker) -> LLM(:8001) -> Backend(:8000) -> Frontend(:5173)
REM  사용법: 저장소 루트에서  run_all.bat
REM  사전 준비: Docker Desktop 실행, .env 작성, uv / node 설치
REM =========================================================
setlocal
cd /d "%~dp0"

echo [1/4] DB 컨테이너 기동...
docker compose up -d db
if errorlevel 1 (
  echo    ^> Docker Desktop 이 실행 중인지 확인하세요.
  exit /b 1
)

echo [2/4] DB 준비 대기...
:waitdb
docker exec startup_db pg_isready -U admin -d startup_platform >nul 2>&1
if errorlevel 1 (
  timeout /t 2 >nul
  goto waitdb
)
echo    ^> DB 준비 완료

echo [3/4] LLM 서비스(:8001) / Backend(:8000) 기동...
start "changeup-llm" cmd /c "cd /d %~dp0LLM && uv run uvicorn src.serving.app:app --port 8001"
start "changeup-backend" cmd /c "cd /d %~dp0Backend && uv run uvicorn main:app --reload --port 8000"

echo [4/4] Frontend(:5173) 기동...
start "changeup-frontend" cmd /c "cd /d %~dp0Frontend && npm run dev"

echo.
echo =========================================================
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000/docs
echo   LLM      : http://localhost:8001/health
echo   각 창을 닫으면 해당 서비스가 종료됩니다.
echo =========================================================
endlocal
