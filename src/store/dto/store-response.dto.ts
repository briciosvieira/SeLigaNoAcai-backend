import { Store } from '@prisma/client';

export class StoreResponseDto {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
  ifoodUrl: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
  rating: string | null;
  minDeliveryMinutes: number | null;
  maxDeliveryMinutes: number | null;
  minimumOrderAmount: string;
  isActive: boolean;

  constructor(store: Store) {
    this.id = store.id;
    this.name = store.name;
    this.slug = store.slug;
    this.logoUrl = store.logoUrl;
    this.whatsappNumber = store.whatsappNumber;
    this.ifoodUrl = store.ifoodUrl;
    this.pixKey = store.pixKey;
    this.pixKeyType = store.pixKeyType;
    this.rating = store.rating ? store.rating.toString() : null;
    this.minDeliveryMinutes = store.minDeliveryMinutes;
    this.maxDeliveryMinutes = store.maxDeliveryMinutes;
    this.minimumOrderAmount = store.minimumOrderAmount.toString();
    this.isActive = store.isActive;
  }
}
