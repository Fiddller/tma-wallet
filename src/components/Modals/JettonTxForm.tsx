import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Input, Section, Placeholder } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonConnect } from '../../hooks/useTonConnect';
import { sendFormSchema, type SendFormData } from '../../utils/tonValidation';
import styles from './Modals.module.css';

interface JettonTxFormProps {
  /** Текст заголовка модалки (уже отрисован родителем — тут только форма) */
  addressHeader: string;
  amountHeader: string;
  submitText: (submitting: boolean) => string;
  /** Обработчик сабмита — делает реальную транзакцию, бросает при ошибке */
  onSend: (data: SendFormData) => Promise<void>;
  /** Начальное значение адреса — например из диплинка */
  defaultAddress?: string;
  /** Вызывается после успешного сабмита */
  onSuccess: () => void;
  successText: string;
}

/**
 * Общая форма отправки/минта жетонов: адрес + сумма.
 * Родительская модалка задаёт заголовки и логику onSend.
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
  const { openConnectModal } = useTonConnect();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SendFormData>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      address: defaultAddress || pendingSendAddress || '',
      amount: '',
    },
  });

  // Адрес из диплинка — заполняем и очищаем
  useEffect(() => {
    if (pendingSendAddress) {
      setValue('address', pendingSendAddress);
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
        <Input
          header={addressHeader}
          placeholder="EQ... или UQ..."
          status={errors.address ? 'error' : 'default'}
          {...register('address')}
        />
        {errors.address && <div className={styles.errorText}>{errors.address.message}</div>}
        <Input
          header={amountHeader}
          placeholder="0.00"
          inputMode="decimal"
          status={errors.amount ? 'error' : 'default'}
          {...register('amount')}
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
