# Se Liga no Açaí - Backend

Documentação técnica do backend da aplicação **Se Liga no Açaí**.

Este documento descreve a arquitetura planejada e o estado atual do projeto, incluindo módulos já criados, módulos futuros, estrutura de pastas, banco de dados, migrations, regras de negócio, rotas públicas, rotas administrativas e estratégia de autenticação/autorização.

---

## 1. Visão Geral

O **Se Liga no Açaí** é uma API RESTful para uma loja de açaí/delivery.

A API foi criada para atender:

- cardápio digital;
- bairros e taxas de entrega;
- categorias de produtos;
- produtos;
- variações de produtos;
- grupos de opções e adicionais;
- vínculo entre produtos e grupos de opções;
- criação de pedidos sem login;
- consulta detalhada de pedidos;
- confirmação manual de pagamento;
- atualização de status do pedido;
- geração de mensagem para WhatsApp da loja;
- autenticação de clientes e administradores;
- fidelidade;
- notificações;
- dashboard administrativo.

O projeto permite compra **sem autenticação**, mas futuramente também suportará clientes autenticados, login com Google, fidelidade e área do cliente.

---

## 2. Stack Técnica

### Stack atual

- NestJS
- TypeScript
- Prisma ORM 7+
- PostgreSQL
- Prisma PostgreSQL Adapter
- class-validator
- class-transformer
- helmet
- compression
- cookie-parser

### Stack planejada

- JWT
- Passport JWT
- bcrypt
- Google OAuth
- Swagger
- Redis
- Gateway de pagamento
- Upload de imagens
- Docker

---

## 3. URL Local

A API roda localmente em:

```txt
http://localhost:3000
```

---

## 4. Estado Atual do Projeto

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
Payment manual dentro de Orders
GET /orders/:id detalhado
```

### Ainda será criado

```txt
Auth
Customers
Roles e Guards
Payments module completo
Notifications
Loyalty
Dashboard
Uploads
Swagger
Testes
Deploy
```

---

## 5. Decisões de Arquitetura

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

Enums não devem ser duplicados manualmente em `src/common/enums` enquanto já existirem no Prisma.

Exemplo de uso:

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
Response DTO
```

Os Response DTOs controlam a saída da API e evitam expor o objeto cru do Prisma.

Campos `Decimal` devem ser retornados como `string`.

---

### 5.6 ApiResponse

Formato padrão de resposta:

```txt
{
  data: T
  meta?: PaginationMeta
}
```

Paginação usa:

```txt
page = 1
limit = 10
```

---

## 6. Estrutura Full Planejada do Backend

A estrutura abaixo representa o backend completo planejado, incluindo o que já foi criado e o que ainda será desenvolvido.

