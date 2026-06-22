# Se Liga no Açaí — Backend

Documentação técnica do backend da aplicação **Se Liga no Açaí**.

---

## 1. Visão geral

API RESTful para loja de açaí/delivery. Atende:

- cardápio digital (categorias, produtos, variações, opções/adicionais)
- bairros e taxas de entrega + opção de retirada na loja
- criação de pedidos com ou sem login (guest)
- autenticação manual com JWT + login com Google
- histórico de pedidos e endereços do cliente
- tracking público de pedido por número + telefone
- pagamentos via PIX Banco Inter (mTLS) com webhook
- pagamentos manuais na entrega (dinheiro / cartão)
- programa de fidelidade por cartões/ciclos com carimbos proporcionais
- anúncios (site announcements)
- banners promocionais
- promoções e cupons
- dashboard administrativo
- uploads locais de imagem
- aceite de Termos de Uso e Política de Privacidade

O sistema permite compra **sem autenticação**, criando um cliente guest para o pedido. Clientes autenticados têm acesso a histórico, endereços, fidelidade e avatar.

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | NestJS 11 |
| Linguagem | TypeScript 5 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Banco | PostgreSQL 16 |
| Auth | JWT (`@nestjs/jwt`), Passport JWT, bcrypt |
| Google Auth | `google-auth-library` |
| HTTP Client | axios (integração Banco Inter) |
| Upload | multer |
| QR Code | qrcode |
| Validação | class-validator, class-transformer |
| Docker | Docker + docker-compose |

---

## 3. URL local

```
http://localhost:3131
```

---

## 4. Estado atual do projeto

### Implementado e funcionando

```
PrismaModule, ConfigModule, ValidationPipe global
ApiResponse<T>, Paginação base

Auth manual (register / login / refresh / logout)
Auth Google (idToken → JWT)
Alteração de senha
Atualização de perfil (PATCH /auth/me)
Aceite de termos e privacidade (POST /auth/me/legal-acceptance)
Avatar do cliente (upload + URL)
CustomerCode sequencial (PostgreSQL sequence)
Roles: CUSTOMER / STAFF / ADMIN
Permissões granulares de STAFF (AdminPermission)
JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard

Store (loja única ativa + disponibilidade)
Delivery Zones (bairros + zona fixa de retirada)
Categories
Products + Product Variants
Options + Option Groups + ProductOptionGroup
Orders (autenticado e guest)
Tracking público de pedido
Atualização de status do pedido e pagamento
OrderStatusHistory

Loyalty por cartões/ciclos (LoyaltyCard)
Carimbos proporcionais: Math.floor(totalAmount / minOrderAmount)
Triggers em PAID e DELIVERED
LoyaltySettings singleton
Admin: ajuste, adição, remoção de carimbos e resgate de brinde

Payments: PIX Banco Inter (mTLS)
Webhook Inter salva: endToEndId, amountPaid, payerName, payerDocument, payerBank, webhookPayload
Pagamentos manuais (dinheiro / cartão na entrega)
Sincronização manual de PIX

Announcements (anúncios ativos públicos + CRUD admin)
Banners (banners ativos públicos + CRUD admin/staff)
Promotions (promoções ativas + cálculo de desconto + cupons)

Dashboard admin completo
Fila operacional de pedidos pendentes

Uploads locais: produtos, loja, banners, fidelidade, anúncios, avatar de cliente
Arquivos servidos via /uploads/*

Admin Users (CRUD completo + roles + permissões + status)
Admin Customers (listagem + detalhe + atualização + status)
Admin Loyalty (settings + clientes + carimbos + resgate)
```

### Pendente / futuro

```
Swagger
Cartão online / PagBank
WhatsApp automático oficial
Redis
Notificações automáticas
```

---

## 5. Decisões de arquitetura

### 5.1 Prisma como camada de banco

Fonte oficial dos modelos: `prisma/schema.prisma`.
Tipos gerados em `@prisma/client`. Não usamos `entities/` do TypeORM.

### 5.2 Enums do Prisma

```ts
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
```

Não duplicar enums manualmente enquanto existirem no Prisma.

### 5.3 PrismaModule sem `@Global()`

