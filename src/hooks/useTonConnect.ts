import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { useAppStore } from '../store/useAppStore';

const TON_API_BASE = 'https://toncenter.com/api/v2';

async function fetchTonBalance(address: string): Promise<number> {
  try {
    const res = await fetch(`${TON_API_BASE}/getAddressBalance?address=${address}`);
    const data = await res.json();
    if (data.ok) {
      return Number(data.result) / 1e9;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress(false);
  const friendlyAddress = useTonAddress(true);

  const { setIsConnected, setBalance, setAddress } = useAppStore();

  useEffect(() => {
    const connected = !!wallet;
    setIsConnected(connected);

    if (connected && address) {
      setAddress(friendlyAddress || address);
      fetchTonBalance(address).then(setBalance);
    } else {
      setBalance(0);
      setAddress('');
    }
  }, [wallet, address, friendlyAddress, setIsConnected, setBalance, setAddress]);

  const openConnectModal = () => {
    tonConnectUI.openModal();
  };

  const disconnect = () => {
    tonConnectUI.disconnect();
  };

  const sendTransaction = async (to: string, amount: string) => {
    const amountNano = Math.floor(Number(amount) * 1e9).toString();
    return tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: to,
          amount: amountNano,
        },
      ],
    });
  };

  const sendRawTransaction = async (msg: { address: string; amount: string; payload: string }) => {
    return tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [msg],
    });
  };

  return {
    tonConnectUI,
    wallet,
    address,
    friendlyAddress,
    openConnectModal,
    disconnect,
    sendTransaction,
    sendRawTransaction,
  };
}
