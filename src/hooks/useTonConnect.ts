import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { useAppStore } from '../store/useAppStore';

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

  const { setIsConnected, setBalance, setTonBalance, setAddress, setWalletRestored } = useAppStore();

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
      setAddress(friendlyAddress || address);
      import('../utils/jetton').then(({ getJettonBalance, getTonBalance }) => {
        getJettonBalance(address).then(setBalance);
        getTonBalance(address).then(setTonBalance);
      });
    } else {
      setBalance(0);
      setTonBalance(0);
      setAddress('');
    }
  }, [wallet, address, friendlyAddress, setIsConnected, setBalance, setTonBalance, setAddress]);

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
