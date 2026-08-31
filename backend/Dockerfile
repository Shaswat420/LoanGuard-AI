FROM eclipse-temurin:24-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

ENV SERVER_PORT=10000

EXPOSE 10000

CMD ["java", "-jar", "target/loanguard-backend-0.0.1-SNAPSHOT.jar"]
