import { z } from 'zod';
import { Address } from '@ton/core';

/**
 * Валидация TON-адреса через @ton/core Address.
 * Принимает как friendly (EQ.../UQ...), так и raw (0:abcd...) формат.
 */
export const tonAddressSchema = z
  .string()
  .min(1, 'Введите адрес')
  .refine(
    (v) => {
      try {
        Address.parse(v);
        return true;
      } catch {
        return false;
      }
    },
    'Некорректный TON-адрес',
  );

export const sendFormSchema = z.object({
  address: tonAddressSchema,
  amount: z
    .string()
    .min(1, 'Введите сумму')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Сумма должна быть больше 0'),
});

export type SendFormData = z.infer<typeof sendFormSchema>;
