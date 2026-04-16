// TestJetton master contract (testnet)
// https://github.com/seniorGarin/test-master
export const TEST_JETTON_MASTER = 'kQD8IpAw9lq0c13mg7_iRRMv1cwMEAC_F2tDlFAJDqEVxb5x';
export const JETTON_DECIMALS = 9;
const TONCENTER_TESTNET = 'https://testnet.toncenter.com/api/v2';

/**
 * Get jetton balance for a user's wallet.
 * Returns amount in human-readable units (divided by 10^decimals).
 * Returns 0 if user has no jetton wallet yet.
 */
export async function getJettonBalance(
  ownerAddress: string,
  jettonMaster: string = TEST_JETTON_MASTER,
  decimals: number = JETTON_DECIMALS,
): Promise<number> {
  try {
    const jettonWallet = await getJettonWalletAddress(ownerAddress, jettonMaster);

    // Call get_wallet_data on the jetton wallet
    const res = await fetch(`${TONCENTER_TESTNET}/runGetMethod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: jettonWallet,
        method: 'get_wallet_data',
        stack: [],
      }),
    });

    const data = await res.json();
    if (!data.ok || !data.result?.stack?.[0]) {
      return 0;
    }

    // Stack: [balance, owner, jetton, jetton_wallet_code]
    // First element is balance as hex number: ["num", "0x..."]
    const [type, value] = data.result.stack[0];
    if (type !== 'num') return 0;
    const balanceNano = BigInt(value);
    return Number(balanceNano) / 10 ** decimals;
  } catch {
    return 0;
  }
}

/**
 * Get user's jetton wallet address for a given jetton master.
 * Calls the master contract's get method `get_wallet_address` via toncenter API.
 * Dynamically imports @ton/core to avoid loading it on app start.
 */
export async function getJettonWalletAddress(
  ownerAddress: string,
  jettonMaster: string = TEST_JETTON_MASTER,
): Promise<string> {
  const { Address, beginCell, Cell } = await import('@ton/core');
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

  const [, bocB64] = data.result.stack[0];
  const cell = Cell.fromBase64(bocB64);
  const slice = cell.beginParse();
  const walletAddr = slice.loadAddress();
  return walletAddr.toString();
}

/**
 * Build jetton transfer payload (TEP-74).
 */
export async function buildJettonTransferPayload(
  recipient: string,
  amount: string,
  decimals: number = 9,
): Promise<string> {
  const { Address, beginCell, toNano } = await import('@ton/core');
  const recipientAddr = Address.parse(recipient);
  const amountNano = BigInt(Math.floor(Number(amount) * 10 ** decimals));

  const body = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(amountNano)
    .storeAddress(recipientAddr)
    .storeAddress(recipientAddr)
    .storeBit(0)
    .storeCoins(toNano('0.01'))
    .storeBit(0)
    .endCell();

  return body.toBoc().toString('base64');
}