```txt
backend/
 ├── prisma/
 │   ├── schema.prisma
 │   ├── migrations/
 │   └── seed.ts
 │
 ├── src/
 │   ├── app/
 │   │   └── app.module.ts
 │   │
 │   ├── prisma/
 │   │   ├── prisma.module.ts
 │   │   └── prisma.service.ts
 │   │
 │   ├── auth/
 │   │   ├── dto/
 │   │   │   ├── register.dto.ts
 │   │   │   ├── login.dto.ts
 │   │   │   ├── google-login.dto.ts
 │   │   │   ├── guest-login.dto.ts
 │   │   │   ├── refresh-token.dto.ts
 │   │   │   └── auth-response.dto.ts
 │   │   ├── guards/
 │   │   │   ├── jwt-auth.guard.ts
 │   │   │   ├── optional-jwt-auth.guard.ts
 │   │   │   └── roles.guard.ts
 │   │   ├── strategies/
 │   │   │   ├── jwt.strategy.ts
 │   │   │   └── google.strategy.ts
 │   │   ├── decorators/
 │   │   │   ├── current-user.decorator.ts
 │   │   │   └── roles.decorator.ts
 │   │   ├── auth.controller.ts
 │   │   ├── auth.module.ts
 │   │   └── auth.service.ts
 │   │
 │   ├── store/
 │   │   ├── dto/
 │   │   │   ├── create-store.dto.ts
 │   │   │   ├── update-store.dto.ts
 │   │   │   └── store-response.dto.ts
 │   │   ├── store.controller.ts
 │   │   ├── store.module.ts
 │   │   └── store.service.ts
 │   │
 │   ├── delivery-zones/
 │   │   ├── dto/
 │   │   │   ├── create-delivery-zone.dto.ts
 │   │   │   ├── update-delivery-zone.dto.ts
 │   │   │   └── delivery-zones-response.dto.ts
 │   │   ├── delivery-zones.controller.ts
 │   │   ├── delivery-zones.module.ts
 │   │   └── delivery-zones.service.ts
 │   │
 │   ├── categories/
 │   │   ├── dto/
 │   │   │   ├── create-category.dto.ts
 │   │   │   ├── update-category.dto.ts
 │   │   │   └── category-response.dto.ts
 │   │   ├── categories.controller.ts
 │   │   ├── categories.module.ts
 │   │   └── categories.service.ts
 │   │
 │   ├── products/
 │   │   ├── dto/
 │   │   │   ├── create-products.dto.ts
 │   │   │   ├── update-products.dto.ts
 │   │   │   ├── product-response.dto.ts
 │   │   │   ├── create-product-variant.dto.ts
 │   │   │   ├── update-product-variant.dto.ts
 │   │   │   ├── product-variant-response.dto.ts
 │   │   │   ├── create-product-option-group.dto.ts
 │   │   │   ├── update-product-option-group.dto.ts
 │   │   │   └── product-option-group-response.dto.ts
 │   │   ├── products.controller.ts
 │   │   ├── products.module.ts
 │   │   └── products.service.ts
 │   │
 │   ├── options/
 │   │   ├── dto/
 │   │   │   ├── create-option-group.dto.ts
 │   │   │   ├── update-option-group.dto.ts
 │   │   │   ├── create-option.dto.ts
 │   │   │   ├── update-option.dto.ts
 │   │   │   ├── option-group-response.dto.ts
 │   │   │   └── option-response.dto.ts
 │   │   ├── options.controller.ts
 │   │   ├── options.module.ts
 │   │   └── options.service.ts
 │   │
 │   ├── orders/
 │   │   ├── dto/
 │   │   │   ├── create-order.dto.ts
 │   │   │   ├── create-order-customer.dto.ts
 │   │   │   ├── create-order-address.dto.ts
 │   │   │   ├── create-order-item.dto.ts
 │   │   │   ├── create-order-item-option.dto.ts
 │   │   │   ├── filter-orders.dto.ts
 │   │   │   ├── update-order-status.dto.ts
 │   │   │   ├── update-payment-status.dto.ts
 │   │   │   ├── order-response.dto.ts
 │   │   │   ├── order-detail-response.dto.ts
 │   │   │   ├── order-item-response.dto.ts
 │   │   │   ├── order-item-option-response.dto.ts
 │   │   │   ├── order-payment-response.dto.ts
 │   │   │   └── order-status-history-response.dto.ts
 │   │   ├── orders.controller.ts
 │   │   ├── orders.module.ts
 │   │   └── orders.service.ts
 │   │
 │   ├── customers/
 │   │   ├── dto/
 │   │   │   ├── customer-response.dto.ts
 │   │   │   ├── update-customer.dto.ts
 │   │   │   ├── create-customer-address.dto.ts
 │   │   │   ├── update-customer-address.dto.ts
 │   │   │   └── customer-address-response.dto.ts
 │   │   ├── customers.controller.ts
 │   │   ├── customers.module.ts
 │   │   └── customers.service.ts
 │   │
 │   ├── payments/
 │   │   ├── dto/
 │   │   │   ├── update-payment-status.dto.ts
 │   │   │   ├── payment-response.dto.ts
 │   │   │   ├── pix-payment.dto.ts
 │   │   │   └── card-payment.dto.ts
 │   │   ├── payments.controller.ts
 │   │   ├── payments.module.ts
 │   │   └── payments.service.ts
 │   │
 │   ├── notifications/
 │   │   ├── dto/
 │   │   │   ├── send-whatsapp.dto.ts
 │   │   │   └── notification-response.dto.ts
 │   │   ├── notifications.controller.ts
 │   │   ├── notifications.module.ts
 │   │   └── notifications.service.ts
 │   │
 │   ├── loyalty/
 │   │   ├── dto/
 │   │   │   ├── loyalty-response.dto.ts
 │   │   │   ├── create-loyalty-program.dto.ts
 │   │   │   ├── update-loyalty-program.dto.ts
 │   │   │   └── redeem-reward.dto.ts
 │   │   ├── loyalty.controller.ts
 │   │   ├── loyalty.module.ts
 │   │   └── loyalty.service.ts
 │   │
 │   ├── dashboard/
 │   │   ├── dto/
 │   │   │   └── dashboard-filter.dto.ts
 │   │   ├── dashboard.controller.ts
 │   │   ├── dashboard.module.ts
 │   │   └── dashboard.service.ts
 │   │
 │   ├── uploads/
 │   │   ├── uploads.controller.ts
 │   │   ├── uploads.module.ts
 │   │   └── uploads.service.ts
 │   │
 │   ├── common/
 │   │   ├── dto/
 │   │   │   └── pagination-query.dto.ts
 │   │   ├── filters/
 │   │   │   └── http-exception.filter.ts
 │   │   ├── interceptors/
 │   │   │   └── response.interceptor.ts
 │   │   ├── interfaces/
 │   │   │   └── api-response.interface.ts
 │   │   ├── utils/
 │   │   │   ├── pagination.util.ts
 │   │   │   ├── slug.util.ts
 │   │   │   ├── currency.util.ts
 │   │   │   ├── order-number.util.ts
 │   │   │   └── customer-code.util.ts
 │   │   └── constants/
 │   │       └── app.constants.ts
 │   │
 │   └── main.ts
 │
 ├── .env
 ├── .env.example
 ├── docker-compose.yml
 ├── Dockerfile
 ├── package.json
 ├── prisma.config.ts
 ├── tsconfig.json
 ├── nest-cli.json
 └── README.md
```

