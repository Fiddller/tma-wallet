import { useEffect, useState } from 'react';

/**
 * Резолвит async-функцию в state. Стандартный паттерн для TON-приложений:
 * например — резолв адреса jetton-кошелька на основе owner-адреса,
 * чтобы потом синхронно создавать opened-контракт через useMemo.
 */
export function useAsyncInitialize<T>(
  func: () => Promise<T>,
  deps: unknown[] = [],
): T | undefined {
  const [state, setState] = useState<T | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await func();
      if (!cancelled) setState(result);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
