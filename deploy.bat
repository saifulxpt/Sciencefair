@echo off
echo ==========================================
echo AeroStone Project Auto-Deployment Script
echo Target VPS: 160.25.226.152
echo ==========================================
echo.

echo [1/4] Building Next.js application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Next.js compilation failed. Deployment aborted.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Deploying static site to VPS...
scp -r out\* root@160.25.226.152:/var/www/airpurifying-concrete/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] SCP transfer of static assets failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Deploying PHP APIs and database scripts to VPS...
scp -r api\* root@160.25.226.152:/var/www/airpurifying-concrete/api/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] SCP transfer of PHP files failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/4] Setting server file permissions...
ssh root@160.25.226.152 "chown -R www-data:www-data /var/www/airpurifying-concrete/ && chmod -R 775 /var/www/airpurifying-concrete/"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Permission configuration commands failed on VPS.
)

echo.
echo ==========================================
echo [SUCCESS] AeroStone is live on VPS!
echo Access presentation: http://160.25.226.152/presentation/
echo Access assistant: http://160.25.226.152/assistant/
echo Access admin panel: http://160.25.226.152/admin/
echo ==========================================
echo.
pause
