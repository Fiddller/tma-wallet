import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJettonBalance, getTonBalance } from '../utils/jetton';
import { useAppStore } from '../store/useAppStore';

export const balanceKeys = {
  all: ['balance'] as const,
  jetton: (address: string) => ['balance', 'jetton', address] as const,
  ton: (address: string) => ['balance', 'ton', address] as const,
};

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
    queryFn: () => getJettonBalance(address),
    enabled: !!address,
  });

  const ton = useQuery({
    queryKey: balanceKeys.ton(address),
    queryFn: () => getTonBalance(address),
    enabled: !!address,
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
