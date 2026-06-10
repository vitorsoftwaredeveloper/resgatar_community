# Resgatar Community

Backend serverless para gerenciamento de membros, cobranças e contribuições de uma comunidade. Construído com Node.js e TypeScript sobre AWS Lambda e API Gateway, com integração ao MercadoPago para processamento de pagamentos.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Local](#configuração-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rotas da API](#rotas-da-api)
- [Modelos de Dados](#modelos-de-dados)
- [Scripts](#scripts)
- [Deploy](#deploy)

---

## Visão Geral

O Resgatar Community é uma plataforma de gestão comunitária que oferece:

- Cadastro e gerenciamento de membros com autenticação via AWS Cognito
- Processamento de pagamentos (PIX, Boleto, Cartão de Crédito) integrado ao MercadoPago
- Rastreamento de contribuições mensais por membro e por ano
- Sistema de notificações com expiração automática
- Push notifications via Firebase Cloud Messaging (FCM) para todos os usuários
- Criptografia de dados sensíveis com AES-256-GCM
- Tarefas agendadas diárias: remoção de cobranças expiradas e envio da Liturgia Diária

---

## Arquitetura

O projeto segue uma arquitetura serverless em camadas:

```
HTTP Request
    |
API Gateway (JWT via Cognito)
    |
Lambda Handler  ->  Validation (AJV)
    |
Service Layer   ->  Business Logic
    |
Repository      ->  Mongoose CRUD wrapper
    |
MongoDB
```

Todas as funções Lambda são orquestradas pelo Serverless Framework. O ambiente local é emulado com `serverless-offline`, MongoDB via Docker e LocalStack para serviços AWS.

---

## Tecnologias

| Categoria            | Tecnologia                     |
| -------------------- | ------------------------------ |
| Runtime              | Node.js 24.x                   |
| Linguagem            | TypeScript (ES2022)            |
| Compute              | AWS Lambda                     |
| API                  | AWS API Gateway (HTTP API)     |
| Autenticação         | AWS Cognito + JWT              |
| Banco de Dados       | MongoDB 6.0 com Mongoose 9     |
| Pagamentos           | MercadoPago SDK v2             |
| Push Notifications   | Firebase Admin SDK (FCM)       |
| Criptografia         | AES-256-GCM (Node.js `crypto`) |
| Validação            | AJV 8                          |
| Empacotamento        | serverless-esbuild             |
| Infraestrutura Local | Docker Compose + LocalStack    |
| Testes               | Jest 30                        |

---

## Pré-requisitos

- Node.js >= 20
- Docker e Docker Compose
- Serverless Framework v3 instalado globalmente (`npm install -g serverless`)
- Credenciais AWS configuradas (para deploy)

---

## Configuração Local

**1. Clonar o repositório**

```bash
git clone https://github.com/vitorsoftwaredeveloper/resgatar_community.git
cd resgatar_community
```

**2. Instalar dependências**

```bash
npm install
```

**3. Subir serviços locais (MongoDB + LocalStack)**

```bash
docker-compose up -d
```

**4. Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

---

## Variáveis de Ambiente

As configurações por ambiente ficam em `config/{stage}.json` e são injetadas nas funções Lambda pelo Serverless Framework. Valores sensíveis são armazenados no AWS SSM Parameter Store.

| Variável                   | Descrição                                                                  |
| -------------------------- | -------------------------------------------------------------------------- |
| `STAGE`                    | Ambiente de execução (dev, hml, prod)                                      |
| `SERVICE_NAME`             | Identificador do serviço                                                   |
| `REGION`                   | Região AWS                                                                 |
| `USER_POOL_ID`             | ID do User Pool do AWS Cognito                                             |
| `CLIENT_ID`                | ID do cliente Cognito                                                      |
| `COGNITO_URL`              | URL do issuer Cognito para validação JWT                                   |
| `DB`                       | String de conexão MongoDB                                                  |
| `MPAGO_ACCESS_TOKEN`       | Token de acesso do MercadoPago                                             |
| `MPAGO_TRANSACTION_URL`    | Endpoint da API do MercadoPago                                             |
| `ENCRYPTION_KEY`           | Chave de criptografia AES-256-GCM (string hex de 64 caracteres / 32 bytes) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço do Firebase codificado em Base64                  |

---

## Rotas da API

Todos os endpoints requerem autenticação via token JWT no header `Authorization: Bearer <token>`.

### Membros

| Metodo | Rota                           | Descricao                                         |
| ------ | ------------------------------ | ------------------------------------------------- |
| POST   | `/members`                     | Cria um novo membro e provisiona conta no Cognito |
| GET    | `/members`                     | Retorna os dados do membro autenticado            |
| GET    | `/members/list`                | Lista todos os membros cadastrados                |
| PUT    | `/members/{memberId}`          | Atualiza os dados de um membro                    |
| DELETE | `/members/{memberId}`          | Remove um membro do sistema                       |
| PUT    | `/members/{memberId}/password` | Atualiza a senha do membro via Cognito            |
| PATCH  | `/members/push-token`          | Atualiza o push token FCM do membro autenticado   |

### Cobranças

| Metodo | Rota                       | Descricao                                               |
| ------ | -------------------------- | ------------------------------------------------------- |
| POST   | `/charges`                 | Cria uma cobrança via MercadoPago (PIX, Boleto, Cartão) |
| GET    | `/charges/{transactionId}` | Consulta o status de uma transação                      |

### Contribuicoes

| Metodo | Rota             | Descricao                                          |
| ------ | ---------------- | -------------------------------------------------- |
| POST   | `/contributions` | Cria o registro de contribuição anual de um membro |

### Notificacoes

| Metodo | Rota             | Descricao                                   |
| ------ | ---------------- | ------------------------------------------- |
| POST   | `/notifications` | Cria uma notificação (info, alert, warning) |

### Tarefas Agendadas

| Nome            | Cron (UTC)     | Descricao                                          |
| --------------- | -------------- | -------------------------------------------------- |
| `removeCharges` | `0 11 * * ? *` | Remove cobranças pendentes expiradas diariamente   |
| `dailyLiturgy`  | `0 10 * * ? *` | Envia push notification da Liturgia Diária via FCM |

---

## Modelos de Dados

### Member

```
_id           String (UUID do Cognito)
email         String (unico, obrigatorio)
phoneNumber   String
firstName     String
lastName      String
bio           String (opcional)
dateOfBirth   String
address       { street, number, city, state, zip, complement }
identification{ type: CPF | CNPJ, number: String }
paymentInfo   { datePayment: String, amount: Number }
role          Enum: admin | user
status        Enum: active | defaulter
pushToken     String (token FCM para push notifications, nullable)
timestamps    createdAt, updatedAt
```

### Charge

```
transactionId     String (ID da transacao no MercadoPago)
memberId          String (referencia ao membro)
status            Enum: pending | approved | rejected | cancelled | refunded | charged_back
statusDetail      String
transactionAmount Number
currencyId        String
paymentMethodId   Enum: pix | boleto | credit_card
dateCreated       Date
dateOfExpiration  Date
dateApproved      Date
payer             { firstName, lastName, email, identification }
transactionData   { qrCode, qrCodeBase64, ticketUrl }
referenceMonth    Number
timestamps        createdAt, updatedAt
```

### Contribution

```
memberId    String (indexado)
year        Number (indexado, unico por membro)
months      {
              january..december: {
                paid:   Boolean,
                value:  String,
                paidAt: Date
              }
            }
timestamps  createdAt, updatedAt
```

---

## Scripts

| Comando               | Descricao                                 |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Inicia o servidor local com hot-reload    |
| `npm test`            | Executa a suite de testes com Jest        |
| `npm run deploy:dev`  | Faz deploy no ambiente de desenvolvimento |
| `npm run deploy:hml`  | Faz deploy no ambiente de homologacao     |
| `npm run deploy:prod` | Faz deploy no ambiente de producao        |

---

## Deploy

O deploy e realizado pelo Serverless Framework. Certifique-se de que as credenciais AWS e os parametros no SSM Parameter Store estao configurados corretamente para o ambiente alvo.

```bash
# Desenvolvimento
npm run deploy:dev

# Homologacao
npm run deploy:hml

# Producao
npm run deploy:prod
```

O framework empacota automaticamente o codigo com `serverless-esbuild`, realizando transpilacao do TypeScript e minificacao antes do upload para o AWS Lambda.
