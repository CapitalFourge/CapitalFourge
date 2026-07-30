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
ENV JAVA_OPTS="-Xms256m -Xmx384m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseZGC -XX:+ZGenerational -Dserver.address=0.0.0.0"
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -Dserver.address=0.0.0.0 -jar app.jar"]
