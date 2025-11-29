Да, вот как твой текст → превращается в **нормальный XState-автомат на TS** для всего Expanse flow (Home → Accounts → Amount → Categories → Comment → Confirmation + отправка).

Ниже — один файл, который можно назвать, например, `expenseFlowMachine.ts`.

---

## 1. Типы контекста и событий

```ts
// expenseFlowMachine.ts
import { createMachine, assign } from 'xstate';

export type Account = {
  id: string;
  name: string;
  currency: string;
};

export type Category = {
  id: string;
  name: string;       // с эмодзи
  budgetName: string; // без эмодзи
};

export type DestinationSuggestion = {
  id: string;
  name: string;
};

export type ExpenseDraft = {
  user_name?: string;

  account_id?: string;
  account_name?: string;
  account_currency?: string;

  amount?: number;
  amount_eur?: number;

  category_id?: string;
  category_name?: string;
  budget_name?: string;

  destination_id?: string;
  destination_name?: string;

  date?: string; // ISO timestamp на Confirmation
};

export type ExpenseFlowContext = {
  draft: ExpenseDraft;
  accountsCache: Account[];
  categoriesCache: Category[];
  destinationSuggestions: DestinationSuggestion[];
  error?: string | null;
};

export type ExpenseFlowEvent =
  | { type: 'LOAD_CACHES'; accounts: Account[]; categories: Category[] }
  | { type: 'START_EXPENSE_FLOW'; userName: string } // Home → Accounts
  | { type: 'BACK_TO_HOME' }                         // Accounts → Home
  | { type: 'SELECT_ACCOUNT'; account: Account }
  | { type: 'NEXT_FROM_ACCOUNTS' }

  | { type: 'SET_AMOUNT'; amount: number; amountEur: number }
  | { type: 'NEXT_FROM_AMOUNT' }
  | { type: 'BACK_TO_ACCOUNTS' }

  | { type: 'SELECT_CATEGORY'; category: Category }
  | { type: 'NEXT_FROM_CATEGORY' }
  | { type: 'BACK_TO_AMOUNT' }

  | { type: 'SET_DESTINATION'; id?: string; name: string }
  | { type: 'NEXT_FROM_COMMENT' }
  | { type: 'BACK_TO_CATEGORY' }
  | { type: 'SET_DESTINATION_SUGGESTIONS'; list: DestinationSuggestion[] }

  | { type: 'BACK_TO_COMMENT' }
  | { type: 'SUBMIT' }

  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE'; error: string }

  | { type: 'RESET_FLOW' }
  | { type: 'RETRY_SUBMIT' };
```

---

## 2. Начальный контекст

```ts
const initialContext: ExpenseFlowContext = {
  draft: {},
  accountsCache: [],
  categoriesCache: [],
  destinationSuggestions: [],
  error: null,
};
```

---

## 3. Машина состояний (FSM) по твоей спецификации

