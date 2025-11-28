# 📊 Полный Flow для Expense (Расход)

## 🔄 Обзор Flow

Expense flow состоит из **5 экранов**, управляемых через state в главном компоненте `BudgetMiniApp`:

```
Home → Accounts → Amount → Category → Comment → Confirm
```

---

## 📱 Детальное описание каждого экрана

### **1. Home Screen → Accounts Screen**

**Навигация:** Пользователь нажимает "Add Expense" на домашнем экране

**State изменения:**
- `currentScreen`: `'home'` → `'accounts'`

**Что происходит:**
- Срабатывает `useEffect` в `BudgetMiniApp.tsx:69-74`, который вызывает `fetchAccounts()`
- Загружаются счета через `syncService.getAccountsUsage()`
- Счета сортируются по частоте использования (наиболее используемые сверху)
- `accounts` state заполняется данными
- BackButton показывается (через Telegram WebApp API)

**BackButton поведение (`BudgetMiniApp.tsx:124-128`):**
```typescript
case 'accounts':
  return () => {
    resetTransactionData();  // Очищаем данные транзакции
    setCurrentScreen('home'); // Возвращаемся на Home
  };
```

---

### **2. Accounts Screen → Amount Screen**

**Навигация:** Пользователь выбирает счет

**State изменения:**
```typescript
// BudgetMiniApp.tsx:378-404
const handleSelectAccount = (accountName: string) => {
  // 1. Очистка предыдущих данных
  resetTransactionData();

  // 2. Поиск полных данных счета
  const selectedAccount = accounts.find(acc => acc.account_name === accountName);

  // 3. Сохранение данных счета в transactionData
  if (selectedAccount) {
    updateAccountWithDetails(
      selectedAccount.account_name,     // Имя счета
      selectedAccount.account_id,       // ID счета
      selectedAccount.account_currency, // Валюта счета (EUR, USD, etc.)
      selectedAccount.user_name         // Имя пользователя
    );

    // 4. Сохранение данных пользователя Telegram
    if (user?.id) {
      setUserData(user.id, userName);
    }
  }

  // 5. Переход на экран Amount
  setCurrentScreen('amount');
};
```

**State после изменения:**
```typescript
{
  transactionData: {
    account: "Cash EUR",
    account_id: "123",
    account_currency: "EUR",
    username: "john_doe",
    user_id: 12345,
    amount: "",           // Пока пусто
    category: "",         // Пока пусто
    comment: "",          // Пока пусто
  }
}
```

**BackButton поведение (`BudgetMiniApp.tsx:138-139`):**
```typescript
case 'amount':
  return () => setCurrentScreen(transactionType === 'income' ? 'income-accounts' : 'accounts');
```
Возвращается на экран выбора счета (для expense это 'accounts')

---

### **3. Amount Screen → Category Screen**

**Что происходит на Amount Screen:**
- Пользователь вводит сумму через input поле (`AmountScreen.tsx:103-116`)
- Input поддерживает:
  - Только цифры и одну десятичную точку
  - Автоматическая замена запятой на точку
  - Блокировка отрицательных чисел
  - Автодобавление "0" перед точкой (`.5` → `0.5`)

**Конвертация валюты (`AmountScreen.tsx:29-59`):**
```typescript
useEffect(() => {
  const fetchConversion = async () => {
    // Показываем конвертацию только если:
    // 1. Есть сумма
    // 2. Есть код валюты
    // 3. Валюта НЕ EUR (не нужна конвертация для той же валюты)
    if (!amount || !currencyCode || currencyCode === 'EUR') {
      setConversionAmount(null);
      return;
    }

    // Запрос конвертации через API
    const converted = await syncService.getExchangeRate(currencyCode, 'EUR', numAmount);
    setConversionAmount(converted); // Показывается под основной суммой
  };

  // Debounce - запрос через 500ms после последнего изменения
  const timer = setTimeout(fetchConversion, 500);
  return () => clearTimeout(timer);
}, [amount, currencyCode]);
```

**State изменения:**
```typescript
// При вводе суммы вызывается:
const handleAmountChange = (value: string) => {
  updateAmount(value); // Обновляет transactionData.amount
};

// При нажатии Next:
onNext={() => setCurrentScreen('category')}
```

