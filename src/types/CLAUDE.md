### CLAUDE.md

telegram.d.ts - Telegram Mini App type surface.
    - TelegramWebApp "WebApp API contract (initData, buttons, haptics)"
    - TelegramWebAppUser "User payload returned from initDataUnsafe"
    - ThemeParams/ViewportData/etc. "Typed theme and viewport metadata"

transaction.ts - Firefly transaction domain models.
    - FireflyTransactionResponse "Raw API response shape"
    - DisplayTransaction "Normalized UI-ready transaction"
    - FireflyCreateTransactionRequest "Payload for creating transactions"
    - UpdateTransactionRequest "Payload for editing transactions"
    - TransactionType/TransactionEntry/etc. "Core discriminated unions"