```ts
export const expenseFlowMachine = createMachine<
  ExpenseFlowContext,
  ExpenseFlowEvent
>({
  id: 'expenseFlow',
  initial: 'home',
  context: initialContext,
  states: {
    /** 1. HOME (кнопка "расходы") */
    home: {
      on: {
        LOAD_CACHES: {
          actions: 'setCaches', // /get_accounts_usage, /get_categories_usage?type=withdrawal
        },
        START_EXPENSE_FLOW: {
          target: 'accounts',
          actions: 'initDraftWithUserName',
        },
      },
    },

    /** 2. CHOOSE ACCOUNTS */
    accounts: {
      on: {
        SELECT_ACCOUNT: {
          actions: 'selectAccount', // с логикой сброса amount/amount_eur если счёт изменился
        },
        NEXT_FROM_ACCOUNTS: {
          target: 'amount',
          cond: 'isAccountValid',
        },
        BACK_TO_HOME: {
          target: 'home',
          actions: 'resetDraftKeepCaches', // стереть draft, но оставить кэш
        },
      },
    },

    /** 3. AMOUNT */
    amount: {
      on: {
        SET_AMOUNT: {
          actions: 'setAmount', // amount + amount_eur (после конвертации)
        },
        NEXT_FROM_AMOUNT: {
          target: 'categories',
          cond: 'isAmountValid',
        },
        BACK_TO_ACCOUNTS: {
          target: 'accounts', // amount/amount_eur остаются; при смене счёта чистятся в selectAccount
        },
      },
    },

    /** 4. CATEGORIES */
    categories: {
      on: {
        SELECT_CATEGORY: {
          actions: 'selectCategory', // category_id, category_name, budget_name
        },
        NEXT_FROM_CATEGORY: {
          target: 'comment',
          cond: 'isCategoryValid',
        },
        BACK_TO_AMOUNT: {
          target: 'amount', // сумма остаётся и должна подставляться в UI
        },
      },
    },

    /** 5. COMMENT / DESTINATION NAME */
    comment: {
      entry: 'clearError',
      on: {
        SET_DESTINATION_SUGGESTIONS: {
          actions: 'setDestinationSuggestions', // /get_destination_name_usage
        },
        SET_DESTINATION: {
          actions: 'setDestination',
        },
        NEXT_FROM_COMMENT: {
          target: 'confirmation',
          cond: 'isDestinationValid',
        },
        BACK_TO_CATEGORY: {
          target: 'categories',
          actions: 'clearDestinationSuggestions', // стереть список подсказок
        },
      },
    },

    /** 6. CONFIRMATION */
    confirmation: {
      on: {
        BACK_TO_COMMENT: {
          target: 'comment',
        },
        SUBMIT: {
          target: 'submitting',
          cond: 'isAllDataValid',
          actions: ['setConfirmationDate', 'clearError'],
        },
      },
    },

    /** Отправка (safe to firefly) */
    submitting: {
      on: {
        SUBMIT_SUCCESS: {
          target: 'success',
        },
        SUBMIT_FAILURE: {
          target: 'error',
          actions: 'setError',
        },
      },
    },

    /** Успех */
    success: {
      on: {
        RESET_FLOW: {
          target: 'home',
          actions: 'resetDraftKeepCaches',
        },
      },
    },

    /** Ошибка отправки */
    error: {
      on: {
        RETRY_SUBMIT: {
          target: 'submitting',
        },
        BACK_TO_COMMENT: {
          target: 'comment',
        },
      },
    },
  },
},
{
  /** GUARDS (валидаторы шагов) */
  guards: {
    // Choose Accounts: user_name + account_* обязательны
    isAccountValid: (ctx) =>
      !!ctx.draft.user_name &&
      !!ctx.draft.account_id &&
      !!ctx.draft.account_currency,

    // Amount: amount > 0 и есть amount_eur
    isAmountValid: (ctx) =>
      typeof ctx.draft.amount === 'number' &&
      ctx.draft.amount > 0 &&
      typeof ctx.draft.amount_eur === 'number' &&
      ctx.draft.amount_eur > 0,

    // Categories: должны быть category_id и category_name
    isCategoryValid: (ctx) =>
      !!ctx.draft.category_id && !!ctx.draft.category_name,

    // Comment: хотя бы destination_name (id может быть undefined для нового)
    isDestinationValid: (ctx) =>
      !!ctx.draft.destination_name,

    // Confirmation: все обязательные поля + date (ставится при SUBMIT)
    isAllDataValid: (ctx) => {
      const d = ctx.draft;
      return !!(
        d.user_name &&
        d.account_id &&
        d.account_currency &&
        typeof d.amount === 'number' &&
        typeof d.amount_eur === 'number' &&
        d.category_id &&
        d.category_name &&
        d.budget_name &&
        d.destination_name &&
        d.date
      );
    },
  },

  /** ACTIONS (изменения контекста) */
  actions: {
    setCaches: assign((ctx, event) => {
      if (event.type !== 'LOAD_CACHES') return {};
      return {
        accountsCache: event.accounts,
        categoriesCache: event.categories,
      };
    }),

    initDraftWithUserName: assign((ctx, event) => {
      if (event.type !== 'START_EXPENSE_FLOW') return {};
      return {
        draft: {
          user_name: event.userName,
        },
      };
    }),

    resetDraftKeepCaches: assign((ctx) => ({
      draft: {},
      // caches остаются
    })),

    selectAccount: assign((ctx, event) => {
      if (event.type !== 'SELECT_ACCOUNT') return {};
      const account = event.account;
      const prev = ctx.draft;
      const accountChanged =
        prev.account_id && prev.account_id !== account.id;

      return {
        draft: {
          ...prev,
          account_id: account.id,
          account_name: account.name,
          account_currency: account.currency,
          ...(accountChanged
            ? { amount: undefined, amount_eur: undefined }
            : {}),
        },
      };
    }),

    setAmount: assign((ctx, event) => {
      if (event.type !== 'SET_AMOUNT') return {};
      return {
        draft: {
          ...ctx.draft,
          amount: event.amount,
          amount_eur: event.amountEur,
        },
      };
    }),

    selectCategory: assign((ctx, event) => {
      if (event.type !== 'SELECT_CATEGORY') return {};
      const cat = event.category;
      return {
        draft: {
          ...ctx.draft,
          category_id: cat.id,
          category_name: cat.name,
          budget_name: cat.budgetName,
        },
      };
    }),

    setDestinationSuggestions: assign((ctx, event) => {
      if (event.type !== 'SET_DESTINATION_SUGGESTIONS') return {};
      return {
        destinationSuggestions: event.list,
      };
    }),

    clearDestinationSuggestions: assign(() => ({
      destinationSuggestions: [],
    })),

    setDestination: assign((ctx, event) => {
      if (event.type !== 'SET_DESTINATION') return {};
      return {
        draft: {
          ...ctx.draft,
          destination_id: event.id,
          destination_name: event.name,
        },
      };
    }),

    setConfirmationDate: assign((ctx) => ({
      draft: {
        ...ctx.draft,
        date: new Date().toISOString(),
      },
    })),

    setError: assign((ctx, event) => {
      if (event.type !== 'SUBMIT_FAILURE') return {};
      return { error: event.error };
    }),

    clearError: assign(() => ({ error: null })),
  },
});
```

