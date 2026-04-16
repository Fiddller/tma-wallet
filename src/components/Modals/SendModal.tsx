import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Input, Section, Placeholder, SegmentedControl } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonConnect } from '../../hooks/useTonConnect';
import { sendFormSchema, type SendFormData } from '../../utils/tonValidation';
import { getJettonWalletAddress, buildJettonTransferPayload, TEST_JETTON_MASTER } from '../../utils/jetton';
import styles from './Modals.module.css';

type Asset = 'ton' | 'testjetton';

export function SendModal() {
  const { closeModal, balance, isConnected, address } = useAppStore();
  const { sendTransaction, sendRawTransaction, openConnectModal } = useTonConnect();
  const [asset, setAsset] = useState<Asset>('testjetton');

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
      if (asset === 'ton') {
        const amount = Number(data.amount);
        if (amount > balance) {
          toast.error('Недостаточно средств');
          return;
        }
        await sendTransaction(data.address, data.amount);
        toast.success('Транзакция отправлена');
        closeModal();
      } else {
        // TestJetton transfer
        const loadingToast = toast.loading('Получаем Jetton-кошелёк...');
        const jettonWallet = await getJettonWalletAddress(address, TEST_JETTON_MASTER);
        const payload = buildJettonTransferPayload(data.address, data.amount, 9);

        toast.dismiss(loadingToast);
        await sendRawTransaction({
          address: jettonWallet,
          amount: '50000000', // 0.05 TON for fees
          payload,
        });
        toast.success('TestJetton отправлен');
        closeModal();
      }
    } catch (err: any) {
      if (err?.message?.includes('Rejected') || err?.message?.includes('reject')) {
        toast.error('Транзакция отменена');
      } else {
        toast.error(err?.message || 'Ошибка транзакции');
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
            <div className={styles.segmentWrap}>
              <SegmentedControl>
                <SegmentedControl.Item
                  selected={asset === 'testjetton'}
                  onClick={() => setAsset('testjetton')}
                >
                  TestJetton
                </SegmentedControl.Item>
                <SegmentedControl.Item
                  selected={asset === 'ton'}
                  onClick={() => setAsset('ton')}
                >
                  TON
                </SegmentedControl.Item>
              </SegmentedControl>
            </div>
            <Section>
              <Input
                header="Адрес получателя"
                placeholder="EQ... или UQ..."
                status={errors.address ? 'error' : 'default'}
                {...register('address')}
              />
              {errors.address && <div className={styles.errorText}>{errors.address.message}</div>}
              <Input
                header={asset === 'ton' ? 'Сумма (TON)' : 'Сумма (TestJetton)'}
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
