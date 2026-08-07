FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY protos /protos
RUN mvn dependency:go-offline
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 10000
ENV PORT=10000
# JAVA_OPTS can be overridden at runtime via docker-compose environment
ENV JAVA_OPTS="-Xms2g -Xmx4g -XX:MaxMetaspaceSize=256m -XX:CompressedClassSpaceSize=32m -XX:+UseZGC -XX:MaxDirectMemorySize=512m -Dserver.address=0.0.0.0 -Dspring.datasource.hikari.maximum-pool-size=20 -Dspring.datasource.hikari.minimum-idle=5 -Dspring.redis.lettuce.pool.max-active=20 -Djdk.net.URLClassPath.disableClassPathURLCheck=true -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar app.jar"]