---

## 7. Banco de Dados

### 7.1 Models existentes

```txt
Store
DeliveryZone
Customer
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
CustomerLoyalty
LoyaltyTransaction
NotificationLog
```

### 7.2 Models planejados para Auth

O schema atual usa `Customer` também como entidade de autenticação.

Para Auth completo, o `Customer` deve receber ou já prever:

```txt
passwordHash
role
refreshTokenHash
lastLoginAt
```

Recomendação de enum futuro:

```txt
UserRole:
CUSTOMER
ADMIN
```

---

## 8. Resumo dos Models do Banco

### Store

Representa a loja principal.

Campos principais:

```txt
id
name
slug
logoUrl
whatsappNumber
ifoodUrl
pixKey
pixKeyType
rating
minDeliveryMinutes
maxDeliveryMinutes
minimumOrderAmount
isActive
createdAt
updatedAt
```

Relacionamentos:

```txt
deliveryZones
categories
products
optionGroups
orders
loyaltyPrograms
```

---

### DeliveryZone

Representa bairro/zona de entrega.

Campos principais:

```txt
id
storeId
neighborhood
city
state
deliveryFee
isAvailable
displayOrder
createdAt
updatedAt
```

Relacionamentos:

```txt
store
addresses
orders
```

---

### Customer

Representa cliente guest, manual ou Google.

Campos principais atuais:

```txt
id
customerCode
fullName
email
phone
cpf
authProvider
authProviderId
isGuest
isActive
createdAt
updatedAt
```

Campos planejados para Auth:

```txt
passwordHash
role
refreshTokenHash
lastLoginAt
```

Relacionamentos:

```txt
addresses
orders
customerLoyalties
notificationLogs
```

---

### CustomerAddress

Representa endereço do cliente.

Campos principais:

```txt
id
customerId
deliveryZoneId
label
street
number
complement
referencePoint
neighborhood
city
state
isDefault
createdAt
updatedAt
```

