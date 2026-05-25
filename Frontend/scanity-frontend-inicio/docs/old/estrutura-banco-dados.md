# Estrutura do Banco de Dados - Scanity

## 📊 Visão Geral

Este documento descreve a estrutura do banco de dados e os relacionamentos entre as principais entidades do sistema: **accounts**, **users**, **tokens**, **customers** e **products**.

## 🗂️ Tabelas e Relacionamentos

### 1. **Tabela `accounts` (Contas)**

Representa as contas/organizações do sistema. Cada conta pode ter múltiplos usuários, clientes e produtos.

#### Campos:

| Campo                 | Tipo      | Obrigatório | Descrição                             |
| --------------------- | --------- | ----------- | ------------------------------------- |
| `id`                  | UUID      | Sim         | Chave primária                        |
| `name`                | VARCHAR   | Sim         | Nome da conta                         |
| `email`               | VARCHAR   | Sim         | E-mail da conta                       |
| `phone`               | VARCHAR   | Não         | Telefone                              |
| `document`            | VARCHAR   | Não         | CPF/CNPJ                              |
| `zipcode`             | VARCHAR   | Não         | CEP                                   |
| `address_number`      | VARCHAR   | Não         | Número do endereço                    |
| `type`                | VARCHAR   | Sim         | Tipo da conta (ADMIN, USER)           |
| `gateway_customer_id` | VARCHAR   | Não         | ID do cliente no gateway de pagamento |
| `ia_token`            | TEXT      | Não         | Token para integração com IA          |
| `confirmed_at`        | TIMESTAMP | Não         | Data de confirmação da conta          |
| `created_at`          | TIMESTAMP | Não         | Data de criação                       |
| `updated_at`          | TIMESTAMP | Não         | Data de atualização                   |
| `deleted_at`          | TIMESTAMP | Não         | Data de exclusão (soft delete)        |

#### Relacionamentos:

- **Possui:** `users` (1:N)
- **Possui:** `tokens` (1:N)
- **Possui:** `customers` (1:N)
- **Possui:** `products` (1:N)

---

### 2. **Tabela `users` (Usuários)**

Representa os usuários do sistema. Cada usuário pertence a uma conta.

#### Campos:

| Campo        | Tipo      | Obrigatório | Descrição                      |
| ------------ | --------- | ----------- | ------------------------------ |
| `id`         | UUID      | Sim         | Chave primária                 |
| `name`       | VARCHAR   | Sim         | Nome do usuário                |
| `email`      | VARCHAR   | Sim         | E-mail do usuário              |
| `password`   | VARCHAR   | Sim         | Senha criptografada            |
| `token`      | TEXT      | Não         | Token de autenticação          |
| `type`       | VARCHAR   | Sim         | Tipo do usuário (ADMIN, USER)  |
| `is_active`  | BOOLEAN   | Sim         | Status ativo (padrão: true)    |
| `account_id` | UUID      | Sim         | Foreign key para `accounts`    |
| `created_at` | TIMESTAMP | Não         | Data de criação                |
| `updated_at` | TIMESTAMP | Não         | Data de atualização            |
| `deleted_at` | TIMESTAMP | Não         | Data de exclusão (soft delete) |

#### Relacionamentos:

- **Pertence a:** `accounts` (N:1)
  - `account_id` → `accounts.id`
- **Possui:** `tokens` (1:N)

---

### 3. **Tabela `tokens` (Tokens de Autenticação)**

Representa os tokens de autenticação (refresh tokens e access tokens) do sistema.

#### Campos:

| Campo        | Tipo      | Obrigatório | Descrição                                   |
| ------------ | --------- | ----------- | ------------------------------------------- |
| `id`         | UUID      | Sim         | Chave primária                              |
| `type`       | VARCHAR   | Sim         | Tipo do token (REFRESH_TOKEN, ACCESS_TOKEN) |
| `token`      | VARCHAR   | Sim         | Valor do token                              |
| `account_id` | UUID      | Sim         | Foreign key para `accounts`                 |
| `user_id`    | UUID      | Sim         | Foreign key para `users`                    |
| `revoked_at` | TIMESTAMP | Não         | Data de revogação do token                  |
| `created_at` | TIMESTAMP | Não         | Data de criação                             |
| `updated_at` | TIMESTAMP | Não         | Data de atualização                         |
| `deleted_at` | TIMESTAMP | Não         | Data de exclusão (soft delete)              |

#### Relacionamentos:

- **Pertence a:** `accounts` (N:1)
  - `account_id` → `accounts.id`
- **Pertence a:** `users` (N:1)
  - `user_id` → `users.id`

---

### 4. **Tabela `customers` (Clientes)**

Representa os clientes do sistema. Substitui a antiga tabela `leads`.

#### Campos:

