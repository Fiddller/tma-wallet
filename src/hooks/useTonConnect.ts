import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { useAppStore } from '../store/useAppStore';
import { useBalance } from './useBalance';

/**
 * Хук с эффектами: подписывается на wallet, подтягивает баланс,
 * отслеживает connectionRestored. Вызывать ОДИН раз — в App.tsx.
 * Модалкам нужны функции без эффектов — useTonActions().
 */
export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress(false);
  const friendlyAddress = useTonAddress(true);

  const { setIsConnected, setAddress, setWalletRestored } = useAppStore();

  // Баланс читается через react-query, результат синкается в store
  useBalance(address);

  // tonConnectUI.connectionRestored резолвится когда восстановление
  // с предыдущей сессии завершено (wallet известен или подтверждено что его нет).
  // До этого момента isConnected ненадёжен.
  useEffect(() => {
    tonConnectUI.connectionRestored.then(() => {
      setWalletRestored(true);
    });
  }, [tonConnectUI, setWalletRestored]);

  useEffect(() => {
    const connected = !!wallet;
    setIsConnected(connected);

    if (connected && address) {
      // В store всегда friendly (base64url, только A-Za-z0-9_-) —
      // raw с двоеточием ломает Telegram startapp (START_PARAM_INVALID)
      setAddress(friendlyAddress);
    } else {
      setAddress('');
    }
  }, [wallet, address, friendlyAddress, setIsConnected, setAddress]);

  return {
    tonConnectUI,
    wallet,
    address,
    friendlyAddress,
    openConnectModal: () => tonConnectUI.openModal(),
    disconnect: () => tonConnectUI.disconnect(),
  };
}

/**
 * Лёгкий хук только с функциями — без эффектов.
 * Использовать в модалках чтобы не дублировать подписки.
 */
export function useTonActions() {
  const [tonConnectUI] = useTonConnectUI();

  return {
    openConnectModal: () => tonConnectUI.openModal(),
    disconnect: () => tonConnectUI.disconnect(),
    sendRawTransaction: (msg: { address: string; amount: string; payload: string }) =>
      tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      }),
  };
}
