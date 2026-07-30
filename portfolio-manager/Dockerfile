FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY portfolio-manager/pom.xml .
COPY portfolio-manager/src ./src
COPY protos /protos
RUN mvn dependency:go-offline
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 10000
ENV PORT=10000
ENV JAVA_OPTS="-Xms64m -Xmx200m -XX:+UseContainerSupport -XX:MaxRAMPercentage=40.0 -XX:+UseZGC -Dserver.address=0.0.0.0 -Dserver.port=${PORT} -Dspring.jpa.properties.hibernate.jdbc.batch_size=20 -Dspring.jpa.properties.hibernate.order_inserts=true -Dspring.jpa.properties.hibernate.order_updates=true -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -Dmanagement.endpoints.web.exposure.include=health,info,metrics,caches,prometheus -Dmanagement.endpoint.health.probes.enabled=true -Dmanagement.endpoint.health.show-details=always"
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD curl -f http://localhost:${PORT}/actuator/health/liveness || exit 1
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
