import { z } from 'zod';

/**
 * Валидация TON-адреса — логика повторяет Address.isFriendly / Address.isRaw
 * из @ton/core (https://github.com/ton-org/ton-core/blob/main/src/address/Address.ts#L114).
 * Без зависимости на сам пакет чтобы не тянуть его в главный бандл.
 */
function isFriendly(source: string): boolean {
  if (source.length !== 48) return false;
  return /^[A-Za-z0-9+/_-]+$/.test(source);
}

function isRaw(source: string): boolean {
  if (source.indexOf(':') === -1) return false;
  const [wc, hash] = source.split(':');
  if (!Number.isInteger(parseFloat(wc))) return false;
  if (!hash || hash.length !== 64) return false;
  return /^[a-f0-9]+$/i.test(hash);
}

export const tonAddressSchema = z
  .string()
  .min(1, 'Введите адрес')
  .refine((v) => isFriendly(v) || isRaw(v), 'Некорректный TON-адрес');

export const sendFormSchema = z.object({
  address: tonAddressSchema,
  amount: z
    .string()
    .min(1, 'Введите сумму')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Сумма должна быть больше 0'),
});

export type SendFormData = z.infer<typeof sendFormSchema>;
