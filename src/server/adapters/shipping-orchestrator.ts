import { env } from "../../shared/config/env.js";

export interface ShippingProvider {
  calculateRate(origin: string, destination: string, weight: number): Promise<{ rate: number; serviceId: string }>;
  createShipment(orderId: string, address: string): Promise<{ trackingNumber: string }>;
}

export class ShippingOrchestrator {
  static async calculateRate(providerName: string, destination: string, weight: number) {
    if (!env.ENABLE_LIVE_SHIPPING) {
      console.log(`[FEATURE FLAG] Live shipping calculation disabled. Mocking ${providerName} for ${destination}`);
      return { rate: 35000, serviceId: "mock-express" };
    }
    
    console.warn(`[STUB] Live shipping calculation for ${providerName} requested.`);
    return { rate: 0, error: "Live shipping integration temporarily unavailable." };
  }
}
