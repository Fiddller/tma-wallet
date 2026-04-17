import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Input, Section, Placeholder } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonConnect } from '../../hooks/useTonConnect';
import { sendFormSchema, type SendFormData } from '../../utils/tonValidation';
import { buildJettonMintPayload, TEST_JETTON_MASTER } from '../../utils/jetton';
import styles from './Modals.module.css';

export function MintModal() {
  const { closeModal, isConnected, address } = useAppStore();
  const { sendRawTransaction, openConnectModal } = useTonConnect();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendFormData>({
    resolver: zodResolver(sendFormSchema),
  });

  const onSubmit = async (data: SendFormData) => {
    if (!isConnected || !address) {
      toast.error('Подключите кошелёк');
      return;
    }

    try {
      const payload = await buildJettonMintPayload(address, data.address, data.amount, 9);
      await sendRawTransaction({
        address: TEST_JETTON_MASTER,
        amount: '50000000', // 0.05 TON на газ + forward
        payload,
      });
      toast.success('Минт отправлен');
      closeModal();
    } catch (err: any) {
      if (err?.message?.includes('Rejected') || err?.message?.includes('reject')) {
        toast.error('Транзакция отменена');
      } else {
        toast.error(err?.message || 'Ошибка минта');
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Минт TestJetton</span>
          <button className={styles.closeBtn} onClick={closeModal} type="button">✕</button>
        </div>

        {!isConnected ? (
          <Placeholder description="Подключите кошелёк для минта">
            <Button size="l" onClick={openConnectModal}>Подключить кошелёк</Button>
          </Placeholder>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Section>
              <Input
                header="Получатель минта"
                placeholder="EQ... или UQ..."
                status={errors.address ? 'error' : 'default'}
                {...register('address')}
              />
              {errors.address && <div className={styles.errorText}>{errors.address.message}</div>}
              <Input
                header="Сумма (TestJetton)"
                placeholder="0.00"
                inputMode="decimal"
                status={errors.amount ? 'error' : 'default'}
                {...register('amount')}
              />
              {errors.amount && <div className={styles.errorText}>{errors.amount.message}</div>}
            </Section>
            <div className={styles.btnWrap}>
              <Button size="l" stretched type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Минтим...' : 'Заминтить'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
