zar a estrutura e as regras.

README_SE_LIGA_BACKEND.md
# Se Liga no Acai - Backend

API RESTful desenvolvida com **NestJS**, **Prisma**, **PostgreSQL** e **TypeScript** para gerenciamento completo de uma loja de acai: cardapio, bairros de entrega, pedidos, pagamentos, fidelidade, notificacoes via WhatsApp e dashboard administrativo.

Este backend foi pensado para trabalhar com um frontend em **Vite/React** ou **Next.js**, consumindo uma API padronizada.

---

## Tecnologias

- NestJS
- TypeScript
- Prisma ORM 7+
- PostgreSQL
- Prisma PostgreSQL Adapter
- JWT
- Passport JWT
- Swagger
- Docker
- bcrypt
- class-validator
- class-transformer
- helmet
- compression
- cookie-parser

---

## Decisoes de Arquitetura

### Prisma como camada de banco

Como o projeto utiliza **Prisma**, nao usaremos `entities/` no padrao do TypeORM para mapear tabelas.

O mapeamento do banco fica no arquivo:

```txt
prisma/schema.prisma
```

O Prisma gera automaticamente os tipos e o client em:

```ts
import { PrismaClient } from '@prisma/client';
```

### Sem `@Global()` no PrismaModule

O `PrismaModule` **nao sera global**.

Cada modulo que precisar acessar o banco devera importar explicitamente o `PrismaModule`.

Isso deixa a arquitetura mais clara, mais segura e mais facil de testar.

### Response DTO para saida da API

Mesmo usando Prisma, nao retornaremos necessariamente os objetos crus do banco.

Para uma API mais profissional, usaremos:

```txt
DTOs de entrada    -> validam dados recebidos
Response DTOs      -> padronizam dados retornados
ApiResponse<T>     -> padroniza o formato geral da resposta
```

Exemplo de resposta padrao:

```json
{
  "data": {
    "id": "uuid",
    "name": "Se Liga no Acai"
  }
}
```

---

## Estrutura de Pastas

```txt
backend/
 ├── src/
 │   ├── auth/
 │   │   ├── dto/
 │   │   │   ├── login.dto.ts
 │   │   │   ├── register.dto.ts
 │   │   │   ├── google-login.dto.ts
 │   │   │   └── guest-login.dto.ts
 │   │   ├── guards/
 │   │   │   ├── jwt-auth.guard.ts
 │   │   │   └── roles.guard.ts
 │   │   ├── strategies/
 │   │   │   └── jwt.strategy.ts
 │   │   ├── auth.controller.ts
 │   │   ├── auth.module.ts
 │   │   └── auth.service.ts
 │   │
 │   ├── prisma/
 │   │   ├── prisma.module.ts
 │   │   └── prisma.service.ts
 │   │
 │   ├── stores/
 │   │   ├── dto/
 │   │   │   ├── create-store.dto.ts
 │   │   │   ├── update-store.dto.ts
 │   │   │   └── store-response.dto.ts
 │   │   ├── stores.controller.ts
 │   │   ├── stores.module.ts
 │   │   └── stores.service.ts
 │   │
 │   ├── customers/
 │   │   ├── dto/
 │   │   │   ├── create-customer.dto.ts
 │   │   │   ├── update-customer.dto.ts
 │   │   │   ├── update-customer-address.dto.ts
 │   │   │   └── customer-response.dto.ts
 │   │   ├── customers.controller.ts
 │   │   ├── customers.module.ts
 │   │   └── customers.service.ts
 │   │
 │   ├── delivery-zones/
 │   │   ├── dto/
 │   │   │   ├── create-delivery-zone.dto.ts
 │   │   │   ├── update-delivery-zone.dto.ts
 │   │   │   └── delivery-zone-response.dto.ts
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
 │   │   │   ├── create-product.dto.ts
 │   │   │   ├── update-product.dto.ts
 │   │   │   ├── create-product-variant.dto.ts
 │   │   │   ├── update-product-variant.dto.ts
 │   │   │   └── product-response.dto.ts
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
 │   │   │   └── option-group-response.dto.ts
 │   │   ├── options.controller.ts
 │   │   ├── options.module.ts
 │   │   └── options.service.ts
 │   │
 │   ├── orders/
 │   │   ├── dto/
 │   │   │   ├── create-order.dto.ts
 │   │   │   ├── create-order-item.dto.ts
 │   │   │   ├── create-order-item-option.dto.ts
 │   │   │   ├── update-order-status.dto.ts
 │   │   │   ├── filter-orders.dto.ts
 │   │   │   └── order-response.dto.ts
 │   │   ├── orders.controller.ts
 │   │   ├── orders.module.ts
 │   │   └── orders.service.ts
 │   │
 │   ├── payments/
 │   │   ├── dto/
 │   │   │   ├── create-payment.dto.ts
 │   │   │   ├── pix-payment.dto.ts
 │   │   │   ├── card-payment.dto.ts
 │   │   │   └── payment-response.dto.ts
 │   │   ├── payments.controller.ts
 │   │   ├── payments.module.ts
 │   │   └── payments.service.ts
 │   │
 │   ├── loyalty/
 │   │   ├── dto/
 │   │   │   ├── create-loyalty-program.dto.ts
 │   │   │   ├── update-loyalty-program.dto.ts
 │   │   │   ├── redeem-reward.dto.ts
 │   │   │   └── loyalty-response.dto.ts
 │   │   ├── loyalty.controller.ts
 │   │   ├── loyalty.module.ts
 │   │   └── loyalty.service.ts
 │   │
 │   ├── notifications/
 │   │   ├── dto/
 │   │   │   ├── send-whatsapp.dto.ts
 │   │   │   └── notification-response.dto.ts
 │   │   ├── notifications.controller.ts
 │   │   ├── notifications.module.ts
 │   │   └── notifications.service.ts
 │   │
 │   ├── dashboard/
 │   │   ├── dto/
 │   │   │   └── dashboard-filter.dto.ts
 │   │   ├── dashboard.controller.ts
 │   │   ├── dashboard.module.ts
 │   │   └── dashboard.service.ts
 │   │
 │   ├── common/
 │   │   ├── decorators/
 │   │   │   ├── current-user.decorator.ts
 │   │   │   └── roles.decorator.ts
 │   │   ├── enums/
 │   │   │   ├── auth-provider.enum.ts
 │   │   │   ├── order-status.enum.ts
 │   │   │   ├── payment-method.enum.ts
 │   │   │   └── payment-status.enum.ts
 │   │   ├── filters/
 │   │   │   └── http-exception.filter.ts
 │   │   ├── guards/
 │   │   │   └── roles.guard.ts
 │   │   ├── interceptors/
 │   │   │   └── response.interceptor.ts
 │   │   ├── interfaces/
 │   │   │   └── api-response.interface.ts
 │   │   ├── pipes/
 │   │   │   └── validation.pipe.ts
 │   │   └── utils/
 │   │       ├── api-response.util.ts
 │   │       ├── currency.util.ts
 │   │       ├── order-number.util.ts
 │   │       ├── customer-code.util.ts
 │   │       └── slug.util.ts
 │   │
 │   ├── app.module.ts
 │   └── main.ts
 │
 ├── prisma/
 │   ├── schema.prisma
 │   ├── migrations/
 │   └── seed.ts
 │
 ├── test/
 │   └── app.e2e-spec.ts
 │
 ├── .env
 ├── .env.example
 ├── .gitignore
 ├── docker-compose.yml
 ├── Dockerfile
 ├── package.json
 ├── prisma.config.ts
 ├── tsconfig.json
 ├── nest-cli.json
 └── README.md
```

