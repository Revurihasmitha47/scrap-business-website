# Build the Angular frontend first.
FROM node:22-alpine AS frontend-build
WORKDIR /workspace/ui

COPY ui/package.json ui/package-lock.json ./
RUN npm ci

COPY ui/ ./
RUN npm run build

# Package the Spring Boot application with the Angular output available at ../ui/dist.
FROM maven:3.9.9-eclipse-temurin-17 AS backend-build
WORKDIR /workspace

COPY api/pom.xml api/pom.xml
COPY api/src/ api/src/
COPY --from=frontend-build /workspace/ui/dist/scrap-ui /workspace/ui/dist/scrap-ui

RUN mvn -f api/pom.xml -DskipFrontend=true -DskipTests package

# Render runs the single public web service from this image.
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=backend-build /workspace/api/target/scrapflow-api-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
