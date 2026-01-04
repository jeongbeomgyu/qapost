#!/bin/bash

# EC2 배포 스크립트 (로컬에서 실행)
# 사용법: ./deploy.sh <EC2_IP_ADDRESS> [API_URL]

set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 인자 확인
if [ -z "$1" ]; then
    echo -e "${RED}오류: EC2 IP 주소를 입력해주세요.${NC}"
    echo "사용법: ./deploy.sh <EC2_IP_ADDRESS> [API_URL]"
    exit 1
fi

EC2_IP=$1
API_URL=${2:-"http://${EC2_IP}:8080"}

echo -e "${GREEN}=== EC2 배포 시작 ===${NC}"
echo -e "EC2 IP: ${YELLOW}${EC2_IP}${NC}"
echo -e "API URL: ${YELLOW}${API_URL}${NC}"

# Docker Hub 로그인 확인
echo -e "\n${GREEN}[0/5] Docker Hub 로그인 확인 중...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Docker Hub에 로그인하세요.${NC}"
    docker login
fi

# 백엔드 최신 소스코드를 jar 파일로 컴파일 
echo -e "\n${GREEN}[0.5/5] 백엔드 Java 소스코드 빌드 중...${NC}"
cd ./onebyte_backend
chmod +x ./gradlew
./gradlew clean build -x test
cd ..

# 백엔드 Docker 이미지 빌드
echo -e "\n${GREEN}[1/5] 백엔드 Docker 이미지 빌드 중...${NC}"
docker build --no-cache --platform linux/amd64 -t jeongbeomgyu/board-project-backend:latest ./onebyte_backend


# 프론트엔드 Docker 이미지 빌드
echo -e "\n${GREEN}[2/5] 프론트엔드 Docker 이미지 빌드 중...${NC}"
docker build --no-cache \
  --platform linux/amd64 \
  --build-arg VITE_API_URL="${API_URL}" \
  -t jeongbeomgyu/board-project-frontend:latest ./CodeForest

# Docker Hub에 푸시
echo -e "\n${GREEN}[3/5] Docker Hub에 푸시 중...${NC}"
docker push jeongbeomgyu/board-project-backend:latest
docker push jeongbeomgyu/board-project-frontend:latest

# EC2에 배포 파일 전송
echo -e "\n${GREEN}[4/5] EC2에 배포 파일 전송 중...${NC}"
ssh ec2-user@${EC2_IP} "mkdir -p ~/onebyte" 2>/dev/null || ssh ubuntu@${EC2_IP} "mkdir -p ~/onebyte"
scp docker-compose.yml ec2-user@${EC2_IP}:~/onebyte/ 2>/dev/null || scp docker-compose.yml ubuntu@${EC2_IP}:~/onebyte/
scp deploy-ec2.sh ec2-user@${EC2_IP}:~/onebyte/ 2>/dev/null || scp deploy-ec2.sh ubuntu@${EC2_IP}:~/onebyte/

# [5/5] EC2에서 배포 실행
echo -e "\n${GREEN}[5/5] EC2에서 배포 실행 중...${NC}"

# Amazon Linux이므로 ec2-user를 직접 명시합니다.
# -o StrictHostKeyChecking=no 를 추가하면 yes/no를 다시 묻지 않아 더 편리합니다.
ssh -o StrictHostKeyChecking=no ec2-user@${EC2_IP} << EOF
    cd ~/onebyte
    export VITE_API_URL=${API_URL}
    chmod +x deploy-ec2.sh
    ./deploy-ec2.sh
EOF

echo -e "\n${GREEN}=== 배포 완료 ===${NC}"
echo -e "프론트엔드: ${YELLOW}http://${EC2_IP}:3000${NC}"
echo -e "백엔드 API: ${YELLOW}http://${EC2_IP}:8080${NC}"