---

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/SEU_DB?schema=public"

PORT=3000
NODE_ENV=development

JWT_SECRET="sua_chave_jwt"
JWT_EXPIRES_IN="7d"

APP_NAME="Se Liga no Acai"
APP_URL="http://localhost:3000"

FRONTEND_URL="http://localhost:5173"

WHATSAPP_NUMBER="557199999991"

PIX_KEY="00.000.000/0001-00"
PIX_KEY_TYPE="CNPJ"
```

> O arquivo `.env` precisa ficar na raiz do projeto, no mesmo nivel do `package.json`.

---

## Docker

`docker-compose.yml`:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: NOME-COINTAINER-postgres
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: BANCO
      POSTGRES_USER: SENHA
      POSTGRES_PASSWORD: SENHA
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Subir o banco:

```bash
docker-compose up -d
```

---

## Instalacao

### Dependencias principais

```bash
npm install @nestjs/config
npm install @nestjs/swagger swagger-ui-express
npm install class-validator class-transformer
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/jwt
npm install bcrypt
npm install helmet
npm install compression
npm install cookie-parser
```

### Prisma 7+ e PostgreSQL Adapter

```bash
npm install -D prisma@latest
npm install @prisma/client@latest
npm install dotenv
npm install @prisma/adapter-pg pg
```

### Seed em TypeScript

```bash
npm install -D tsx
```

### Tipagens

```bash
npm install -D @types/passport-jwt
npm install -D @types/bcrypt
npm install -D @types/cookie-parser
npm install -D @types/compression
npm install -D @types/pg
```

---

## Prisma

### Inicializar Prisma

```bash
npx prisma init
```
---

## Migrations

Criar migration inicial:

```bash
npx prisma migrate dev --name init
```

Gerar o Prisma Client:

```bash
npx prisma generate
```

Abrir Prisma Studio:

```bash
npx prisma studio
```

Executar seed:

```bash
npx prisma db seed
```

### Observacao sobre drift

Se durante o desenvolvimento ocorrer `Drift detected`, e ainda nao houver dados importantes, o caminho mais limpo e:

```bash
npx prisma migrate reset
```

Ou, se for necessario recomecar completamente:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Depois recrie as migrations com cuidado.

---

## Seed

O seed serve para popular o banco com dados iniciais da aplicacao.

O arquivo deve ficar em:

```txt
prisma/seed.ts
```

Ele deve criar ou atualizar:

```txt
.....
```

O seed nao substitui o banco. Ele apenas alimenta o banco.

Fluxo:

```txt
seed.ts
  ↓
