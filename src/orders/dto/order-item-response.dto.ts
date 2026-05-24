import { Prisma } from '@prisma/client';
import { OrderItemOptionResponseDto } from './order-item-option-response.dto';

type OrderItemWithOptions = Prisma.OrderItemGetPayload<{
  include: {
    options: true;
  };
}>;

export class OrderItemResponseDto {
  id: string;
  orderId: string;
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  optionsAmount: string;
  totalAmount: string;
  itemDescription: string | null;
  createdAt: Date;
  options: OrderItemOptionResponseDto[];

  constructor(item: OrderItemWithOptions) {
    this.id = item.id;
    this.orderId = item.orderId;
    this.productId = item.productId;
    this.productVariantId = item.productVariantId;
    this.productName = item.productName;
    this.variantName = item.variantName;
    this.quantity = item.quantity;
    this.unitPrice = item.unitPrice.toString();
    this.optionsAmount = item.optionsAmount.toString();
    this.totalAmount = item.totalAmount.toString();
    this.itemDescription = item.itemDescription;
    this.createdAt = item.createdAt;
    this.options = item.options.map(
      (option) => new OrderItemOptionResponseDto(option),
    );
  }
}
