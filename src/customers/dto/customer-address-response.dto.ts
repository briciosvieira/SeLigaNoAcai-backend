import { CustomerAddress, DeliveryZone } from '@prisma/client';

export class CustomerAddressResponseDto {
  id: string;
  customerId: string;
  deliveryZoneId: string | null;
  label: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  referencePoint: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deliveryZone?: {
    id: string;
    neighborhood: string;
    city: string;
    state: string;
    deliveryFee: string | number;
    isAvailable: boolean;
  };

  constructor(address: CustomerAddress & { deliveryZone?: DeliveryZone | null }) {
    this.id = address.id;
    this.customerId = address.customerId;
    this.deliveryZoneId = address.deliveryZoneId;
    this.label = address.label;
    this.street = address.street;
    this.number = address.number;
    this.complement = address.complement;
    this.referencePoint = address.referencePoint;
    this.neighborhood = address.neighborhood;
    this.city = address.city;
    this.state = address.state;
    this.isDefault = address.isDefault;
    this.createdAt = address.createdAt;
    this.updatedAt = address.updatedAt;

    if (address.deliveryZone) {
      this.deliveryZone = {
        id: address.deliveryZone.id,
        neighborhood: address.deliveryZone.neighborhood,
        city: address.deliveryZone.city,
        state: address.deliveryZone.state,
        deliveryFee: address.deliveryZone.deliveryFee.toString(),
        isAvailable: address.deliveryZone.isAvailable,
      };
    }
  }
}
