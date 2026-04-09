import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Input, Section, Placeholder } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonConnect } from '../../hooks/useTonConnect';
import { sendFormSchema, type SendFormData } from '../../utils/tonValidation';
import styles from './Modals.module.css';

export function SendModal() {
  const { closeModal, balance, isConnected } = useAppStore();
  const { sendTransaction, openConnectModal } = useTonConnect();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendFormData>({
    resolver: zodResolver(sendFormSchema),
  });

  const onSubmit = async (data: SendFormData) => {
    if (!isConnected) {
      toast.error('Подключите кошелёк');
      return;
    }
    const amount = Number(data.amount);
    if (amount > balance) {
      toast.error('Недостаточно средств');
      return;
    }
    try {
      await sendTransaction(data.address, data.amount);
      toast.success('Транзакция отправлена');
      closeModal();
    } catch (err: any) {
      if (err?.message?.includes('Rejected')) {
        toast.error('Транзакция отменена');
      } else {
        toast.error('Ошибка транзакции');
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Перевод</span>
          <button className={styles.closeBtn} onClick={closeModal} type="button">✕</button>
        </div>

        {!isConnected ? (
          <Placeholder description="Подключите кошелёк для перевода">
            <Button size="l" onClick={openConnectModal}>Подключить кошелёк</Button>
          </Placeholder>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Section>
              <Input
                header="Адрес получателя"
                placeholder="EQ... или UQ..."
                status={errors.address ? 'error' : 'default'}
                {...register('address')}
              />
              {errors.address && <div className={styles.errorText}>{errors.address.message}</div>}
              <Input
                header="Сумма (TON)"
                placeholder="0.00"
                inputMode="decimal"
                status={errors.amount ? 'error' : 'default'}
                {...register('amount')}
              />
              {errors.amount && <div className={styles.errorText}>{errors.amount.message}</div>}
            </Section>
            <div className={styles.btnWrap}>
              <Button size="l" stretched type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
