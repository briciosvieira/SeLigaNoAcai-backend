import { OrderItemOption } from '@prisma/client';

export class OrderItemOptionResponseDto {
  id: string;
  orderItemId: string;
  optionGroupId: string | null;
  optionId: string | null;
  groupName: string;
  optionName: string;
  additionalPrice: string;
  createdAt: Date;

  constructor(option: OrderItemOption) {
    this.id = option.id;
    this.orderItemId = option.orderItemId;
    this.optionGroupId = option.optionGroupId;
    this.optionId = option.optionId;
    this.groupName = option.groupName;
    this.optionName = option.optionName;
    this.additionalPrice = option.additionalPrice.toString();
    this.createdAt = option.createdAt;
  }
}
