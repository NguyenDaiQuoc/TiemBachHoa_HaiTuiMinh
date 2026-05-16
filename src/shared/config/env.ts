import 'dotenv/config';
import { z } from 'zod';

/**
 * Server-side Environment Schema
 * These variables are ONLY available in the Node.js runtime (server.ts, API routes).
 */
const serverEnvSchema = z.object({
  // Infrastructure
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().default('file:./dev.db'),
  REDIS_URL: z.string().url('Invalid REDIS_URL format').default('redis://localhost:6379'),
  
  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters for security'),
  
  // Payment Gateways
  ZALOPAY_KEY: z.string().optional(),
  VNPAY_KEY: z.string().optional(),
  MOMO_KEY: z.string().optional(),
  
  // Logistics
  GHN_TOKEN: z.string().optional(),
  GHTK_TOKEN: z.string().optional(),

  // Feature Flags
  ENABLE_LIVE_PAYMENTS: z.string().optional().transform((v) => v === 'true').default(false),
  ENABLE_LIVE_SHIPPING: z.string().optional().transform((v) => v === 'true').default(false),
  ENABLE_WEBHOOKS: z.string().optional().transform((v) => v === 'true').default(false),
});

/**
 * Client-side Environment Schema
 * Only variables prefixed with NEXT_PUBLIC_ will be exposed to the browser.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Hai Tụi Mình'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

function validateEnv() {
  try {
    // Only validate server env if we are in a Node environment with process.env
    const isServer = typeof process !== 'undefined' && process.env;
    
    if (isServer) {
       console.log('🛡️ Validating Server Environment...');
       
       // In Next.js/Full-stack, we validate both
       const serverParsed = serverEnvSchema.safeParse(process.env);
       const clientParsed = clientEnvSchema.safeParse(process.env);
       
       if (!serverParsed.success) {
         console.error('❌ Invalid Server Environment Variables:');
         console.error(JSON.stringify(serverParsed.error.format(), null, 2));
         
         throw new Error('Invalid server environment variables.');
       }

       if (!clientParsed.success) {
         console.error('❌ Invalid Client Environment Variables:');
         console.error(JSON.stringify(clientParsed.error.format(), null, 2));
       }

       if (serverParsed.success) {
         console.log('✅ Environment Validated');
         return { ...serverParsed.data, ...clientParsed.data };
       }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Critical failure in environment validation:', error.message);
    }
    throw error;
  }
}

const validatedEnv = validateEnv();

if (!validatedEnv) {
  throw new Error('Environment validation did not return a usable configuration.');
}

export const env = validatedEnv as ServerEnv & ClientEnv;

/**
 * Safe accessor for client-side variables
 */
export const clientEnv = {
  get: (key: keyof ClientEnv) => {
    // Priority: process.env (Next.js/Node) -> import.meta.env (Vite)
    return (process as any).env?.[key] || (import.meta as any).env?.[key];
  }
};
