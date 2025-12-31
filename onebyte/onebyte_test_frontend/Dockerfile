FROM node:20-alpine AS builder
WORKDIR /app

# Vite는 빌드 시점에 환경변수를 주입하기 위해 ARG를 사용합니다.
# Vite 환경변수는 반드시 VITE_로 시작해야 코드에서 인식됩니다.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN echo "Building with API URL: $VITE_API_URL"

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 단계 (Nginx 사용)
FROM nginx:stable-alpine
# 빌드된 정적 파일들을 Nginx의 기본 배포 경로로 복사
COPY --from=builder /app/dist /usr/share/nginx/html
# nginx 설정 파일 복사 (SPA 라우팅 지원)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx 기본 포트
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]