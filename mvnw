#!/usr/bin/env sh
WRAPPER_JAR="$(dirname "$0")/.mvn/wrapper/maven-wrapper.jar"
if [ -f "$WRAPPER_JAR" ]; then
  exec java -classpath "$WRAPPER_JAR" -Dmaven.multiModuleProjectDirectory="$(pwd)" org.apache.maven.wrapper.MavenWrapperMain "$@"
fi
if command -v mvn >/dev/null 2>&1; then
  exec mvn "$@"
fi
echo "Maven Wrapper jar not found and mvn is not installed."
exit 1