Cada módulo que precisa do banco importa explicitamente `PrismaModule`.

### 5.4 Loja única ativa

O backend busca a loja ativa internamente. O frontend **não envia** `storeId` para:

```
categories, products, delivery-zones, option-groups, orders
```

### 5.5 DTOs e Response DTOs

```
Create DTO / Update DTO / Filter DTO / Response DTO
```

Response DTOs controlam a saída. Campos `Decimal` retornam como `string`. `payerDocument` sempre retorna mascarado.

### 5.6 ApiResponse

```json
{ "data": T, "meta": PaginationMeta }
```

Paginação padrão: `page=1`, `limit=10`.

### 5.7 Pasta `commom`

O projeto usa `src/commom` (grafia mantida intencionalmente).

### 5.8 Zona de retirada

ID fixo imutável usado pelo backend:

```
PICKUP_DELIVERY_ZONE_ID = '11111111-1111-4111-8111-111111111111'
```

O backend detecta retirada quando `deliveryZoneId` é esse valor e não exige endereço.

---

## 6. Estrutura de pastas

```
backend/
 ├── prisma/
 │   ├── schema.prisma
 │   ├── migrations/
 │   └── seed.ts
 │
 ├── uploads/
 │   ├── products/
 │   ├── store/
 │   ├── banners/
 │   ├── loyalty/
 │   ├── announcements/
 │   └── customers/
 │
 ├── src/
 │   ├── app/app.module.ts
 │   ├── main.ts
 │   │
 │   ├── prisma/
 │   ├── commom/
 │   │   ├── constants/pickup.constants.ts
 │   │   ├── dto/pagination-query.dto.ts
 │   │   ├── interfaces/api-response.interface.ts
 │   │   └── utils/
 │   │
 │   ├── auth/
 │   │   ├── dto/ (register, login, refresh-token, google-login, auth-response,
 │   │   │         update-me, change-my-password, legal-acceptance)
 │   │   ├── guards/ (jwt-auth, optional-jwt-auth, roles)
 │   │   ├── strategies/jwt.strategy.ts
 │   │   └── decorators/ (current-user, roles)
 │   │
 │   ├── admin/
 │   ├── store/
 │   ├── delivery-zones/
 │   ├── categories/
 │   ├── products/
 │   ├── options/
 │   ├── customers/
 │   ├── orders/
 │   ├── payments/
 │   │   └── providers/inter/ (inter-auth, inter-pix, inter.types)
 │   ├── loyalty/
 │   ├── announcements/
 │   ├── banners/
 │   ├── promotions/
 │   ├── dashboard/
 │   └── uploads/
 │
 ├── Dockerfile
 ├── docker-compose.yml
 ├── entrypoint.sh
 ├── .env / .env.example
 └── prisma.config.ts
```

---

## 7. Variáveis de ambiente

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/seliganoacaidb"

NODE_ENV=development
PORT=3131
FRONTEND_URL=http://localhost:5173

