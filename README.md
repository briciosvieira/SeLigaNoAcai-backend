# Se Liga no Açaí - Backend

Documentação técnica atualizada do backend da aplicação **Se Liga no Açaí**.

Este README descreve o estado atual do projeto, arquitetura, stack, regras de negócio, autenticação, pagamentos, fidelidade, uploads, dashboard, rotas disponíveis, variáveis de ambiente e próximos passos.

---

## 1. Visão geral

O **Se Liga no Açaí** é uma API RESTful para uma loja de açaí/delivery.

A API atende:

- cardápio digital;
- categorias, produtos e variações;
- grupos de opções e adicionais;
- bairros e taxas de entrega;
- criação de pedidos com ou sem login;
- autenticação manual com JWT;
- login com Google;
- histórico de pedidos do cliente;
- endereços do cliente;
- tracking público de pedido;
- pagamentos via PIX Banco Inter;
- pagamentos manuais na entrega;
- fidelidade por cartões/ciclos;
- dashboard administrativo;
- upload local de imagens.

O sistema permite compra **sem autenticação**, criando um cliente guest para o pedido, mas também suporta cliente autenticado para histórico, endereços e fidelidade.

---

## 2. Stack técnica

### Stack atual

- NestJS 11
- TypeScript 5
- Prisma ORM 7+
- PostgreSQL
- Prisma PostgreSQL Adapter (`@prisma/adapter-pg`)
- class-validator
- class-transformer
- JWT (`@nestjs/jwt`)
- Passport JWT (`passport`, `passport-jwt`)
- bcrypt
- date-fns
- google-auth-library
- axios (cliente HTTP para integração com Banco Inter)
- multer (upload de arquivos)
- swagger-ui-express (instalado, configuração pendente)
- Banco Inter PIX via mTLS/certificados
- Upload local de imagens

### Futuro / opcional

- Swagger (pacote já instalado, configuração ainda pendente)
- Docker
- Redis, se necessário
- Cartão online / PagBank
- WhatsApp oficial via API oficial
- Deploy em produção

---

## 3. URL local

```txt
http://localhost:3000
```

---

## 4. Estado atual do projeto

### Criado e testado

```txt
PrismaModule
ConfigModule
ValidationPipe global
ApiResponse<T>
Paginação base

Store
Delivery Zones
Categories
Products
Product Variants
Options
Product Option Groups

Orders
Tracking público
Pedidos com ou sem token
Pedidos do cliente autenticado
Atualização de status do pedido
Atualização de status de pagamento
Integração Orders + Loyalty

Auth manual + JWT
Google Login
Refresh token
Logout
Alteração de senha (usuário autenticado)
Roles CUSTOMER / STAFF / ADMIN
Permissões granulares de admin (AdminPermission)
JwtAuthGuard
OptionalJwtAuthGuard
RolesGuard
CurrentUser decorator
Roles decorator

Admin Users
Admin Customers

Customers
Customer Addresses

Loyalty por cartões/ciclos
Expiração de cartões
Resgate de brinde
Ajuste manual de carimbos

Payments module
PIX Banco Inter
Consulta/sincronização PIX Inter
Dinheiro na entrega
Cartão na entrega
Webhook Inter preparado para produção

Dashboard admin
Fila operacional de pedidos pendentes

Uploads locais
Upload de produtos
Upload de logo da loja
Remoção de arquivos
Arquivos servidos via /uploads/*
```

### Ainda pendente

```txt
Swagger
Testes finais ponta a ponta
Deploy
Seed real quando o cliente passar os dados
```

### Adiado para evolução futura

```txt
Cartão online / PagBank
WhatsApp automático oficial
Notifications module
Redis
Docker
```

---

## 5. Decisões de arquitetura

### 5.1 Prisma como camada de banco

O projeto usa **Prisma** como ORM principal.

Não usamos `entities/` como no TypeORM.

A fonte oficial dos modelos é:

```txt
prisma/schema.prisma
```

Os tipos, models e enums são gerados pelo Prisma em:

```ts
@prisma/client
```

---

### 5.2 Enums do Prisma

Enums não devem ser duplicados manualmente em `src/commom/enums` enquanto já existirem no Prisma.

Exemplo:

```ts
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
```

---

### 5.3 PrismaModule sem `@Global()`

O `PrismaModule` não é global.

Cada módulo que precisa acessar o banco importa explicitamente:

```txt
PrismaModule
```

---

### 5.4 Loja ativa

O sistema trabalha inicialmente com uma única loja ativa.

Por isso, o frontend não envia `storeId` no body para:

```txt
categories
products
delivery-zones
option-groups
orders
```

O backend busca a loja ativa e conecta os registros à loja.

---

### 5.5 DTOs e Response DTOs

O projeto usa:

