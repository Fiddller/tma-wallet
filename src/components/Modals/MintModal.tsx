import { useAppStore } from '../../store/useAppStore';
import { useTonActions } from '../../hooks/useTonConnect';
import { buildJettonMintPayload, TEST_JETTON_MASTER } from '../../utils/jetton';
import { JettonTxForm } from './JettonTxForm';
import styles from './Modals.module.css';

export function MintModal() {
  const { closeModal, address } = useAppStore();
  const { sendRawTransaction } = useTonActions();

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Минт TestJetton</span>
          <button className={styles.closeBtn} onClick={closeModal} type="button">✕</button>
        </div>

        <JettonTxForm
          addressHeader="Получатель минта"
          amountHeader="Сумма (TestJetton)"
          submitText={(s) => (s ? 'Минтим...' : 'Заминтить')}
          successText="Минт отправлен"
          onSuccess={closeModal}
          onSend={async (data) => {
            if (!address) throw new Error('Нет адреса отправителя');
            const payload = await buildJettonMintPayload(address, data.address, data.amount, 9);
            await sendRawTransaction({
              address: TEST_JETTON_MASTER,
              amount: '50000000',
              payload,
            });
          }}
        />
      </div>
    </div>
  );
}
