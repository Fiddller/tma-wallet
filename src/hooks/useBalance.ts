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
 * Синкает результат в zustand store для совместимости с компонентами.
 *
 * openedMaster — useMemo без deps, контракт мастера общий.
 * jetton/ton — useQuery с queryKey по address: когда address пуст, query
 * disabled и data === undefined, store автоматически встаёт в 0.
 */
export function useBalance(address: string) {
  const setBalance = useAppStore((s) => s.setBalance);
  const setTonBalance = useAppStore((s) => s.setTonBalance);

  const openedMaster = useMemo(
    () => getClient().open(TestMaster.fromAddress(Address.parse(JETTON_MASTER))),
    [],
  );

  const jetton = useQuery({
    queryKey: balanceKeys.jetton(address),
    queryFn: async () => {
      const walletAddr = await openedMaster.getWalletAddress(Address.parse(address));
      const wallet = getClient().open(TestWallet.fromAddress(walletAddr));
      const data = await wallet.getWalletData();
      return Number(data.balance) / 10 ** JETTON_DECIMALS;
    },
    enabled: !!address,
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
 * Хелпер для инвалидации баланса после транзакций.
 */
export function useInvalidateBalance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: balanceKeys.all });
}