```txt
Create DTO
Update DTO
Filter DTO
Response DTO
```

Os Response DTOs controlam a saída da API e evitam expor o objeto cru do Prisma.

Campos `Decimal` devem ser retornados como `string`.

---

### 5.6 ApiResponse

Formato padrão de resposta:

```txt
{
  data: T,
  meta?: PaginationMeta
}
```

Paginação padrão:

```txt
page = 1
limit = 10
```

---

### 5.7 Pasta `commom`

O projeto atual usa a pasta:

```txt
src/commom
```

Mesmo com a grafia diferente de `common`, o README documenta a estrutura real usada no projeto.

---

## 6. Estrutura atual/recomendada do backend

```txt
backend/
 ├── prisma/
 │   ├── schema.prisma
 │   ├── migrations/
 │   └── seed.ts
 │
 ├── uploads/
 │   ├── products/
 │   └── store/
 │
 ├── src/
 │   ├── app/
 │   │   └── app.module.ts
 │   │
 │   ├── prisma/
 │   │   ├── prisma.module.ts
 │   │   └── prisma.service.ts
 │   │
 │   ├── admin/
 │   │   ├── dto/
 │   │   │   ├── create-admin-user.dto.ts
 │   │   │   ├── update-admin-user.dto.ts
 │   │   │   ├── update-admin-user-role.dto.ts
 │   │   │   ├── update-admin-user-status.dto.ts
 │   │   │   ├── update-admin-user-permissions.dto.ts
 │   │   │   ├── filter-admin-users.dto.ts
 │   │   │   ├── admin-user-response.dto.ts
 │   │   │   ├── filter-admin-customers.dto.ts
 │   │   │   ├── admin-customer-response.dto.ts
 │   │   │   ├── update-admin-customer.dto.ts
 │   │   │   └── update-admin-customer-status.dto.ts
 │   │   ├── admin.controller.ts
 │   │   ├── admin-customers.controller.ts
 │   │   ├── admin.module.ts
 │   │   └── admin.service.ts
 │   │
 │   ├── auth/
 │   │   ├── dto/
 │   │   │   ├── register.dto.ts
 │   │   │   ├── login.dto.ts
 │   │   │   ├── refresh-token.dto.ts
 │   │   │   ├── google-login.dto.ts
 │   │   │   └── auth-response.dto.ts
 │   │   ├── guards/
 │   │   │   ├── jwt-auth.guard.ts
 │   │   │   ├── optional-jwt-auth.guard.ts
 │   │   │   └── roles.guard.ts
 │   │   ├── strategies/
 │   │   │   └── jwt.strategy.ts
 │   │   ├── decorators/
 │   │   │   ├── current-user.decorator.ts
 │   │   │   └── roles.decorator.ts
 │   │   ├── auth.controller.ts
 │   │   ├── auth.module.ts
 │   │   └── auth.service.ts
 │   │
 │   ├── store/
 │   ├── delivery-zones/
 │   ├── categories/
 │   ├── products/
 │   ├── options/
 │   ├── orders/
 │   ├── customers/
 │   ├── loyalty/
 │   ├── payments/
 │   │   ├── dto/
 │   │   ├── providers/
 │   │   │   ├── inter/
 │   │   │   │   ├── inter-auth.service.ts
 │   │   │   │   ├── inter-pix.service.ts
 │   │   │   │   └── inter.types.ts
 │   │   │   ├── manual-payment.provider.ts
 │   │   │   └── payment-provider.interface.ts
 │   │   ├── payments.controller.ts
 │   │   ├── payments.module.ts
 │   │   └── payments.service.ts
 │   │
 │   ├── dashboard/
 │   │   ├── dto/
 │   │   ├── dashboard.controller.ts
 │   │   ├── dashboard.module.ts
 │   │   └── dashboard.service.ts
 │   │
 │   ├── uploads/
 │   │   ├── dto/
 │   │   │   └── upload-response.dto.ts
 │   │   ├── uploads.controller.ts
 │   │   ├── uploads.module.ts
 │   │   └── uploads.service.ts
 │   │
 │   ├── commom/
 │   │   ├── dto/
 │   │   │   └── pagination-query.dto.ts
 │   │   ├── interfaces/
 │   │   │   └── api-response.interface.ts
 │   │   └── utils/
 │   │       ├── pagination.util.ts
 │   │       ├── slug.util.ts
 │   │       ├── currency.util.ts
 │   │       ├── order-number.util.ts
 │   │       └── customer-code.util.ts
 │   │
 │   └── main.ts
 │
 ├── .env
 ├── .env.example
 ├── .gitignore
 ├── package.json
 ├── prisma.config.ts
 ├── tsconfig.json
 ├── nest-cli.json
 └── README.md
```

---

## 7. Variáveis de ambiente