JWT_SECRET=change_me_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_EXPIRES_IN=15m
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
INTER_PIX_EXPIRATION_SECONDS=900
```

---

## 8. Segurança e arquivos sensíveis

Nunca versionar:

```
.env
certs/ / src/certs/
*.crt *.key *.pem *.pfx *.p12
uploads/
```

---

## 9. Banco de dados

### 9.1 Models

```
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
LoyaltySettings
LoyaltyCard
CustomerLoyalty
LoyaltyStampHistory
LoyaltyProgram (legado)
SiteAnnouncement
Banner
Promotion
NotificationLog
```

### 9.2 Customer — campos relevantes

```
id, customerCode
fullName, email, phone, cpf
authProvider, authProviderId, role
avatarUrl, googleAvatarUrl
passwordHash, refreshTokenHash
termsAcceptedAt, privacyAcceptedAt, termsVersion, privacyVersion
isGuest, isActive, lastLoginAt
adminPermissions (relação)
loyaltyCycleCards (relação)
createdAt, updatedAt
```

### 9.3 Payment — campos relevantes

```
id, orderId
paymentMethod, status, amount
provider, providerPaymentId (= txid Inter)
pixQrCode, pixCopyPaste, pixExpiresAt
providerEndToEndId          ← endToEndId vindo do webhook
amountPaid                  ← valor efetivamente pago
payerName, payerDocument    ← dados do pagador (document mascarado na API)
payerBank                   ← instituição do pagador
webhookPayload              ← payload bruto para auditoria
paidAt, failedReason
installments, cardBrand, cardLastDigits
createdAt, updatedAt
```

### 9.4 LoyaltyCard — campos relevantes

```
id, customerId
status (ACTIVE | COMPLETED | REWARD_AVAILABLE | REDEEMED | EXPIRED | CANCELED)
stamps, stampsRequired
minOrderAmount, rewardDescription
startedAt, expiresAt, completedAt, redeemedAt
createdAt
```

### 9.5 LoyaltySettings — singleton

```
id = '11111111-2222-4333-8444-555555555555'
isEnabled, title, description, cardImageUrl
minOrderAmount, stampsRequired, validityMonths
rewardDescription
```

---

## 10. Enums

### AuthProvider
```
GOOGLE | GUEST | MANUAL
```

### UserRole
```
CUSTOMER | STAFF | ADMIN
```

### AdminPermission
```
MANAGE_DASHBOARD | MANAGE_ORDERS | MANAGE_PRODUCTS | MANAGE_PAYMENTS
MANAGE_CUSTOMERS | MANAGE_LOYALTY | MANAGE_STORE | MANAGE_DELIVERY_ZONES
MANAGE_UPLOADS | MANAGE_USERS
```

### PaymentMethod
```
PIX | CREDIT_ONLINE | CARD_ON_DELIVERY | CASH_ON_DELIVERY
```

### PaymentStatus
```
PENDING | PAID | FAILED | REFUNDED | CANCELED
```

### OrderStatus
```
CREATED | AWAITING_PAYMENT | PAID | PREPARING | OUT_FOR_DELIVERY | DELIVERED | CANCELED
```

### LoyaltyCardStatus
```
ACTIVE | COMPLETED | REWARD_AVAILABLE | REDEEMED | EXPIRED | CANCELED
```

### ProductType
```
SIMPLE | CUSTOM | COMBO
```

---

## 11. Regras de negócio

### 11.1 Preço

O backend sempre recalcula: `basePrice + variantPrice + additionalPrice + deliveryFee`.

### 11.2 Carrinho

Fica no frontend (Zustand + localStorage). Não há tabela de carrinho.

### 11.3 Compra sem login

```
→ cria customer guest
→ não gera customerCode
→ não pontua fidelidade
→ acompanha via tracking público (número do pedido + telefone)
```

### 11.4 Compra com login

```
→ vincula pedido ao customer autenticado
→ acesso a /orders/my-orders
→ acesso a endereços
→ participa da fidelidade
```

### 11.5 Tracking público

```
GET /orders/tracking/:orderNumber?phone=71999999999
```

Retorna: `orderNumber, customerName, customerPhone, orderStatus, paymentStatus, paymentMethod, totalAmount, createdAt, updatedAt`.

Não retorna: endereço completo, CPF, e-mail, itens, histórico interno.

### 11.6 Fidelidade

Regras atuais:

```
Cliente logado tem um LoyaltyCard ativo por ciclo.
Cartão vale por validityMonths meses (padrão: 10).
Carimbo proporcional: Math.floor(totalAmount / minOrderAmount)
  ex.: pedido R$ 32 com mínimo R$ 16 = 2 carimbos
  ex.: pedido R$ 31 com mínimo R$ 16 = 1 carimbo (não arredonda)
