@echo off
setlocal
set WRAPPER_JAR=%~dp0.mvn\wrapper\maven-wrapper.jar
set MAVEN_REPO_URL=https://repo.maven.apache.org/maven2

if exist "%WRAPPER_JAR%" (
  java -classpath "%WRAPPER_JAR%" -Dmaven.multiModuleProjectDirectory=%~dp0 org.apache.maven.wrapper.MavenWrapperMain %*
  exit /b %errorlevel%
)

where mvn >nul 2>nul
if %errorlevel% equ 0 (
  mvn %*
  exit /b %errorlevel%
)

echo Maven Wrapper jar not found and mvn is not installed.
echo If network access is available, restore .mvn\wrapper\maven-wrapper.jar and run again.
exit /b 1
