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
  // Единый вызов — все эффекты и функции из одного хука,
  // чтобы не было двойных подписок на wallet/balance/connectionRestored
  const { openConnectModal } = useTonConnect();

  const { activeModal, pendingSendAddress, isConnected, walletRestored, openModal } = useAppStore();

  // Обработка диплинка: если пришёл pendingSendAddress и wallet восстановлен
  //   — авторизован → SendModal (форма заполнится из store)
  //   — не авторизован → сперва connect-модалка, после подключения
  //     этот эффект сработает снова и откроет SendModal
  useEffect(() => {
    if (!pendingSendAddress) return;
    if (!walletRestored) return;
    if (activeModal) return;

    if (isConnected) {
      openModal('send');
    } else {
      openConnectModal();
    }
    // openConnectModal намеренно НЕ в deps — он пересоздаётся каждый
    // рендер, иначе эффект будет срабатывать повторно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSendAddress, isConnected, walletRestored, activeModal, openModal]);

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
