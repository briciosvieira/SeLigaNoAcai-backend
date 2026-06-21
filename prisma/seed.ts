import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Must match src/commom/constants/pickup.constants.ts
const PICKUP_DELIVERY_ZONE_ID = '11111111-1111-4111-8111-111111111111';
const PICKUP_DELIVERY_ZONE_NAME = 'Retirada na loja';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não encontrada no arquivo .env');
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed do Se Liga no Açaí...');

  // Loja
  const store = await prisma.store.upsert({
    where: { slug: 'se-liga-no-acai' },
    update: {
      name: 'Se Liga no Açaí',
      whatsappNumber: '55719999999',
      ifoodUrl: 'https://www.ifood.com.br/delivery/salvador-ba/se-liga-no-acai',
      pixKey: '00.000.000/0001-00',
      pixKeyType: 'CNPJ',
      rating: '4.90',
      minDeliveryMinutes: 12,
      maxDeliveryMinutes: 27,
      minimumOrderAmount: '16.00',
      isActive: true,
    },
    create: {
      name: 'Se Liga no Açaí',
      slug: 'se-liga-no-acai',
      whatsappNumber: '55719999999',
      ifoodUrl: 'https://www.ifood.com.br/delivery/salvador-ba/se-liga-no-acai',
      pixKey: '00.000.000/0001-00',
      pixKeyType: 'CNPJ',
      rating: '4.90',
      minDeliveryMinutes: 12,
      maxDeliveryMinutes: 27,
      minimumOrderAmount: '16.00',
      isActive: true,
    },
  });

  // Zona fixa de retirada na loja - ID imutavel usado pelo backend
  await prisma.deliveryZone.upsert({
    where: { id: PICKUP_DELIVERY_ZONE_ID },
    update: {
      neighborhood: PICKUP_DELIVERY_ZONE_NAME,
      city: 'Salvador',
      state: 'BA',
      deliveryFee: 0,
      isAvailable: true,
    },
    create: {
      id: PICKUP_DELIVERY_ZONE_ID,
      storeId: store.id,
      neighborhood: PICKUP_DELIVERY_ZONE_NAME,
      city: 'Salvador',
      state: 'BA',
      deliveryFee: 0,
      isAvailable: true,
    },
  });

  // Zonas de entrega por bairro
  const bairros = [
    ['Abaeté', '5.00'],
    ['Aeroporto', '4.00'],
    ['Alto do Coqueirinho', '6.00'],
    ['Bairro da Paz', '5.00'],
    ['Dorival Caymi', '4.00'],
    ['Estrada Velha do Aeroporto', '5.00'],
    ['Excombatentes', '4.00'],
    ['Farol de Itapuã', '3.00'],
    ['Itinga', '7.00'],
    ['Jardim das Margaridas', '8.00'],
    ['Km 17', '7.00'],
    ['Lauro de Freitas', '9.00'],
    ['Mussurunga 1', '6.00'],
    ['Mussurunga 2', '6.00'],
    ['Nova Brasília de Itapuã', '3.00'],
    ['Nova Conquista', '7.00'],
    ['Orlando Gomes', '8.00'],
    ['Parque São Cristóvão', '7.00'],
    ['Pituaçu', '6.00'],
    ['Praia do Flamengo', '5.00'],
    ['São Cristóvão', '6.00'],
    ['Stella Mares', '4.00'],
    ['Tokaia', '4.00'],
    ['Vila Militar', '5.00'],
  ];

  for (const [index, [neighborhood, deliveryFee]] of bairros.entries()) {
    await prisma.deliveryZone.upsert({
      where: {
        storeId_neighborhood_city_state: {
          storeId: store.id,
          neighborhood,
          city: 'Salvador',
          state: 'BA',
        },
      },
      update: {
        deliveryFee,
        isAvailable: true,
        displayOrder: index + 1,
      },
      create: {
        storeId: store.id,
        neighborhood,
        city: 'Salvador',
        state: 'BA',
        deliveryFee,
        isAvailable: true,
        displayOrder: index + 1,
      },
    });
  }

  // Configuracoes do programa de fidelidade
  await prisma.loyaltySettings.upsert({
    where: { id: '11111111-2222-4333-8444-555555555555' },
    update: {},
    create: {
      id: '11111111-2222-4333-8444-555555555555',
      isEnabled: true,
      title: 'Cartão Fidelidade',
      description: 'Complete 10 compras acima de R$ 16,00 e ganhe 1 brinde.',
      minOrderAmount: 16,
      stampsRequired: 10,
      rewardDescription: 'Ganhe 1 açaí grátis',
    },
  });

  // Backfill customerCode — clientes sem código
  const customersWithoutCode = await prisma.customer.findMany({
    where: { customerCode: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (customersWithoutCode.length > 0) {
    console.log(`Backfill customerCode: ${customersWithoutCode.length} clientes sem código.`);

    for (const c of customersWithoutCode) {
      let assigned = false;
      let attempts = 0;

      while (!assigned && attempts < 100) {
        const last = await prisma.customer.findFirst({
          where: { customerCode: { not: null } },
          orderBy: { customerCode: 'desc' },
          select: { customerCode: true },
        });

        const next = String((last?.customerCode ? Number(last.customerCode) : 0) + 1).padStart(7, '0');
        const conflict = await prisma.customer.findUnique({ where: { customerCode: next } });

        if (!conflict) {
          await prisma.customer.update({ where: { id: c.id }, data: { customerCode: next } });
          assigned = true;
        }

        attempts++;
      }
    }

    console.log('Backfill customerCode concluído.');
  }

  // Admins — upsert por e-mail, nunca sobrescreve senha existente
  const adminUsers = [
    { email: 'teste@teste.com', fullName: 'Admin Teste' },
    { email: 'fabricio@email.com', fullName: 'Fabricio Vieira' },
  ];

  const passwordHash = await bcrypt.hash('123456', 10);

  for (const admin of adminUsers) {
    const existing = await prisma.customer.findUnique({
      where: { email: admin.email },
    });

    if (!existing) {
      const last = await prisma.customer.findFirst({
        where: { customerCode: { not: null } },
        orderBy: { customerCode: 'desc' },
        select: { customerCode: true },
      });
      const adminCode = String((last?.customerCode ? Number(last.customerCode) : 0) + 1).padStart(7, '0');

      await prisma.customer.create({
        data: {
          email: admin.email,
          fullName: admin.fullName,
          authProvider: 'MANUAL',
          role: 'ADMIN',
          isGuest: false,
          isActive: true,
          passwordHash,
          customerCode: adminCode,
        },
      });
      console.log(`Admin criado: ${admin.email} (código: ${adminCode})`);
    } else {
      console.log(`Admin já existe (ignorado): ${admin.email}`);
    }
  }

  console.log('Seed finalizado com sucesso.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Erro ao executar seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
