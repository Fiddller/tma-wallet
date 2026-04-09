import { Toaster } from 'react-hot-toast';
import { WalletHeader } from './components/WalletHeader/WalletHeader';
import { MarketingBanner } from './components/MarketingBanner/MarketingBanner';
import { SendModal } from './components/Modals/SendModal';
import { ReceiveModal } from './components/Modals/ReceiveModal';
import { PlaceholderModal } from './components/Modals/PlaceholderModal';
import { useAppStore } from './store/useAppStore';
import { useTelegram } from './hooks/useTelegram';
import { useTonConnect } from './hooks/useTonConnect';

function App() {
  useTelegram();
  useTonConnect();

  const { activeModal } = useAppStore();

  return (
    <div className="app">
      <WalletHeader />
      <MarketingBanner />

      {activeModal === 'send' && <SendModal />}
      {activeModal === 'receive' && <ReceiveModal />}
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
