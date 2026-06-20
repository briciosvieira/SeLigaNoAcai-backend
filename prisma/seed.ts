import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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

  const store = await prisma.store.upsert({
    where: {
      slug: 'se-liga-no-acai',
    },
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

  // Zona fixa de retirada na loja — ID imutável usado pelo backend
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

  const categoryAcai = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'acai',
      },
    },
    update: {
      name: 'Açaí',
      displayOrder: 1,
      isActive: true,
    },
    create: {
      storeId: store.id,
      name: 'Açaí',
      slug: 'acai',
      displayOrder: 1,
      isActive: true,
    },
  });

  const categoryCombos = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'combos',
      },
    },
    update: {
      name: 'Combos',
      displayOrder: 2,
      isActive: true,
    },
    create: {
      storeId: store.id,
      name: 'Combos',
      slug: 'combos',
      displayOrder: 2,
      isActive: true,
    },
  });

  const categoryOfertas = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'ofertas',
      },
    },
    update: {
      name: 'Ofertas',
      displayOrder: 3,
      isActive: true,
    },
    create: {
      storeId: store.id,
      name: 'Ofertas',
      slug: 'ofertas',
      displayOrder: 3,
      isActive: true,
    },
  });

  const monteSeuAcai = await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'monte-seu-acai',
      },
    },
    update: {
      categoryId: categoryAcai.id,
      name: 'Monte seu Açaí',
      description: 'Do tamanho e sabor que você quiser',
      emoji: '🫐',
      basePrice: '13.90',
      badge: 'Mais pedido',
      productType: 'CUSTOM',
      isFeatured: true,
      isOffer: false,
      isActive: true,
      displayOrder: 1,
    },
    create: {
      storeId: store.id,
      categoryId: categoryAcai.id,
      name: 'Monte seu Açaí',
      slug: 'monte-seu-acai',
      description: 'Do tamanho e sabor que você quiser',
      emoji: '🫐',
      basePrice: '13.90',
      badge: 'Mais pedido',
      productType: 'CUSTOM',
      isFeatured: true,
      isOffer: false,
      isActive: true,
      displayOrder: 1,
    },
  });

  const produtos = [
    {
      categoryId: categoryCombos.id,
      name: 'Combo Frutas',
      slug: 'combo-frutas',
      description: 'Açaí 500ml + morango + banana',
      emoji: '🍓',
      basePrice: '24.90',
      oldPrice: '29.38',
      badge: 'Oferta',
      productType: 'COMBO' as const,
      isFeatured: true,
      isOffer: true,
      displayOrder: 2,
    },
    {
      categoryId: categoryCombos.id,
      name: 'Combo Granola',
      slug: 'combo-granola',
      description: 'Açaí 500ml + granola + mel',
      emoji: '🌾',
      basePrice: '22.90',
      oldPrice: null,
      badge: null,
      productType: 'COMBO' as const,
      isFeatured: true,
      isOffer: false,
      displayOrder: 3,
    },
    {
      categoryId: categoryCombos.id,
      name: 'Combo Premium',
      slug: 'combo-premium',
      description: 'Açaí 700ml + frutas + granola',
      emoji: '👑',
      basePrice: '34.90',
      oldPrice: null,
      badge: 'Premium',
      productType: 'COMBO' as const,
      isFeatured: true,
      isOffer: false,
      displayOrder: 4,
    },
    {
      categoryId: categoryAcai.id,
      name: 'Açaí Família 1L',
      slug: 'acai-familia-1l',
      description: 'Perfeito para compartilhar',
      emoji: '🫐',
      basePrice: '32.00',
      oldPrice: null,
      badge: 'Família',
      productType: 'SIMPLE' as const,
      isFeatured: true,
      isOffer: false,
      displayOrder: 5,
    },
    {
      categoryId: categoryOfertas.id,
      name: 'Dupla Econômica',
      slug: 'dupla-economica',
      description: '2x Açaí 300ml com desconto',
      emoji: '🏷️',
      basePrice: '22.00',
      oldPrice: '25.90',
      badge: '-15%',
      productType: 'COMBO' as const,
      isFeatured: false,
      isOffer: true,
      displayOrder: 6,
    },
    {
      categoryId: categoryOfertas.id,
      name: 'Combo Chocolate',
      slug: 'combo-chocolate',
      description: 'Açaí 500ml + calda + Oreo',
      emoji: '🍫',
      basePrice: '26.90',
      oldPrice: '29.90',
      badge: '-10%',
      productType: 'COMBO' as const,
      isFeatured: false,
      isOffer: true,
      displayOrder: 7,
    },
  ];

  for (const product of produtos) {
    await prisma.product.upsert({
      where: {
        storeId_slug: {
          storeId: store.id,
          slug: product.slug,
        },
      },
      update: {
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        emoji: product.emoji,
        basePrice: product.basePrice,
        oldPrice: product.oldPrice,
        badge: product.badge,
        productType: product.productType,
        isFeatured: product.isFeatured,
        isOffer: product.isOffer,
        isActive: true,
        displayOrder: product.displayOrder,
      },
      create: {
        storeId: store.id,
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        emoji: product.emoji,
        basePrice: product.basePrice,
        oldPrice: product.oldPrice,
        badge: product.badge,
        productType: product.productType,
        isFeatured: product.isFeatured,
        isOffer: product.isOffer,
        isActive: true,
        displayOrder: product.displayOrder,
      },
    });
  }

  const variants = [
    ['300ml', '13.90', false, 1],
    ['500ml', '18.90', true, 2],
    ['700ml', '24.90', false, 3],
    ['1 Litro', '32.00', false, 4],
  ] as const;

  for (const [name, price, isDefault, displayOrder] of variants) {
    await prisma.productVariant.upsert({
      where: {
        productId_name: {
          productId: monteSeuAcai.id,
          name,
        },
      },
      update: {
        price,
        isDefault,
        isActive: true,
        displayOrder,
      },
      create: {
        productId: monteSeuAcai.id,
        name,
        price,
        isDefault,
        isActive: true,
        displayOrder,
      },
    });
  }

  const saborBase = await prisma.optionGroup.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'sabor-base',
      },
    },
    update: {
      name: 'Sabor da base',
      selectionType: 'SINGLE',
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      isActive: true,
      displayOrder: 1,
    },
    create: {
      storeId: store.id,
      name: 'Sabor da base',
      slug: 'sabor-base',
      selectionType: 'SINGLE',
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      isActive: true,
      displayOrder: 1,
    },
  });

  const frutas = await prisma.optionGroup.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'frutas',
      },
    },
    update: {
      name: 'Frutas',
      selectionType: 'MULTIPLE',
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      isActive: true,
      displayOrder: 2,
    },
    create: {
      storeId: store.id,
      name: 'Frutas',
      slug: 'frutas',
      selectionType: 'MULTIPLE',
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      isActive: true,
      displayOrder: 2,
    },
  });

  const complementos = await prisma.optionGroup.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'complementos',
      },
    },
    update: {
      name: 'Complementos',
      selectionType: 'MULTIPLE',
      minSelected: 0,
      maxSelected: 6,
      isRequired: false,
      isActive: true,
      displayOrder: 3,
    },
    create: {
      storeId: store.id,
      name: 'Complementos',
      slug: 'complementos',
      selectionType: 'MULTIPLE',
      minSelected: 0,
      maxSelected: 6,
      isRequired: false,
      isActive: true,
      displayOrder: 3,
    },
  });

  const docesCoberturas = await prisma.optionGroup.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'doces-coberturas',
      },
    },
    update: {
      name: 'Doces e coberturas',
      selectionType: 'MULTIPLE',
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      isActive: true,
      displayOrder: 4,
    },
    create: {
      storeId: store.id,
      name: 'Doces e coberturas',
      slug: 'doces-coberturas',
      selectionType: 'MULTIPLE',
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      isActive: true,
      displayOrder: 4,
    },
  });

  const optionsByGroup = [
    {
      group: saborBase,
      options: [
        ['Açaí Puro', 'Original da casa', '🫐', '0.00', 1],
        ['Açaí com Chocolate', 'Batido com cacau', '🍫', '0.00', 2],
        ['Açaí com Morango', 'Batido com morango', '🍓', '0.00', 3],
        ['Açaí com Amendoim', 'Batido com amendoim', '🥜', '0.00', 4],
      ],
    },
    {
      group: frutas,
      options: [
        ['Morango', null, '🍓', '0.00', 1],
        ['Banana', null, '🍌', '0.00', 2],
        ['Kiwi', null, '🥝', '0.00', 3],
        ['Uva', null, '🍇', '0.00', 4],
        ['Manga', null, '🥭', '0.00', 5],
        ['Pêssego', null, '🍑', '0.00', 6],
      ],
    },
    {
      group: complementos,
      options: [
        ['Granola', null, '🌾', '0.00', 1],
        ['Leite condensado', null, '🥛', '0.00', 2],
        ['Creme de ninho', null, '🍦', '0.00', 3],
        ['Amendoim triturado', null, '🥜', '0.00', 4],
        ['Confeito colorido', null, '🎨', '0.00', 5],
        ['Castanha', null, '🌰', '0.00', 6],
      ],
    },
    {
      group: docesCoberturas,
      options: [
        ['Calda de chocolate', null, '🍫', '0.00', 1],
        ['Calda de caramelo', null, '🍮', '0.00', 2],
        ['Calda frutas vermelhas', null, '🫐', '0.00', 3],
        ['Paçoca', null, '🍬', '0.00', 4],
        ['Biscoito Oreo', null, '🍪', '0.00', 5],
        ['Granulado', null, '🍩', '0.00', 6],
      ],
    },
  ] as const;

  for (const groupData of optionsByGroup) {
    for (const [
      name,
      description,
      emoji,
      additionalPrice,
      displayOrder,
    ] of groupData.options) {
      await prisma.option.upsert({
        where: {
          optionGroupId_name: {
            optionGroupId: groupData.group.id,
            name,
          },
        },
        update: {
          description,
          emoji,
          additionalPrice,
          isActive: true,
          displayOrder,
        },
        create: {
          optionGroupId: groupData.group.id,
          name,
          description,
          emoji,
          additionalPrice,
          isActive: true,
          displayOrder,
        },
      });
    }
  }

  const productGroups = [
    {
      group: saborBase,
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      displayOrder: 1,
    },
    {
      group: frutas,
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      displayOrder: 2,
    },
    {
      group: complementos,
      minSelected: 0,
      maxSelected: 6,
      isRequired: false,
      displayOrder: 3,
    },
    {
      group: docesCoberturas,
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      displayOrder: 4,
    },
  ];

  for (const productGroup of productGroups) {
    await prisma.productOptionGroup.upsert({
      where: {
        productId_optionGroupId: {
          productId: monteSeuAcai.id,
          optionGroupId: productGroup.group.id,
        },
      },
      update: {
        minSelected: productGroup.minSelected,
        maxSelected: productGroup.maxSelected,
        isRequired: productGroup.isRequired,
        displayOrder: productGroup.displayOrder,
      },
      create: {
        productId: monteSeuAcai.id,
        optionGroupId: productGroup.group.id,
        minSelected: productGroup.minSelected,
        maxSelected: productGroup.maxSelected,
        isRequired: productGroup.isRequired,
        displayOrder: productGroup.displayOrder,
      },
    });
  }

  const existingLoyaltyProgram = await prisma.loyaltyProgram.findFirst({
    where: {
      storeId: store.id,
      name: 'Cartão Fidelidade',
    },
  });

  if (existingLoyaltyProgram) {
    await prisma.loyaltyProgram.update({
      where: {
        id: existingLoyaltyProgram.id,
      },
      data: {
        purchasesRequired: 10,
        minimumOrderAmount: '16.00',
        validityMonths: 10,
        rewardDescription:
          'Complete 10 compras a partir de R$ 16,00 e ganhe um presente dourado.',
        isActive: true,
      },
    });
  } else {
    await prisma.loyaltyProgram.create({
      data: {
        storeId: store.id,
        name: 'Cartão Fidelidade',
        purchasesRequired: 10,
        minimumOrderAmount: '16.00',
        validityMonths: 10,
        rewardDescription:
          'Complete 10 compras a partir de R$ 16,00 e ganhe um presente dourado.',
        isActive: true,
      },
    });
  }

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
