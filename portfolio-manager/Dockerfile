FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY portfolio-manager/pom.xml .
COPY portfolio-manager/src ./src
COPY ../protos /protos
RUN mvn dependency:go-offline
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 10000
ENV PORT=10000
ENV JAVA_OPTS="-Xms64m -Xmx128m -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=24m -XX:+UseZGC -XX:MaxDirectMemorySize=32m -Dserver.address=0.0.0.0 -Dspring.datasource.hikari.maximum-pool-size=4 -Dspring.redis.lettuce.pool.max-active=4 -Djdk.net.URLClassPath.disableClassPathURLCheck=true -XX:+UnlockExperimentalVMOptions -XX:+ZGenerational"
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar app.jar"]