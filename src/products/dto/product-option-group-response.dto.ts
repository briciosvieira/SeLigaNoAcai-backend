import { Prisma } from '@prisma/client';

type ProductOptionGroupWithGroup = Prisma.ProductOptionGroupGetPayload<{
  include: {
    optionGroup: {
      include: {
        options: true;
      };
    };
  };
}>;

export class ProductOptionGroupResponseDto {
  id: string;
  productId: string;
  optionGroupId: string;
  minSelected: number | null;
  maxSelected: number | null;
  isRequired: boolean | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  optionGroup: {
    id: string;
    name: string;
    slug: string;
    selectionType: string;
    minSelected: number;
    maxSelected: number | null;
    isRequired: boolean;
    isActive: boolean;
    displayOrder: number;
    options: {
      id: string;
      name: string;
      description: string | null;
      emoji: string | null;
      additionalPrice: string;
      isActive: boolean;
      displayOrder: number;
    }[];
  };

  constructor(productOptionGroup: ProductOptionGroupWithGroup) {
    this.id = productOptionGroup.id;
    this.productId = productOptionGroup.productId;
    this.optionGroupId = productOptionGroup.optionGroupId;
    this.minSelected = productOptionGroup.minSelected;
    this.maxSelected = productOptionGroup.maxSelected;
    this.isRequired = productOptionGroup.isRequired;
    this.displayOrder = productOptionGroup.displayOrder;
    this.createdAt = productOptionGroup.createdAt;
    this.updatedAt = productOptionGroup.updatedAt;

    this.optionGroup = {
      id: productOptionGroup.optionGroup.id,
      name: productOptionGroup.optionGroup.name,
      slug: productOptionGroup.optionGroup.slug,
      selectionType: productOptionGroup.optionGroup.selectionType,
      minSelected: productOptionGroup.optionGroup.minSelected,
      maxSelected: productOptionGroup.optionGroup.maxSelected,
      isRequired: productOptionGroup.optionGroup.isRequired,
      isActive: productOptionGroup.optionGroup.isActive,
      displayOrder: productOptionGroup.optionGroup.displayOrder,
      options: productOptionGroup.optionGroup.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        emoji: option.emoji,
        additionalPrice: option.additionalPrice.toString(),
        isActive: option.isActive,
        displayOrder: option.displayOrder,
      })),
    };
  }
}