Exemplo de `.env` para desenvolvimento:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/seliganoacai"

NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

INTER_API_BASE_URL=https://cdpj.partners.bancointer.com.br
INTER_TOKEN_URL=https://cdpj.partners.bancointer.com.br/oauth/v2/token
INTER_PIX_COB_URL=https://cdpj.partners.bancointer.com.br/pix/v2/cob
INTER_CLIENT_KEY_PATH=./src/certs/Inter_chave.key
INTER_CLIENT_CERT_PATH=./src/certs/Inter_cert.crt
INTER_CLIENT_ID=your_inter_client_id
INTER_CLIENT_SECRET=your_inter_client_secret
INTER_PIX_KEY=your_pix_key
INTER_PIX_EXPIRATION_SECONDS=300
```

Para testar Google Login com HTML local em Live Server, o CORS local pode aceitar também:

```txt
http://localhost:5500
http://127.0.0.1:5500
```

---

## 8. Segurança e arquivos sensíveis

Nunca versionar:

```txt
.env
certs/
src/certs/
*.crt
*.key
*.pem
*.pfx
*.p12
uploads/
google-test.html
```

Exemplo recomendado no `.gitignore`:

```gitignore
.env

certs/
src/certs/
*.crt
*.key
*.pem
*.pfx
*.p12

uploads/