---

### Как это соотносится с твоим описанием и реальной реализацией

* **Home** (HomeScreen)
  – `LOAD_CACHES` → кэш `/get_accounts_usage` и `/get_categories_usage?type=withdrawal` (тип: `withdrawal` для трат).
  – `START_EXPENSE_FLOW` → `accounts`, пишем `user_name`.

  **API Call Pattern:**
  ```ts
  // GET /api/v1/get_accounts_usage?user_name=Kaiukov
  // Ответ:
  {
    "success": true,
    "get_accounts_usage": [
      {
        "account_id": "1",
        "user_name": "Kaiukov",
        "account_name": "Cash EUR",
        "account_currency": "EUR",
        "current_balance": 500,
        "balance_in_USD": 550,
        "usage_count": 15,      // Сортируем по этому!
        "user_has_used": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
  ```

* **Choose Accounts** (AccountsScreen) ✅ РЕАЛЬНАЯ РЕАЛИЗАЦИЯ

  **Smart Sorting & Deduplication:**
  – Показываем счета с `usage_count > 0` в первую очередь (сортируем по usage_count DESC).
  – Неиспользованные счета (`usage_count = 0`) внизу.
  – **Дедупликация**: если в API приходят одинаковые счета → берём с наибольшим usage_count.

  **State Updates:**
  – `SELECT_ACCOUNT` → пишем `account_id`, `account_name`, `account_currency`.
  – **Важно**: если `account_id` изменился → **чистим `amount` и `amount_eur`** (цена привязана к счёту).
  – `NEXT_FROM_ACCOUNTS` с guard `isAccountValid` (нужны: user_name, account_id, account_currency).
  – `BACK_TO_HOME` → `resetDraftKeepCaches` (draft очищен, кэши счетов/категорий живут).

  **UI States:**
  – ⏳ Loading: показываем спинер mientras fetchим.
  – ❌ Error: показываем сообщение ошибки + кнопка "Retry".
  – ✅ Loaded: список счетов в card-view с балансом и иконкой валюты.

  **Optimization:**
  – Пока юзер на accounts → **параллельно pre-load категории** (GET `/api/v1/get_categories_usage?user_name=Kaiukov&type=withdrawal`).
  – Когда перейдём на Amount → категории уже в кэше, нет задержки.

* **Amount** (AmountScreen) 📋 ГОТОВ К ИМПЛЕМЕНТАЦИИ
  – `SET_AMOUNT` → пишем `amount`, `amount_eur` (конвертация EUR ↔ USD уже сделана на уровне UI).
  – Используем `exchange.ts` сервис для конвертации (курс EUR/USD).
  – `NEXT_FROM_AMOUNT` с guard `isAmountValid` (нужны: amount > 0, amount_eur > 0, оба числа).
  – `BACK_TO_ACCOUNTS` → только смена состояния; сумма остаётся (может отредактировать).
  – При смене счёта на accounts → сумма сбросится (в selectAccount action).

* **Categories** (CategoryScreen) 📋 ГОТОВ К ИМПЛЕМЕНТАЦИИ
  – `SELECT_CATEGORY` → пишем `category_id`, `category_name`, `budget_name`.
  – Категории уже в кэше (pre-loaded с accounts page).
  – API Response Shape:
    ```ts
    // GET /api/v1/get_categories_usage?user_name=Kaiukov&type=withdrawal
    {
      "success": true,
      "get_categories_usage": [
        {
          "category_id": "5",
          "user_name": "Kaiukov",
          "category_name": "🍔 Food",       // с эмодзи
          "budget_name": "Food",            // без эмодзи (для API)
          "usage_count": 23,
          "created_at": "...",
          "updated_at": "..."
        }
      ]
    }
    ```
  – `NEXT_FROM_CATEGORY` с guard `isCategoryValid`.
  – `BACK_TO_AMOUNT` → сумма остаётся, категория чистится.

