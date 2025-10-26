# Инструкция по настройке Cloudflare Worker прокси

## Обзор решения

Это решение использует Cloudflare Worker в качестве прокси-слоя для обхода проблем с CORS. Вместо настройки CORS-заголовков на nginx-сервере, все API-запросы проходят через ваш же домен Cloudflare, что полностью устраняет проблемы с CORS.

## Архитектура

```
[Браузер] → [Cloudflare Pages + Worker]
                ↓
    /api/* → [nginx backend: dev.neon-chuckwalla.ts.net]
    /* → [Статические файлы React]
```

## Как это работает

### Локальная разработка
- Vite dev server проксирует все запросы `/api/*` → `https://dev.neon-chuckwalla.ts.net`
- Настройка в `vite.config.ts`

### Production (Cloudflare Pages)
- Cloudflare Worker перехватывает все запросы
- Запросы `/api/*` проксируются на nginx backend
- Остальные запросы обслуживаются как статические файлы React
- Файл `_worker.js` автоматически деплоится вместе с проектом

## Файлы конфигурации

### 1. `_worker.js` (уже создан)

Cloudflare Worker, который проксирует API-запросы на ваш nginx backend:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Проксируем все запросы, начинающиеся с /api/
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = `https://dev.neon-chuckwalla.ts.net${url.pathname}${url.search}`;

      const newHeaders = new Headers(request.headers);
      newHeaders.delete('host');
      newHeaders.delete('origin');
      newHeaders.delete('referer');

      const backendRequest = new Request(backendUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : null,
      });

      const backendResponse = await fetch(backendRequest);

      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: backendResponse.headers,
      });
    }

    // Все остальные запросы — статические файлы React
    return env.ASSETS.fetch(request);
  }
}
```

### 2. `vite.config.ts` (обновлен)

Упрощенная конфигурация прокси для локальной разработки:

```typescript
proxy: {
  // Proxy all /api/* requests to backend
  '/api': {
    target: 'https://dev.neon-chuckwalla.ts.net',
    changeOrigin: true,
    secure: true
  }
}
```

## Использование в React-коде

### ✅ Правильно - используйте относительные пути:

```javascript
// Firefly III API
fetch('/api/v1/about', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Sync API
fetch('/api/sync/get_accounts_usage', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
})

// Debug endpoint
fetch('/api/debug')
```

### ❌ Неправильно - НЕ указывайте полный домен:

```javascript
// НЕ ДЕЛАЙТЕ ТАК!
fetch('https://dev.neon-chuckwalla.ts.net/api/v1/about')
```

## Деплой на Cloudflare Pages

1. Соберите проект:
   ```bash
   npm run build
   ```

2. Файл `_worker.js` будет автоматически использован Cloudflare Pages как Worker

3. После деплоя проверьте:
   - Откройте `https://budgetbot-tg-mini-app.kayukov2010.workers.dev`
   - Все API-запросы должны работать без CORS-ошибок

## Преимущества этого решения

1. **Никаких CORS-проблем**: Запросы идут на тот же домен (same-origin)
2. **Единая конфигурация**: Одинаковое поведение в dev и production
3. **Безопасность**: Headers очищаются перед проксированием
4. **Простота**: Не нужно настраивать CORS на nginx
5. **Гибкость**: Легко добавить логирование, rate limiting, кеширование

## Nginx конфигурация

Теперь на nginx не нужны CORS-заголовки, потому что все запросы приходят от Cloudflare Worker. Но если вы хотите, можете оставить CORS-заголовки для прямых запросов (не через Worker):

```nginx
location / {
    # CORS headers (опционально, для прямых запросов)
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://budgetbot-tg-mini-app.kayukov2010.workers.dev' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Length' 0;
        return 204;
    }

    add_header 'Access-Control-Allow-Origin' 'https://budgetbot-tg-mini-app.kayukov2010.workers.dev' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;

    proxy_pass http://your_backend_proxy_pass;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Проверка работы

После деплоя используйте компонент `ApiTest` для проверки:

1. Откройте приложение
2. Найдите "API Test" в навигации
3. Нажмите "Run Tests"
4. Все тесты должны пройти успешно ✅

## Troubleshooting

### Worker не работает после деплоя

1. Проверьте, что файл `_worker.js` находится в корне проекта
2. Убедитесь, что он был включен в деплой
3. Проверьте логи в Cloudflare Pages Dashboard

### API-запросы не проксируются

1. Убедитесь, что запросы начинаются с `/api/`
2. Проверьте, что вы используете относительные пути, а не полные URL
3. Откройте DevTools → Network и проверьте URL запросов

### CORS-ошибки в production

1. Убедитесь, что Worker деплоится корректно
2. Проверьте, что не используете полные URL в коде
3. Очистите кеш браузера и Cloudflare
