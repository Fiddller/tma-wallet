import type { JettonTransfer } from '../contracts/TestWallet';
import type { JettonMint } from '../contracts/TestMaster';
import { JETTON_MASTER, JETTON_DECIMALS, TONCLIENT_ENDPOINT } from '../config';

// Re-export для обратной совместимости с местами где использовали старые имена
export const TEST_JETTON_MASTER = JETTON_MASTER;
export { JETTON_DECIMALS };

/**
 * Get user's jetton wallet address using TestMaster wrapper.
 */
export async function getJettonWalletAddress(
  ownerAddress: string,
  jettonMaster: string = JETTON_MASTER,
): Promise<string> {
  const { Address } = await import('@ton/core');
  const { TonClient4 } = await import('@ton/ton');
  const { TestMaster } = await import('../contracts/TestMaster');

  const master = TestMaster.fromAddress(Address.parse(jettonMaster));
  const client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
  const provider = client.open(master);
  const walletAddr = await provider.getWalletAddress(Address.parse(ownerAddress));
  return walletAddr.toString();
}

/**
 * Get jetton balance using TestWallet wrapper.
 */
export async function getJettonBalance(
  ownerAddress: string,
  jettonMaster: string = JETTON_MASTER,
  decimals: number = JETTON_DECIMALS,
): Promise<number> {
  try {
    const { Address } = await import('@ton/core');
    const { TonClient4 } = await import('@ton/ton');
    const { TestWallet } = await import('../contracts/TestWallet');

    const jettonWalletAddr = await getJettonWalletAddress(ownerAddress, jettonMaster);
    const wallet = TestWallet.fromAddress(Address.parse(jettonWalletAddr));
    const client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
    const provider = client.open(wallet);
    const data = await provider.getWalletData();
    return Number(data.balance) / 10 ** decimals;
  } catch {
    return 0;
  }
}

/**
 * Get TON balance (native TON, не жетоны).
 */
export async function getTonBalance(ownerAddress: string): Promise<number> {
  try {
    const { Address } = await import('@ton/core');
    const { TonClient4 } = await import('@ton/ton');
    const client = new TonClient4({ endpoint: TONCLIENT_ENDPOINT });
    const { last } = await client.getLastBlock();
    const { account } = await client.getAccount(last.seqno, Address.parse(ownerAddress));
    return Number(account.balance.coins) / 1e9;
  } catch {
    return 0;
  }
}

/**
 * Build jetton transfer payload using TestWallet's storeJettonTransfer.
 */
export async function buildJettonTransferPayload(
  recipient: string,
  amount: string,
  decimals: number = JETTON_DECIMALS,
): Promise<string> {
  const { Address, beginCell, toNano } = await import('@ton/core');
  const { storeJettonTransfer } = await import('../contracts/TestWallet');

  const recipientAddr = Address.parse(recipient);
  const amountNano = BigInt(Math.floor(Number(amount) * 10 ** decimals));

  const transfer: JettonTransfer = {
    $$type: 'JettonTransfer',
    query_id: 0n,
    amount: amountNano,
    destination: recipientAddr,
    response_destination: recipientAddr,
    custom_payload: null,
    forward_ton_amount: toNano('0.01'),
    forward_payload: beginCell().endCell().asSlice(),
  };

  const body = beginCell().store(storeJettonTransfer(transfer)).endCell();
  return body.toBoc().toString('base64');
}

/**
 * Build JettonMint payload using TestMaster's storeJettonMint.
 */
export async function buildJettonMintPayload(
  origin: string,
  receiver: string,
  amount: string,
  decimals: number = JETTON_DECIMALS,
): Promise<string> {
  const { Address, beginCell, toNano } = await import('@ton/core');
  const { storeJettonMint } = await import('../contracts/TestMaster');

  const originAddr = Address.parse(origin);
  const receiverAddr = Address.parse(receiver);
  const amountNano = BigInt(Math.floor(Number(amount) * 10 ** decimals));

  const mint: JettonMint = {
    $$type: 'JettonMint',
    query_id: 0n,
    origin: originAddr,
    receiver: receiverAddr,
    amount: amountNano,
    custom_payload: null,
    forward_ton_amount: toNano('0.01'),
    forward_payload: beginCell().endCell().asSlice(),
  };

  const body = beginCell().store(storeJettonMint(mint)).endCell();
  return body.toBoc().toString('base64');
}
