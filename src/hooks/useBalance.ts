import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { TonClient4 } from '@ton/ton';
import { TestWallet } from '../contracts/TestWallet';
import { TestMaster } from '../contracts/TestMaster';
import { JETTON_MASTER, JETTON_DECIMALS, TONCLIENT_ENDPOINT } from '../config';
import { useAppStore } from '../store/useAppStore';

export const balanceKeys = {
  all: ['balance'] as const,
  jetton: (address: string) => ['balance', 'jetton', address] as const,
  ton: (address: string) => ['balance', 'ton', address] as const,
  jettonWallet: (address: string) => ['jettonWallet', address] as const,
};

// Один TonClient4 на всё приложение — пересоздавать его на каждый фетч
// (как было раньше) дорого и плодит сокеты
let _client: TonClient4 | null = null;
function getClient() {
  if (!_client) _client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
  return _client;
}

/**
 * Хук чтения баланса через react-query.
 * Без авто-интервала — обновлять через invalidateBalance() после транзакций.
 * Синкает результат в zustand store (balance / tonBalance) для совместимости.
 *
 * Архитектура:
 *   useMemo:  openedMaster (TestMaster в client.open()) — общий, без deps
 *   useQuery: jettonWallet  — резолв wallet-address на владельца (кешируется навсегда)
 *   useQuery: jetton        — дёргает уже опенед wallet, инвалидируется
 *   useQuery: ton           — native через общий client
 */
export function useBalance(address: string) {
  const setBalance = useAppStore((s) => s.setBalance);
  const setTonBalance = useAppStore((s) => s.setTonBalance);

  // Опенед-master общий, jetton-master не зависит от пользователя
  const openedMaster = useMemo(
    () => getClient().open(TestMaster.fromAddress(Address.parse(JETTON_MASTER))),
    [],
  );

  // Опенед jetton-wallet для конкретного owner. Адрес не меняется,
  // поэтому staleTime: Infinity — резолвим один раз и переиспользуем.
  const jettonWalletQuery = useQuery({
    queryKey: balanceKeys.jettonWallet(address),
    queryFn: async () => {
      const walletAddr = await openedMaster.getWalletAddress(Address.parse(address));
      return getClient().open(TestWallet.fromAddress(walletAddr));
    },
    enabled: !!address,
    staleTime: Infinity,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const openedWallet = jettonWalletQuery.data;

  const jetton = useQuery({
    queryKey: balanceKeys.jetton(address),
    queryFn: async () => {
      const data = await openedWallet!.getWalletData();
      return Number(data.balance) / 10 ** JETTON_DECIMALS;
    },
    enabled: !!address && !!openedWallet,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const ton = useQuery({
    queryKey: balanceKeys.ton(address),
    queryFn: async () => {
      const client = getClient();
      const { last } = await client.getLastBlock();
      const { account } = await client.getAccount(last.seqno, Address.parse(address));
      return Number(account.balance.coins) / 1e9;
    },
    enabled: !!address,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  useEffect(() => {
    if (!address) {
      setBalance(0);
      setTonBalance(0);
      return;
    }
    if (jetton.data !== undefined) setBalance(jetton.data);
    if (ton.data !== undefined) setTonBalance(ton.data);
  }, [address, jetton.data, ton.data, setBalance, setTonBalance]);

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
 * Хелпер для инвалидации баланса после транзакций.
 * Инвалидирует только balance — резолвленный jettonWallet остаётся в кеше.
 */
export function useInvalidateBalance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: balanceKeys.all });
}