**State после изменения:**
```typescript
{
  transactionData: {
    account: "Cash EUR",
    account_id: "123",
    account_currency: "EUR",
    username: "john_doe",
    user_id: 12345,
    amount: "50.00",      // ✅ Заполнено
    category: "",         // Пока пусто
    comment: "",          // Пока пусто
  }
}
```

**BackButton поведение (`BudgetMiniApp.tsx:141-142`):**
```typescript
case 'category':
  return () => setCurrentScreen('amount');
```

---

### **4. Category Screen → Comment Screen**

**Что происходит на Category Screen:**
- При открытии экрана срабатывает `useEffect` (`BudgetMiniApp.tsx:76-81`)
- Загружаются категории через `fetchCategories()`
- Категории фильтруются по типу транзакции (expense/income)
- Для expense показываются ВСЕ категории
- Сортировка: наиболее используемые сверху

**State изменения:**
```typescript
// При выборе категории:
onSelectCategory={(category) => {
  updateCategory(category);      // Обновляет transactionData.category
  setCurrentScreen('comment');   // Переходим на экран комментариев
}}
```

**State после изменения:**
```typescript
{
  transactionData: {
    account: "Cash EUR",
    account_id: "123",
    account_currency: "EUR",
    username: "john_doe",
    user_id: 12345,
    amount: "50.00",
    category: "🍔 Food",  // ✅ Заполнено
    comment: "",          // Пока пусто
  }
}
```

**BackButton поведение (`BudgetMiniApp.tsx:143-144`):**
```typescript
case 'comment':
  return () => setCurrentScreen('category');
```

---

### **5. Comment Screen → Confirm Screen**

**Что происходит на Comment Screen:**
- При открытии загружаются **suggestions** (подсказки для комментариев)
- Suggestions основаны на:
  - Истории пользователя для выбранной категории
  - Community suggestions (от других пользователей)
- Фильтрация на клиенте (`CommentScreen.tsx:36-110`)

**Smart Suggestions алгоритм:**
```typescript
// 1. Загрузка всех destinations
const data = await syncService.getDestinationNameUsage();

// 2. Группировка
const userDestinations = allDestinations.filter(
  d => d.user_name === userName && d.category_name === category
);
const communityDestinations = allDestinations.filter(
  d => d.category_name === category && d.user_name !== userName
);

// 3. Сортировка по usage_count (DESC)
userDestinations.sort((a, b) => b.usage_count - a.usage_count);
communityDestinations.sort((a, b) => b.usage_count - a.usage_count);

// 4. Объединение: сначала пользовательские, потом community
const combinedSuggestions = [...userDestinations, ...communityDestinations];
```

**State изменения:**
```typescript
// При вводе комментария:
onCommentChange={updateComment}  // Обновляет transactionData.comment

// При нажатии Next:
onNext={() => setCurrentScreen('confirm')}
```

**State после изменения:**
```typescript
{
  transactionData: {
    account: "Cash EUR",
    account_id: "123",
    account_currency: "EUR",
    username: "john_doe",
    user_id: 12345,
    amount: "50.00",
    category: "🍔 Food",
    comment: "Lunch at McDonald's",  // ✅ Заполнено (или пусто, если пропущено)
  }
}
```

**BackButton поведение (`BudgetMiniApp.tsx:146-147`):**
```typescript
case 'confirm':
  return () => setCurrentScreen('comment');
```

---

### **6. Confirm Screen (Финальный экран)**

**Что происходит на Confirm Screen:**
- Показывается сводка всех введенных данных
- Пользователь подтверждает или отменяет транзакцию

**Процесс подтверждения (`ConfirmScreen.tsx:38-130`):**

