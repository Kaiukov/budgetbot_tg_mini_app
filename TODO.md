# Budget Mini App - TODO & Roadmap

**Последнее обновление:** 2025-11-04
**Версия:** 1.0.0
**Статус проекта:** В активной разработке

---

## 📋 Оглавление

1. [Текущие приоритеты](#текущие-приоритеты)
2. [Запланированные функции](#запланированные-функции)
3. [Технические улучшения](#технические-улучшения)
4. [Рекомендации от Claude](#рекомендации-от-claude)
5. [Архитектурные решения](#архитектурные-решения)
6. [Известные проблемы](#известные-проблемы)
7. [Долгосрочная перспектива](#долгосрочная-перспектива)

---

## 🎯 Текущие приоритеты

### 1. Завершить Expense/Income/Transfer Flow ⏳
**Статус:** В процессе
**Приоритет:** 🔴 Критический

#### Что нужно сделать:
- [ ] **Expense Flow**
  - [x] Выбор аккаунта (AccountsScreen)
  - [x] Ввод суммы (AmountScreen)
  - [x] Выбор категории (CategoryScreen)
  - [x] Комментарий (CommentScreen)
  - [x] Подтверждение (ConfirmScreen)
  - [ ] Обработка ошибок при создании транзакции
  - [ ] Отображение успешного создания с transaction ID
  - [ ] Возврат на главный экран после успеха

- [ ] **Income Flow**
  - [x] Выбор аккаунта назначения
  - [x] Ввод суммы
  - [x] Выбор категории дохода
  - [x] Подтверждение (IncomeConfirmScreen)
  - [ ] Интеграция с Firefly API для создания deposit транзакций
  - [ ] Валидация источников дохода

- [ ] **Transfer Flow**
  - [x] Выбор source account (TransferAmountScreen)
  - [x] Выбор destination account
  - [x] Ввод суммы и комиссии (TransferFeeScreen)
  - [x] Подтверждение (TransferConfirmScreen)
  - [ ] Поддержка разных валют (мультивалютный перевод)
  - [ ] Автоматический расчет exchange rate
  - [ ] Создание transfer транзакции в Firefly III

#### Файлы для изменения:
- `src/BudgetMiniApp.tsx` - основная логика флоу
- `src/components/ConfirmScreen.tsx` - доработка обработки успеха/ошибок
- `src/components/IncomeConfirmScreen.tsx` - интеграция с API
- `src/components/TransferConfirmScreen.tsx` - полная реализация transfer
- `src/services/firefly/transactions.ts:543` - реализовать поиск по external_id (TODO в коде)
- `src/services/firefly/transactions.ts:590` - реализовать sync trigger (TODO в коде)

---

### 2. Supabase Backend для Firefly API 🔐
**Статус:** Не начато
**Приоритет:** 🔴 Критический

#### Зачем:
- Скрыть Firefly III токен от клиента
- Добавить валидацию пользователей по Telegram ID
- Централизованное логирование транзакций
- Rate limiting и защита от злоупотреблений

#### Что нужно сделать:
- [ ] **Supabase Edge Functions**
  - [ ] Создать Edge Function `create-transaction`
    - Endpoint: `POST /functions/v1/create-transaction`
    - Входные данные: `{ telegram_id, transaction_data }`
    - Валидация пользователя по `telegram_id` в Supabase DB
    - Проксирование запроса в Firefly III API с backend токеном
    - Логирование в таблицу `transaction_logs`

  - [ ] Создать Edge Function `validate-user`
    - Endpoint: `POST /functions/v1/validate-user`
    - Проверка существования пользователя
    - Проверка прав доступа

- [ ] **Supabase Database Schema**
  ```sql
  -- Таблица пользователей
  CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    firefly_user_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Таблица логов транзакций
  CREATE TABLE transaction_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    transaction_type VARCHAR(50), -- 'expense', 'income', 'transfer'
    firefly_transaction_id VARCHAR(255),
    external_id VARCHAR(255),
    amount DECIMAL(15, 2),
    currency_code VARCHAR(10),
    status VARCHAR(50), -- 'pending', 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Индексы для производительности
  CREATE INDEX idx_users_telegram_id ON users(telegram_id);
  CREATE INDEX idx_transaction_logs_user_id ON transaction_logs(user_id);
  CREATE INDEX idx_transaction_logs_status ON transaction_logs(status);
  ```

- [ ] **Frontend Integration**
  - [ ] Создать `src/services/supabase.ts`
  - [ ] Заменить прямые вызовы Firefly API на Supabase Edge Functions
  - [ ] Обновить `.env.example` с Supabase URL и anon key
  - [ ] Удалить `VITE_FIREFLY_TOKEN` из frontend environment

- [ ] **Security & Auth**
  - [ ] Настроить Row Level Security (RLS) в Supabase
  - [ ] Добавить JWT валидацию для Telegram initData
  - [ ] Rate limiting через Supabase (100 requests/min per user)

#### Файлы для создания:
- `supabase/functions/create-transaction/index.ts`
- `supabase/functions/validate-user/index.ts`
- `supabase/migrations/001_initial_schema.sql`
- `src/services/supabase.ts`
- `src/config/supabase.ts`

#### Файлы для изменения:
- `src/components/ConfirmScreen.tsx`
- `src/components/IncomeConfirmScreen.tsx`
- `src/components/TransferConfirmScreen.tsx`
- `.env.example`

---

### 3. Переделать Transactions Feature на Supabase 🔄
**Статус:** Не начато
**Приоритет:** 🟡 Высокий

#### Что нужно сделать:
- [ ] **Backend (Supabase)**
  - [ ] Создать Edge Function `get-transactions`
    - Получение транзакций из Firefly III
    - Кэширование в Supabase Database
    - Фильтрация по пользователю

  - [ ] Таблица для кэширования транзакций
    ```sql
    CREATE TABLE cached_transactions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(telegram_id),
      firefly_transaction_id VARCHAR(255),
      transaction_data JSONB,
      cached_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    );
    ```

- [ ] **Frontend**
  - [ ] Создать `src/hooks/useTransactions.ts`
    - Загрузка транзакций через Supabase
    - Pagination support
    - Фильтры (по дате, категории, аккаунту)

  - [ ] Создать компонент `TransactionsScreen.tsx`
    - Список транзакций
    - Поиск и фильтры
    - Pull-to-refresh
    - Infinite scroll

- [ ] **Дизайнерские баги**
  - [ ] Исправить отступы в TransactionsScreen (если есть)
  - [ ] Добавить skeleton loaders при загрузке
  - [ ] Улучшить анимации переходов
  - [ ] Адаптировать цвета под Telegram theme
  - [ ] Проверить responsive layout на разных устройствах

#### Файлы для создания:
- `supabase/functions/get-transactions/index.ts`
- `supabase/migrations/002_cached_transactions.sql`
- `src/hooks/useTransactions.ts`
- `src/components/TransactionsScreen.tsx`

---

### 4. Реализовать Budgets Feature 💰
**Статус:** Не начато
**Приоритет:** 🟡 Высокий

#### Контекст:
Firefly III API возвращает данные с `pc_*` полями (primary currency amounts) - это EUR эквиваленты для всех транзакций. Это позволяет корректно подсчитывать бюджеты независимо от валюты транзакции.

#### Что нужно сделать:
- [ ] **Backend Integration**
  - [ ] Создать `src/services/firefly/budgets.ts`
    ```typescript
    interface Budget {
      id: string;
      name: string;
      currency_code: string;
      monthly_amount: number;
      spent_amount: number; // Calculated from pc_amount
      remaining: number;
      period_start: string;
      period_end: string;
    }

    // Получить бюджеты
    async getBudgets(): Promise<Budget[]>

    // Получить транзакции бюджета за период
    async getBudgetTransactions(budgetId: string, start: string, end: string): Promise<Transaction[]>

    // Подсчитать потраченную сумму в EUR (используя pc_amount)
    async calculateBudgetSpent(budgetId: string, start: string, end: string): Promise<number>
    ```

  - [ ] Реализовать функцию подсчета с учетом `pc_amount`
    ```typescript
    const calculateSpentEUR = (transactions: Transaction[]) => {
      return transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => {
          const pcAmount = parseFloat(t.pc_amount);
          return sum + Math.abs(pcAmount);
        }, 0);
    };
    ```

- [ ] **Frontend Components**
  - [ ] Создать `src/components/BudgetsScreen.tsx`
    - Список бюджетов с прогресс-барами
    - Цветовая индикация (зеленый - в рамках, желтый - близко к лимиту, красный - превышен)
    - Monthly view по умолчанию

  - [ ] Создать `src/components/BudgetDetailScreen.tsx`
    - Детальная информация по бюджету
    - График расходов по дням
    - Список транзакций в рамках бюджета
    - Фильтры по периоду

  - [ ] Создать `src/hooks/useBudgets.ts`
    - Загрузка бюджетов
    - Кэширование
    - Real-time updates

- [ ] **N8N/Cloudflare Workers для расчетов (опционально)**
  - [ ] Создать Cloudflare Worker `budget-calculator`
    - Endpoint: `GET /api/budgets/calculate/:budgetId`
    - Параметры: `start`, `end`
    - Использует `pc_amount` для подсчета
    - Кэширование результатов на 15 минут

  - [ ] N8N workflow для ночного обновления
    - Запуск каждую ночь в 2:00 AM
    - Обновление всех бюджетов
    - Сохранение в Supabase
    - Отправка уведомлений пользователям о превышении бюджета

- [ ] **UI/UX**
  - [ ] Иконки для категорий бюджета
  - [ ] Анимированные прогресс-бары
  - [ ] Push-уведомления при превышении 80% бюджета
  - [ ] Swipe-to-edit для быстрого редактирования лимитов

#### Пример кода для работы с Firefly API:
```typescript
// Получение транзакций бюджета
const response = await fetch(
  `${FIREFLY_BASE}/api/v1/budgets/${budgetId}/transactions?start=${start}&end=${end}&limit=1000`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const data = await response.json();

// Подсчет в EUR используя pc_amount
let spentEUR = 0;
for (const journal of data.data || []) {
  for (const split of journal.attributes?.transactions || []) {
    const pcAmount = parseFloat(split.pc_amount);
    if (split.type === 'withdrawal' && !isNaN(pcAmount)) {
      spentEUR += Math.abs(pcAmount);
    }
  }
}
```

#### Файлы для создания:
- `src/services/firefly/budgets.ts`
- `src/components/BudgetsScreen.tsx`
- `src/components/BudgetDetailScreen.tsx`
- `src/hooks/useBudgets.ts`
- `functions/budget-calculator/index.ts` (Cloudflare Worker)

#### Файлы для изменения:
- `src/components/HomeScreen.tsx` - добавить навигацию к Budgets
- `src/BudgetMiniApp.tsx` - добавить routing для budgets screens

---

### 5. Страница Accounts 🏦
**Статус:** Не начато
**Приоритет:** 🟢 Средний

#### Что нужно сделать:
- [ ] **Компонент AccountsPage**
  - [ ] Создать `src/components/AccountsPage.tsx`
    - Список всех аккаунтов пользователя
    - Балансы в нативной валюте
    - Балансы в EUR/USD (используя API поля `balance_in_EUR`, `balance_in_USD`)
    - Группировка по типу (asset accounts, cash accounts, etc.)

  - [ ] Создать `src/components/AccountCard.tsx`
    - Карточка аккаунта с балансом
    - Иконка валюты
    - Цветовая индикация (положительный/отрицательный баланс)
    - Click-to-expand для деталей

  - [ ] Создать `src/components/AccountDetailScreen.tsx`
    - Детальная информация по аккаунту
    - История транзакций аккаунта
    - Быстрые действия (добавить expense/income/transfer)
    - График баланса за период

- [ ] **Функционал**
  - [ ] Поиск аккаунтов
  - [ ] Фильтр по валюте
  - [ ] Фильтр по типу аккаунта
  - [ ] Сортировка (по балансу, по имени, по использованию)
  - [ ] Pull-to-refresh для обновления балансов

- [ ] **Интеграция с Sync API**
  - [ ] Использовать существующий `syncService.getAccountsUsage()`
  - [ ] Отображение `usage_count` - как часто используется аккаунт
  - [ ] Real-time обновление балансов

- [ ] **UI/UX**
  - [ ] Анимации при открытии карточек
  - [ ] Skeleton loaders
  - [ ] Empty state при отсутствии аккаунтов
  - [ ] Swipe-to-action (быстрый expense/income)

#### Файлы для создания:
- `src/components/AccountsPage.tsx`
- `src/components/AccountCard.tsx`
- `src/components/AccountDetailScreen.tsx`
- `src/hooks/useAccountDetail.ts`

#### Файлы для изменения:
- `src/components/HomeScreen.tsx` - добавить навигацию к Accounts page
- `src/BudgetMiniApp.tsx` - routing для accounts screens

---

## 🔧 Технические улучшения

### Testing & Quality Assurance 🧪
**Приоритет:** 🟡 Высокий

- [ ] **Unit Tests**
  - [ ] Установить Vitest
    ```bash
    npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
    ```
  - [ ] Тесты для сервисов
    - `src/services/firefly/transactions.test.ts`
    - `src/services/sync.test.ts`
  - [ ] Тесты для утилит
    - `src/utils/formatCurrency.test.ts`
    - `src/utils/categoryFilter.test.ts`
  - [ ] Настроить coverage reporting (цель: 80%+)

- [ ] **Integration Tests**
  - [ ] Тесты для API интеграции
  - [ ] Mock Firefly API responses
  - [ ] Тесты для Telegram WebApp integration

- [ ] **E2E Tests**
  - [ ] Установить Playwright
  - [ ] Тесты для основных флоу
    - Expense flow от начала до конца
    - Income flow
    - Transfer flow

### Валидация данных 📝
**Приоритет:** 🟡 Высокий

- [ ] Установить Zod для валидации
  ```bash
  npm install zod
  ```
- [ ] Создать схемы валидации
  - `src/validation/transaction.schema.ts`
  - `src/validation/account.schema.ts`
  - `src/validation/category.schema.ts`
- [ ] Валидация на frontend перед отправкой
- [ ] Валидация на backend (Supabase Edge Functions)

### Error Handling & UX 🚨
**Приоритет:** 🟡 Высокий

- [ ] **Global Error Boundary**
  - [ ] Создать `src/components/ErrorBoundary.tsx`
  - [ ] Красивая страница ошибки
  - [ ] Кнопка "Report Bug"

- [ ] **Toast Notifications**
  - [ ] Установить toast library (sonner или react-hot-toast)
  - [ ] Стандартизировать сообщения об ошибках
  - [ ] Success/Error/Warning/Info типы

- [ ] **Offline Support**
  - [ ] Определение offline состояния
  - [ ] Отображение offline indicator
  - [ ] Очередь запросов для отправки при восстановлении соединения

### State Management 🗂️
**Приоритет:** 🟢 Средний

- [ ] **Рассмотреть Zustand**
  - Сейчас: useState в `BudgetMiniApp.tsx`
  - Проблема: Prop drilling
  - Решение: Zustand для глобального состояния

- [ ] Создать stores
  - `src/stores/userStore.ts`
  - `src/stores/transactionStore.ts`
  - `src/stores/accountStore.ts`

### Performance Optimization ⚡
**Приоритет:** 🟢 Средний

- [ ] **Code Splitting**
  - [ ] React.lazy для screens
  - [ ] Dynamic imports для тяжелых компонентов
  - [ ] Анализ bundle size (vite-bundle-visualizer)

- [ ] **Caching Strategy**
  - [ ] Service Worker для offline
  - [ ] IndexedDB для persistent cache
  - [ ] Optimize Sync API cache (уже есть 60s cache, проверить эффективность)

- [ ] **Image Optimization**
  - [ ] Lazy loading для user photos
  - [ ] Placeholder images
  - [ ] WebP format support

---

## 💡 Рекомендации от Claude

### 1. Безопасность 🔐
**Приоритет:** 🔴 Критический

#### Текущие проблемы:
- ✅ Firefly token хранится в `.env`, но доступен на клиенте через `VITE_FIREFLY_TOKEN`
- ⚠️ Нет валидации Telegram initData на бэкенде
- ⚠️ Нет rate limiting для API запросов

#### Рекомендации:
- [x] **Планируется:** Переход на Supabase backend (см. пункт 2)
- [ ] **Дополнительно:**
  - [ ] Валидация Telegram initData через crypto signature
    ```typescript
    // src/utils/telegramAuth.ts
    import crypto from 'crypto';

    export const validateTelegramData = (initData: string, botToken: string): boolean => {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      const calculatedHash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    };
    ```
  - [ ] Content Security Policy (CSP) headers
  - [ ] HTTPS-only cookies для session management
  - [ ] Input sanitization для всех форм

### 2. Документация 📚
**Приоритет:** 🟢 Средний

- [ ] **API Documentation**
  - [ ] Дополнить `API.md` примерами запросов
  - [ ] Добавить Postman collection
  - [ ] OpenAPI/Swagger спецификация

- [ ] **Component Documentation**
  - [ ] JSDoc комментарии для всех компонентов
  - [ ] Storybook для UI components (опционально)
  - [ ] Props documentation

- [ ] **Developer Guide**
  - [ ] Создать `CONTRIBUTING.md`
  - [ ] Создать `ARCHITECTURE.md`
  - [ ] Setup guide для новых разработчиков

### 3. Мониторинг & Analytics 📊
**Приоритет:** 🟢 Средний

- [ ] **Error Tracking**
  - [ ] Интеграция с Sentry
  - [ ] Source maps для production
  - [ ] User context в error reports

- [ ] **Analytics**
  - [ ] Google Analytics 4 или Plausible
  - [ ] Отслеживание конверсий (сколько транзакций создано)
  - [ ] Performance metrics (Core Web Vitals)

- [ ] **Logging**
  - [ ] Структурированное логирование
  - [ ] Log levels (debug, info, warn, error)
  - [ ] Log aggregation (CloudWatch или Datadog)

### 4. Accessibility (A11y) ♿
**Приоритет:** 🟢 Низкий

- [ ] ARIA labels для interactive elements
- [ ] Keyboard navigation support
- [ ] Screen reader testing
- [ ] Color contrast compliance (WCAG 2.1 AA)

### 5. Интернационализация (i18n) 🌍
**Приоритет:** 🟢 Низкий (для будущего)

- [ ] Установить i18next
- [ ] Поддержка языков
  - [ ] English (en)
  - [ ] Ukrainian (uk)
  - [ ] Russian (ru)
- [ ] Локализация дат и валют
- [ ] RTL support для арабского/иврита (если нужно)

### 6. PWA Capabilities 📱
**Приоритет:** 🟢 Средний

- [ ] **Service Worker**
  - [ ] Offline support
  - [ ] Background sync для транзакций
  - [ ] Push notifications

- [ ] **Manifest.json**
  - [ ] App icons (разные размеры)
  - [ ] Splash screens
  - [ ] Theme colors

- [ ] **Install Prompt**
  - [ ] "Add to Home Screen" промпт
  - [ ] Custom install UI

---

## 🏗️ Архитектурные решения

### Текущая архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram Mini App                     │
│                  (React + TypeScript)                    │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│   Sync API       │              │  Firefly III API │
│  (Cache Layer)   │◄─────────────│  (Direct calls)  │
│  Cloudflare      │              │                  │
└──────────────────┘              └──────────────────┘
```

### Планируемая архитектура (после Supabase)

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram Mini App                     │
│                  (React + TypeScript)                    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ (Только anon key)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Backend                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Edge Functions (Auth + Proxy)            │   │
│  │  • validate-user (Telegram ID check)             │   │
│  │  • create-transaction (Proxy to Firefly)         │   │
│  │  • get-transactions (Cache + Firefly)            │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database                      │   │
│  │  • users                                         │   │
│  │  • transaction_logs                              │   │
│  │  • cached_transactions                           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          │                                 │
          │ (Firefly token)                 │ (Sync token)
          ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│  Firefly III API │              │   Sync API       │
│                  │              │  (Cache Layer)   │
└──────────────────┘              └──────────────────┘
```

### Преимущества новой архитектуры:
1. **Безопасность:** Токены не доступны на клиенте
2. **Валидация:** Проверка пользователей через Telegram ID
3. **Аудит:** Логирование всех транзакций
4. **Rate Limiting:** Защита от abuse
5. **Кэширование:** Суперscale в Supabase PostgreSQL

---

## 🐛 Известные проблемы

### Critical Bugs
- [ ] **TODO в коде:**
  - `src/services/firefly/transactions.ts:543` - Не реализован поиск по external_id
  - `src/services/firefly/transactions.ts:590` - Не реализован sync trigger

### Minor Issues
- [ ] Отсутствие loading states в некоторых компонентах
- [ ] Неполная обработка ошибок сети
- [ ] Нет retry logic для failed requests
- [ ] Telegram Back Button не работает на всех экранах

### Design Issues
- [ ] Проверить spacing/padding на разных устройствах
- [ ] Консистентность цветов (некоторые hardcoded вместо theme)
- [ ] Анимации переходов между экранами
- [ ] Icon sizes не консистентны

---

## 🚀 Долгосрочная перспектива

### Phase 1: Core Features (Q1 2025) ✅ В процессе
- [x] Expense flow
- [x] Income flow
- [x] Transfer flow
- [ ] Supabase backend
- [ ] Basic error handling

### Phase 2: Enhancement (Q2 2025)
- [ ] Budgets feature
- [ ] Accounts page
- [ ] Transactions history
- [ ] Search & Filters
- [ ] Unit tests

### Phase 3: Advanced Features (Q3 2025)
- [ ] Reports & Analytics
- [ ] Budget alerts
- [ ] Recurring transactions
- [ ] Multi-currency advanced features
- [ ] Export data (CSV, PDF)

### Phase 4: Optimization (Q4 2025)
- [ ] PWA capabilities
- [ ] Offline support
- [ ] Performance optimization
- [ ] A/B testing
- [ ] i18n support

### Phase 5: Ecosystem (2026+)
- [ ] Desktop app (Electron)
- [ ] Widget для Telegram
- [ ] API для third-party интеграций
- [ ] Machine learning для категоризации
- [ ] Финансовые insights и рекомендации

---

## 📈 Метрики успеха

### Технические метрики
- [ ] **Performance:**
  - Lighthouse score > 90
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s

- [ ] **Quality:**
  - Test coverage > 80%
  - Zero critical bugs
  - < 5 minor bugs

- [ ] **Reliability:**
  - Uptime > 99.9%
  - Error rate < 0.1%

### Бизнес метрики
- [ ] Daily Active Users (DAU)
- [ ] Transactions created per day
- [ ] User retention rate
- [ ] Average session duration

---

## 📝 Примечания

### Полезные ссылки:
- **Firefly III API Docs:** https://docs.firefly-iii.org/api/
- **Telegram Bot API:** https://core.telegram.org/bots/webapps
- **Supabase Docs:** https://supabase.com/docs
- **Production URL:** https://budgetbot-tg-mini-app.kayukov2010.workers.dev/

### Команды для разработки:
```bash
# Development
npm run dev

# Build
npm run build

# Tests (когда настроены)
npm run test
npm run test:coverage

# Linting
npm run lint
```

### Environment Variables:
См. `.env.example` для полного списка переменных окружения.

---

**Последнее обновление:** 2025-11-04
**Составлено:** Claude (AI Assistant)
**Для вопросов:** Обращаться к @Kaiukov

---

## 🎉 Заключение

Этот документ будет регулярно обновляться по мере развития проекта. Если есть вопросы или предложения - создавайте Issues в GitHub или обсуждайте в команде.

**Помни:** Качество важнее скорости. Лучше сделать меньше, но хорошо, чем много и плохо.

Good luck! 🚀
