import { Prisma } from '@prisma/client';
import { OptionResponseDto } from './option-response.dto';

type OptionGroupWithOptions = Prisma.OptionGroupGetPayload<{
  include: {
    options: true;
  };
}>;

export class OptionGroupResponseDto {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  selectionType: string;
  minSelected: number;
  maxSelected: number | null;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  options: OptionResponseDto[];

  constructor(group: OptionGroupWithOptions) {
    this.id = group.id;
    this.storeId = group.storeId;
    this.name = group.name;
    this.slug = group.slug;
    this.selectionType = group.selectionType;
    this.minSelected = group.minSelected;
    this.maxSelected = group.maxSelected;
    this.isRequired = group.isRequired;
    this.isActive = group.isActive;
    this.displayOrder = group.displayOrder;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
    this.options = group.options.map((option) => new OptionResponseDto(option));
  }
}