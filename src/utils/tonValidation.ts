import { z } from 'zod';

export const tonAddressSchema = z
  .string()
  .min(1, 'Введите адрес')
  .regex(
    /^[EUkQ0][A-Za-z0-9_-]{47}$/,
    'Некорректный TON-адрес'
  );

export const sendFormSchema = z.object({
  address: tonAddressSchema,
  amount: z
    .string()
    .min(1, 'Введите сумму')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Сумма должна быть больше 0'),
});

export type SendFormData = z.infer<typeof sendFormSchema>;