```typescript
const handleConfirmTransaction = async () => {
  setIsSubmitting(true);

  // 1. КОНВЕРТАЦИЯ ВАЛЮТЫ (если нужно)
  let amountForeignEur: number | null = null;

  if (transactionData.account_currency !== 'EUR') {
    // Конвертируем сумму в EUR для Firefly
    amountForeignEur = await syncService.getExchangeRate(
      transactionData.account_currency,
      'EUR',
      parseFloat(amount)
    );
  } else {
    amountForeignEur = parseFloat(amount);
  }

  // 2. ПОДГОТОВКА PAYLOAD
  const budgetName = extractBudgetName(category); // Извлекает имя бюджета без эмодзи

  const transactionPayload: ExpenseTransactionData = {
    account: transactionData.account,
    account_id: parseInt(transactionData.account_id || '0'),
    account_currency: transactionData.account_currency || 'EUR',
    currency: transactionData.account_currency || 'EUR',
    amount: parseFloat(amount),              // Оригинальная сумма
    amount_foreign: amountForeignEur,       // Сумма в EUR
    category: category,
    comment: comment || '',
    date: new Date().toISOString(),
    user_id: transactionData.user_id || 0,
    username: userName || transactionData.username || 'unknown',
    ...(budgetName && { budget_name: budgetName })
  };

  // 3. ОТПРАВКА В FIREFLY API
  const [success, response] = await addTransaction(transactionPayload, 'expense', true);

  if (success) {
    // 4. ПОКАЗАТЬ SUCCESS MESSAGE
    setSubmitMessage({ type: 'success', text: 'Transaction saved to Firefly!' });

    // 5. СБРОС И ВОЗВРАТ НА HOME (через 2 секунды)
    setTimeout(() => {
      onSuccess();    // Очищает transactionData
      onConfirm();    // Показывает success toast
    }, 2000);
  } else {
    // ОШИБКА
    setSubmitMessage({ type: 'error', text: `Error: ${errorMessage}` });
  }

  setIsSubmitting(false);
};
```

**Success Flow:**
```
[Yes Button Click]
  → isSubmitting = true
  → Convert currency (if needed)
  → Build payload
  → Send to Firefly API
  → Success message (2 seconds)
  → Reset transactionData
  → Navigate to Home
  → Show success toast (2 seconds)
```

**BackButton поведение:**
Возвращает на Comment Screen

**Cancel Button поведение (`BudgetMiniApp.tsx:511-516`):**
```typescript
onCancel={() => {
  resetTransactionData();           // Очищает все данные
  setTransactionType('expense');    // Сброс типа транзакции
  setCurrentScreen('home');         // Возврат на Home
}}
```

---

## 🔄 Реактивная загрузка данных при навигации

### **Механизм автоматической загрузки категорий**

Когда пользователь возвращается с экрана `comment` на `category`, система автоматически определяет необходимость загрузки категорий через **реактивный useEffect**.

#### **Как это работает:**

**1. BackButton handler изменяет currentScreen (`BudgetMiniApp.tsx:143-144`):**
```typescript
case 'comment':
  return () => setCurrentScreen('category');  // Меняем state
```

**2. useEffect отслеживает изменение currentScreen (`BudgetMiniApp.tsx:76-81`):**
```typescript
// Fetch categories when category screen is opened
useEffect(() => {
  if (currentScreen === 'category') {
    fetchCategories();  // Автоматически вызывается при изменении currentScreen
  }
}, [currentScreen, userName]);  // Dependencies: перезапускается при изменении
```

**3. Почему это работает для expense:**

```typescript
// В CategoryScreen происходит фильтрация по типу транзакции
const displayCategories = filterCategoriesByType(categories, transactionType);

// Для expense (CategoryScreen.tsx:25-26):
// transactionType = 'expense' → показываются ВСЕ категории

// Для income:
// transactionType = 'income' → показываются только категории income
```

#### **Детальный Flow при возврате:**

```
┌─────────────────────────────────────────────────────────────┐
│ User нажимает BackButton на Comment Screen                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ BackButton handler выполняется:                              │
│   setCurrentScreen('category')                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ React обнаруживает изменение state                           │
│   currentScreen: 'comment' → 'category'                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ useEffect [currentScreen, userName] триггерится              │
│                                                               │
│   if (currentScreen === 'category') {  // ✅ TRUE            │
│     fetchCategories();                                        │
│   }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchCategories() выполняется:                               │
│                                                               │
│   1. setCategoriesLoading(true)                              │
│   2. API call: syncService.getCategoriesUsage(userName)      │
│   3. setCategories(data.get_categories_usage)                │
│   4. setCategoriesLoading(false)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ CategoryScreen re-renders с обновленными данными             │
│                                                               │
│   - categories: CategoryUsage[] (обновлено)                  │
│   - transactionType: 'expense'                               │
│   - displayCategories = filterCategoriesByType(...)          │
└─────────────────────────────────────────────────────────────┘
```

