# Resgatar Community

Backend serverless para gerenciamento de membros, cobranças, contribuições e vídeos de uma comunidade. Construído com Node.js e TypeScript sobre AWS Lambda e API Gateway, com integração ao MercadoPago para processamento de pagamentos e YouTube para gerenciamento de vídeos.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Local](#configuração-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rotas da API](#rotas-da-api)
- [Validações do Cadastro de Membro](#validações-do-cadastro-de-membro)
- [Modelos de Dados](#modelos-de-dados)
- [Testes](#testes)
- [Scripts](#scripts)
- [Deploy](#deploy)
- [Webhook MercadoPago](#webhook-mercadopago)

---

## Visão Geral

O Resgatar Community é uma plataforma de gestão comunitária que oferece:

- Cadastro público de membros com validações equivalentes ao app mobile (CPF/CNPJ, senha forte, domínio de email)
- Gerenciamento de membros com autenticação via AWS Cognito, incluindo suporte a foto de perfil (`profileImage`)
- Processamento de pagamentos (PIX, Boleto, Cartão de Crédito) integrado ao MercadoPago
- Webhook do MercadoPago para atualização automática de status de pagamento e envio de push notification ao membro na aprovação
- Rastreamento de contribuições mensais por membro e por ano
- Gerenciamento de vídeos do YouTube: cadastro, listagem enriquecida (thumbnail, dados do membro) e remoção
- Envio de push notifications via Firebase Cloud Messaging (FCM) para todos os usuários (notificações manuais e Liturgia Diária automatizada)
- Criptografia de dados sensíveis com AES-256-GCM
- Tarefas agendadas diárias: remoção de cobranças expiradas, envio da Liturgia Diária e lembrete de dia de pagamento

---

## Arquitetura

O projeto segue uma arquitetura serverless em camadas:

```
HTTP Request
    |
API Gateway (HTTP API)
    |  public: POST /members
    |  autenticado: demais rotas (JWT via Cognito)
    |
Lambda Handler  ->  Validation (AJV + validadores customizados)
    |
Service Layer   ->  Business Logic
    |
Repository      ->  Mongoose CRUD wrapper
    |
MongoDB
```

As funções Lambda são organizadas por módulo, cada uma com apenas as variáveis de ambiente necessárias, definidas em arquivos `functions.yml` individuais.

---

## Tecnologias

| Categoria            | Tecnologia                     |
| -------------------- | ------------------------------ |
| Runtime              | Node.js 24.x                   |
| Linguagem            | TypeScript (ES2022)            |
| Compute              | AWS Lambda (timeout: 30s)      |
| API                  | AWS API Gateway (HTTP API)     |
| Autenticação         | AWS Cognito + JWT              |
| Banco de Dados       | MongoDB 6.0 com Mongoose 9     |
| Pagamentos           | MercadoPago SDK v2             |
| Push Notifications   | Firebase Admin SDK (FCM)       |
| Criptografia         | AES-256-GCM (Node.js `crypto`) |
| Validação            | AJV 8 + validadores customizados |
| YouTube              | API pública de thumbnails        |
| Empacotamento        | serverless-esbuild             |
| Infraestrutura Local | Docker Compose + LocalStack    |
| Testes               | Jest 30 + ts-jest + lcov       |

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

As configurações por ambiente ficam em `config/{stage}.json` e são injetadas pelo Serverless Framework individualmente em cada função Lambda (cada módulo recebe apenas as variáveis que utiliza).

| Variável                   | Descrição                                                                   | Módulos que utilizam              |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------- |
| `STAGE`                    | Ambiente de execução (dev, hml, prod)                                       | todos (global)                    |
| `DB`                       | String de conexão MongoDB                                                   | members, agents                   |
| `USER_POOL_ID`             | ID do User Pool do AWS Cognito                                              | members                           |
| `CLIENT_ID`                | ID do cliente Cognito                                                       | createMember                      |
| `COGNITO_URL`              | URL do issuer Cognito para validação JWT                                    | provider (authorizer)             |
| `ENCRYPTION_KEY`           | Chave de criptografia AES-256-GCM (string hex de 64 caracteres / 32 bytes)  | members, charges                  |
| `MPAGO_ACCESS_TOKEN`       | Token de acesso do MercadoPago                                              | charges                           |
| `MPAGO_TRANSACTION_URL`    | Endpoint da API do MercadoPago                                              | charges                           |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço do Firebase codificado em Base64                   | notifications, agents             |
| `MPAGO_WEBHOOK_SECRET`     | Segredo para validação de assinatura do webhook do MercadoPago              | webhook                           |

---

## Rotas da API

### Membros

| Método | Rota                           | Auth | Descrição                                          |
| ------ | ------------------------------ | ---- | -------------------------------------------------- |
| POST   | `/members`                     | ❌ pública | Cadastro de novo membro (signup)             |
| GET    | `/members`                     | ✅ JWT | Retorna os dados do membro autenticado           |
| GET    | `/members/list`                | ✅ JWT | Lista todos os membros cadastrados               |
| PUT    | `/members/{memberId}`          | ✅ JWT | Atualiza os dados de um membro                   |
| DELETE | `/members/{memberId}`          | ✅ JWT | Remove um membro do sistema                      |
| PUT    | `/members/{memberId}/password` | ✅ JWT | Atualiza a senha do membro via Cognito           |
| PATCH  | `/members/push-token`          | ✅ JWT | Atualiza o push token FCM do membro autenticado  |

### Vídeos

| Método | Rota                   | Auth      | Descrição                                                              |
| ------ | ---------------------- | --------- | ---------------------------------------------------------------------- |
| GET    | `/videos`              | ✅ JWT    | Lista todos os vídeos com thumbnail, dados do autor e foto de perfil   |
| POST   | `/videos`              | ✅ JWT    | Cadastra um vídeo do YouTube (extrai `videoId` e gera thumbnail)       |
| DELETE | `/videos/{videoId}`    | ✅ JWT    | Remove um vídeo cadastrado                                             |

### Cobranças

| Método | Rota                       | Auth  | Descrição                                               |
| ------ | -------------------------- | ----- | ------------------------------------------------------- |
| POST   | `/charges`                 | ✅ JWT | Cria uma cobrança via MercadoPago (PIX, Boleto, Cartão) |
| GET    | `/charges/{transactionId}` | ✅ JWT | Consulta o status de uma transação                      |

### Contribuições

| Método | Rota             | Auth  | Descrição                                          |
| ------ | ---------------- | ----- | -------------------------------------------------- |
| POST   | `/contributions` | ✅ JWT | Cria o registro de contribuição anual de um membro |

### Notificações

| Método | Rota             | Auth  | Descrição                                                                      |
| ------ | ---------------- | ----- | ------------------------------------------------------------------------------ |
| POST   | `/notifications` | ✅ JWT | Envia push notification via FCM para todos os usuários (requer perfil `admin`) |

### Webhook

| Método | Rota                | Auth      | Descrição                                                                         |
| ------ | ------------------- | --------- | --------------------------------------------------------------------------------- |
| POST   | `/webhook/mercadopago` | ❌ pública | Recebe eventos do MercadoPago, atualiza status da cobrança no banco e envia push notification ao membro quando o pagamento é aprovado |

### Tarefas Agendadas

| Nome                  | Cron (UTC)      | Horário (BRT) | Descrição                                                       |
| --------------------- | --------------- | ------------- | --------------------------------------------------------------- |
| `removeCharges`       | `0 11 * * ? *`  | 08:00         | Remove cobranças pendentes expiradas                            |
| `dailyLiturgy`        | `0 10 * * ? *`  | 07:00         | Envia push notification "A Palavra de Deus para hoje" via FCM   |
| `paymentDayReminder`  | `0 12 * * ? *`  | 09:00         | Envia lembrete de dia de pagamento para membros                 |

---

## Validações do Cadastro de Membro

A rota `POST /members` é pública e aplica as mesmas regras de validação do app mobile:

### Campos obrigatórios

`firstName`, `lastName`, `email`, `phoneNumber`, `password`, `dateOfBirth`, `paymentInfo`, `identification`

### Regras por campo

| Campo | Regras |
| ----- | ------ |
| `email` | Formato de email válido + domínio não descartável (bloqueia mailinator, tempmail, yopmail e similares) |
| `phoneNumber` | Somente dígitos, mínimo 10 caracteres |
| `password` | Mínimo 8 caracteres, deve conter: letra minúscula, letra maiúscula, número e caractere especial (`@$!%*?&#`) |
| `identification.type` | `"CPF"` ou `"CNPJ"` |
| `identification.numberType` | Somente dígitos (11 para CPF, 14 para CNPJ) + validação do dígito verificador |
| `paymentInfo.datePayment` | Número entre 1 e 31 |
| `paymentInfo.amount` | Formato `"000,00"` |

---

## Modelos de Dados

### Member

```
_id           String (UUID do Cognito)
email         String (único, obrigatório)
phoneNumber   String
firstName     String
lastName      String
bio           String (opcional)
dateOfBirth   Number (timestamp)
address       { street, number, city, state, zip, complement }
identification{ type: CPF | CNPJ, numberType: String (criptografado) }
paymentInfo   { datePayment: Number, amount: String }
role          Enum: admin | user
status        Enum: active | defaulter
pushToken     String (token FCM, nullable)
profileImage  String (URL da foto de perfil, nullable)
timestamps    createdAt, updatedAt
```

### Charge

```
transactionId     String (ID da transação no MercadoPago)
memberId          String (referência ao membro)
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
year        Number (indexado, único por membro)
months      {
              january..december: {
                paid:   Boolean,
                value:  String,
                paidAt: Date
              }
            }
timestamps  createdAt, updatedAt
```

### Video

```
_id       String (UUID)
memberId  String (indexado, referência ao membro)
url       String (URL original do YouTube)
videoId   String (ID extraído da URL do YouTube)
title     String (opcional)
timestamps createdAt, updatedAt
```

> A listagem de vídeos (`GET /videos`) enriquece cada item com `thumbnail` (gerado via `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`), `firstName`, `lastName` e `profileImage` do membro autor.

---

## Webhook MercadoPago

O endpoint `POST /webhook/mercadopago` recebe notificações de pagamento do MercadoPago e executa automaticamente:

1. Busca os dados atualizados da transação diretamente na API do MercadoPago
2. Atualiza o status da cobrança (`Charge`) no banco de dados
3. Se o status for `approved`, envia uma push notification ao membro via FCM informando a confirmação do pagamento

---

## Testes

O projeto possui cobertura de testes unitários e de integração organizados em:

```
__tests__/
├── unit/
│   ├── db/           # Singleton de conexão MongoDB
│   ├── utils/        # crypto, helper, http, validate, cognito, mongoose, youtube
│   ├── repositories/ # createInstanceMongoose (todos os métodos CRUD)
│   └── integrations/ # mercadopago, firebase
└── integration/
    └── services/
        ├── members/  # createMember, editMember, getMember, listMembers
        ├── videos/   # createVideo, removeVideo
        └── helper.ts # findMemberById, verifyAdmin, createContributionByYear
```

```bash
# Executar todos os testes com relatório de cobertura
npm test

# Modo watch (desenvolvimento)
npm run test:watch
```

O relatório de cobertura é gerado em `coverage/` nos formatos `lcov`, `html` e `text`.

---

## Scripts

| Comando               | Descrição                                  |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Inicia o servidor local com hot-reload     |
| `npm test`            | Executa a suite de testes com cobertura    |
| `npm run test:watch`  | Executa testes em modo watch               |
| `npm run deploy:dev`  | Faz deploy no ambiente de desenvolvimento  |
| `npm run deploy:hml`  | Faz deploy no ambiente de homologação      |
| `npm run deploy:prod` | Faz deploy no ambiente de produção         |

---

## Deploy

O deploy é realizado pelo Serverless Framework com empacotamento automático via `serverless-esbuild` (transpilação TypeScript + minificação).

```bash
# Homologação
npm run deploy:hml

# Produção
npm run deploy:prod
```

Todas as funções Lambda têm timeout configurado para **30 segundos** e recebem apenas as variáveis de ambiente do seu módulo.
