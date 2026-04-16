import { Buffer } from 'buffer';
// Polyfill Buffer for @ton/core in browser
(globalThis as any).Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';
import App from './App';
import './index.css';

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
);
