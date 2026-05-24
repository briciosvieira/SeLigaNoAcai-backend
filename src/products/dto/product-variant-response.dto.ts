import { ProductVariant } from '@prisma/client';

export class ProductVariantResponseDto {
  id: string;
  productId: string;
  name: string;
  price: string;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(variant: ProductVariant) {
    this.id = variant.id;
    this.productId = variant.productId;
    this.name = variant.name;
    this.price = variant.price.toString();
    this.isDefault = variant.isDefault;
    this.isActive = variant.isActive;
    this.displayOrder = variant.displayOrder;
    this.createdAt = variant.createdAt;
    this.updatedAt = variant.updatedAt;
  }
}