Relacionamentos:

```txt
customer
deliveryZone
orders
```

---

### Category

Representa categoria do cardápio.

Campos principais:

```txt
id
storeId
name
slug
displayOrder
isActive
createdAt
updatedAt
```

Relacionamentos:

```txt
store
products
```

---

### Product

Representa produto principal.

Campos principais:

```txt
id
storeId
categoryId
name
slug
description
emoji
imageUrl
basePrice
oldPrice
badge
productType
isFeatured
isOffer
isActive
displayOrder
createdAt
updatedAt
```

Relacionamentos:

```txt
store
category
variants
productOptionGroups
orderItems
```

---

### ProductVariant

Representa tamanho/preço do produto.

Campos principais:

```txt
id
productId
name
price
isDefault
isActive
displayOrder
createdAt
updatedAt
```

Relacionamentos:

```txt
product
orderItems
```

---

### OptionGroup

Representa grupo de opções.

Campos principais:

```txt
id
storeId
name
slug
selectionType
minSelected
maxSelected
isRequired
isActive
displayOrder
createdAt
updatedAt
```

Relacionamentos:

```txt
store
options
productOptionGroups
orderItemOptions
```

---

### Option

Representa opção dentro de um grupo.

Campos principais:

```txt
id
optionGroupId
name
description
emoji
additionalPrice
isActive
displayOrder
createdAt
updatedAt
```

Relacionamentos:

```txt
optionGroup
orderItemOptions
```

---

### ProductOptionGroup

Representa vínculo entre produto e grupo de opções.

Campos principais:

```txt
id
productId
optionGroupId
minSelected
maxSelected
isRequired
displayOrder
createdAt
updatedAt
```

Relacionamentos:

```txt
product
optionGroup
```

---

### Order

Representa o pedido.

Campos principais:

```txt
id
storeId
customerId
customerAddressId
deliveryZoneId
orderNumber
customerName
customerPhone
customerEmail
deliveryNeighborhood
deliveryAddressText
subtotalAmount
deliveryFee
discountAmount
totalAmount
paymentMethod
paymentStatus
orderStatus
changeForAmount
notes
whatsappMessage
source
createdAt
updatedAt
```

Relacionamentos:

```txt
store
customer
customerAddress
deliveryZone
items
payments
statusHistory
loyaltyLogs
notifications
```

---

### OrderItem

Representa item do pedido.

Campos principais:

```txt
id
orderId
productId
productVariantId
productName
variantName
quantity
unitPrice
optionsAmount
totalAmount
itemDescription
createdAt
```

Relacionamentos:

```txt
order
product
productVariant
options
```

---

### OrderItemOption

Representa opção escolhida em um item.

Campos principais:

```txt
id
orderItemId
optionGroupId
optionId
groupName
optionName
additionalPrice
createdAt
```

Relacionamentos:

```txt
orderItem
optionGroup
option
```

---

### Payment

Representa pagamento do pedido.

Campos principais:

```txt
id
orderId
paymentMethod
status
amount
provider
providerPaymentId
pixQrCode
pixCopyPaste
pixExpiresAt
installments
cardBrand
cardLastDigits
paidAt
failedReason
createdAt
updatedAt
```

Relacionamentos:

```txt
order
```

---

### OrderStatusHistory

Registra histórico de status.

Campos principais:

```txt
id
orderId
oldStatus
newStatus
description
createdBy
createdAt
```

Relacionamentos:

```txt
order
```

---

### LoyaltyProgram

Representa programa de fidelidade.

Campos principais:

```txt
id
storeId
name
purchasesRequired
minimumOrderAmount
rewardDescription
isActive
createdAt
updatedAt
```

Relacionamentos:

```txt
store
customerLoyalties
```

---

### CustomerLoyalty

Representa progresso do cliente na fidelidade.

Campos principais:

```txt
id
customerId
loyaltyProgramId
currentStamps
totalStamps
rewardsAvailable
rewardsRedeemed
lastStampAt
createdAt
updatedAt
```

