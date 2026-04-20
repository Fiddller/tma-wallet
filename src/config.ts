import { z } from 'zod';

/**
 * Схема env-переменных Vite (import.meta.env).
 * Все переменные должны начинаться с VITE_ чтобы быть доступными на клиенте.
 *
 * Все переменные обязательны — без дефолтов. Задавать:
 *   - локально: .env (см. .env.example)
 *   - на Vercel: Project Settings → Environment Variables
 *
 * Если что-то не задано — приложение упадёт с ошибкой конфига в консоли,
 * а не будет молча работать с неправильными значениями.
 */
const envSchema = z.object({
  VITE_JETTON_MASTER: z.string().min(1, 'Задайте VITE_JETTON_MASTER (адрес master-контракта)'),

  VITE_JETTON_DECIMALS: z
    .string()
    .min(1, 'Задайте VITE_JETTON_DECIMALS')
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0).max(18)),

  VITE_TONCENTER_ENDPOINT: z.string().url('Задайте VITE_TONCENTER_ENDPOINT (URL)'),
  VITE_TONCLIENT_ENDPOINT: z.string().url('Задайте VITE_TONCLIENT_ENDPOINT (URL)'),

  VITE_BOT_USERNAME: z.string().min(1, 'Задайте VITE_BOT_USERNAME (без @)'),
  VITE_APP_NAME: z.string().min(1, 'Задайте VITE_APP_NAME (из /newapp BotFather)'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Ошибка конфига env:', parsed.error.flatten().fieldErrors);
  throw new Error(
    'Невалидные env-переменные. Проверь .env или Vercel Environment Variables. Детали в консоли.',
  );
}

export const config = parsed.data;

export const JETTON_MASTER = config.VITE_JETTON_MASTER;
export const JETTON_DECIMALS = config.VITE_JETTON_DECIMALS;
export const TONCENTER_ENDPOINT = config.VITE_TONCENTER_ENDPOINT;
export const TONCLIENT_ENDPOINT = config.VITE_TONCLIENT_ENDPOINT;
export const BOT_USERNAME = config.VITE_BOT_USERNAME;
export const APP_NAME = config.VITE_APP_NAME;