google-test.html
```

---

## 9. Banco de dados

### 9.1 Models principais

```txt
Store
DeliveryZone
Customer
CustomerAdminPermission
CustomerAddress
Category
Product
ProductVariant
OptionGroup
Option
ProductOptionGroup
Order
OrderItem
OrderItemOption
Payment
OrderStatusHistory
LoyaltyProgram
CustomerLoyaltyCard
LoyaltyTransaction
NotificationLog
```

`NotificationLog` existe no schema como estrutura futura/logística, mas o módulo de notificações automáticas não faz parte do MVP atual.

---

### 9.2 Auth no Customer

O schema usa `Customer` também como entidade de autenticação.

Campos relevantes:

```txt
customerCode
fullName
email
phone
cpf
authProvider
authProviderId
role
adminPermissions  (relação com CustomerAdminPermission)
passwordHash
refreshTokenHash
lastLoginAt
isGuest
isActive
createdAt
updatedAt
```

Roles:

```txt
CUSTOMER
STAFF
ADMIN
```

Providers:

```txt
MANUAL
GOOGLE
GUEST
```

---

## 10. Enums do banco

```txt
AuthProvider
UserRole
AdminPermission
ProductType
SelectionType
PaymentMethod
PaymentStatus
OrderStatus
OrderSource
LoyaltyCardStatus
LoyaltyTransactionType
NotificationChannel
NotificationStatus
```

### AuthProvider

```txt
GOOGLE
GUEST
MANUAL
```

### UserRole

```txt
CUSTOMER
STAFF
ADMIN
```

### AdminPermission

```txt
MANAGE_DASHBOARD
MANAGE_ORDERS
MANAGE_PRODUCTS
MANAGE_PAYMENTS
MANAGE_CUSTOMERS
MANAGE_LOYALTY
MANAGE_STORE
MANAGE_DELIVERY_ZONES
MANAGE_UPLOADS
MANAGE_USERS
```

Permissões aplicadas a usuários com role `STAFF` para controle granular de acesso às funcionalidades administrativas.

### ProductType

```txt
SIMPLE
CUSTOM
COMBO
```

### SelectionType

```txt
SINGLE
MULTIPLE
```

### PaymentMethod

```txt
PIX
CREDIT_ONLINE
CARD_ON_DELIVERY
CASH_ON_DELIVERY
```

Observação:

```txt
CREDIT_ONLINE existe no schema, mas cartão online ficou para uma evolução futura.
```

### PaymentStatus

```txt
PENDING
PAID
FAILED
REFUNDED
CANCELED
```

### OrderStatus

```txt
CREATED
AWAITING_PAYMENT
PAID
PREPARING
OUT_FOR_DELIVERY
DELIVERED
CANCELED
```

### OrderSource

```txt
SITE
WHATSAPP
IFOOD
ADMIN
```

### LoyaltyCardStatus

```txt
ACTIVE
REWARD_AVAILABLE
REDEEMED
EXPIRED
CANCELED
```

### LoyaltyTransactionType

```txt
STAMP_EARNED
REWARD_AVAILABLE
REWARD_REDEEMED
CARD_EXPIRED
ADJUSTMENT
```

---

## 11. Regras de negócio

### 11.1 Preço

O frontend pode calcular preço para exibição.

O backend sempre recalcula:

```txt
product.basePrice
productVariant.price
option.additionalPrice
deliveryZone.deliveryFee
```

Não existe bloqueio por pedido mínimo no checkout.

O valor mínimo é usado apenas para decidir se um pedido pontua ou não na fidelidade.

---

### 11.2 Carrinho

O carrinho fica no frontend.

Sugestão:

```txt
Zustand + localStorage
```

Não há tabela de carrinho no MVP.

---

### 11.3 Compra sem login

Pedido sem login:

```txt
cria customer guest
não gera customerCode
não soma fidelidade
pode acompanhar pelo tracking público com número do pedido + telefone
```

Regra importante:

```txt
Customer guest não deve salvar email/cpf únicos quando isso puder causar conflito de unique constraint.
Dados informados no checkout devem ficar no próprio Order.
```

---

### 11.4 Compra com login

Pedido com login:

```txt
usa cliente autenticado
vincula pedido ao customer do token
pode consultar /orders/my-orders
pode consultar /orders/my-orders/:id
pode gerenciar endereços em /customers/me/addresses
pode participar da fidelidade
```

---

### 11.5 Tracking público

Endpoint:

```txt
GET /orders/tracking/:orderNumber?phone=71999999999
```

Retorna apenas dados básicos:

```txt
orderNumber
customerName
customerPhone
orderStatus
paymentStatus
paymentMethod
totalAmount
createdAt
updatedAt
```

Não retorna:

```txt
endereço completo
CPF
e-mail
itens detalhados
histórico interno
```

---

### 11.6 Pagamento

Métodos atuais:

```txt
PIX Banco Inter
Dinheiro na entrega
Cartão na entrega
```

Futuro:

```txt
Cartão online / PagBank
```

Ao criar pedido:

```txt
paymentStatus = PENDING
orderStatus = CREATED ou AWAITING_PAYMENT, conforme regra do método
```

Ao confirmar pagamento:

```txt
paymentStatus = PAID
```

O status operacional do pedido segue fluxo separado:

```txt
CREATED
AWAITING_PAYMENT
PAID
PREPARING
OUT_FOR_DELIVERY
DELIVERED
CANCELED
```

---

### 11.7 PIX Banco Inter

Fluxo atual:

```txt
1. Cliente cria pedido.
2. Backend cria Payment PENDING.
3. Frontend/admin chama POST /payments/order/:orderId/pix.
4. Backend gera cobrança PIX no Banco Inter.
5. Backend salva providerPaymentId, pixCopyPaste, pixQrCode e pixExpiresAt.
6. Cliente paga o PIX.
7. Enquanto estiver local, backend consulta manualmente GET /payments/:paymentId/pix.
8. Se estiver pago no Inter, backend atualiza Payment.status = PAID e Order.paymentStatus = PAID.
```

Webhook preparado para produção:

```txt
POST /payments/webhook/inter
```

Em localhost, o webhook não será chamado pelo Inter sem URL pública.

---

### 11.8 Pagamentos manuais

Métodos permitidos:

```txt
CASH_ON_DELIVERY
CARD_ON_DELIVERY
```

Criar pagamento manual:

```txt
POST /payments/order/:orderId/manual
```

Body dinheiro:

```json
{
  "paymentMethod": "CASH_ON_DELIVERY",
  "description": "Cliente pagará em dinheiro."
}
```

Body cartão na entrega:

```json
{
  "paymentMethod": "CARD_ON_DELIVERY",
  "description": "Cliente pagará na maquininha."
}
```

Confirmar pagamento recebido:

```txt
PATCH /payments/:paymentId/status
```

Body:

```json
{
  "paymentStatus": "PAID",
  "reason": "Pagamento recebido na entrega."
}
```

---

### 11.9 WhatsApp

A `whatsappMessage` gerada no pedido é para a loja receber/ver o resumo do pedido.

O envio automático por WhatsApp não faz parte do MVP atual.

No MVP:

```txt
loja acompanha pedidos pelo dashboard
cliente acompanha pelo app/tracking
```

---

### 11.10 Fidelidade

A fidelidade funciona por cartões/ciclos.

Regra geral:

```txt
Cliente logado tem um cartão fidelidade ativo.
Cartão vale por 10 meses.
A cada pedido válido, ganha 1 carimbo.
Ao completar 10 carimbos, libera o brinde.
Admin marca o brinde como retirado.
Cartão atual vira REDEEMED.
Novo cartão nasce ACTIVE com 0 carimbos.
Se passar de 10 meses, cartão vira EXPIRED.
```

O carimbo só entra quando:

```txt
paymentStatus = PAID
orderStatus = DELIVERED
cliente não é guest
pedido ainda não gerou carimbo
pedido bate o valor mínimo do programa
cartão está ACTIVE
cartão não venceu
```

Status do cartão:

```txt
ACTIVE
REWARD_AVAILABLE
REDEEMED
EXPIRED
CANCELED
```

Rotas administrativas importantes:

```txt
POST /loyalty/cards/:id/redeem
  marca o brinde como retirado e cria novo cartão ativo

