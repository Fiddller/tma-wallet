import { z } from 'zod';

/**
 * Схема env-переменных Vite (import.meta.env).
 * Все переменные опциональны — для незаданных fallback в коде ниже
 * (через || defaultValue), потому что .default() в zod ловит только
 * undefined, а Vite может подставлять пустую строку.
 *
 * Для проды (на Vercel) обязательно переопределить:
 *   - VITE_BOT_USERNAME на свой бот
 *   - VITE_APP_NAME на short name своей TMA
 */
const envSchema = z.object({
  VITE_JETTON_MASTER: z.string().optional(),
  VITE_JETTON_DECIMALS: z.string().optional(),
  VITE_TONCENTER_ENDPOINT: z.string().optional(),
  VITE_TONCLIENT_ENDPOINT: z.string().optional(),
  VITE_BOT_USERNAME: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Ошибка конфига env:', parsed.error.flatten().fieldErrors);
  throw new Error('Невалидные env-переменные. Детали в консоли.');
}

const env = parsed.data;

// Fallback дефолты: testnet + TestJetton + тестовый бот @fiddller_tma_wallet_bot
export const JETTON_MASTER =
  env.VITE_JETTON_MASTER || 'kQD8IpAw9lq0c13mg7_iRRMv1cwMEAC_F2tDlFAJDqEVxb5x';

export const JETTON_DECIMALS = Number(env.VITE_JETTON_DECIMALS) || 9;

export const TONCENTER_ENDPOINT =
  env.VITE_TONCENTER_ENDPOINT || 'https://testnet.toncenter.com/api/v2';

export const TONCLIENT_ENDPOINT =
  env.VITE_TONCLIENT_ENDPOINT || 'https://testnet-v4.tonhubapi.com';

export const BOT_USERNAME = env.VITE_BOT_USERNAME || 'fiddller_tma_wallet_bot';
export const APP_NAME = env.VITE_APP_NAME || 'tma-wallet';

export const config = {
  JETTON_MASTER,
  JETTON_DECIMALS,
  TONCENTER_ENDPOINT,
  TONCLIENT_ENDPOINT,
  BOT_USERNAME,
  APP_NAME,
};
