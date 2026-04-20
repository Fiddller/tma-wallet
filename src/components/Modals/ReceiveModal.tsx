import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Button, Placeholder, Text } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonActions } from '../../hooks/useTonConnect';
import { BOT_USERNAME, APP_NAME } from '../../config';
import styles from './Modals.module.css';

export function ReceiveModal() {
  const { closeModal, isConnected, address } = useAppStore();
  const { openConnectModal } = useTonActions();

  // Диплинк через startapp=<address> — открывает TMA с параметром
  // При открытии приложения параметр читается из initData.start_param
  // и если юзер не подключён — запросит подключение, потом откроет SendModal
  // с заполненным адресом получателя
  // Main Mini App (кнопка "Launch app" в профиле бота) → без /<app>
  // Side Mini App (из /newapp) → с /<app>
  const deeplink = address
    ? APP_NAME
      ? `https://t.me/${BOT_USERNAME}/${APP_NAME}?startapp=${address}`
      : `https://t.me/${BOT_USERNAME}?startapp=${address}`
    : '';

  const copyLink = async () => {
    if (!deeplink) return;
    try {
      await navigator.clipboard.writeText(deeplink);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

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
                value={deeplink}
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
            <Button size="m" stretched mode="plain" onClick={copyLink}>
              Скопировать ссылку для оплаты
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
