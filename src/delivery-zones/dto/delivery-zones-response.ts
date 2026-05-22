import { DeliveryZone } from '@prisma/client';

export class DeliveryZonesResponseDto {
  id: string;
  storeId: string;
  neighborhood: string;
  city: string;
  state: string;
  deliveryFee: string;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(deliveryZone: DeliveryZone) {
    this.id = deliveryZone.id;
    this.storeId = deliveryZone.storeId;
    this.neighborhood = deliveryZone.neighborhood;
    this.city = deliveryZone.city;
    this.state = deliveryZone.state;
    this.deliveryFee = deliveryZone.deliveryFee.toString();
    this.isAvailable = deliveryZone.isAvailable;
    this.displayOrder = deliveryZone.displayOrder;
    this.createdAt = deliveryZone.createdAt;
    this.updatedAt = deliveryZone.updatedAt;
  }
}
