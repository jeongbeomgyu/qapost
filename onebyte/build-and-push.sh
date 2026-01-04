#!/bin/bash

# Docker 이미지 빌드 및 Docker Hub 푸시 스크립트
# 사용법: ./build-and-push.sh [API_URL]

set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL=${1:-"http://localhost:8080/api"}

echo -e "${GREEN}=== Docker 이미지 빌드 및 푸시 ===${NC}"
echo -e "API URL: ${YELLOW}${API_URL}${NC}"

# Docker Hub 로그인 확인
echo -e "\n${GREEN}[0/4] Docker Hub 로그인 확인 중...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Docker Hub에 로그인하세요.${NC}"
    docker login
fi

# 백엔드 Docker 이미지 빌드
echo -e "\n${GREEN}[1/4] 백엔드 Docker 이미지 빌드 중...${NC}"
cd onebyte_backend
docker build -t jeongbeomgyu/board-project-backend:latest .
cd ..

# 프론트엔드 Docker 이미지 빌드
echo -e "\n${GREEN}[2/4] 프론트엔드 Docker 이미지 빌드 중...${NC}"
cd CodeForest
docker build --build-arg VITE_API_URL=${API_URL} -t jeongbeomgy/board-project-frontend:latest .
cd ..

# Docker Hub에 푸시
echo -e "\n${GREEN}[3/4] Docker Hub에 푸시 중...${NC}"
docker push jeongbeomgyu/board-project-backend:latest
docker push jeongbeomgyu/board-project-frontend:latest

echo -e "\n${GREEN}[4/4] 완료!${NC}"
echo -e "${GREEN}=== 빌드 및 푸시 완료 ===${NC}"
echo -e "이제 EC2에서 'docker-compose pull && docker-compose up -d'를 실행하세요."

