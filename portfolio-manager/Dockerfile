FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY protos /protos
COPY report-service /app/report-service
RUN mvn dependency:go-offline
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/report-service /app/report-service
RUN apt-get update && apt-get install -y python3 python3-pip && \
    pip3 install reportlab && \
    rm -rf /var/lib/apt/lists/*
EXPOSE 10000
ENV PORT=10000
ENV REPORT_GENERATOR_SCRIPT_PATH=/app/report-service/generator.py
# JAVA_OPTS can be overridden at runtime via docker-compose environment
ENV JAVA_OPTS="-Xms2g -Xmx4g -XX:MaxMetaspaceSize=256m -XX:CompressedClassSpaceSize=32m -XX:+UseZGC -XX:MaxDirectMemorySize=512m -Dserver.address=0.0.0.0 -Dspring.datasource.hikari.maximum-pool-size=20 -Dspring.datasource.hikari.minimum-idle=5 -Dspring.redis.lettuce.pool.max-active=20 -Djdk.net.URLClassPath.disableClassPathURLCheck=true -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar app.jar"]