import { z } from 'zod';

/**
 * Схема env-переменных Vite (import.meta.env).
 * Для каждой переменной задан дефолт через .default() — если на Vercel
 * не выставлена, используется значение по умолчанию (testnet + TestJetton
 * + тестовый бот @fiddller_tma_wallet_bot).
 */
const envSchema = z.object({
  VITE_JETTON_MASTER: z
    .string()
    .default('kQD8IpAw9lq0c13mg7_iRRMv1cwMEAC_F2tDlFAJDqEVxb5x'),

  VITE_JETTON_DECIMALS: z
    .string()
    .default('9')
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0).max(18)),

  VITE_TONCENTER_ENDPOINT: z
    .string()
    .default('https://testnet.toncenter.com/api/v2'),

  VITE_TONCLIENT_ENDPOINT: z
    .string()
    .default('https://testnet-v4.tonhubapi.com'),

  VITE_BOT_USERNAME: z
    .string()
    .default('fiddller_tma_wallet_bot'),

  // Short name TMA (из /newapp в BotFather). Если пусто — используется
  // Main Mini App формат ссылки: t.me/<bot>?startapp=<param>.
  // Если задан — Side Mini App: t.me/<bot>/<app>?startapp=<param>.
  VITE_APP_NAME: z
    .string()
    .default(''),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Ошибка конфига env:', parsed.error.flatten().fieldErrors);
  throw new Error('Невалидные env-переменные. Детали в консоли.');
}

export const config = parsed.data;

export const JETTON_MASTER = config.VITE_JETTON_MASTER;
export const JETTON_DECIMALS = config.VITE_JETTON_DECIMALS;
export const TONCENTER_ENDPOINT = config.VITE_TONCENTER_ENDPOINT;
export const TONCLIENT_ENDPOINT = config.VITE_TONCLIENT_ENDPOINT;
export const BOT_USERNAME = config.VITE_BOT_USERNAME;
export const APP_NAME = config.VITE_APP_NAME;
