import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Input, Section, Placeholder } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonActions } from '../../hooks/useTonConnect';
import { sendFormSchema, type SendFormData } from '../../utils/tonValidation';
import styles from './Modals.module.css';

interface JettonTxFormProps {
  addressHeader: string;
  amountHeader: string;
  submitText: (submitting: boolean) => string;
  onSend: (data: SendFormData) => Promise<void>;
  defaultAddress?: string;
  onSuccess: () => void;
  successText: string;
}

/**
 * Общая форма отправки/минта жетонов: адрес + сумма.
 * Использует react-hook-form Controller (controlled inputs) вместо register,
 * потому что Input из @telegram-apps/telegram-ui не прокидывает ref
 * через forwardRef корректно — register'а не хватает.
 */
export function JettonTxForm({
  addressHeader,
  amountHeader,
  submitText,
  onSend,
  defaultAddress = '',
  onSuccess,
  successText,
}: JettonTxFormProps) {
  const { isConnected, pendingSendAddress, clearPendingSendAddress } = useAppStore();
  const { openConnectModal } = useTonActions();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SendFormData>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      address: defaultAddress || pendingSendAddress || '',
      amount: '',
    },
    mode: 'onBlur',
  });

  // Адрес из диплинка — заполняем и очищаем
  useEffect(() => {
    if (pendingSendAddress) {
      setValue('address', pendingSendAddress, { shouldValidate: true });
      clearPendingSendAddress();
    }
  }, [pendingSendAddress, setValue, clearPendingSendAddress]);

  const onSubmit = async (data: SendFormData) => {
    try {
      await onSend(data);
      toast.success(successText);
      onSuccess();
    } catch (err: any) {
      if (err?.message?.includes('Rejected') || err?.message?.includes('reject')) {
        toast.error('Транзакция отменена');
      } else {
        toast.error(err?.message || 'Ошибка транзакции');
      }
    }
  };

  if (!isConnected) {
    return (
      <Placeholder description="Подключите кошелёк">
        <Button size="l" onClick={openConnectModal}>Подключить кошелёк</Button>
      </Placeholder>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Section>
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Input
              header={addressHeader}
              placeholder="EQ... или UQ..."
              status={errors.address ? 'error' : 'default'}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
        {errors.address && <div className={styles.errorText}>{errors.address.message}</div>}

        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              header={amountHeader}
              placeholder="0.00"
              inputMode="decimal"
              status={errors.amount ? 'error' : 'default'}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
        {errors.amount && <div className={styles.errorText}>{errors.amount.message}</div>}
      </Section>

      <div className={styles.btnWrap}>
        <Button size="l" stretched type="submit" disabled={isSubmitting}>
          {submitText(isSubmitting)}
        </Button>
      </div>
    </form>
  );
}
