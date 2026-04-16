import { useState } from 'react';
import { Avatar, Cell, InlineButtons, Section } from '@telegram-apps/telegram-ui';
import { useAppStore } from '../../store/useAppStore';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useTelegram } from '../../hooks/useTelegram';
import { formatBalanceRub } from '../../utils/formatBalance';
import styles from './WalletHeader.module.css';

export function WalletHeader() {
  const { balance, isConnected, openModal, address } = useAppStore();
  const { openConnectModal, disconnect } = useTonConnect();
  const { getUser } = useTelegram();
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'crypto' | 'ton'>('crypto');

  const tgUser = getUser();
  const userPhoto = tgUser?.photo_url;
  const userAcronym = tgUser
    ? `${tgUser.first_name?.[0] || ''}${tgUser.last_name?.[0] || ''}`.toUpperCase()
    : address?.slice(0, 2).toUpperCase() || 'W';

  const handleAvatarClick = () => {
    if (isConnected) {
      setShowMenu((v) => !v);
    } else {
      openConnectModal();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowMenu(false);
  };

  return (
    <div className={styles.header}>
      {/* Top row: avatar (left) + tabs (center) */}
      <div className={styles.topRow}>
        <div className={styles.avatarWrap}>
          <div onClick={handleAvatarClick} className={styles.avatarClickable}>
            {isConnected ? (
              <Avatar size={40} src={userPhoto} acronym={userAcronym} />
            ) : (
              <div className={styles.walletLogo}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 8.5v7L12 22l10-6.5v-7L12 2z" fill="#3b9dff"/>
                  <path d="M12 2v20M2 8.5L22 15.5M22 8.5L2 15.5" stroke="#fff" strokeWidth="1" opacity="0.3"/>
                </svg>
              </div>
            )}
          </div>
          {showMenu && (
            <>
              <div className={styles.menuOverlay} onClick={() => setShowMenu(false)} />
              <Section className={styles.menu}>
                <Cell subtitle={address ? `${address.slice(0, 8)}...${address.slice(-6)}` : ''}>
                  Кошелёк подключён
                </Cell>
                <Cell onClick={handleDisconnect}>
                  <span className={styles.disconnectText}>Отключить кошелёк</span>
                </Cell>
              </Section>
            </>
          )}
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'crypto' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('crypto')}
            type="button"
          >
            Крипто
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'ton' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ton')}
            type="button"
          >
            TON
          </button>
        </div>

        <div className={styles.topSpacer} />
      </div>

      {/* Balance */}
      <div className={styles.balanceBlock}>
        <div className={styles.balanceLabel}>Баланс</div>
        <div className={styles.balanceAmount}>
          {formatBalanceRub(balance)} <span className={styles.currency}>₽</span>
        </div>
      </div>

      {/* Action buttons */}
      <InlineButtons className={styles.inlineButtons}>
        <InlineButtons.Item text="Перевести" onClick={() => openModal('send')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3.4 20.6L2 22l.9-3.6L17.4 3.8a2 2 0 012.8 0l1 1a2 2 0 010 2.8L6.6 22.2 2 22z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </InlineButtons.Item>
        <InlineButtons.Item text="Пополнить" onClick={() => openModal('receive')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/>
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </InlineButtons.Item>
        <InlineButtons.Item text="Вывести" onClick={() => openModal('withdraw')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/>
            <path d="M12 8v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M9 11l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </InlineButtons.Item>
        <InlineButtons.Item text="Обменять" onClick={() => openModal('exchange')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 7h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M7 20l-3-3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 17H4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </InlineButtons.Item>
      </InlineButtons>
    </div>
  );
}
