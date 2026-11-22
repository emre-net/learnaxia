Stop-Process -Name watchman -Force -ErrorAction SilentlyContinue
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
Set-Location "C:\lrx\apps\mobile\android"
Write-Host "Starting Gradle assembleRelease with JDK 17..."
.\gradlew.bat assembleRelease
