const TON_TO_RUB_RATE = 450;

export function formatBalanceRub(tonBalance: number): string {
  const rub = tonBalance * TON_TO_RUB_RATE;
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rub);
}

export function formatTon(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
