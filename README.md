# TMA Wallet — Telegram Mini App

Telegram Mini App (клон верхней части @wallet) с подключением TON-кошелька через TonConnect, отображением баланса TestJetton и TON, переводом и минтом TestJetton.

## Стек

- Vite + React 18 + TypeScript
- @telegram-apps/telegram-ui — нативные UI-компоненты
- @tonconnect/ui-react — подключение TON-кошелька
- @ton/core + @ton/ton — работа с контрактами
- zustand — состояние
- react-hook-form + zod — формы и валидация
- react-hot-toast — уведомления
- qrcode.react — QR-коды

## Локальная разработка

```bash
cp .env.example .env
# отредактируй .env (см. раздел про env-переменные ниже)

npm install
npm run dev
```

## Env-переменные

Все переменные с префиксом `VITE_` (доступны на клиенте). Валидируются через zod в `src/config.ts` — если что-то не задано, приложение упадёт с явной ошибкой в консоли.

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `VITE_JETTON_MASTER` | нет (есть дефолт) | Адрес master-контракта Jetton |
| `VITE_JETTON_DECIMALS` | нет | Decimals жетона (9 по умолчанию) |
| `VITE_TONCENTER_ENDPOINT` | нет | Testnet toncenter API |
| `VITE_TONCLIENT_ENDPOINT` | нет | Testnet TonClient4 endpoint |
| `VITE_BOT_USERNAME` | **ДА** | Username бота без `@` |
| `VITE_APP_NAME` | **ДА** | Short name TMA из `/newapp` в BotFather |

`VITE_BOT_USERNAME` и `VITE_APP_NAME` используются для QR-диплинка `https://t.me/<bot>/<app>?startapp=<address>` — без них QR покажет ссылку на дефолтного бота и не откроется.

### Настройка на Vercel

1. Project Settings → Environment Variables
2. Добавить `VITE_BOT_USERNAME` = `ваш_бот_без_at`
3. Добавить `VITE_APP_NAME` = `short_name_из_BotFather`
4. Redeploy (или просто пушнуть новый коммит)

## Настройка в BotFather

1. `/newbot` → создать бота, получить токен и username
2. `/newapp` → выбрать бота, указать:
   - Title, Description, Photo
   - **Short name** — это `VITE_APP_NAME`
   - Web App URL — URL задеплоенного TMA
3. `/setmenubutton` → указать URL и текст кнопки меню

## TonConnect

Отредактировать `public/tonconnect-manifest.json` — указать реальный домен задеплоенного приложения (`url`, `iconUrl`, `termsOfUseUrl`, `privacyPolicyUrl`).

Требования к манифесту:
- PNG иконка (не SVG)
- CORS-заголовки на JSON-файле (на Apache — через `.htaccess`)

## Сборка

```bash
npm run build
```

Бандл в `dist/`.

## Структура

```
src/
  components/
    WalletHeader/     — аватарка, баланс TJ + TON, 4 кнопки
    MarketingBanner/  — промо-плашка
    Modals/           — Send, Receive, Mint, Placeholder
  contracts/          — обёртки TestMaster, TestWallet
  store/              — zustand (кошелёк + модалки + pending send)
  hooks/              — useTelegram (BackButton, start_param), useTonConnect
  utils/              — jetton (transfer/mint/balance), tonValidation, formatBalance
  config.ts           — zod-валидация env
```

## Как работает QR-диплинк

1. В модалке "Пополнить" — QR с URL `https://t.me/<bot>/<app>?startapp=<address>`
2. Кто-то сканирует QR → открывается TMA в Telegram → `initDataUnsafe.start_param = <address>`
3. `useTelegram` сохраняет адрес в `pendingSendAddress`
4. `App.tsx` ждёт `walletRestored` от TonConnect:
   - подключён → открывается `SendModal` с заполненным адресом
   - не подключён → сначала TonConnect модалка, потом SendModal