Relacionamentos:

```txt
customer
loyaltyProgram
transactions
```

---

### LoyaltyTransaction

Representa movimentação de fidelidade.

Campos principais:

```txt
id
customerLoyaltyId
orderId
transactionType
quantity
description
createdAt
```

Relacionamentos:

```txt
customerLoyalty
order
```

---

### NotificationLog

Representa log de notificação.

Campos principais:

```txt
id
orderId
customerId
channel
recipient
message
status
sentAt
errorMessage
createdAt
```

Relacionamentos:

```txt
order
customer
```

---

## 9. Enums do Banco

```txt
AuthProvider
ProductType
SelectionType
PaymentMethod
PaymentStatus
OrderStatus
OrderSource
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

### LoyaltyTransactionType

```txt
STAMP_EARNED
REWARD_GRANTED
REWARD_REDEEMED
ADJUSTMENT
```

### NotificationChannel

```txt
WHATSAPP
EMAIL
SMS
```

### NotificationStatus

```txt
PENDING
SENT
FAILED
```

### UserRole planejado

```txt
CUSTOMER
ADMIN
```

---

## 10. Migrations

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

### Migration de sequence do pedido

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

### Migration planejada para Auth

Deve adicionar ao `Customer`:

```txt
passwordHash
role
refreshTokenHash
lastLoginAt
```

E criar enum:

```txt
UserRole
```

---

### Migration planejada para customerCode

O campo `customerCode` já existe no `Customer`.

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

## 11. Seed

Arquivo:

```txt
prisma/seed.ts
```

Responsabilidades:

```txt
criar loja inicial
criar bairros
criar categorias
criar produtos
criar variações
criar grupos de opções
criar opções
criar vínculos ProductOptionGroup
criar programa de fidelidade inicial
```

Comando:

```bash
npx prisma db seed
```

---

## 12. Rotas Atuais e Planejadas

### 12.1 Store

```txt
GET    /store/current
POST   /store/current
PATCH  /store/current
DELETE /store/:id
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

---

### 12.2 Delivery Zones

```txt
GET    /delivery-zones
GET    /delivery-zones/:id
POST   /delivery-zones
PATCH  /delivery-zones/:id
DELETE /delivery-zones/:id
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

Rota futura opcional:

```txt
GET /delivery-zones/available
```

---

### 12.3 Categories

```txt
GET    /categories
GET    /categories/:id
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

---

### 12.4 Products

```txt
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

Rotas futuras/opcionais:

```txt
GET /products/featured
GET /products/offers
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

---

### 12.5 Product Variants

```txt
GET    /products/:productId/variants
POST   /products/:productId/variants
PATCH  /products/:productId/variants/:variantId
DELETE /products/:productId/variants/:variantId
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

---

### 12.6 Options

```txt
GET    /options/groups
GET    /options/groups/:id
POST   /options/groups
PATCH  /options/groups/:id
DELETE /options/groups/:id

POST   /options/groups/:groupId/options
PATCH  /options/:id
DELETE /options/:id
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

---

### 12.7 Product Option Groups

```txt
GET    /products/:productId/option-groups
POST   /products/:productId/option-groups
PATCH  /products/:productId/option-groups/:id
DELETE /products/:productId/option-groups/:id
```

Observação:

```txt
:id no PATCH/DELETE é o ID do vínculo product_option_groups
não é o optionGroupId
```

Proteção futura:

```txt
GET    público
POST   ADMIN
PATCH  ADMIN
DELETE ADMIN
```

---

### 12.8 Orders

```txt
GET    /orders
GET    /orders/:id
POST   /orders
PATCH  /orders/:id/status
PATCH  /orders/:id/payment-status
```

Proteção futura:

```txt
POST   público ou OptionalJwtAuthGuard
GET    /orders                    ADMIN
GET    /orders/:id                tracking seguro, dono do pedido ou ADMIN
PATCH  /orders/:id/status         ADMIN
PATCH  /orders/:id/payment-status ADMIN
```

Rotas futuras:

