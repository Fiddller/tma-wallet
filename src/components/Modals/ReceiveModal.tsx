import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Button, Placeholder, Text } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonConnect } from '../../hooks/useTonConnect';
import styles from './Modals.module.css';

export function ReceiveModal() {
  const { closeModal, isConnected, address } = useAppStore();
  const { openConnectModal } = useTonConnect();

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Адрес скопирован');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Пополнить</span>
          <button className={styles.closeBtn} onClick={closeModal} type="button">✕</button>
        </div>

        {!isConnected || !address ? (
          <Placeholder description="Подключите кошелёк, чтобы получить адрес">
            <Button size="l" onClick={openConnectModal}>Подключить кошелёк</Button>
          </Placeholder>
        ) : (
          <div className={styles.qrSection}>
            <div className={styles.qrWrapper}>
              <QRCodeSVG
                value={`ton://transfer/${address}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>
            <div className={styles.addressRow}>
              <Text className={styles.addressText}>{address}</Text>
              <Button size="s" onClick={copyAddress}>Копировать</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