* **Comment / Destination** (DestinationScreen) 📋 ГОТОВ К ИМПЛЕМЕНТАЦИИ
  – При entry в `comment` state → **async загружаем** suggestions (`SET_DESTINATION_SUGGESTIONS` action).
  – Endpoint: GET `/api/v1/get_destination_name_usage?user_name=Kaiukov`.
  – `SET_DESTINATION` → пишем `destination_id` (может быть undefined для нового), `destination_name` (обязательно).
  – `NEXT_FROM_COMMENT` с guard `isDestinationValid` (нужен destination_name).
  – `BACK_TO_CATEGORY` → **очищаем destinationSuggestions** (перезагрузим при re-entry).

* **Confirmation** (ConfirmScreen) 📋 ГОТОВ К ИМПЛЕМЕНТАЦИИ
  – Review всех данных: Аккаунт → Сумма → Категория → Назначение.
  – `SUBMIT` с guard `isAllDataValid` + action `setConfirmationDate` (ISO timestamp).
  – Переходим в `submitting` state (не показываем пользователю, только внутренний статус).
  – дальше `submitting` → `success | error`.

* **Submitting & Error Handling**
  – `submitting`: делаем POST на `/api/v1/add_transaction` с полным draft.
  – `SUBMIT_SUCCESS` → `success` (показываем "✅ Трата создана!").
  – `SUBMIT_FAILURE` → `error` (показываем ошибку, кнопка "Retry" или "Back to Comment").
  – `RETRY_SUBMIT` → опять `submitting`.
  – `BACK_TO_COMMENT` из `error` → возвращаемся на comment page для редактирования.

---

## 4. React Integration (@xstate/react)

### Hook Pattern

```ts
// src/hooks/useExpenseFlow.ts
import { useMachine } from '@xstate/react';
import { expenseFlowMachine } from 'src/machines';

export const useExpenseFlow = () => {
  const [state, send] = useMachine(expenseFlowMachine);

  // Дополнительные helpers
  const isLoading = state.matches('submitting');
  const isError = state.matches('error');
  const currentStep = state.value;

  // Public API
  return {
    state,
    send,
    // Convenience
    isLoading,
    isError,
    currentStep,
  };
};
```

### Component Integration Example (Accounts Screen)

```tsx
// src/components/AccountsScreen.tsx
import { useExpenseFlow } from 'src/hooks/useExpenseFlow';

export const AccountsScreen: React.FC = () => {
  const { state, send } = useExpenseFlow();
  const draft = state.context.draft;
  const accounts = state.context.accountsCache;

  useEffect(() => {
    // Load accounts on entry
    if (accounts.length === 0) {
      loadAccounts();
    }
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await syncService.getAccountsUsage(draft.user_name);

      // Smart sorting: used first
      const sorted = response.get_accounts_usage
        .sort((a, b) => b.usage_count - a.usage_count);

      // Deduplication
      const deduped = deduplicateByUsageCount(sorted);

      // Update caches
      send({
        type: 'LOAD_CACHES',
        accounts: deduped,
        categories: state.context.categoriesCache,
      });
    } catch (error) {
      // Handle error
    }
  };

  const handleSelectAccount = (account: Account) => {
    send({ type: 'SELECT_ACCOUNT', account });
  };

  const handleNext = () => {
    if (isAccountValid(state.context)) {
      send({ type: 'NEXT_FROM_ACCOUNTS' });
    }
  };

  return (
    <div>
      <h2>Choose Account</h2>
      {accounts.map(acc => (
        <div
          key={acc.id}
          onClick={() => handleSelectAccount(acc)}
          className={draft.account_id === acc.id ? 'selected' : ''}
        >
          <div>{acc.name}</div>
          <div>{acc.currency} {acc.balance}</div>
        </div>
      ))}
      <button onClick={handleNext}>Next</button>
      <button onClick={() => send({ type: 'BACK_TO_HOME' })}>Back</button>
    </div>
  );
};
```

---

## 5. Back Navigation Logic (Все шаги)

Все шаги следуют паттерну **incremental data accumulation**:

| Step | Back To | Fields Clear | Cache Keep |
|------|---------|-------------|-----------|
| `accounts` | `home` | **ВСЕ** (user_name, amount, category, etc) | ✅ Accounts & Categories |
| `amount` | `accounts` | **Условно**: amount/amount_eur только если счёт другой | ✅ Все кэши |
| `categories` | `amount` | category fields | ✅ Все кэши |
| `comment` | `categories` | destination fields | ⚠️ Чистим destinationSuggestions |
| `confirmation` | `comment` | (ничего не чистим) | ✅ Все кэши |

---

Если захочешь, могу следующим шагом показать пример, как **тестировать этот автомат** (XState jest tests) и как вешать **side effects** (вызовы API через invoke).
