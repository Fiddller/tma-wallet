import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@telegram-apps/telegram-ui/dist/styles.css';
import App from './App';
import './index.css';

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

// Без авто-refetch: баланс инвалидируется вручную после транзакций
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: 1,
      staleTime: Infinity,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TonConnectUIProvider
        manifestUrl={manifestUrl}
        actionsConfiguration={{
          twaReturnUrl: 'https://t.me',
        }}
      >
        <AppRoot appearance="dark">
          <App />
        </AppRoot>
      </TonConnectUIProvider>
    </QueryClientProvider>
  </StrictMode>,
);
