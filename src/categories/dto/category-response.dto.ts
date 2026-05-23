import { Category } from '@prisma/client';
export class CategoriesRespondeDto {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(categories: Category) {
    this.id = categories.id;
    this.storeId = categories.storeId;
    this.name = categories.name;
    this.slug = categories.slug;
    this.isActive = categories.isActive;
    this.displayOrder = categories.displayOrder;
    this.createdAt = categories.createdAt;
    this.updatedAt = categories.updatedAt;
  }
}
