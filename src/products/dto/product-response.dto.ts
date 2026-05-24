import { Product } from '@prisma/client';

export class ProductResponseDto {
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  imageUrl: string | null;
  basePrice: string;
  oldPrice: string | null;
  badge: string | null;
  productType: string;
  isFeatured: boolean;
  isOffer: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(product: Product) {
    this.id = product.id;
    this.storeId = product.storeId;
    this.categoryId = product.categoryId;
    this.name = product.name;
    this.slug = product.slug;
    this.description = product.description;
    this.emoji = product.emoji;
    this.imageUrl = product.imageUrl;
    this.basePrice = product.basePrice.toString();
    this.oldPrice = product.oldPrice ? product.oldPrice.toString() : null;
    this.badge = product.badge;
    this.productType = product.productType;
    this.isFeatured = product.isFeatured;
    this.isOffer = product.isOffer;
    this.isActive = product.isActive;
    this.displayOrder = product.displayOrder;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