Máximo de carimbos por pedido limitado ao stampsRequired restante.
Carimbo ativado em: orderStatus = PAID ou DELIVERED.
Cliente não pode ser guest.
Pedido não pode já ter gerado carimbo (idempotente).
```

Ciclo do cartão:

```
ACTIVE → (carimbos completos) → COMPLETED
COMPLETED → (admin resgata) → REDEEMED + novo cartão ACTIVE
ACTIVE → (expirou) → EXPIRED
```

### 11.7 PIX Banco Inter

Fluxo:

```
1. Cliente cria pedido → Payment PENDING criado.
2. Admin/frontend chama POST /payments/order/:orderId/pix.
3. Backend gera cobrança no Inter e salva txid + qrCode + copyPaste + expiresAt.
4. Cliente paga.
5. Inter chama POST /payments/webhook/inter → backend salva todos os detalhes.
6. Ou: admin chama GET /payments/:id/pix para sincronizar manualmente.
```

Dados salvos pelo webhook:

```
endToEndId, amountPaid, payerName, payerDocument, payerBank, webhookPayload
```

Divergência de valor (> R$ 0,01): evento é logado e ignorado (não marca como pago).

Webhook não é chamado em localhost sem URL pública (use ngrok para testar).

URL do webhook a cadastrar no Inter:

```
POST https://seudominio.com.br/payments/webhook/inter
```

### 11.8 Pagamentos manuais

Métodos: `CASH_ON_DELIVERY`, `CARD_ON_DELIVERY`.

```
POST /payments/order/:orderId/manual   → configura método manual
PATCH /payments/:id/status             → confirma pagamento recebido
```

### 11.9 Aceite de termos

```
POST /auth/me/legal-acceptance
```

Comportamento **write-once**: se `termsAcceptedAt` já estiver preenchido, não sobrescreve a data original.

O backend **não bloqueia** login quando termos não foram aceitos. Controle de exibição fica no frontend.

---

## 12. Autenticação e autorização

### 12.1 Auth manual

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout               ← requer JWT
GET  /auth/me                   ← requer JWT
PATCH /auth/me                  ← requer JWT (fullName, phone, avatarUrl)
PATCH /auth/me/password         ← requer JWT
POST /auth/me/legal-acceptance  ← requer JWT
```

### 12.2 Google Login

```
POST /auth/google
Body: { "idToken": "GOOGLE_ID_TOKEN" }
```

Fluxo: valida idToken → busca por googleId → busca por email → cria ou atualiza customer. Salva `googleAvatarUrl`. Nunca sobrescreve `avatarUrl` customizado.

### 12.3 Roles e guards

```
JwtAuthGuard          — requer token válido
OptionalJwtAuthGuard  — aceita token ou guest (POST /orders)
RolesGuard            — verifica role
```

Promover para ADMIN em dev:

```sql
UPDATE customers SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### 12.4 Response de autenticação

Todos os endpoints de auth retornam `{ user, accessToken, refreshToken }`.

Campos do `user`:

```
id, customerCode, fullName, email, phone, cpf
avatarUrl, googleAvatarUrl
role, authProvider, isGuest, isActive
termsAcceptedAt, privacyAcceptedAt, termsVersion, privacyVersion
createdAt, updatedAt
```

---

## 13. Uploads

Pastas criadas automaticamente:

```
uploads/products/
uploads/store/
uploads/banners/
uploads/loyalty/
uploads/announcements/
uploads/customers/
```

Rotas:

```
POST   /uploads/products        → ADMIN, STAFF
POST   /uploads/store-logo      → ADMIN, STAFF
POST   /uploads/banners         → ADMIN, STAFF
POST   /uploads/loyalty-card    → ADMIN, STAFF
POST   /uploads/announcement    → ADMIN, STAFF
POST   /uploads/avatar          → qualquer usuário autenticado
DELETE /uploads/:folder/:filename → ADMIN, STAFF
```

Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`. Tamanho máximo: 5 MB.

Arquivos servidos via `/uploads/PASTA/ARQUIVO`.

---

## 14. Announcements

Anúncio único ativo exibido no topo do site.

```
GET  /announcements/active           ← público (retorna o anúncio ativo no momento)

GET    /admin/announcements          ← ADMIN
GET    /admin/announcements/:id      ← ADMIN
POST   /admin/announcements          ← ADMIN
PATCH  /admin/announcements/:id      ← ADMIN
DELETE /admin/announcements/:id      ← ADMIN
```

Campos: `imageUrl, startAt, endAt, isActive`.

---

## 15. Banners

