import { Address, beginCell, toNano, Cell } from '@ton/core';

// TestJetton master contract (testnet)
// https://github.com/seniorGarin/test-master
export const TEST_JETTON_MASTER = 'kQD8IpAw9lq0c13mg7_iRRMv1cwMEAC_F2tDlFAJDqEVxb5x';

/**
 * Get user's jetton wallet address for a given jetton master.
 * Calls the master contract's get method `get_wallet_address` via toncenter API.
 */
export async function getJettonWalletAddress(
  ownerAddress: string,
  jettonMaster: string = TEST_JETTON_MASTER,
): Promise<string> {
  const owner = Address.parse(ownerAddress);
  const ownerCell = beginCell().storeAddress(owner).endCell();
  const ownerB64 = ownerCell.toBoc().toString('base64');

  const url = `https://testnet.toncenter.com/api/v2/runGetMethod`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: jettonMaster,
      method: 'get_wallet_address',
      stack: [['tvm.Slice', ownerB64]],
    }),
  });

  const data = await res.json();
  if (!data.ok || !data.result?.stack?.[0]) {
    throw new Error('Не удалось получить jetton-кошелёк');
  }

  // Stack element is ["tvm.Slice", "<base64 boc>"]
  const [, bocB64] = data.result.stack[0];
  const cell = Cell.fromBase64(bocB64);
  const slice = cell.beginParse();
  const walletAddr = slice.loadAddress();
  return walletAddr.toString();
}

/**
 * Build jetton transfer payload (TEP-74).
 * @param recipient — получатель
 * @param amount — количество в единицах жетона (строка, например "1.5")
 * @param decimals — decimals токена (обычно 9)
 */
export function buildJettonTransferPayload(
  recipient: string,
  amount: string,
  decimals: number = 9,
): string {
  const recipientAddr = Address.parse(recipient);
  const amountNano = BigInt(Math.floor(Number(amount) * 10 ** decimals));

  const body = beginCell()
    .storeUint(0xf8a7ea5, 32) // jetton transfer op
    .storeUint(0, 64) // query id
    .storeCoins(amountNano) // jetton amount
    .storeAddress(recipientAddr) // destination
    .storeAddress(recipientAddr) // response destination (для сдачи)
    .storeBit(0) // no custom payload
    .storeCoins(toNano('0.01')) // forward amount
    .storeBit(0) // no forward payload
    .endCell();

  return body.toBoc().toString('base64');
}
