# 1단계: 빌드 단계
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# [수정] 빌드 후, plain이 붙지 않은 진짜 실행 파일(jar)을 app.jar로 복사
RUN chmod +x gradlew && \
    ./gradlew bootJar -x test --no-daemon && \
    find build/libs/ -name "*.jar" ! -name "*-plain.jar" -exec mv {} build/libs/app.jar \;

# 2단계: 실행 단계
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 빌드 단계에서 생성된 app.jar만 깔끔하게 복사
COPY --from=builder /app/build/libs/app.jar .

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]