POST /loyalty/cards/:id/adjust
  ajusta carimbos manualmente

POST /loyalty/cards/expire-overdue
  expira todos os cartões vencidos
```

Observação para Postman:

```txt
POST /loyalty/cards/expire-overdue não precisa de body.
Se enviar Content-Type: application/json com body vazio, pode ocorrer Unexpected end of JSON input.
Use Body none ou envie {}.
```

---

## 12. Autenticação e autorização

### 12.1 Auth manual

Rotas:

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Fluxo:

```txt
register cria customer manual
login retorna accessToken e refreshToken
refresh gera novo accessToken
logout remove refreshTokenHash
me retorna usuário autenticado
```

Header:

```txt
Authorization: Bearer ACCESS_TOKEN
```

---

### 12.2 Google Login

Rota:

```txt
POST /auth/google
```

Body:

```json
{
  "idToken": "GOOGLE_ID_TOKEN"
}
```

Fluxo:

```txt
1. Frontend obtém idToken com Google Identity Services.
2. Backend valida idToken com google-auth-library.
3. Backend busca customer por authProvider GOOGLE + authProviderId.
4. Se não encontrar, busca por e-mail.
5. Se encontrar por e-mail, vincula a conta ao Google.
6. Se não encontrar, cria novo customer.
7. Retorna accessToken e refreshToken.
```

Campos criados/atualizados:

```txt
authProvider = GOOGLE
authProviderId = sub do Google
isGuest = false
isActive = true
lastLoginAt = data atual
```

---

### 12.3 Roles

Roles atuais:

```txt
CUSTOMER  — cliente padrão
STAFF     — operador com permissões granulares via AdminPermission
ADMIN     — acesso total ao sistema
```

Para promover usuário para admin em desenvolvimento:

```sql
UPDATE customers
SET role = 'ADMIN'
WHERE email = 'admin@example.com';
```

Para promover para staff (operador com permissões específicas):

```sql
UPDATE customers
SET role = 'STAFF'
WHERE email = 'operador@example.com';
```

As permissões do staff são configuradas individualmente via `PATCH /admin/users/:id/permissions`.

---

### 12.4 Alteração de senha

Rota:

```txt
PATCH /auth/me/password
```

Requer JWT do usuário autenticado.

Body:

```json
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

---

## 13. Uploads

Uploads são locais no MVP.

Pastas:

```txt
uploads/products
uploads/store
```

Rotas:

```txt
POST   /uploads/products
POST   /uploads/store-logo
DELETE /uploads/:folder/:filename
```

Proteção:

```txt
ADMIN
```

Tipos permitidos:

```txt
image/jpeg
image/png
image/webp
```

Tamanho máximo:

```txt
5MB
```

Arquivos são servidos por:

```txt
/uploads/products/NOME_DO_ARQUIVO
/uploads/store/NOME_DO_ARQUIVO
```

Configuração necessária em `main.ts`:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});
```

---

## 14. Dashboard administrativo

Todas as rotas do dashboard são protegidas por:

```txt
JwtAuthGuard
RolesGuard
ADMIN
```

Rotas:

```txt
GET /dashboard/summary
GET /dashboard/orders
GET /dashboard/orders/pending
GET /dashboard/revenue
GET /dashboard/payments
GET /dashboard/customers
GET /dashboard/loyalty
```

### Fila de pedidos pendentes

Rota:

```txt
GET /dashboard/orders/pending
```

Uso:

```txt
Fila operacional da loja.
Mostra pedidos que ainda precisam de ação.
```

Inclui status:

```txt
CREATED
AWAITING_PAYMENT
PAID
PREPARING
OUT_FOR_DELIVERY
```

Não inclui:

```txt
DELIVERED
CANCELED
```

Ordenação:

```txt
createdAt ASC
```

Ou seja, o pedido mais antigo aparece primeiro.

---

## 15. Rotas públicas

```txt
GET  /store/current

GET  /delivery-zones
GET  /delivery-zones/:id

GET  /categories
GET  /categories/:id

GET  /products
GET  /products/:id
GET  /products/:productId/variants
GET  /products/:productId/option-groups

GET  /options/groups
GET  /options/groups/:id

POST /orders
GET  /orders/tracking/:orderNumber?phone=71999999999

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/google

POST /payments/webhook/inter
```

Observação:

```txt
Webhook é público tecnicamente, mas deve ser validado por segurança conforme estratégia definida para produção.
```

---

## 16. Rotas de cliente autenticado

```txt
GET   /auth/me
POST  /auth/logout
PATCH /auth/me/password

GET   /customers/me
PATCH /customers/me