```
GET /banners/active    ← público
GET /banners/:id       ← público

GET    /banners        ← ADMIN, STAFF
POST   /banners        ← ADMIN, STAFF
PATCH  /banners/:id    ← ADMIN, STAFF
PATCH  /banners/:id/status  ← ADMIN, STAFF
DELETE /banners/:id    ← ADMIN, STAFF
```

---

## 16. Promotions

```
GET /promotions/active                  ← público
GET /promotions/coupons/availability    ← público
POST /promotions/calculate              ← público (calcula desconto no carrinho)

GET    /promotions        ← ADMIN, STAFF
GET    /promotions/:id    ← ADMIN, STAFF
POST   /promotions        ← ADMIN, STAFF
PATCH  /promotions/:id    ← ADMIN, STAFF
PATCH  /promotions/:id/status ← ADMIN, STAFF
DELETE /promotions/:id    ← ADMIN, STAFF
```

---

## 17. Dashboard administrativo

Todas as rotas requerem `ADMIN`.

```
GET /dashboard/summary
GET /dashboard/orders
GET /dashboard/orders/pending   ← fila operacional (CREATED, AWAITING_PAYMENT, PAID, PREPARING, OUT_FOR_DELIVERY)
GET /dashboard/revenue
GET /dashboard/payments
GET /dashboard/customers
GET /dashboard/loyalty
```

---

## 18. Rotas completas

### Públicas

```
GET  /store/current
GET  /store/availability/duration-options

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

GET  /announcements/active
GET  /banners/active
GET  /banners/:id
GET  /promotions/active
GET  /promotions/coupons/availability
POST /promotions/calculate

POST /orders
GET  /orders/tracking/:orderNumber?phone=71999999999

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/google

POST /payments/webhook/inter
```

### Cliente autenticado

```
GET   /auth/me
PATCH /auth/me
POST  /auth/logout
PATCH /auth/me/password
POST  /auth/me/legal-acceptance

POST  /uploads/avatar

GET   /customers/me
PATCH /customers/me
GET   /customers/me/address/default
PUT   /customers/me/address/default
GET   /customers/me/addresses
POST  /customers/me/addresses
PATCH /customers/me/addresses/:addressId
DELETE /customers/me/addresses/:addressId

GET   /orders/my-orders
GET   /orders/my-orders/:id

GET   /loyalty/me

GET   /payments/my/order/:orderId
```

### Administrativas — Pedidos

```
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/status
PATCH  /orders/:id/payment-status
```

### Administrativas — Pagamentos

```
GET    /payments
GET    /payments/:id
GET    /payments/order/:orderId
GET    /payments/:id/pix
POST   /payments/order/:orderId/pix
POST   /payments/order/:orderId/manual
PATCH  /payments/:id/status
```

### Administrativas — Store

```
POST   /store/current
PATCH  /store/current
PATCH  /store/current/availability
DELETE /store/:id
```

### Administrativas — Cardápio

```
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
```

### Administrativas — Loyalty

```
GET    /admin/loyalty/settings
PATCH  /admin/loyalty/settings

GET    /admin/loyalty/customers
GET    /admin/loyalty/customers/:customerId
POST   /admin/loyalty/customers/:customerId/stamps/add
POST   /admin/loyalty/customers/:customerId/stamps/remove
POST   /admin/loyalty/customers/:customerId/rewards/redeem
```

### Administrativas — Customers

```
GET    /customers
GET    /customers/:id

GET    /admin/customers
GET    /admin/customers/:id
PATCH  /admin/customers/:id
PATCH  /admin/customers/:id/status
```

### Administrativas — Admin Users

```
GET    /admin/users
GET    /admin/users/:id
POST   /admin/users
PATCH  /admin/users/:id
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/status
PATCH  /admin/users/:id/permissions
DELETE /admin/users/:id
```

### Administrativas — Conteúdo

```
GET    /admin/announcements
GET    /admin/announcements/:id
POST   /admin/announcements
PATCH  /admin/announcements/:id
DELETE /admin/announcements/:id

GET    /banners
POST   /banners
PATCH  /banners/:id
PATCH  /banners/:id/status
DELETE /banners/:id

GET    /promotions
GET    /promotions/:id
POST   /promotions
PATCH  /promotions/:id
PATCH  /promotions/:id/status
DELETE /promotions/:id

POST   /uploads/products
POST   /uploads/store-logo
POST   /uploads/banners
POST   /uploads/loyalty-card
POST   /uploads/announcement
DELETE /uploads/:folder/:filename
```

