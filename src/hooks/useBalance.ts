import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTonWallet } from '@tonconnect/ui-react';
import { Address, fromNano, type OpenedContract } from '@ton/core';
import { TonClient4 } from '@ton/ton';
import { TestWallet } from '../contracts/TestWallet';
import { TestMaster } from '../contracts/TestMaster';
import { JETTON_MASTER } from '../config';
import { useAppStore } from '../store/useAppStore';
import { useAsyncInitialize } from './useAsyncInitialize';

export const balanceKeys = {
  all: ['balance'] as const,
  jetton: (address: string) => ['balance', 'jetton', address] as const,
  ton: (address: string) => ['balance', 'ton', address] as const,
};

// Endpoint выбираем по сети подключённого кошелька (TonConnect.account.chain).
// '-3' = testnet, '-239' = mainnet. Без подключённого кошелька — testnet
// как дефолт (та же сеть что у JETTON_MASTER из config).
const MAINNET_V4 = 'https://mainnet-v4.tonhubapi.com';
const TESTNET_V4 = 'https://testnet-v4.tonhubapi.com';

function endpointForChain(chain: string | undefined): string {
  return chain === '-239' ? MAINNET_V4 : TESTNET_V4;
}

// Кеш клиентов/мастеров по endpoint'у — стабильные ссылки между рендерами.
const _clients = new Map<string, TonClient4>();
function getClient(endpoint: string): TonClient4 {
  let c = _clients.get(endpoint);
  if (!c) {
    c = new TonClient4({ endpoint });
    _clients.set(endpoint, c);
  }
  return c;
}

const _masters = new Map<string, OpenedContract<TestMaster>>();
function getOpenedMaster(endpoint: string): OpenedContract<TestMaster> {
  let m = _masters.get(endpoint);
  if (!m) {
    m = getClient(endpoint).open(TestMaster.fromAddress(Address.parse(JETTON_MASTER)));
    _masters.set(endpoint, m);
  }
  return m;
}

/**
 * Хук чтения баланса через react-query.
 * Без авто-интервала — обновлять через invalidateBalance() после транзакций.
 * Синкает результат в zustand store.
 *
 * Endpoint берётся по chain подключённого TonConnect-кошелька. Клиент и
 * opened-master кешируются по endpoint'у на модульном уровне.
 */
export function useBalance(address: string) {
  const setBalance = useAppStore((s) => s.setBalance);
  const setTonBalance = useAppStore((s) => s.setTonBalance);

  const tonWallet = useTonWallet();
  const endpoint = endpointForChain(tonWallet?.account.chain);

  const walletAddress = useAsyncInitialize(async () => {
    if (!address) return null;
    try {
      return await getOpenedMaster(endpoint).getWalletAddress(Address.parse(address));
    } catch (err) {
      console.error('[useBalance] getWalletAddress failed', err);
      return null;
    }
  }, [address, endpoint]);

  const wallet = useMemo(() => {
    if (!walletAddress) return null;
    return getClient(endpoint).open(TestWallet.fromAddress(walletAddress));
  }, [walletAddress, endpoint]);

  // queryKey включает walletAddrStr: пока wallet резолвится (useAsyncInitialize),
  // ключ один; когда wallet открывается — ключ меняется и react-query сам
  // делает новый фетч. enabled: !!address (не !!wallet) — чтобы первый прогон
  // случился сразу и хук не блокировался ожиданием wallet.
  const walletAddrStr = wallet?.address.toString();

  const jetton = useQuery({
    queryKey: [...balanceKeys.jetton(address), endpoint, walletAddrStr],
    queryFn: async () => {
      // Если wallet ещё не готов — НЕ возвращаем 0, а undefined (implicit),
      // чтобы не перезаписать в store реальный баланс нулём. data === undefined
      // отфильтруется в useEffect.
      if (wallet) {
        const data = await wallet.getWalletData();
        return Number(fromNano(data.balance));
      }
    },
    enabled: !!address,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const ton = useQuery({
    queryKey: [...balanceKeys.ton(address), endpoint],
    queryFn: async () => {
      const client = getClient(endpoint);
      const { last } = await client.getLastBlock();
      const { account } = await client.getAccount(last.seqno, Address.parse(address));
      return Number(fromNano(account.balance.coins));
    },
    enabled: !!address,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    placeholderData: keepPreviousData,
  });

  // Пишем в store только реальные числа. Любой undefined (первый прогон,
  // wallet не готов, рефетч, ошибка) — пропускаем, store держит прежнее.
  useEffect(() => {
    if (jetton.data !== undefined) setBalance(jetton.data);
    if (ton.data !== undefined) setTonBalance(ton.data);
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
