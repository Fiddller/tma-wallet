import { z } from 'zod';

export const tonAddressSchema = z
  .string()
  .min(1, 'Введите адрес')
  .regex(
    /^(EQ|UQ|0:|kQ)[a-zA-Z0-9_-]{46,48}$/,
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
