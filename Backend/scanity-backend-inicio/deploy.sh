#!/bin/bash

# Script de deploy para Gerenciador de Processos Backend
# Este script automatiza o processo de deploy usando apenas o Dockerfile

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configurações
CONTAINER_NAME="scanity-backend"
IMAGE_NAME="scanity-backend"
PORT="3000"
ENV_FILE=".env"

log "🚀 Iniciando deploy do Gerenciador de Processos Backend..."

# Verificar se o arquivo .env existe
if [ ! -f "$ENV_FILE" ]; then
    error "Arquivo $ENV_FILE não encontrado!"
    warning "Copie o arquivo env.example para .env e configure as variáveis necessárias:"
    echo "cp env.example .env"
    exit 1
fi

# Verificar se o Docker está instalado e rodando
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
    exit 1
fi

if ! docker info &> /dev/null; then
    error "Docker não está rodando!"
    exit 1
fi

# Parar container existente (se existir)
if docker ps -a --format 'table {{.Names}}' | grep -q "$CONTAINER_NAME"; then
    log "📦 Parando container existente..."
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    success "Container anterior removido"
fi

# Remover imagem anterior (opcional, para forçar rebuild)
if [ "$1" = "--force-rebuild" ]; then
    log "🗑️  Removendo imagem anterior para forçar rebuild..."
    docker rmi "$IMAGE_NAME" || true
fi

# Build da nova imagem
log "🔨 Fazendo build da imagem..."
if docker build -t "$IMAGE_NAME" .; then
    success "Build da imagem concluído"
else
    error "Falha no build da imagem"
    exit 1
fi

# Executar novo container
log "▶️  Executando novo container..."
if docker run -d \
    --name "$CONTAINER_NAME" \
    --env-file "$ENV_FILE" \
    -p "$PORT:$PORT" \
    --restart unless-stopped \
    "$IMAGE_NAME"; then
    success "Container iniciado"
else
    error "Falha ao iniciar container"
    exit 1
fi

# Aguardar aplicação inicializar
log "⏳ Aguardando aplicação inicializar..."
sleep 15

# Verificar healthcheck
log "🔍 Verificando saúde da aplicação..."
for i in {1..30}; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-healthcheck")
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        success "Aplicação está saudável!"
        break
    elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
        error "Aplicação não está saudável!"
        docker logs --tail 50 "$CONTAINER_NAME"
        exit 1
    else
        echo -n "."
        sleep 2
    fi
done

# Verificar se está respondendo
log "🌐 Testando conectividade..."
if curl -f "http://localhost:$PORT/api" > /dev/null 2>&1; then
    success "Deploy realizado com sucesso!"
    echo ""
    echo -e "${GREEN}🎉 Aplicação Gerenciador de Processos Backend está rodando!${NC}"
    echo -e "${BLUE}📍 URL da API: http://localhost:$PORT/api${NC}"
    echo -e "${BLUE}📍 Documentação Swagger: http://localhost:$PORT/api${NC}"
    echo ""
    echo -e "${YELLOW}Comandos úteis:${NC}"
    echo "  docker logs $CONTAINER_NAME           # Ver logs"
    echo "  docker logs -f $CONTAINER_NAME        # Ver logs em tempo real"
    echo "  docker stop $CONTAINER_NAME           # Parar aplicação"
    echo "  docker restart $CONTAINER_NAME        # Reiniciar aplicação"
else
    error "Aplicação não está respondendo na porta $PORT"
    warning "Verificando logs do container:"
    docker logs --tail 50 "$CONTAINER_NAME"
    exit 1
fi
