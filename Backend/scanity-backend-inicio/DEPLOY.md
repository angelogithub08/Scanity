# Guia de Deploy - Gerenciador de Processos Backend

Este guia descreve como fazer o deploy da aplicação usando apenas o Dockerfile, sem dependência do docker-compose.yml.

## Pré-requisitos

- Docker instalado na máquina/servidor
- Arquivo `.env` configurado com as variáveis de ambiente necessárias

## Configuração do Ambiente

### 1. Criar o arquivo .env

Copie o arquivo `env.example` para `.env` e configure as variáveis necessárias:

```bash
cp env.example .env
```

### 2. Configurar variáveis obrigatórias no .env

Edite o arquivo `.env` e configure pelo menos as seguintes variáveis:

```bash
# Configurações da Aplicação
APP_PORT=3000
NODE_ENV=production

# Configurações JWT (OBRIGATÓRIO)
JWT_SECRET=sua_chave_secreta_jwt_muito_segura_aqui
JWT_TTL=10080m

# Configurações do Banco de Dados (OBRIGATÓRIO)
DB_CONNECTION_URI=postgresql://usuario:senha@host:porta/database

# Configurações de Email (OBRIGATÓRIO se usar funcionalidades de email)
MAIL_SENDER="Gerenciador de Processos <naoresponda@gerenciadordeprocessos.com.br>"
MAIL_HOST=seu.servidor.smtp.com
MAIL_PORT=587
MAIL_USER=seu_usuario_email
MAIL_PASS=sua_senha_email
MAIL_SECURE=false

# Configurações do AWS S3 (OBRIGATÓRIO se usar upload de arquivos)
AWS_ID=sua_aws_access_key_id
AWS_SECRET=sua_aws_secret_access_key
AWS_REGION=us-east-1
AWS_BUCKET=seu-bucket-s3
```

## Deploy da Aplicação

### 1. Build da imagem Docker

```bash
# Fazer o build da imagem
docker build -t scanity-backend .
```

### 2. Executar o container

```bash
# Executar o container com o arquivo .env
docker run -d \
  --name scanity-backend \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  scanity-backend
```

### 3. Verificar se a aplicação está funcionando

```bash
# Verificar logs do container
docker logs scanity-backend

# Verificar se a aplicação está respondendo
curl http://localhost:3000/api

# Verificar o healthcheck
docker inspect --format='{{.State.Health.Status}}' scanity-backend
```

## Comandos Úteis

### Parar e remover o container

```bash
# Parar o container
docker stop scanity-backend

# Remover o container
docker rm scanity-backend
```

### Atualizar a aplicação

```bash
# 1. Parar e remover o container atual
docker stop scanity-backend
docker rm scanity-backend

# 2. Fazer novo build da imagem
docker build -t scanity-backend .

# 3. Executar o novo container
docker run -d \
  --name scanity-backend \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  scanity-backend
```

### Executar migrações manualmente (se necessário)

```bash
# Executar migrações em um container temporário
docker run --rm \
  --env-file .env \
  scanity-backend \
  npm run db:migrate
```

### Executar seeds (se necessário)

```bash
# Executar seeds em um container temporário
docker run --rm \
  --env-file .env \
  scanity-backend \
  npm run db:seed
```

## Monitoramento

### Healthcheck

A aplicação inclui um healthcheck automático que verifica se o endpoint `/api` está respondendo corretamente. Você pode verificar o status com:

```bash
docker inspect --format='{{.State.Health.Status}}' scanity-backend
```

### Logs

Para acompanhar os logs da aplicação:

```bash
# Ver logs em tempo real
docker logs -f scanity-backend

# Ver últimas 100 linhas dos logs
docker logs --tail 100 scanity-backend
```

## Configurações de Produção

### Variáveis de ambiente importantes para produção

- `NODE_ENV=production` - Define o ambiente como produção
- `APP_PORT` - Porta da aplicação (padrão: 3000)
- `JWT_SECRET` - Chave secreta para JWT (deve ser forte e única)
- `DB_CONNECTION_URI` - String de conexão com o banco PostgreSQL

### Segurança