| Campo          | Tipo      | Obrigatório | Descrição                      |
| -------------- | --------- | ----------- | ------------------------------ |
| `id`           | UUID      | Sim         | Chave primária                 |
| `name`         | VARCHAR   | Sim         | Nome do cliente                |
| `document`     | VARCHAR   | Não         | CPF/CNPJ                       |
| `phone`        | VARCHAR   | Não         | Telefone                       |
| `email`        | VARCHAR   | Não         | E-mail                         |
| `street`       | VARCHAR   | Não         | Logradouro                     |
| `number`       | VARCHAR   | Não         | Número                         |
| `city`         | VARCHAR   | Não         | Cidade                         |
| `state`        | VARCHAR   | Não         | Estado (UF)                    |
| `neighborhood` | VARCHAR   | Não         | Bairro                         |
| `zipcode`      | VARCHAR   | Não         | CEP                            |
| `complement`   | VARCHAR   | Não         | Complemento                    |
| `account_id`   | UUID      | Sim         | Foreign key para `accounts`    |
| `created_at`   | TIMESTAMP | Não         | Data de criação                |
| `updated_at`   | TIMESTAMP | Não         | Data de atualização            |
| `deleted_at`   | TIMESTAMP | Não         | Data de exclusão (soft delete) |

#### Relacionamentos:

- **Pertence a:** `accounts` (N:1)
  - `account_id` → `accounts.id`

---

### 5. **Tabela `products` (Produtos)**

Representa os produtos/serviços oferecidos pelo sistema.

#### Campos:

| Campo        | Tipo      | Obrigatório | Descrição                      |
| ------------ | --------- | ----------- | ------------------------------ |
| `id`         | UUID      | Sim         | Chave primária                 |
| `name`       | VARCHAR   | Sim         | Nome do produto                |
| `value`      | DECIMAL   | Sim         | Valor do produto (10,2)        |
| `account_id` | UUID      | Sim         | Foreign key para `accounts`    |
| `created_at` | TIMESTAMP | Não         | Data de criação                |
| `updated_at` | TIMESTAMP | Não         | Data de atualização            |
| `deleted_at` | TIMESTAMP | Não         | Data de exclusão (soft delete) |

#### Relacionamentos:

- **Pertence a:** `accounts` (N:1)
  - `account_id` → `accounts.id`

---

## 🔗 Hierarquia de Relacionamentos

```
accounts (Contas)
    │
    ├── users (1:N)
    │   │
    │   └── tokens (1:N)
    │
    ├── tokens (1:N)
    │
    ├── customers (1:N)
    │
    └── products (1:N)
```

### Legenda:

- **1:N** = Um para muitos (um account pode ter vários users, customers, products, tokens)
- **N:1** = Muitos para um (vários users, customers, products, tokens pertencem a um account)

---

## 💡 Como Funciona o Sistema

### Conceito Principal

O sistema utiliza uma arquitetura multi-tenant onde todas as entidades principais estão isoladas por `account_id`, garantindo que cada conta tenha seus próprios dados de forma independente.

### Fluxo de Funcionamento

1. **Criação de uma Conta**
   - Uma conta é criada no sistema (ex: "Escritório XYZ")
   - A conta recebe um `id` único e pode ser do tipo ADMIN ou USER
   - Campos opcionais como `gateway_customer_id` e `ia_token` podem ser preenchidos para integrações

2. **Criação de Usuários**
   - Usuários são criados vinculados a uma conta
   - Cada usuário tem credenciais (email, password) e pode ser ativado/desativado
   - Usuários podem ser do tipo ADMIN ou USER

3. **Autenticação e Tokens**
   - Quando um usuário faz login, tokens são gerados na tabela `tokens`
   - Tokens podem ser do tipo REFRESH_TOKEN ou ACCESS_TOKEN
   - Tokens podem ser revogados através do campo `revoked_at`

4. **Gestão de Clientes**
   - Clientes são criados vinculados a uma conta
   - Cada cliente pode ter informações completas de contato e endereço
   - Clientes são isolados por conta (multi-tenancy)

5. **Gestão de Produtos**
   - Produtos são criados vinculados a uma conta
   - Cada produto tem um nome e um valor
   - Produtos são isolados por conta (multi-tenancy)

---

## 🎯 Exemplo Prático

### Cenário:

**Account:** Escritório XYZ  
**User:** João Silva (ADMIN)  
**Customer:** Maria Santos  
**Product:** Consultoria Jurídica

### Dados nas Tabelas:

#### `accounts`

```sql
id: "acc-uuid-xyz"
name: "Escritório XYZ"
email: "contato@escritorioxyz.com"
type: "ADMIN"
created_at: "2025-01-15 10:00:00"
```

#### `users`

```sql
id: "user-uuid-joao"
name: "João Silva"
email: "joao@escritorioxyz.com"
type: "ADMIN"
is_active: true
account_id: "acc-uuid-xyz"
created_at: "2025-01-15 10:05:00"
```

#### `customers`

