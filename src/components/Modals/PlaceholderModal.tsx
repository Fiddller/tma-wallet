import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import styles from './Modals.module.css';

export function PlaceholderModal() {
  const { closeModal, activeModal } = useAppStore();
  const title = activeModal === 'withdraw' ? 'Вывести' : 'Обменять';

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.closeBtn} onClick={closeModal} type="button">✕</button>
        </div>
        <Placeholder description="Функция в разработке">
          <Button size="l" onClick={closeModal}>Понятно</Button>
        </Placeholder>
      </div>
    </div>
  );
}