GET    /customers/me/addresses
POST   /customers/me/addresses
PATCH  /customers/me/addresses/:id
DELETE /customers/me/addresses/:id

GET /orders/my-orders
GET /orders/my-orders/:id

GET /loyalty/me
GET /loyalty/cards
GET /loyalty/cards/:id
```

---

## 17. Rotas administrativas

### Admin Users

```txt
GET    /admin/users               lista usuários admin/staff (ADMIN)
GET    /admin/users/:id           detalhe de usuário (ADMIN)
POST   /admin/users               cria usuário admin/staff (ADMIN)
PATCH  /admin/users/:id           atualiza dados do usuário (ADMIN)
PATCH  /admin/users/:id/role      altera role do usuário (ADMIN)
PATCH  /admin/users/:id/status    ativa/desativa usuário (ADMIN)
PATCH  /admin/users/:id/permissions  define permissões do staff (ADMIN)
DELETE /admin/users/:id           remove usuário (ADMIN)
```

### Admin Customers

```txt
GET    /admin/customers           lista clientes com filtros (ADMIN/STAFF)
GET    /admin/customers/:id       detalhe do cliente (ADMIN/STAFF)
PATCH  /admin/customers/:id       atualiza dados do cliente (ADMIN/STAFF)
PATCH  /admin/customers/:id/status  ativa/desativa cliente (ADMIN/STAFF)
```

### Store

```txt
POST   /store/current
PATCH  /store/current
DELETE /store/:id
```

### Delivery Zones

```txt
POST   /delivery-zones
PATCH  /delivery-zones/:id
DELETE /delivery-zones/:id
```

### Categories

```txt
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
```

### Products

```txt
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

### Product Variants

```txt
POST   /products/:productId/variants
PATCH  /products/:productId/variants/:variantId
DELETE /products/:productId/variants/:variantId
```

### Product Option Groups

```txt
POST   /products/:productId/option-groups
PATCH  /products/:productId/option-groups/:id
DELETE /products/:productId/option-groups/:id
```

Observação:

```txt
:id no PATCH/DELETE é o ID do vínculo product_option_groups, não é o optionGroupId.
```

### Options

```txt
POST   /options/groups
PATCH  /options/groups/:id
DELETE /options/groups/:id
POST   /options/groups/:groupId/options
PATCH  /options/:id
DELETE /options/:id
```

### Orders

```txt
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/status
PATCH  /orders/:id/payment-status
```

### Customers

```txt
GET    /customers
GET    /customers/:id
```

### Loyalty

```txt
GET    /loyalty/programs
POST   /loyalty/programs
PATCH  /loyalty/programs/:id
DELETE /loyalty/programs/:id
GET    /loyalty/customer/:customerId
POST   /loyalty/cards/:id/redeem
POST   /loyalty/cards/:id/adjust
POST   /loyalty/cards/expire-overdue
```

### Payments

```txt
GET    /payments
GET    /payments/:id
GET    /payments/order/:orderId
POST   /payments/order/:orderId/pix
GET    /payments/:id/pix
POST   /payments/order/:orderId/manual
PATCH  /payments/:id/status
```

### Dashboard

```txt
GET /dashboard/summary
GET /dashboard/orders
GET /dashboard/orders/pending
GET /dashboard/revenue
GET /dashboard/payments
GET /dashboard/customers
GET /dashboard/loyalty
```

### Uploads

```txt
POST   /uploads/products
POST   /uploads/store-logo
DELETE /uploads/:folder/:filename
```

---

## 18. Fluxo atual do pedido

```txt
1. Cliente consulta loja.
2. Cliente consulta bairros.
3. Cliente consulta categorias.
4. Cliente consulta produtos.
5. Cliente consulta variações.
6. Cliente consulta grupos de opções por produto.
7. Frontend monta o carrinho.
8. Cliente finaliza pedido sem login ou com login.
9. Se não houver token, backend cria customer guest.
10. Se houver token, backend vincula o pedido ao customer autenticado.
11. Backend cria dados/endereço do pedido.
12. Backend recalcula todos os valores.
13. Backend cria pedido.
14. Backend cria itens.
15. Backend cria opções dos itens.
16. Backend cria payment pendente.
17. Backend cria histórico de status.
18. Backend gera whatsappMessage/resumo.
19. Cliente pode acompanhar via tracking público ou área logada.
20. Admin acompanha pelo dashboard.
21. Se PIX, backend gera cobrança Inter.
22. Se pagamento manual, admin confirma recebimento.
23. Admin atualiza status operacional.
24. Ao entregar pedido pago de cliente logado, fidelidade tenta adicionar carimbo.
```

---

## 19. Payments

### 19.1 Listagem

Rota:

```txt
GET /payments
```

Recomendação:

```txt
Ordenar por updatedAt DESC.
```

Motivo:

```txt
O Payment nasce com o pedido e pode ser atualizado depois quando o PIX é gerado.
Ordenar por createdAt pode deixar pagamentos recém-atualizados longe da primeira página.
```

---

### 19.2 PIX

Criar cobrança PIX:

```txt
POST /payments/order/:orderId/pix
```

Consultar/sincronizar PIX:

```txt
GET /payments/:paymentId/pix
```

Resposta esperada na criação:

```txt
providerPaymentId
pixCopyPaste
pixQrCode
pixExpiresAt
status = PENDING
```

---

### 19.3 Manual

Criar pagamento manual:

```txt
POST /payments/order/:orderId/manual
```

Confirmar/alterar status:

```txt
PATCH /payments/:paymentId/status
```

---

## 20. Migrations

### Migration inicial

Cria:

```txt
enums
tables
relations
unique constraints
indexes
defaults
```

Comando:

```bash
npx prisma migrate dev --name init
```

---

### Sequence do pedido

Cria sequence para número do pedido:

```sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO CYCLE;
```

Usada para gerar:

```txt
PED-000001
PED-000002
PED-000003
```

---

### Sequence do customerCode

Regra:

```txt
cliente registrado recebe código sequencial
cliente guest não recebe código
```

Formato:

```txt
0000001
0000002
0000003
```

Pode usar sequence própria no PostgreSQL.

---

## 21. Seed

Arquivo:

```txt
prisma/seed.ts
```

O seed real fica para o final porque depende dos dados do cliente.

Quando o cliente enviar os dados, o seed deve criar:

```txt
loja real
logo real
categorias reais
produtos reais
variações reais
opções/adicionais reais
grupos de opções reais
vínculos ProductOptionGroup
bairros reais
taxas reais
programa de fidelidade real
admin inicial
```

Comando:

```bash
npx prisma db seed
```

---

## 22. Ordem de testes recomendada

### 22.1 Base pública

```txt
GET  /store/current
GET  /delivery-zones
GET  /delivery-zones/:id
GET  /categories
GET  /products
GET  /products/:id
GET  /products/:productId/variants
GET  /products/:productId/option-groups
GET  /options/groups
GET  /options/groups/:id
```

### 22.2 Auth

```txt
POST  /auth/register
POST  /auth/login
POST  /auth/google
GET   /auth/me
POST  /auth/refresh
PATCH /auth/me/password
POST  /auth/logout
```

### 22.3 Cliente

```txt
GET   /customers/me
PATCH /customers/me
POST  /customers/me/addresses
GET   /customers/me/addresses
PATCH /customers/me/addresses/:id
DELETE /customers/me/addresses/:id
```

### 22.4 Pedido

```txt
POST /orders
GET  /orders/tracking/:orderNumber?phone=71999999999
GET  /orders/my-orders
GET  /orders/my-orders/:id
GET  /orders
GET  /orders/:id
PATCH /orders/:id/payment-status
PATCH /orders/:id/status
```

### 22.5 Payments

```txt
GET  /payments
GET  /payments/:id
GET  /payments/order/:orderId
POST /payments/order/:orderId/pix
GET  /payments/:id/pix
POST /payments/order/:orderId/manual
PATCH /payments/:id/status
```

### 22.6 Loyalty

```txt
POST /loyalty/programs
GET  /loyalty/programs
GET  /loyalty/me
GET  /loyalty/cards
GET  /loyalty/cards/:id
GET  /loyalty/customer/:customerId
POST /loyalty/cards/:id/adjust
POST /loyalty/cards/:id/redeem
POST /loyalty/cards/expire-overdue
```

### 22.7 Dashboard

```txt
GET /dashboard/summary
GET /dashboard/orders
GET /dashboard/orders/pending
GET /dashboard/revenue
GET /dashboard/payments
GET /dashboard/customers
GET /dashboard/loyalty
```

### 22.8 Uploads

```txt
POST   /uploads/products
POST   /uploads/store-logo
DELETE /uploads/:folder/:filename
```

### 22.9 Admin

```txt
POST   /admin/users
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/status
PATCH  /admin/users/:id/permissions
DELETE /admin/users/:id
GET    /admin/customers
GET    /admin/customers/:id
PATCH  /admin/customers/:id
PATCH  /admin/customers/:id/status
```

---

## 23. Fluxo ponta a ponta recomendado

```txt
1. Criar/admin logar.
2. Cadastrar loja.
3. Cadastrar bairros.
4. Cadastrar categorias.
5. Cadastrar produtos.
6. Cadastrar variações.
7. Cadastrar grupos/opções/adicionais.
8. Vincular grupos aos produtos.
9. Cliente loga com Google.
10. Cliente cria endereço.
11. Cliente cria pedido autenticado.
12. Gerar PIX.
13. Consultar PIX.
14. Admin vê pedido em /dashboard/orders/pending.
15. Admin confirma pagamento ou sincroniza PIX.
16. Admin muda status para PREPARING.
17. Admin muda status para OUT_FOR_DELIVERY.
18. Admin muda status para DELIVERED.
19. Conferir carimbo na fidelidade.
20. Cliente consulta /orders/my-orders.
21. Cliente consulta /loyalty/me.
```