#### **Почему используется useEffect, а не прямой вызов?**

**Преимущества реактивного подхода:**

1. **Единый источник правды**
   - Логика загрузки в одном месте
   - Не нужно дублировать вызов fetchCategories() в каждом handler

2. **Автоматическая синхронизация**
   - При изменении userName категории перезагружаются автоматически
   - При возврате на экран данные всегда актуальны

3. **Предзагрузка (Preloading)**
   - Категории загружаются не только при навигации, но и в фоне:
   ```typescript
   // BudgetMiniApp.tsx:90-102
   useEffect(() => {
     const timer = setTimeout(() => {
       if (userName) {
         console.log('🚀 Preloading categories in background...');
         fetchCategories();  // Фоновая загрузка через 5 секунд
       }
     }, 5000);
     return () => clearTimeout(timer);
   }, [userName]);
   ```

4. **Кеширование через state**
   - После первой загрузки categories остаются в state
   - При возврате показываются старые данные, затем обновляются
   - Пользователь не видит пустой экран

#### **Аналогичный механизм для других экранов:**

**Accounts Screen (`BudgetMiniApp.tsx:69-74`):**
```typescript
useEffect(() => {
  if (currentScreen === 'accounts' ||
      currentScreen === 'income-accounts' ||
      currentScreen === 'transfer-source-accounts' ||
      currentScreen === 'transfer-dest-accounts') {
    fetchAccounts();  // Загрузка при переходе на любой экран выбора счетов
  }
}, [currentScreen, userName]);
```

**Debug Screen (`BudgetMiniApp.tsx:84-88`):**
```typescript
useEffect(() => {
  if (currentScreen === 'debug') {
    checkServiceConnections();  // Проверка соединений при открытии Debug
  }
}, [currentScreen]);
```

#### **Важные детали реализации:**

**1. Dependencies в useEffect:**
```typescript
useEffect(() => {
  if (currentScreen === 'category') {
    fetchCategories();
  }
}, [currentScreen, userName]);  // ← Включает userName
```
- `currentScreen` - загружает при переходе на экран
- `userName` - перезагружает при изменении пользователя (например, в браузере)

**2. Защита от лишних запросов:**
```typescript
const fetchCategories = async () => {
  setCategoriesLoading(true);  // Защита от дублирования
  // ... API call
  setCategoriesLoading(false);
};
```

**3. Error handling:**
```typescript
try {
  const data = await syncService.getCategoriesUsage(...);
  setCategories(data.get_categories_usage);
} catch (error) {
  setCategoriesError(errorMessage);  // Показывает ошибку с Retry кнопкой
}
```

---

## 🔧 State Management Architecture

### **1. Главный State (`BudgetMiniApp.tsx`)**

```typescript
// Навигация
const [currentScreen, setCurrentScreen] = useState('home');

// Тип транзакции
const [transactionType, setTransactionType] = useState<TransactionType>('expense');

// Данные счетов
const [accounts, setAccounts] = useState<AccountUsage[]>([]);
const [accountsLoading, setAccountsLoading] = useState(false);
const [accountsError, setAccountsError] = useState<string | null>(null);

// Данные категорий
const [categories, setCategories] = useState<CategoryUsage[]>([]);
const [categoriesLoading, setCategoriesLoading] = useState(false);
const [categoriesError, setCategoriesError] = useState<string | null>(null);

// Success toast
const [showSuccess, setShowSuccess] = useState(false);
```

### **2. Transaction State (через Hook)**

Используется custom hook `useTransactionData` (`hooks/useTransactionData.ts`):

```typescript
const {
  transactionData,           // Объект с данными транзакции
  updateAccount,             // Обновить только account
  updateAccountWithDetails,  // Обновить account + id + currency + username
  updateAmount,              // Обновить сумму
  updateCategory,            // Обновить категорию
  updateComment,             // Обновить комментарий
  setUserData,              // Установить user_id и username
  resetTransactionData       // Очистить все данные
} = useTransactionData(transactionType);
```

