# Правильные переменные окружения для Cloudflare Pages

## Проблема обнаружена!

В Cloudflare Pages Dashboard найдена **критическая опечатка**:

### ❌ НЕПРАВИЛЬНО (текущие настройки):
```
BACKEND_UR = https://dev.neon-chuckwalla.ts.net/
```

### ✅ ПРАВИЛЬНО (исправить на):
```
BACKEND_URL = https://dev.neon-chuckwalla.ts.net
```

**Важно**:
1. Название переменной: `BACKEND_UR` → `BACKEND_URL` (добавить `L` в конце)
2. Убрать trailing slash `/` в конце URL

## Полный список необходимых переменных

### 1. Server-side переменные (используются в `functions/`)

Эти переменные нужны для Cloudflare Pages Functions middleware:

| Переменная | Значение | Обязательна? | Описание |
|------------|----------|--------------|----------|
| `BACKEND_URL` | `https://dev.neon-chuckwalla.ts.net` | ✅ **ДА** | URL backend API для проксирования |
| `FIREFLY_TOKEN` | (ваш токен) | ⚠️ Опционально | Firefly API token для server-side auth |
| `SYNC_API_KEY` | (ваш ключ) | ⚠️ Опционально | Sync API key для server-side auth |

### 2. Client-side переменные (используются в браузере)

Эти переменные доступны в React коде:

| Переменная | Значение | Обязательна? | Описание |
|------------|----------|--------------|----------|
| `VITE_FIREFLY_TOKEN` | `eyJ0eXAiOiJKV1QiLCJhbGci...` | ✅ **ДА** | Firefly API token для браузера |
| `VITE_SYNC_API_KEY` | `sk_sync_2f952db378162b...` | ✅ **ДА** | Sync API key для браузера |
| `VITE_TELEGRAM_BOT_TOKEN` | `7287096901:AAEXbITi_...` | ✅ **ДА** | Telegram Bot token |
| `VITE_TELEGRAM_BOT_USERNAME` | `budgetbot` | ✅ **ДА** | Telegram Bot username |

### 3. Deprecated переменные (больше не используются)

| Переменная | Статус | Примечание |
|------------|--------|------------|
| `VITE_BASE_URL` | ❌ Устарело | Код теперь использует относительные пути |

## Инструкция по исправлению

### Шаг 1: Исправить опечатку

В Cloudflare Pages Dashboard:
1. Найдите переменную `BACKEND_UR`
2. **УДАЛИТЕ** её
3. **ДОБАВЬТЕ** новую переменную:
   - Name: `BACKEND_URL` (с буквой L в конце!)
   - Value: `https://dev.neon-chuckwalla.ts.net` (БЕЗ trailing slash!)

### Шаг 2: Добавить server-side токены (опционально)

Для server-side authentication (если хотите скрыть токены от браузера):

1. **Добавить** переменную:
   - Name: `FIREFLY_TOKEN`
   - Value: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOWQzZjU5ZWY4ZmE2ZjliYWUyYTgyZDc0ODgyYWExOWJlZDgzMjI0ODkxNWViZDQwYjI3YjRjZGRiZjcxMjMzMjgwMTIwNmRkNzcyYWY5MTMiLCJpYXQiOjE3NTI3MzIzNjQuMTM5NDA3LCJuYmYiOjE3NTI3MzIzNjQuMTM5NDEsImV4cCI6MTc4NDI2ODM2My45ODU3MjQsInN1YiI6IjEiLCJzY29wZXMiOltdfQ.IYiWJlwIAHSl0emwz2QfUoOnuKgvv1Iz0_UEdXAlchgMiYdg6qQQUBSAxBOjzjgtpd5agD961ixSuRvsfiKMOZfpvTgMX7L83uLENgT3yLvuwVzbbfFNrAe9YFiL-KhqSC-JL-zSuReIHC8yBmrBEShiZzrg7tYeCkoZozqwR0IhpocoNet1LFqyIjUeC7p_20oOTjscroqtFYCPS7258a4vK6Akk-LgljAUFC5FZkxAYzziub_jpCq0MMdyzz644i9G6ipVA2q2dF5LKD1sTFiuOD-n0K0SAwCqSCZcqifA1tifo798p7y3ZujE7AVAW-hBrWi9BWgCCipcQYuMKz3_FefkvjZFCZ8QqlX7WGZWbA2yjgESNJK8noAepxkH8srSufGX5Dk2iIJj34giCp515D3X-IWjnn0UcnEqzYanCdXR4RyaijJVMmfDHwj3PBDC-r9hBh5KyjMzto8jpzPO98UYFjVdebZ7SEQO01CMnLCk0rNnEaXGSx77Qn_d4qUEveN0c-nK84bhuYOHebyXkFKANcBzYQO7Y_NfhtJpfF49WwG0W9sgieek9Q-mGnS9rBFzgQRgvWveruEwRxMFJTuDzoaIdlqhfJRgrFeticpK1QJg0ayoxs5bD25DuKgGrFVP4MR6iQyU7o5PYkBRBbyA3nrS-KlueiUJXrc`

2. **Добавить** переменную:
   - Name: `SYNC_API_KEY`
   - Value: `sk_sync_2f952db378162b9942f3d85929c79d2fb5795b73246b75439983187ce922a99b`

**Примечание**: Эти переменные опциональны. Если их не установить, middleware будет использовать токены из client-side переменных (`VITE_FIREFLY_TOKEN` и `VITE_SYNC_API_KEY`).

### Шаг 3: Удалить устаревшую переменную

- **УДАЛИТЕ** переменную `VITE_BASE_URL` (больше не используется)

### Шаг 4: Redeploy

После изменения переменных окружения:
1. Зайдите в раздел **Deployments**
2. Найдите последний deployment
3. Нажмите **"Retry deployment"** или создайте новый commit

## Финальный список переменных

После исправления у вас должны быть:

```
✅ BACKEND_URL = https://dev.neon-chuckwalla.ts.net
✅ VITE_FIREFLY_TOKEN = eyJ0eXAiOiJKV1QiLCJhbGci...
✅ VITE_SYNC_API_KEY = sk_sync_2f952db378162b9942f3d85929c79d2fb5795b73246b75439983187ce922a99b
✅ VITE_TELEGRAM_BOT_TOKEN = 7287096901:AAEXbITi_...
✅ VITE_TELEGRAM_BOT_USERNAME = budgetbot