```txt
GET /orders/my-orders
GET /orders/my-orders/:id
GET /orders/:id/tracking
```

---

### 12.9 Auth

Rotas planejadas:

```txt
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/guest
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Proteção:

```txt
register público
login público
google público
guest público
refresh público com refresh token
logout autenticado
me autenticado
```

---

### 12.10 Customers

Rotas planejadas:

```txt
GET    /customers
GET    /customers/:id
GET    /customers/me
PATCH  /customers/me
PATCH  /customers/:id
DELETE /customers/:id
```

Endereços planejados:

```txt
GET    /customers/me/addresses
POST   /customers/me/addresses
PATCH  /customers/me/addresses/:id
DELETE /customers/me/addresses/:id
```

Proteção:

```txt
/customers/me                   CUSTOMER ou ADMIN
/customers/me/addresses         CUSTOMER ou ADMIN
/customers                      ADMIN
/customers/:id                  ADMIN
```

---

### 12.11 Payments

Rotas planejadas:

```txt
GET    /payments
GET    /payments/:id
GET    /payments/order/:orderId
PATCH  /payments/:id/status
POST   /payments/webhook
```

Proteção:

```txt
GET/PATCH ADMIN
webhook protegido por assinatura/token do gateway
```

---

### 12.12 Notifications

Rotas planejadas:

```txt
GET    /notifications
GET    /notifications/:id
POST   /notifications/orders/:orderId/resend
```

Proteção:

```txt
ADMIN
```

---

### 12.13 Loyalty

Rotas planejadas:

```txt
GET    /loyalty/me
GET    /loyalty/customer/:customerId
GET    /loyalty/programs
POST   /loyalty/programs
PATCH  /loyalty/programs/:id
DELETE /loyalty/programs/:id
POST   /loyalty/redeem
POST   /loyalty/customer/:customerId/adjust
```

Proteção:

```txt
/loyalty/me              CUSTOMER
/loyalty/redeem          CUSTOMER
demais rotas             ADMIN
```

---

### 12.14 Dashboard

Rotas planejadas:

```txt
GET /dashboard/summary
GET /dashboard/orders
GET /dashboard/products
GET /dashboard/customers
GET /dashboard/revenue
GET /dashboard/loyalty
```

Proteção:

```txt
ADMIN
```

---

### 12.15 Uploads

Rotas planejadas:

```txt
POST   /uploads/products
POST   /uploads/store-logo
DELETE /uploads/:fileId
```

Proteção:

```txt
ADMIN
```

---

## 13. Fluxo Atual do Pedido

Fluxo implementado:

```txt
1. Cliente consulta loja.
2. Cliente consulta bairros.
3. Cliente consulta categorias.
4. Cliente consulta produtos.
5. Cliente consulta variações.
6. Cliente consulta grupos de opções por produto.
7. Frontend monta o carrinho.
8. Cliente finaliza sem login.
9. Backend cria customer guest.
10. Backend cria endereço.
11. Backend recalcula todos os valores.
12. Backend cria pedido.
13. Backend cria itens.
14. Backend cria opções dos itens.
15. Backend cria payment pendente.
16. Backend cria histórico de status.
17. Backend gera whatsappMessage.
18. Frontend abre WhatsApp da loja.
```

---

## 14. Regras de Negócio

### Preço

O frontend pode calcular preço para exibição.

O backend sempre recalcula:

```txt
product.basePrice
productVariant.price
option.additionalPrice
deliveryZone.deliveryFee
store.minimumOrderAmount
```

---

### Carrinho

O carrinho fica no frontend.

Sugestão:

```txt
Zustand + localStorage
```

Não há tabela de carrinho no MVP.

---

### Compra sem login

Pedido sem login:

```txt
cria customer guest
não gera customerCode
não soma fidelidade
```

Pedido com login no futuro:

```txt
usa cliente autenticado
pode gerar customerCode
pode somar fidelidade
```

---

### Pagamento

MVP:

```txt
PIX manual
cartão na entrega manual
dinheiro manual
cartão online futuro
```

Ao criar pedido:

```txt
paymentStatus = PENDING
orderStatus = CREATED
```

Ao confirmar pagamento:

```txt
paymentStatus = PAID
orderStatus = PAID
```

---

### WhatsApp

A `whatsappMessage` gerada no pedido é para a loja receber.

Ela não é a mensagem de confirmação do cliente.

---

### Fidelidade futura

Regra planejada:

```txt
cliente autenticado
pedido DELIVERED
total >= mínimo do programa
soma 1 carimbo
```

---

## 15. Rotas Públicas

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

POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/guest
POST /auth/refresh
```

