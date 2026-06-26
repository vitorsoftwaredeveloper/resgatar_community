# Resgatar Community

Backend serverless para gestão de uma comunidade: membros, contribuições mensais, cobranças (PIX/cartão e dinheiro), despesas com comprovantes, balanço financeiro, vídeos e notificações. Construído com Node.js e TypeScript sobre AWS Lambda e API Gateway, com integração ao MercadoPago para pagamentos, AWS S3 para comprovantes, Firebase Cloud Messaging para push notifications e YouTube para vídeos.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Níveis de Acesso](#níveis-de-acesso)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Local](#configuração-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rotas da API](#rotas-da-api)
- [Validações do Cadastro de Membro](#validações-do-cadastro-de-membro)
- [Modelos de Dados](#modelos-de-dados)
- [Comprovantes de Despesa (S3)](#comprovantes-de-despesa-s3)
- [Testes](#testes)
- [Scripts](#scripts)
- [Deploy](#deploy)
- [Webhook MercadoPago](#webhook-mercadopago)

---

## Visão Geral

O Resgatar Community é uma plataforma de gestão comunitária que oferece:

- Cadastro público de membros com validações equivalentes ao app mobile (CPF/CNPJ, senha forte, domínio de email)
- Gerenciamento de membros com autenticação via AWS Cognito, incluindo foto de perfil (`profileImage`) e papel (`role`)
- Processamento de pagamentos online (PIX, Boleto, Cartão de Crédito) integrado ao MercadoPago
- Registro manual de pagamentos em dinheiro pelo administrador, com notificação ao membro
- Rastreamento de contribuições mensais por membro e por ano, com método de pagamento e data de quitação
- Painéis financeiros para o administrador: resumo mensal e anual de arrecadação, progresso de meta e balanço anual (entradas x saídas)
- Gestão de despesas da comunidade (CRUD) com categorias, resumo mensal e upload/visualização de comprovantes em S3 via URLs pré-assinadas
- Gerenciamento de vídeos do YouTube: cadastro, listagem enriquecida (thumbnail, dados do membro) e remoção
- Envio de push notifications via Firebase Cloud Messaging (FCM) para todos os usuários (notificações manuais e Liturgia Diária automatizada)
- Webhook do MercadoPago para atualização automática de status de pagamento e push notification ao membro na aprovação
- Criptografia de dados sensíveis com AES-256-GCM
- Tarefas agendadas diárias: remoção de cobranças expiradas, Liturgia Diária, lembrete de dia de pagamento e parabéns aos aniversariantes

---

## Níveis de Acesso

A autenticação é feita por JWT do AWS Cognito. Além de estar autenticado, algumas rotas exigem que o membro tenha `role: admin` — a verificação é feita no service via `verifyAdmin` (consulta o `role` do membro no banco). Em algumas rotas o acesso é **próprio ou admin**: o próprio dono do recurso pode agir sobre si, e um admin pode agir sobre qualquer membro.

### Funcionalidades do Usuário Comum (`role: user`)

Qualquer membro autenticado pode:

- **Conta:** ver os próprios dados (`GET /members`), editar o próprio perfil, trocar a própria senha, atualizar o push token FCM e excluir a própria conta
- **Pagamentos:** criar a própria cobrança no MercadoPago (PIX/Boleto/Cartão) e consultar o status da transação
- **Meta da comunidade:** consultar o progresso da meta de arrecadação do mês (`GET /charges/goal-progress`)
- **Contribuições:** criar o registro de contribuição anual
- **Aniversariantes:** listar os aniversariantes do mês (`GET /members/birthdays`)
- **Vídeos:** listar, cadastrar e remover vídeos do YouTube

### Funcionalidades exclusivas do Administrador (`role: admin`)

Apenas membros com `role: admin` podem:

- **Membros:** listar todos os membros (`GET /members/list`), consultar um membro por id (`GET /members/{memberId}`), editar/remover qualquer membro e alterar o `role` de um membro (promover/rebaixar)
- **Pagamentos em dinheiro:** registrar manualmente o pagamento de um mês em dinheiro (`POST /charges/cash`), marcando a contribuição como paga e notificando o membro
- **Painéis financeiros:** resumo mensal de cobranças (`GET /charges/summary`), resumo anual (`GET /charges/annual-summary`) e balanço anual entradas x saídas (`GET /balance/annual`)
- **Despesas:** criar, listar, editar e remover despesas; ver o resumo mensal de despesas; gerar URLs pré-assinadas de upload/visualização de comprovantes
- **Notificações:** enviar push notification manual para todos os usuários (`POST /notifications`)

> A promoção/rebaixamento de papel é feita pela própria rota de edição de membro (`PUT /members/{memberId}`): quando o payload contém o campo `role`, a alteração exige `role: admin` no requisitante.

---

## Arquitetura

O projeto segue uma arquitetura serverless em camadas:

```
HTTP Request
    |
API Gateway (HTTP API)
    |  público: POST /members, POST /webhook/mercadopago
    |  autenticado: demais rotas (JWT via Cognito)
    |
Lambda Handler  ->  Validation (AJV + validadores customizados)
    |
Service Layer   ->  Business Logic + verifyAdmin (autorização por role)
    |
Repository      ->  Mongoose CRUD wrapper        Integrações: MercadoPago, FCM, S3
    |
MongoDB
```

As funções Lambda são organizadas por módulo, cada uma com apenas as variáveis de ambiente necessárias, definidas em arquivos `functions.yml` individuais.

---

## Tecnologias

| Categoria            | Tecnologia                       |
| -------------------- | -------------------------------- |
| Runtime              | Node.js 24.x                     |
| Linguagem            | TypeScript (ES2022)              |
| Compute              | AWS Lambda (timeout: 27s)        |
| API                  | AWS API Gateway (HTTP API)       |
| Autenticação         | AWS Cognito + JWT                |
| Banco de Dados       | MongoDB 6.0 com Mongoose 9       |
| Pagamentos           | MercadoPago SDK v2               |
| Armazenamento        | AWS S3 (comprovantes, URLs pré-assinadas) |
| Push Notifications   | Firebase Admin SDK (FCM)         |
| Criptografia         | AES-256-GCM (Node.js `crypto`)   |
| Validação            | AJV 8 + validadores customizados |
| YouTube              | API pública de thumbnails        |
| Empacotamento        | serverless-esbuild               |
| Infraestrutura Local | Docker Compose + LocalStack      |
| Testes               | Jest 30 + ts-jest + lcov         |

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
| `DB`                       | String de conexão MongoDB                                                   | todos (global) / agents           |
| `USER_POOL_ID`             | ID do User Pool do AWS Cognito                                              | members                           |
| `CLIENT_ID`                | ID do cliente Cognito (e audience do authorizer JWT)                        | createMember / authorizer         |
| `COGNITO_URL`              | URL do issuer Cognito para validação JWT                                    | authorizer                        |
| `COGNITO_USER_POOL_ARN`    | ARN do User Pool, usado nas permissões IAM das funções                      | infra (IAM)                       |
| `REGION`                   | Região AWS usada pelo cliente S3                                            | expenses                          |
| `RECEIPTS_BUCKET_NAME`     | Nome do bucket S3 onde os comprovantes de despesa são armazenados          | expenses / infra                  |
| `ENCRYPTION_KEY`           | Chave de criptografia AES-256-GCM (string hex de 64 caracteres / 32 bytes)  | members, charges                  |
| `MPAGO_ACCESS_TOKEN`       | Token de acesso do MercadoPago                                              | charges, webhook                  |
| `MPAGO_TRANSACTION_URL`    | Endpoint da API do MercadoPago                                             | charges, webhook                  |
| `MPAGO_NOTIFICATION_URL`   | URL de notificação (webhook) informada ao MercadoPago na criação da cobrança | createCharge                    |
| `MPAGO_WEBHOOK_SECRET`     | Segredo para validação de assinatura do webhook do MercadoPago              | webhook                           |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço do Firebase codificado em Base64                   | notifications, charges, agents    |

---

## Rotas da API

> Legenda de acesso: ❌ pública · ✅ autenticada (qualquer membro) · 👤 próprio ou admin · 🔑 somente admin

### Membros

| Método | Rota                           | Acesso | Descrição                                                        |
| ------ | ------------------------------ | ------ | ---------------------------------------------------------------- |
| POST   | `/members`                     | ❌     | Cadastro de novo membro (signup)                                 |
| GET    | `/members`                     | ✅     | Retorna os dados do membro autenticado                           |
| GET    | `/members/list`                | 🔑     | Lista todos os membros cadastrados                               |
| GET    | `/members/birthdays`           | ✅     | Lista os aniversariantes do mês corrente                         |
| GET    | `/members/{memberId}`          | 🔑     | Consulta um membro específico por id                             |
| PUT    | `/members/{memberId}`          | 👤     | Atualiza os dados de um membro (alterar `role` exige admin)      |
| DELETE | `/members/{memberId}`          | 👤     | Remove o membro e seus dados (contribuições, cobranças, vídeos)  |
| PUT    | `/members/{memberId}/password` | ✅     | Atualiza a senha do membro via Cognito                           |
| PATCH  | `/members/push-token`          | ✅     | Atualiza o push token FCM do membro autenticado                  |

### Vídeos

| Método | Rota                | Acesso | Descrição                                                            |
| ------ | ------------------- | ------ | ------------------------------------------------------------------- |
| GET    | `/videos`           | ✅     | Lista todos os vídeos com thumbnail, dados do autor e foto de perfil |
| POST   | `/videos`           | ✅     | Cadastra um vídeo do YouTube (extrai `videoId` e gera thumbnail)     |
| DELETE | `/videos/{videoId}` | ✅     | Remove um vídeo cadastrado                                           |

### Cobranças

| Método | Rota                         | Acesso | Descrição                                                          |
| ------ | ---------------------------- | ------ | ------------------------------------------------------------------ |
| POST   | `/charges`                   | ✅     | Cria uma cobrança via MercadoPago (PIX, Boleto, Cartão)            |
| POST   | `/charges/cash`              | 🔑     | Registra manualmente o pagamento de um mês em dinheiro e notifica o membro |
| GET    | `/charges/goal-progress`     | ✅     | Progresso da meta de arrecadação do mês (`?year=&month=`, mês 1-12) |
| GET    | `/charges/summary`           | 🔑     | Resumo mensal de cobranças por membro (`?year=&month=`, mês 1-12)  |
| GET    | `/charges/annual-summary`    | 🔑     | Resumo anual de cobranças por mês e por membro (`?year=`)          |
| GET    | `/charges/{transactionId}`   | ✅     | Consulta o status de uma transação                                 |

### Despesas

> Todas as rotas de despesas são exclusivas do administrador.

| Método | Rota                              | Acesso | Descrição                                                                 |
| ------ | --------------------------------- | ------ | ------------------------------------------------------------------------- |
| POST   | `/expenses`                       | 🔑     | Cria uma despesa (opcionalmente vinculada a um comprovante via `receiptKey`) |
| GET    | `/expenses`                       | 🔑     | Lista despesas do período (`?year=&month=`, mês **0-11**)                  |
| GET    | `/expenses/summary`               | 🔑     | Resumo mensal de despesas: total, contagem e total por categoria          |
| GET    | `/expenses/receipt-upload-url`    | 🔑     | Gera URL pré-assinada de upload do comprovante (`?contentType=`)          |
| PUT    | `/expenses/{expenseId}`           | 🔑     | Edita uma despesa (troca/remove o comprovante quando `receiptKey` muda)   |
| DELETE | `/expenses/{expenseId}`           | 🔑     | Remove a despesa e o comprovante associado no S3                          |
| GET    | `/expenses/{expenseId}/receipt`   | 🔑     | Gera URL pré-assinada (temporária) para visualizar o comprovante          |

### Balanço

| Método | Rota              | Acesso | Descrição                                                                          |
| ------ | ----------------- | ------ | ---------------------------------------------------------------------------------- |
| GET    | `/balance/annual` | 🔑     | Balanço anual entradas (arrecadação) x saídas (despesas), por mês e acumulado (`?year=`) |

### Contribuições

| Método | Rota             | Acesso | Descrição                                          |
| ------ | ---------------- | ------ | -------------------------------------------------- |
| POST   | `/contributions` | ✅     | Cria o registro de contribuição anual de um membro |

### Notificações

| Método | Rota             | Acesso | Descrição                                                  |
| ------ | ---------------- | ------ | ---------------------------------------------------------- |
| POST   | `/notifications` | 🔑     | Envia push notification via FCM para todos os usuários      |

### Webhook

| Método | Rota                   | Acesso | Descrição                                                                         |
| ------ | ---------------------- | ------ | --------------------------------------------------------------------------------- |
| POST   | `/webhook/mercadopago` | ❌     | Recebe eventos do MercadoPago, atualiza o status da cobrança e envia push ao membro quando aprovado |

### Tarefas Agendadas

| Nome                   | Cron (UTC)      | Horário (BRT) | Descrição                                                       |
| ---------------------- | --------------- | ------------- | --------------------------------------------------------------- |
| `removeCharges`        | `0 0 11 * ? *`  | dia 11, 00:00 UTC ¹ | Remove cobranças pendentes expiradas                      |
| `dailyLiturgy`         | `0 10 * * ? *`  | 07:00 (diário)      | Envia push notification "A Palavra de Deus para hoje" via FCM |
| `paymentDayReminder`   | `0 11 * * ? *`  | 08:00 (diário)      | Envia lembrete de dia de pagamento aos membros            |
| `birthdayNotification` | `0 11 * * ? *`  | 08:00 (diário)      | Avisa a comunidade dos aniversariantes do dia e parabeniza os aniversariantes |

> ¹ O cron de `removeCharges` (`cron(0 0 11 * ? *)`) executa às 00:00 UTC **do dia 11 de cada mês** — diferente dos demais agentes, que rodam diariamente. Se a intenção for execução diária às 08:00 BRT (11:00 UTC), o cron deveria ser `cron(0 11 * * ? *)`.

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

> O cadastro **não** aceita o campo `role`: todo novo membro é criado como `user`. A promoção a `admin` é feita posteriormente por um administrador via `PUT /members/{memberId}`.

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
year        Number (indexado, único por membro junto de memberId)
months      {
              january..december: {
                paid:          Boolean,
                value:         String,     // valor registrado no momento do pagamento
                paidAt:        Date,
                paymentMethod: Enum: pix | cash
              }
            }
timestamps  createdAt, updatedAt
```

> Cada documento representa um ano de um membro. Apenas os meses presentes no documento são "esperados" para pagamento — meses anteriores à entrada do membro simplesmente não existem (trata adesões no meio do ano). O `value` é gravado no instante do pagamento para que edições futuras em `paymentInfo.amount` não distorçam os históricos.

### Expense

```
_id            String (UUID)
description    String (obrigatório, até 200 caracteres)
amount         String (formato "000,00")
category       Enum: maintenance | event | material | food | donation | utilities | transport | other
referenceMonth Number (0-11, 0 = janeiro)
referenceYear  Number
date           Number (timestamp)
note           String (opcional, até 500 caracteres)
receiptKey     String (key do comprovante no S3, opcional)
adminId        String (admin que registrou a despesa)
timestamps     createdAt, updatedAt
```

### Video

```
_id        String (UUID)
memberId   String (indexado, referência ao membro)
url        String (URL original do YouTube)
videoId    String (ID extraído da URL do YouTube)
title      String (opcional)
timestamps createdAt, updatedAt
```

> A listagem de vídeos (`GET /videos`) enriquece cada item com `thumbnail` (gerado via `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`), `firstName`, `lastName` e `profileImage` do membro autor.

---

## Comprovantes de Despesa (S3)

Os comprovantes de despesa são enviados pelo app diretamente ao S3 usando **URLs pré-assinadas**, sem trafegar o arquivo pela Lambda. O fluxo é:

1. **Solicitar URL de upload** — `GET /expenses/receipt-upload-url?contentType=image/jpeg` retorna `{ uploadUrl, key }`. Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
2. **Enviar o arquivo** — o app faz um `PUT` do arquivo direto na `uploadUrl` (válida por 5 minutos).
3. **Vincular à despesa** — o `key` retornado é enviado como `receiptKey` ao criar (`POST /expenses`) ou editar (`PUT /expenses/{expenseId}`) a despesa.
4. **Visualizar** — `GET /expenses/{expenseId}/receipt` retorna uma `viewUrl` pré-assinada (GET, válida por 5 minutos).

A key segue o padrão `receipts/<adminId>/<uuid>.<ext>`. Ao salvar/editar, o backend valida que a key pertence ao próprio admin (prefixo `receipts/<adminId>/`), impedindo referenciar comprovantes de outros administradores. Ao remover ou trocar um comprovante, o objeto antigo é apagado do S3 — sempre **após** a atualização do banco ser confirmada. O bucket é privado (acesso público bloqueado) e possui regra de CORS para `PUT`/`GET`.

---

## Webhook MercadoPago

O endpoint `POST /webhook/mercadopago` recebe notificações de pagamento do MercadoPago e executa automaticamente:

1. Valida a assinatura do evento com `MPAGO_WEBHOOK_SECRET`
2. Busca os dados atualizados da transação diretamente na API do MercadoPago
3. Atualiza o status da cobrança (`Charge`) no banco de dados
4. Se o status for `approved`, envia uma push notification ao membro via FCM informando a confirmação do pagamento

---

## Testes

O projeto possui cobertura de testes unitários e de integração organizados em:

```
__tests__/
├── unit/
│   ├── db/           # Singleton de conexão MongoDB
│   ├── utils/        # crypto, helper, http, validate, cognito, mongoose, youtube, s3
│   ├── repositories/ # createInstanceMongoose (todos os métodos CRUD)
│   └── integrations/ # mercadopago, firebase
└── integration/
    └── services/
        ├── members/  # createMember, editMember, getMember, listMembers, removeMember
        ├── charges/  # registerCashPayment, summaries, goalProgress
        ├── expenses/ # createExpense, editExpense, removeExpense, summaries
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

O deploy é realizado pelo Serverless Framework com empacotamento automático via `serverless-esbuild` (transpilação TypeScript + minificação). O `serverless.yml` também provisiona o bucket S3 de comprovantes (`ReceiptsBucket`) e as permissões IAM de Cognito e S3.

```bash
# Homologação
npm run deploy:hml

# Produção
npm run deploy:prod
```

Todas as funções Lambda têm timeout configurado para **27 segundos** e recebem apenas as variáveis de ambiente do seu módulo.
