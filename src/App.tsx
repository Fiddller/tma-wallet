import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletHeader } from './components/WalletHeader/WalletHeader';
import { MarketingBanner } from './components/MarketingBanner/MarketingBanner';
import { SendModal } from './components/Modals/SendModal';
import { ReceiveModal } from './components/Modals/ReceiveModal';
import { MintModal } from './components/Modals/MintModal';
import { PlaceholderModal } from './components/Modals/PlaceholderModal';
import { useAppStore } from './store/useAppStore';
import { useTelegram } from './hooks/useTelegram';
import { useTonConnect } from './hooks/useTonConnect';

function App() {
  useTelegram();
  useTonConnect();

  const { activeModal, pendingSendAddress, isConnected, walletRestored, openModal } = useAppStore();
  const { openConnectModal } = useTonConnect();

  // Обработка диплинка: если есть pendingSendAddress
  // — если авторизован → открываем SendModal (форма заполнится из store)
  // — если нет → сначала открываем подключение кошелька
  // Важно: ждём walletRestored, иначе при восстановлении сессии
  // isConnected ещё false и мы зря откроем connect-модалку
  useEffect(() => {
    if (!pendingSendAddress) return;
    if (!walletRestored) return;
    if (activeModal) return;

    if (isConnected) {
      openModal('send');
    } else {
      openConnectModal();
    }
  }, [pendingSendAddress, isConnected, walletRestored, activeModal, openModal, openConnectModal]);

  return (
    <div className="app">
      <WalletHeader />
      <MarketingBanner />

      {activeModal === 'send' && <SendModal />}
      {activeModal === 'receive' && <ReceiveModal />}
      {activeModal === 'mint' && <MintModal />}
      {(activeModal === 'withdraw' || activeModal === 'exchange') && (
        <PlaceholderModal />
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
            color: 'var(--tg-theme-text-color, #ffffff)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}

export default App;
