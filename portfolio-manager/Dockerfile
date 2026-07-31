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
ENV JAVA_OPTS="-Xms64m -Xmx200m -XX:MaxRAMPercentage=40.0 -XX:+UseZGC -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -Dserver.address=0.0.0.0 -Dserver.port=\\${PORT} -Dspring.jpa.properties.hibernate.jdbc.batch_size=20 -Dspring.jpa.properties.hibernate.order_inserts=true -Dspring.jpa.properties.hibernate.order_updates=true -Dmanagement.endpoints.web.exposure.include=health,info,metrics,caches,prometheus -Dmanagement.endpoint.health.probes.enabled=true -Dmanagement.endpoint.health.show-details=always -Dspring.jpa.open-in-view=false"
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 CMD curl -f http://localhost:\\${PORT}/actuator/health/liveness || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