- O container executa com usuário não-root (`nestjs`)
- Utiliza `dumb-init` para tratamento adequado de sinais
- Inclui apenas as dependências de produção na imagem final
- Arquivos sensíveis são excluídos via `.dockerignore`

### Performance

- Build multi-stage para otimizar o tamanho da imagem
- Cache de dependências otimizado
- Configuração de memória Node.js ajustada (`--max_old_space_size=2048`)

## Troubleshooting

### Problema: Container não inicia

1. Verifique se o arquivo `.env` existe e está configurado corretamente
2. Verifique os logs: `docker logs scanity-backend`
3. Verifique se a porta 3000 não está sendo usada por outro processo

### Problema: Erro de conexão com banco de dados (ECONNREFUSED)

Este é um dos erros mais comuns. Para resolvê-lo:

1. **Verifique a string de conexão**: A `DB_CONNECTION_URI` deve estar no formato correto:

   ```bash
   DB_CONNECTION_URI=postgresql://usuario:senha@host:porta/database
   ```

2. **Para banco local**: Se o banco está rodando na máquina host, use:

   ```bash
   # No Linux/Mac
   DB_CONNECTION_URI=postgresql://postgres:postgres@host.docker.internal:5432/database

   # Ou tente com o IP da máquina host
   DB_CONNECTION_URI=postgresql://postgres:postgres@192.168.1.100:5432/database
   ```

3. **Para banco em container**: Se usando docker-compose para o banco:

   ```bash
   # Use o nome do serviço do banco
   DB_CONNECTION_URI=postgresql://postgres:postgres@postgres:5432/database
   ```

4. **Teste de conectividade**:
   ```bash
   # Testar conexão do container
   docker run --rm --env-file .env scanity-backend \
     npm run db:migrate
   ```

### Problema: Erros de TypeScript em produção

Se você ver erros como "Failed to load external module ts-node/register":

1. **Isso é normal** - O container agora usa arquivos JavaScript compilados
2. **Verifique se o build foi bem-sucedido** durante a criação da imagem
3. **Se persistir**, force um rebuild:
   ```bash
   docker build --no-cache -t scanity-backend .
   ```

### Problema: Migrações falhando

1. **Pular migrações temporariamente**:

   ```bash
   docker run -d \
     --name scanity-backend \
     --env-file .env \
     -e SKIP_MIGRATIONS=true \
     -p 3000:3000 \
     scanity-backend
   ```

2. **Executar migrações separadamente**:
   ```bash
   docker run --rm --env-file .env scanity-backend \
     npm run db:migrate
   ```

### Problema: Healthcheck falhando

1. Verifique se a aplicação está respondendo na porta configurada
2. Verifique se o endpoint `/api` está acessível
3. Aguarde alguns segundos após o start do container
4. Verifique se não há erro de inicialização nos logs

## Exemplo de Script de Deploy

Crie um script `deploy.sh` para automatizar o processo:

```bash
#!/bin/bash

# Script de deploy para Gerenciador de Processos Backend

set -e

echo "🚀 Iniciando deploy do Gerenciador de Processos Backend..."

# Parar container existente (se existir)
if docker ps -a --format 'table {{.Names}}' | grep -q scanity-backend; then
    echo "📦 Parando container existente..."
    docker stop scanity-backend || true
    docker rm scanity-backend || true
fi

# Build da nova imagem
echo "🔨 Fazendo build da imagem..."
docker build -t scanity-backend .

# Executar novo container
echo "▶️ Executando novo container..."
docker run -d \
  --name scanity-backend \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  scanity-backend

# Aguardar alguns segundos
echo "⏳ Aguardando aplicação inicializar..."
sleep 10

# Verificar se está funcionando
if curl -f http://localhost:3000/api > /dev/null 2>&1; then
    echo "✅ Deploy realizado com sucesso!"
    echo "🌐 Aplicação disponível em: http://localhost:3000/api"
else
    echo "❌ Erro no deploy. Verificar logs:"
    docker logs scanity-backend
    exit 1
fi
```

Para usar o script:

```bash
chmod +x deploy.sh
./deploy.sh
```
