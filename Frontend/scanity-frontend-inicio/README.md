# 🚀 Scanity - Sistema de Controle de Estoque com QR Code

## 📌 Descrição do Projeto
O Scanity é um sistema de controle de estoque desenvolvido com o objetivo de auxiliar empresas no gerenciamento de produtos, entradas e saídas, utilizando QR Code para identificação e rastreamento.

O sistema permite o controle completo das movimentações, garantindo segurança, organização e rastreabilidade das operações realizadas.

---

## 🎯 Objetivo
Desenvolver um sistema eficiente para controle de estoque, permitindo:

- Cadastro de produtos
- Registro de entradas e saídas
- Controle de usuários
- Identificação via QR Code
- Histórico de movimentações

---

## ⚙️ Tecnologias Utilizadas

### Backend
- Node.js
- NestJS
- TypeScript
- Knex
- Banco de Dados (SQLite / PostgreSQL)

### Frontend
- Vue.js (Quasar Framework)
- TypeScript

---

## 🧠 Regra de Negócio Implementada

A principal regra de negócio implementada no sistema consiste na **validação de estoque**, impedindo que sejam realizadas saídas de produtos com quantidade superior à disponível.

### ✔ Funcionamento:
- O sistema calcula o estoque atual com base nas entradas e saídas
- Antes de registrar uma saída, é feita uma validação
- Caso o estoque seja insuficiente, a operação é bloqueada

### 🔒 Exemplo:
```ts
if (quantidade_saida > estoque_atual) {
  throw new Error("Estoque insuficiente");
}