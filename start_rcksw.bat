@echo off
echo Starting RCKSW Services...

REM RCKSW 폴더로 이동
cd /d c:\Users\c\Desktop\rck\VCLM

REM PM2 설치 여부 확인
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PM2 not found in PATH
    pause
    exit /b 1
)

REM 기존 PM2 프로세스 확인 및 정리
call pm2 delete all

REM PM2 앱 시작
echo Starting PM2 processes...
call pm2 start ecosystem.config.js

REM PM2 상태 확인
call pm2 status

REM PM2 프로세스 저장 (부팅시 복구용)
call pm2 save

echo.
echo ====================================
echo RCKSW Services Started Successfully!
echo Front: http://localhost:3001
echo Back:  http://localhost:8081
echo ====================================
echo.
echo Press any key to exit...
pause >nul