**TransactionData interface:**
```typescript
interface TransactionData {
  account: string;
  amount: string;
  category: string;
  comment: string;
  account_id?: string;
  account_currency?: string;
  user_id?: number;
  username?: string;
  amount_foreign?: string;
}
```

---

## ⬅️ Telegram BackButton Management

BackButton управляется через **единый useEffect** в `BudgetMiniApp.tsx:114-215`:

### **Архитектура:**

```typescript
useEffect(() => {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  // Получаем handler для текущего экрана
  const backHandler = getBackHandler();

  if (backHandler) {
    tg.BackButton.show();              // Показываем кнопку
    tg.BackButton.onClick(backHandler); // Устанавливаем handler

    return () => {
      tg.BackButton.offClick(backHandler); // Cleanup: убираем handler
    };
  } else {
    tg.BackButton.hide();              // Скрываем на Home
  }
}, [currentScreen, transactionType, resetTransactionData]);
```

### **BackButton Handlers Map:**

| Screen | Action | State Changes |
|--------|--------|---------------|
| `home` | null | BackButton скрыт |
| `accounts` | Go to home | `resetTransactionData()`, `currentScreen = 'home'` |
| `amount` | Go to accounts | `currentScreen = 'accounts'` |
| `category` | Go to amount | `currentScreen = 'amount'` |
| `comment` | Go to category | `currentScreen = 'category'` |
| `confirm` | Go to comment | `currentScreen = 'comment'` |

**Ключевые особенности:**
1. **Один источник правды** - все handlers в одном месте
2. **Автоматический cleanup** - offClick при размонтировании
3. **Type-safe** - учитывает transactionType для правильной навигации
4. **State cleanup** - resetTransactionData() при выходе из flow

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     BudgetMiniApp (Parent)                   │
│                                                               │
│  State:                                                       │
│  - currentScreen: string                                      │
│  - transactionType: 'expense'                                 │
│  - accounts: AccountUsage[]                                   │
│  - categories: CategoryUsage[]                                │
│                                                               │
│  Hook (useTransactionData):                                   │
│  - transactionData: { account, amount, category, comment }    │
│  - updateAccount(), updateAmount(), updateCategory()...       │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AccountsScreen│ │ AmountScreen │ │CategoryScreen│
│              │ │              │ │              │
│ Props:       │ │ Props:       │ │ Props:       │
│ - accounts   │ │ - amount     │ │ - categories │
│ - onSelect   │ │ - onChange   │ │ - onSelect   │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
                ┌──────────────┐
                │CommentScreen │
                │              │
                │ Props:       │
                │ - comment    │
                │ - onChange   │
                └──────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ConfirmScreen │
                │              │
                │ Props:       │
                │ - all data   │
                │ - onConfirm  │
                └──────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ Firefly  │
                  │   API    │
                  └──────────┘
```

---

## 🎯 Key Features

### **1. Preloading & Optimization**
- Accounts preload на Home screen через 5 секунд (`BudgetMiniApp.tsx:104-112`)
- Categories preload через 5 секунд (`BudgetMiniApp.tsx:90-102`)
- Debouncing для currency conversion (500ms)

### **2. Smart Sorting**
- Accounts: сортировка по usage_count (наиболее используемые сверху)
- Categories: сортировка по usage_count
- Suggestions: пользовательские первыми, потом community

### **3. Error Handling**
- Loading states для всех async операций
- Error states с Retry кнопками
- Empty states для пустых списков

### **4. Currency Support**
- Автоматическая конвертация в EUR для Firefly
- Показ конвертированной суммы на Amount screen
- Поддержка multiple валют (EUR, USD, RUB, etc.)

---

## 📝 Summary

Expense flow - это **реактивная система** с:
- **Единым источником правды** для навигации (`currentScreen`)
- **Автоматической загрузкой данных** через useEffect
- **Централизованным управлением BackButton**
- **Оптимизацией через preloading**
- **Надежным error handling**

Все экраны синхронизированы через React state, что обеспечивает предсказуемое поведение при любых сценариях навигации.
