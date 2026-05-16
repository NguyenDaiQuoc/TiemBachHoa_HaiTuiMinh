import { env } from "../../shared/config/env.js";

export interface PaymentProvider {
  createPayment(amount: number, orderId: string): Promise<{ success: boolean; url?: string; error?: string }>;
}

export class PaymentOrchestrator {
  static async createPayment(providerName: string, amount: number, orderId: string) {
    if (!env.ENABLE_LIVE_PAYMENTS) {
      console.log(`[FEATURE FLAG] Live payments disabled. Mocking ${providerName} for order ${orderId}`);
      return { success: true, url: `/checkout/success?orderId=${orderId}&mock=true` };
    }
    
    // In the future, load the actual provider adapter (ZaloPay, VNPay, Momo)
    // For now, even if ENABLE_LIVE_PAYMENTS is true, we need the logic
    console.warn(`[STUB] Live payment execution for ${providerName} requested but not fully implemented.`);
    return { success: false, error: "Live payment integration temporarily unavailable." };
  }
}
