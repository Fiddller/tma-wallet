import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address, fromNano } from '@ton/core';
import { TonClient4 } from '@ton/ton';
import { TestWallet } from '../contracts/TestWallet';
import { TestMaster } from '../contracts/TestMaster';
import { JETTON_MASTER, TONCLIENT_ENDPOINT } from '../config';
import { useAppStore } from '../store/useAppStore';
import { useAsyncInitialize } from './useAsyncInitialize';

export const balanceKeys = {
  all: ['balance'] as const,
  jetton: (address: string) => ['balance', 'jetton', address] as const,
  ton: (address: string) => ['balance', 'ton', address] as const,
};

// Один TonClient4 на всё приложение
let _client: TonClient4 | null = null;
function getClient() {
  if (!_client) _client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
  return _client;
}

/**
 * Хук чтения баланса через react-query.
 * Без авто-интервала — обновлять через invalidateBalance() после транзакций.
 * Синкает результат в zustand store.
 *
 * Архитектура (паттерн TON-приложений):
 *   useMemo openedMaster — общий, без deps.
 *   useAsyncInitialize walletAddress — резолв jetton-wallet-адреса async'ом.
 *   useMemo wallet — синхронно открываем TestWallet когда адрес известен.
 *   useQuery jetton — дёргает уже открытый wallet, queryKey включает wallet.address.
 *   useQuery ton — нативный баланс через общий client.
 */
export function useBalance(address: string) {
  const setBalance = useAppStore((s) => s.setBalance);
  const setTonBalance = useAppStore((s) => s.setTonBalance);

  const openedMaster = useMemo(
    () => getClient().open(TestMaster.fromAddress(Address.parse(JETTON_MASTER))),
    [],
  );

  const walletAddress = useAsyncInitialize(async () => {
    if (!address) return null;
    return await openedMaster.getWalletAddress(Address.parse(address));
  }, [address, openedMaster]);

  const wallet = useMemo(() => {
    if (!walletAddress) return null;
    return getClient().open(TestWallet.fromAddress(walletAddress));
  }, [walletAddress]);

  const jetton = useQuery({
    queryKey: [...balanceKeys.jetton(address), wallet?.address.toString()],
    queryFn: async () => {
      if (!wallet) return 0;
      const data = await wallet.getWalletData();
      return Number(fromNano(data.balance));
    },
    enabled: !!address && !!wallet,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const ton = useQuery({
    queryKey: balanceKeys.ton(address),
    queryFn: async () => {
      const client = getClient();
      const { last } = await client.getLastBlock();
      const { account } = await client.getAccount(last.seqno, Address.parse(address));
      return Number(fromNano(account.balance.coins));
    },
    enabled: !!address,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  useEffect(() => {
    setBalance(jetton.data ?? 0);
    setTonBalance(ton.data ?? 0);
  }, [jetton.data, ton.data, setBalance, setTonBalance]);

  return {
    jettonBalance: jetton.data ?? 0,
    tonBalance: ton.data ?? 0,
    isLoading: jetton.isLoading || ton.isLoading,
    isFetching: jetton.isFetching || ton.isFetching,
    refetch: () => {
      jetton.refetch();
      ton.refetch();
    },
  };
}

/**
 * Инвалидация баланса после транзакций.
 */
export function useInvalidateBalance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: balanceKeys.all });
}
