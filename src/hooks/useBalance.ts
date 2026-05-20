import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJettonWalletAddress } from '../utils/jetton';
import { JETTON_DECIMALS, TONCLIENT_ENDPOINT } from '../config';
import { useAppStore } from '../store/useAppStore';

export const balanceKeys = {
  all: ['balance'] as const,
  jetton: (address: string) => ['balance', 'jetton', address] as const,
  ton: (address: string) => ['balance', 'ton', address] as const,
};

// queryFn БЕЗ try/catch — пусть ошибка летит наружу, react-query сделает retry.
// Утилитные getJettonBalance/getTonBalance глушат ошибки в 0, и тогда staleTime
// кеширует фальшивый ноль навсегда — это и было «через раз показывает».
async function fetchJettonBalance(ownerAddress: string): Promise<number> {
  const { Address } = await import('@ton/core');
  const { TonClient4 } = await import('@ton/ton');
  const { TestWallet } = await import('../contracts/TestWallet');
  const jettonWalletAddr = await getJettonWalletAddress(ownerAddress);
  const wallet = TestWallet.fromAddress(Address.parse(jettonWalletAddr));
  const client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
  const data = await client.open(wallet).getWalletData();
  return Number(data.balance) / 10 ** JETTON_DECIMALS;
}

async function fetchTonBalance(ownerAddress: string): Promise<number> {
  const { Address } = await import('@ton/core');
  const { TonClient4 } = await import('@ton/ton');
  const client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
  const { last } = await client.getLastBlock();
  const { account } = await client.getAccount(last.seqno, Address.parse(ownerAddress));
  return Number(account.balance.coins) / 1e9;
}

/**
 * Хук чтения баланса через react-query.
 * Без авто-интервала — обновлять через invalidateBalance() после транзакций.
 * Синкает результат в zustand store (balance / tonBalance) для совместимости.
 */
export function useBalance(address: string) {
  const setBalance = useAppStore((s) => s.setBalance);
  const setTonBalance = useAppStore((s) => s.setTonBalance);

  const jetton = useQuery({
    queryKey: balanceKeys.jetton(address),
    queryFn: () => fetchJettonBalance(address),
    enabled: !!address,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const ton = useQuery({
    queryKey: balanceKeys.ton(address),
    queryFn: () => fetchTonBalance(address),
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
 * Использовать: const invalidate = useInvalidateBalance(); ... invalidate();
 */
export function useInvalidateBalance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: balanceKeys.all });
}
