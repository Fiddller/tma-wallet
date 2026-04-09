# TMA Wallet — Telegram Mini App

Клон верхней части приложения @wallet (Telegram) на React + TypeScript.

## Стек

- Vite + React 19 + TypeScript
- @tonconnect/ui-react — подключение TON кошелька
- zustand — управление состоянием
- react-hook-form + zod — формы и валидация
- react-hot-toast — уведомления
- qrcode.react — QR-коды
- CSS Modules — стилизация

## Запуск

```bash
cd tma-wallet
npm install --legacy-peer-deps
npm run dev
```

## Сборка для деплоя

```bash
npm run build
```

Готовый бандл появится в папке `dist/`. Загрузите его на хостинг и укажите URL в @BotFather как Web App URL.

## Настройка TonConnect

Отредактируйте `public/tonconnect-manifest.json` — замените URL на реальный адрес вашего приложения.

## Настройка в BotFather

1. Откройте @BotFather -> `/newapp` или `/setmenubutton`
2. Укажите URL вашего задеплоенного приложения
3. Готово — приложение доступно как TMA

## Структура

```
src/
  components/
    WalletHeader/     — аватарка, баланс, кнопки действий
    MarketingBanner/  — промо-плашка
    Modals/           — модальные окна (перевод, получение, заглушки)
  store/              — zustand стор
  hooks/              — useTelegram, useTonConnect
  utils/              — валидация TON-адреса, форматирование баланса
```
