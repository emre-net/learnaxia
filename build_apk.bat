@echo off
echo [INFO] Moving to mobile android directory...
cd apps\mobile\android
set NODE_ENV=production
echo [INFO] Starting Gradle Build...
call gradlew.bat clean assembleRelease --stacktrace -Dorg.gradle.internal.http.connectionTimeout=600000 -Dorg.gradle.internal.http.socketTimeout=600000
if errorlevel 1 (
    echo [ERROR] Gradle build failed with exit code %errorlevel%
    exit /b %errorlevel%
)
echo [INFO] Build Successful!