---

## 24. Docker

### Arquivos

```txt
Dockerfile        — build da imagem Node 22 Alpine (inclui bcrypt nativo)
docker-compose.yml — orquestra PostgreSQL + API
entrypoint.sh     — roda migrations e inicia a aplicação
.dockerignore     — exclui node_modules, dist, .env, uploads, certs
```

### Subir tudo com um comando

```bash
docker compose up --build
```

Isso irá:
1. Subir o PostgreSQL 16 e aguardar ele ficar saudável
2. Fazer build da imagem NestJS
3. Aplicar todas as migrations Prisma (`prisma migrate deploy`)
4. Rodar o seed (`prisma db seed`) se `RUN_SEED=true`
5. Iniciar a API em `http://localhost:3000`

### Subir sem rebuild (após primeiro build)

```bash
docker compose up
```

### Parar tudo

```bash
docker compose down
```

### Parar e apagar volumes (banco + uploads)

```bash
docker compose down -v
```

### Controlar o seed

Por padrão `RUN_SEED=true` no `docker-compose.yml`.

Para subir sem rodar o seed:

```bash
RUN_SEED=false docker compose up --build
```

Ou edite a variável diretamente no `docker-compose.yml`.

### Configurações obrigatórias antes do primeiro uso

Edite o `docker-compose.yml` e preencha:

```txt
JWT_ACCESS_SECRET   — segredo do access token (troque em produção)
JWT_REFRESH_SECRET  — segredo do refresh token (troque em produção)
GOOGLE_CLIENT_ID    — Client ID do Google Console (para login com Google)
```

Para PIX Banco Inter, preencha também:

```txt
INTER_CLIENT_ID
INTER_CLIENT_SECRET
INTER_PIX_KEY
```

E monte os certificados mTLS via volume adicional no `docker-compose.yml`:

```yaml
volumes:
  - ./src/certs:/app/src/certs:ro
```

### Volumes persistentes

```txt
postgres_data — dados do banco PostgreSQL
uploads       — arquivos de imagem enviados via upload
```

---

## 25. Comandos úteis

Subir em desenvolvimento:

```bash
npm run start:dev
```

Gerar client Prisma:

```bash
npx prisma generate
```

Validar schema:

```bash
npx prisma validate
```

Formatar schema:

```bash
npx prisma format
```

Rodar migration:

```bash
npx prisma migrate dev
```

Criar migration sem aplicar:

```bash
npx prisma migrate dev --name nome_da_migration --create-only
```

Executar seed:

```bash
npx prisma db seed
```

Abrir Prisma Studio:

```bash
npx prisma studio
```

Resetar banco em desenvolvimento:

```bash
npx prisma migrate reset
```

Resetar sem executar seed automaticamente:

```bash
npx prisma migrate reset --force --skip-seed
```

---

## 26. Checklist antes do deploy

```txt
Remover google-test.html do projeto/versionamento
Garantir .env fora do git
Garantir certificados Inter fora do git
Trocar JWT_ACCESS_SECRET e JWT_REFRESH_SECRET no docker-compose.yml (ou .env produção)
Preencher GOOGLE_CLIENT_ID e variáveis Inter no docker-compose.yml (ou .env produção)
Configurar DNS/API pública
Configurar CORS com domínio real do frontend (FRONTEND_URL)
Configurar URL pública do webhook Inter
Montar certificados mTLS via volume no docker-compose.yml
Validar HTTPS
Validar uploads persistentes (volume Docker ou storage externo)
Validar backup do banco (volume postgres_data)
Validar logs
Validar usuário admin
Testar PIX em ambiente correto
Testar dashboard admin
Testar pedido guest
Testar pedido logado
Testar fidelidade
```

---

## 27. Próximas etapas recomendadas

Ordem sugerida:

```txt
1. Revisão final técnica do código.
2. Swagger.
3. Testes finais ponta a ponta.
4. Ajustes finais de produção.
5. Deploy.
6. Seed real quando o cliente passar os dados.
```

---

## 28. Funcionalidades futuras

```txt
Cartão online / PagBank
WhatsApp automático oficial
Notifications module
Redis para filas/cache, se necessário
Docker
Painel administrativo frontend
Relatórios avançados
Cupons/descontos
Horário de funcionamento avançado
Controle de estoque, se necessário
```

---

## 29. Licença

Projeto privado pertencente ao **Se Liga no Açaí**.