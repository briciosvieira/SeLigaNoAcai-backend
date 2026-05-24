import { Option } from '@prisma/client';

export class OptionResponseDto {
  id: string;
  optionGroupId: string;
  name: string;
  description: string | null;
  emoji: string | null;
  additionalPrice: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(option: Option) {
    this.id = option.id;
    this.optionGroupId = option.optionGroupId;
    this.name = option.name;
    this.description = option.description;
    this.emoji = option.emoji;
    this.additionalPrice = option.additionalPrice.toString();
    this.isActive = option.isActive;
    this.displayOrder = option.displayOrder;
    this.createdAt = option.createdAt;
    this.updatedAt = option.updatedAt;
  }
}