```sql
id: "customer-uuid-maria"
name: "Maria Santos"
email: "maria@email.com"
phone: "(11) 99999-9999"
document: "123.456.789-00"
account_id: "acc-uuid-xyz"
created_at: "2025-01-15 11:00:00"
```

#### `products`

```sql
id: "product-uuid-consultoria"
name: "Consultoria Jurídica"
value: 500.00
account_id: "acc-uuid-xyz"
created_at: "2025-01-15 10:30:00"
```

#### `tokens`

```sql
id: "token-uuid-1"
type: "ACCESS_TOKEN"
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
account_id: "acc-uuid-xyz"
user_id: "user-uuid-joao"
created_at: "2025-01-15 10:10:00"
```

---

## 🛡️ Recursos de Integridade

### Soft Delete

Todas as tabelas implementam **soft delete** através do campo `deleted_at`:

- Quando um registro é "deletado", apenas o campo `deleted_at` é preenchido
- O registro permanece no banco de dados
- Queries devem filtrar `deleted_at IS NULL` para obter apenas registros ativos

### Foreign Keys (Integridade Referencial)

Todas as foreign keys garantem a integridade dos dados:

```sql
-- users
account_id → accounts.id

-- tokens
account_id → accounts.id
user_id → users.id

-- customers
account_id → accounts.id

-- products
account_id → accounts.id
```

### Timestamps Automáticos

Todos os registros têm:

- `created_at`: Preenchido automaticamente na criação
- `updated_at`: Atualizado automaticamente em cada modificação

---

## 🔍 Queries Úteis

### Buscar todos os usuários de uma conta

```sql
SELECT
    u.*,
    a.name as account_name
FROM users u
INNER JOIN accounts a ON u.account_id = a.id
WHERE u.account_id = 'acc-uuid'
    AND u.deleted_at IS NULL
    AND a.deleted_at IS NULL
ORDER BY u.created_at DESC;
```

### Buscar todos os clientes de uma conta

```sql
SELECT
    c.*
FROM customers c
WHERE c.account_id = 'acc-uuid'
    AND c.deleted_at IS NULL
ORDER BY c.name;
```

### Buscar todos os produtos de uma conta

```sql
SELECT
    p.*
FROM products p
WHERE p.account_id = 'acc-uuid'
    AND p.deleted_at IS NULL
ORDER BY p.name;
```

### Buscar tokens ativos de um usuário

```sql
SELECT
    t.*
FROM tokens t
WHERE t.user_id = 'user-uuid'
    AND t.account_id = 'acc-uuid'
    AND t.revoked_at IS NULL
    AND t.deleted_at IS NULL
ORDER BY t.created_at DESC;
```

### Buscar conta com estatísticas

```sql
SELECT
    a.*,
    COUNT(DISTINCT u.id) as users_count,
    COUNT(DISTINCT c.id) as customers_count,
    COUNT(DISTINCT p.id) as products_count
FROM accounts a
LEFT JOIN users u ON a.id = u.account_id AND u.deleted_at IS NULL
LEFT JOIN customers c ON a.id = c.account_id AND c.deleted_at IS NULL
LEFT JOIN products p ON a.id = p.account_id AND p.deleted_at IS NULL
WHERE a.id = 'acc-uuid'
    AND a.deleted_at IS NULL
GROUP BY a.id;
```

---

## 📝 Notas Importantes

1. **Multi-tenancy**: Todas as entidades principais (users, customers, products) são isoladas por `account_id`, garantindo que cada conta tenha seus próprios dados

2. **Tipos de Conta e Usuário**: O campo `type` pode ser ADMIN ou USER, permitindo diferentes níveis de acesso

3. **Tokens**: O sistema suporta diferentes tipos de tokens (REFRESH_TOKEN, ACCESS_TOKEN) e permite revogação através do campo `revoked_at`

4. **Status de Usuário**: O campo `is_active` permite ativar/desativar usuários sem deletá-los

5. **Integrações**: A tabela `accounts` possui campos para integrações externas (`gateway_customer_id` para pagamentos, `ia_token` para IA)

6. **Performance**: Para melhor performance, considere adicionar índices em:
   - `users.account_id`
   - `tokens.account_id` e `tokens.user_id`
   - `customers.account_id`
   - `products.account_id`
   - Campos `deleted_at` em todas as tabelas

---

## 🚀 Possíveis Melhorias Futuras

1. **Auditoria**: Tabela de histórico para rastrear todas as ações dos usuários
2. **Permissões Granulares**: Sistema de roles e permissões mais detalhado
3. **Relacionamentos entre Entidades**: Tabelas para relacionar customers com products (vendas, contratos)
4. **Notificações**: Sistema de notificações para usuários
5. **Anexos**: Tabela para anexar documentos aos customers ou products
6. **Histórico de Alterações**: Versionamento de dados importantes

---

**Última atualização:** Janeiro de 2025
