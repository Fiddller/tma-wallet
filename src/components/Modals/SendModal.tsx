import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useTonActions } from '../../hooks/useTonConnect';
import { getJettonWalletAddress, buildJettonTransferPayload, TEST_JETTON_MASTER } from '../../utils/jetton';
import { JettonTxForm } from './JettonTxForm';
import styles from './Modals.module.css';

export function SendModal() {
  const { closeModal, address } = useAppStore();
  const { sendRawTransaction } = useTonActions();

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Перевод TestJetton</span>
          <button className={styles.closeBtn} onClick={closeModal} type="button">✕</button>
        </div>

        <JettonTxForm
          addressHeader="Адрес получателя"
          amountHeader="Сумма (TestJetton)"
          submitText={(s) => (s ? 'Отправка...' : 'Отправить')}
          successText="TestJetton отправлен"
          onSuccess={closeModal}
          onSend={async (data) => {
            if (!address) throw new Error('Нет адреса отправителя');
            const loadingToast = toast.loading('Получаем Jetton-кошелёк...');
            try {
              const jettonWallet = await getJettonWalletAddress(address, TEST_JETTON_MASTER);
              const payload = await buildJettonTransferPayload(data.address, data.amount, 9);
              await sendRawTransaction({
                address: jettonWallet,
                amount: '50000000',
                payload,
              });
            } finally {
              toast.dismiss(loadingToast);
            }
          }}
        />
      </div>
    </div>
  );
}
