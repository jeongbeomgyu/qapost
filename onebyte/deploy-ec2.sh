#!/bin/bash

# EC2 내부에서 실행하는 배포 스크립트
# EC2 서버에 직접 접속해서 실행하거나, deploy.sh에서 자동으로 실행됩니다.

set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== EC2 내부 배포 시작 ===${NC}"

# Docker Hub에서 이미지 가져오기
echo -e "\n${GREEN}[1/3] Docker Hub에서 이미지 가져오는 중...${NC}"
docker-compose pull

# 기존 컨테이너 중지 및 제거
echo -e "\n${GREEN}[2/3] 기존 컨테이너 중지 및 제거 중...${NC}"
docker-compose down

# 새 컨테이너 시작 (Docker Hub에서 받은 이미지 사용)
echo -e "\n${GREEN}[3/3] 새 컨테이너 시작 중...${NC}"
docker-compose up -d

# 컨테이너 상태 확인
echo -e "\n${GREEN}컨테이너 상태:${NC}"
docker-compose ps

# 로그 확인
echo -e "\n${YELLOW}최근 로그 (10줄):${NC}"
docker-compose logs --tail=10

echo -e "\n${GREEN}=== 배포 완료 ===${NC}"