---

## 19. Seed

O seed atual (`prisma/seed.ts`) cria apenas o mínimo estrutural. Produtos, categorias e zonas de entrega são cadastrados pelo admin pelo painel.

O seed cria:

```
1. Loja (upsert por slug)
2. Zona de retirada (ID fixo imutável)
3. Zonas de entrega por bairro (24 bairros de Salvador)
4. LoyaltySettings singleton
5. Backfill de customerCode para clientes existentes sem código
6. Admins: teste@teste.com / 123456 e fabricio@email.com / 123456
```

Rodar seed:

```bash
npx prisma db seed
```

---

## 20. Migrations

```bash
npx prisma migrate dev --name nome_da_migration
npx prisma generate
npx prisma validate
npx prisma format
npx prisma db seed
npx prisma studio
npx prisma migrate reset
```

Sequences criadas:

```sql
order_number_seq   → números de pedido PED-000001, PED-000002 ...
customer_code_seq  → códigos de cliente 0000001, 0000002 ...
```

---

## 21. Docker

```bash
docker compose up --build    # build + sobe tudo
docker compose up            # sobe sem rebuild
docker compose down          # para tudo
docker compose down -v       # para e apaga volumes (banco + uploads)
```

O `entrypoint.sh` executa na ordem:

1. `prisma migrate deploy` — aplica migrations pendentes
2. `prisma db seed` — se `RUN_SEED=true` (padrão)
3. `node dist/main` — sobe a API

A API fica disponível em `http://localhost:3131`.

Variáveis obrigatórias no `docker-compose.yml`:

```
JWT_SECRET, JWT_REFRESH_SECRET
GOOGLE_CLIENT_ID
INTER_CLIENT_ID, INTER_CLIENT_SECRET, INTER_PIX_KEY
```

Certificados mTLS (adicionar volume):

```yaml
volumes:
  - ./src/certs:/app/src/certs:ro
```

---

## 22. Fluxo completo de pedido

```
1. Cliente consulta loja, bairros, categorias, produtos, opções.
2. Frontend monta carrinho.
3. Cliente finaliza pedido (com ou sem login).
4. Backend cria customer guest (se sem login) ou usa autenticado.
5. Backend recalcula todos os valores.
6. Backend cria Order + OrderItems + Payment PENDING + OrderStatusHistory.
7. Se PIX → admin/frontend gera cobrança Inter.
8. Inter retorna txid, qrCode, copyPaste, expiresAt.
9. Cliente paga PIX.
10. Inter chama webhook → backend salva todos os detalhes do pagamento.
11. Ou: admin sincroniza manualmente via GET /payments/:id/pix.
12. Pedido vai para fila do dashboard.
13. Admin atualiza status: PAID → PREPARING → OUT_FOR_DELIVERY → DELIVERED.
14. Se DELIVERED ou PAID e cliente logado → carimbo adicionado na fidelidade.
```

---

## 23. Checklist de deploy

```
[ ] Remover arquivos de teste do git
[ ] .env fora do git
[ ] Certificados Inter fora do git
[ ] Trocar JWT_SECRET e JWT_REFRESH_SECRET
[ ] Preencher GOOGLE_CLIENT_ID
[ ] Preencher variáveis INTER_*
[ ] Configurar DNS público
[ ] Configurar CORS com domínio real (FRONTEND_URL)
[ ] Cadastrar webhook Inter: POST https://dominio/payments/webhook/inter
[ ] Montar certificados mTLS via volume
[ ] Validar HTTPS
[ ] Validar uploads persistentes (volume ou storage externo)
[ ] Validar backup do banco
[ ] Testar PIX end-to-end
[ ] Testar webhook (ngrok em staging)
[ ] Testar pedido guest
[ ] Testar pedido logado
[ ] Testar fidelidade
[ ] Validar usuário admin
```

---

## 24. Licença

Projeto privado pertencente ao **Se Liga no Açaí**.
