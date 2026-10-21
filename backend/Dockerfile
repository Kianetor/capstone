# Build del backend in due fasi: Maven compila il jar, l'immagine finale contiene solo Java e il jar

# 1. Compilazione (le dipendenze in un livello a parte: se cambia solo il codice non si riscaricano)
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src src
RUN mvn -q -B package -DskipTests

# 2. Esecuzione: solo il runtime Java, più leggero
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Il piano gratuito di Render ha 512 MB: la JVM usa al massimo il 75% della memoria disponibile
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