npx prisma db seed
  ↓
PostgreSQL
  ↓
Backend consulta com Prisma
```

---

## Rotas da API

### Auth

```txt
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/guest
GET  /auth/me
```

### Stores

```txt
GET   /stores/current
PATCH /stores/:id
```

### Delivery Zones

```txt
GET    /delivery-zones
GET    /delivery-zones/available
POST   /delivery-zones
PATCH  /delivery-zones/:id
DELETE /delivery-zones/:id
```

### Categories

```txt
GET    /categories
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
```

### Products

```txt
GET    /products
GET    /products/featured
GET    /products/offers
GET    /products/:id
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

### Options

```txt
GET    /options/groups
POST   /options/groups
PATCH  /options/groups/:id
DELETE /options/groups/:id

POST   /options/groups/:groupId/options
PATCH  /options/:id
DELETE /options/:id
```

### Orders

```txt
GET   /orders
GET   /orders/my-orders
GET   /orders/:id
POST  /orders
PATCH /orders/:id/status
```

### Payments

```txt
POST /payments/pix
POST /payments/card
POST /payments/manual
GET  /payments/:orderId
```

### Loyalty

```txt
GET  /loyalty/me
GET  /loyalty/customer/:customerId
POST /loyalty/redeem
```

### Dashboard

```txt
GET /dashboard/summary
GET /dashboard/orders
GET /dashboard/products
GET /dashboard/customers
```

---

## Fluxo Completo do Pedido

```txt
1. Cliente acessa o frontend.
2. Frontend chama POST /auth/guest ou POST /auth/google.
3. Frontend recebe JWT.
4. Frontend carrega:
   GET /stores/current
   GET /delivery-zones/available
   GET /categories
   GET /products
   GET /options/groups
5. Cliente seleciona o bairro.
6. Cliente monta o acai.
7. Frontend calcula preco apenas para exibicao.
8. Cliente adiciona item ao carrinho.
9. Cliente escolhe forma de pagamento.
10. Checkout coleta nome, telefone e endereco.
11. Frontend envia POST /orders.
12. Backend recalcula todos os valores pelo banco.
13. Backend cria order, order_items, order_item_options e payment.
14. Backend gera whatsappLink.
15. Frontend exibe confirmacao.
```

---

## Regras Importantes

### Preco

O frontend pode calcular preco para exibicao, mas o backend sempre deve recalcular:

```txt
variant.price
option.additionalPrice
deliveryZone.deliveryFee
store.minimumOrderAmount
```

### Carrinho

Na primeira versao, o carrinho fica no frontend.

```txt
Zustand + localStorage
```

Nao sera criada tabela de carrinho inicialmente.

### Pedido

O pedido so e salvo no banco quando o cliente finaliza o checkout.

### Pagamento

Primeira versao:

```txt
PIX                -> manual/pendente
Cartao online      -> futuro gateway
Cartao na entrega  -> manual
Dinheiro           -> manual com troco
```

### Fidelidade

A fidelidade sera atualizada quando o pedido mudar para:

```txt
DELIVERED
```

Regra:

```txt
Se total >= R$ 16,00:
    soma 1 carimbo

Se completar 10 carimbos:
    libera recompensa
```

Visitantes nao recebem `customerCode`, mas podem ter pedidos vinculados ao UUID temporario.

---

## WhatsApp

O `NotificationsService` monta o link:

```txt
https://wa.me/NUMERO?text=MENSAGEM
```

Exemplo de mensagem:

```txt
*Novo Pedido - Se Liga no Acai*

Cliente: Layza Santos
Codigo: 0000001
Telefone: 71999990000
Bairro: Stella Mares

Endereco: Rua das Flores, 123 - Apto 2
Referencia: Proximo ao mercado

Itens:
1x Monte seu Acai 500ml
   -> Acai Puro · Morango · Granola · Leite condensado

Subtotal: R$ 18,90
Frete: R$ 4,00
Total: R$ 22,90
Pagamento: PIX
```

---

## Dashboard

Indicadores planejados:

```txt
Total de vendas
Quantidade de pedidos
Ticket medio
Produtos mais vendidos
Pedidos por status
Clientes fidelizados
Clientes cadastrados
Clientes visitantes
```

---

## Ordem de Desenvolvimento

```txt
01. PrismaModule
02. ConfigModule
03. Common: ApiResponse, utils, filters e interceptors
04. Stores
05. Delivery Zones
06. Categories
07. Products
08. Options
09. Customers
10. Auth Guest
11. JWT Strategy e Guard
12. Auth Google
13. Auth Register/Login
14. Payments
15. Notifications
16. Orders
17. Loyalty
18. Dashboard
19. Swagger
20. Integracao com frontend
```

---

## Ordem de Testes

```txt
GET  /stores/current
GET  /delivery-zones/available
GET  /categories
GET  /products
GET  /options/groups

POST /auth/guest
GET  /auth/me

POST /orders
GET  /orders/my-orders

PATCH /orders/:id/status

GET  /loyalty/me
```
---

## Licenca

Este projeto e de uso privado e pertence ao **Se Liga no Acai**.