---

## 16. Rotas de Cliente Autenticado

```txt
GET  /auth/me
POST /auth/logout

GET   /customers/me
PATCH /customers/me

GET    /customers/me/addresses
POST   /customers/me/addresses
PATCH  /customers/me/addresses/:id
DELETE /customers/me/addresses/:id

GET /orders/my-orders
GET /orders/my-orders/:id

GET  /loyalty/me
POST /loyalty/redeem
```

---

## 17. Rotas Administrativas

```txt
POST   /store/current
PATCH  /store/current
DELETE /store/:id

POST   /delivery-zones
PATCH  /delivery-zones/:id
DELETE /delivery-zones/:id

POST   /categories
PATCH  /categories/:id
DELETE /categories/:id

POST   /products
PATCH  /products/:id
DELETE /products/:id

POST   /products/:productId/variants
PATCH  /products/:productId/variants/:variantId
DELETE /products/:productId/variants/:variantId

POST   /products/:productId/option-groups
PATCH  /products/:productId/option-groups/:id
DELETE /products/:productId/option-groups/:id

POST   /options/groups
PATCH  /options/groups/:id
DELETE /options/groups/:id
POST   /options/groups/:groupId/options
PATCH  /options/:id
DELETE /options/:id

GET    /orders
PATCH  /orders/:id/status
PATCH  /orders/:id/payment-status

GET    /customers
GET    /customers/:id
PATCH  /customers/:id
DELETE /customers/:id

GET    /payments
GET    /payments/:id
PATCH  /payments/:id/status

GET    /notifications
POST   /notifications/orders/:orderId/resend

GET    /dashboard/summary
GET    /dashboard/orders
GET    /dashboard/products
GET    /dashboard/customers

POST   /uploads/products
POST   /uploads/store-logo
DELETE /uploads/:fileId
```

---

## 18. Próxima Etapa Recomendada

A próxima fase deve ser:

```txt
Auth + Customers + Roles
```

Ordem sugerida:

```txt
1. Ajustar schema para Auth
2. Adicionar UserRole
3. Adicionar passwordHash no Customer
4. Adicionar refreshTokenHash no Customer
5. Criar AuthModule
6. Criar register
7. Criar login
8. Criar JWT
9. Criar JwtStrategy
10. Criar JwtAuthGuard
11. Criar RolesGuard
12. Criar OptionalJwtAuthGuard
13. Criar CurrentUser decorator
14. Criar Roles decorator
15. Criar CustomersModule
16. Criar /customers/me
17. Criar /orders/my-orders
18. Proteger rotas administrativas
```

---

## 19. Ordem de Testes Recomendada

```txt
GET  /store/current

GET  /delivery-zones
GET  /delivery-zones/:id

GET  /categories
POST /categories

GET  /products
POST /products
GET  /products/:productId/variants
POST /products/:productId/variants

GET  /options/groups
POST /options/groups
POST /options/groups/:groupId/options

POST /products/:productId/option-groups
GET  /products/:productId/option-groups
PATCH /products/:productId/option-groups/:id
DELETE /products/:productId/option-groups/:id

POST /orders
GET  /orders
GET  /orders/:id
PATCH /orders/:id/payment-status
PATCH /orders/:id/status
```

---

## 20. Comandos Úteis

Subir em desenvolvimento:

```bash
npm run start:dev
```

Gerar client Prisma:

```bash
npx prisma generate
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

---

## 21. Licença

Projeto privado pertencente ao **Se Liga no Açaí**.
