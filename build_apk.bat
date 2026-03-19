@echo off
subst K: /d >nul 2>&1
subst K: "c:\Users\Emre\.gemini\antigravity\scratch\learnaxity\learnaxia"
if errorlevel 1 (
    echo [ERROR] Failed to subst K: drive
    exit /b 1
)
K:
cd apps\mobile\android
echo [INFO] Starting Gradle Build...
call gradlew.bat assembleDebug --stacktrace --info
if errorlevel 1 (
    echo [ERROR] Gradle build failed with exit code %errorlevel%
    exit /b %errorlevel%
)
echo [INFO] Build Successful!