⚠️ FIREFLY_TOKEN = (опционально, для server-side auth)
⚠️ SYNC_API_KEY = (опционально, для server-side auth)
```

## Проверка после исправления

1. **Откройте debug endpoint**:
   ```
   https://budgetbot-tg-mini-app.kayukov2010.workers.dev/api/debug
   ```

2. **Проверьте ответ**:
   ```json
   {
     "environment": {
       "BACKEND_URL": "https://dev.neon-chuckwalla.ts.net",  // ✅ должно быть установлено
       "FIREFLY_TOKEN": "✓ Configured",                      // ✓ опционально
       "SYNC_API_KEY": "✓ Configured"                        // ✓ опционально
     },
     "diagnostics": {
       "configurationStatus": "✓ Configuration looks good"   // ✅ должно быть OK
     }
   }
   ```

3. **Откройте приложение**:
   ```
   https://budgetbot-tg-mini-app.kayukov2010.workers.dev
   ```

4. **Перейдите в Debug** (кнопка внизу экрана)

5. **Проверьте статусы**:
   - Sync API: должен быть ✅ **CONNECTED**
   - Firefly API: должен быть ✅ **CONNECTED**

## Разница между переменными с VITE_ и без

### БЕЗ префикса VITE_ (server-side)
```
BACKEND_URL     → используется в functions/_middleware.ts
FIREFLY_TOKEN   → используется в functions/_middleware.ts
SYNC_API_KEY    → используется в functions/_middleware.ts
```

Эти переменные доступны **только на сервере** (Cloudflare Pages Functions) и **НЕ** попадают в браузер.

### С префиксом VITE_ (client-side)
```
VITE_FIREFLY_TOKEN    → используется в браузере (src/)
VITE_SYNC_API_KEY     → используется в браузере (src/)
```

Эти переменные **встраиваются в JavaScript bundle** и доступны в браузере через `import.meta.env.VITE_*`.

## Почему нужны обе версии?

- **Client-side** (`VITE_*`): Браузер делает запросы с этими токенами
- **Server-side** (без `VITE_`): Если браузер НЕ отправил токен, middleware может добавить его автоматически

Это дает гибкость:
1. Если `VITE_FIREFLY_TOKEN` установлен → браузер сам отправляет токен
2. Если НЕ установлен → middleware использует server-side `FIREFLY_TOKEN`

## Troubleshooting

### "BACKEND_URL not configured"
- Проверьте правильность написания: `BACKEND_URL` (с буквой `L` в конце)
- Убедитесь, что нет trailing slash: `https://dev.neon-chuckwalla.ts.net` (без `/` в конце)

### "API shows as disconnected"
- Убедитесь, что `BACKEND_URL` установлен правильно
- Проверьте, что backend доступен из Cloudflare network
- Проверьте, что Tailscale настроен правильно (`.ts.net` домен)

### "403 Access denied"
- Cloudflare Worker не может получить доступ к Tailscale сети
- Backend защищен и блокирует запросы от Cloudflare
- Возможно, нужно настроить Cloudflare Tunnel
