#!/bin/bash

# Skrypt do budowania i pushowania obrazu Docker dla Next.js Frontend
# Użycie: ./docker-build-push.sh <tag>
# Przykład: ./docker-build-push.sh v1.0.0

set -e  # Zatrzymaj przy błędzie

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguracja
DOCKER_REPO="klegus/www-plan"
DOCKERFILE="Dockerfile"

# API URLs - zmień na swoje wartości produkcyjne
NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://172.30.0.20}"
API_BASE_URL="${API_BASE_URL:-http://172.30.0.20}"

# Sprawdź czy podano tag
if [ -z "$1" ]; then
    echo -e "${RED}❌ Błąd: Nie podano tagu!${NC}"
    echo -e "${YELLOW}Użycie: $0 <tag>${NC}"
    echo -e "${YELLOW}Przykład: $0 v1.0.0${NC}"
    exit 1
fi

TAG=$1
FULL_IMAGE_NAME="${DOCKER_REPO}:${TAG}"
LATEST_IMAGE_NAME="${DOCKER_REPO}:latest"

echo -e "${GREEN}🚀 Rozpoczynam proces budowania i publikacji obrazu Docker${NC}"
echo -e "📦 Repozytorium: ${YELLOW}${DOCKER_REPO}${NC}"
echo -e "🏷️  Tag: ${YELLOW}${TAG}${NC}"
echo ""

# Sprawdź czy użytkownik jest zalogowany do Docker Hub
echo -e "${GREEN}🔐 Sprawdzam logowanie do Docker Hub...${NC}"
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Nie jesteś zalogowany do Docker Hub${NC}"
    echo -e "${YELLOW}Zaloguj się używając: docker login${NC}"
    docker login
fi

# Sprawdź czy Dockerfile istnieje
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ Błąd: Nie znaleziono pliku Dockerfile!${NC}"
    exit 1
fi

# Build aplikacji Next.js z ustawionymi zmiennymi środowiskowymi
echo -e "${GREEN}📦 Buduję aplikację Next.js...${NC}"
echo -e "${YELLOW}   NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}${NC}"
echo -e "${YELLOW}   API_BASE_URL=${API_BASE_URL}${NC}"
NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} API_BASE_URL=${API_BASE_URL} npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd podczas budowania aplikacji Next.js${NC}"
    exit 1
fi

# Budowanie obrazu Docker z build args
echo -e "${GREEN}🔨 Buduję obraz Docker...${NC}"
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
  --build-arg API_BASE_URL=${API_BASE_URL} \
  -t ${FULL_IMAGE_NAME} .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd podczas budowania obrazu Docker${NC}"
    exit 1
fi

# Tagowanie jako latest
echo -e "${GREEN}🏷️  Taguję obraz jako 'latest'...${NC}"
docker tag ${FULL_IMAGE_NAME} ${LATEST_IMAGE_NAME}

# Pushowanie obrazu z konkretnym tagiem
echo -e "${GREEN}📤 Wysyłam obraz z tagiem ${TAG}...${NC}"
docker push ${FULL_IMAGE_NAME}
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd podczas wysyłania obrazu${NC}"
    exit 1
fi

# Pushowanie obrazu jako latest
echo -e "${GREEN}📤 Wysyłam obraz z tagiem 'latest'...${NC}"
docker push ${LATEST_IMAGE_NAME}
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd podczas wysyłania obrazu 'latest'${NC}"
    exit 1
fi

# Pokaż informacje o zbudowanym obrazie
echo ""
echo -e "${GREEN}✅ Sukces! Obraz został zbudowany i wysłany do Docker Hub${NC}"
echo -e "📦 Obraz: ${YELLOW}${FULL_IMAGE_NAME}${NC}"
echo -e "📦 Latest: ${YELLOW}${LATEST_IMAGE_NAME}${NC}"
echo ""
echo -e "${GREEN}Aby pobrać obraz, użyj:${NC}"
echo -e "  docker pull ${FULL_IMAGE_NAME}"
echo ""

# Opcjonalnie: wyczyść lokalne obrazy
read -p "Czy chcesz usunąć lokalne obrazy Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Usuwam lokalne obrazy...${NC}"
    docker rmi ${FULL_IMAGE_NAME} ${LATEST_IMAGE_NAME}
    echo -e "${GREEN}✅ Lokalne obrazy zostały usunięte${NC}"
fi

echo -e "${GREEN}🎉 Proces zakończony pomyślnie!${NC}"