export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Проксируем все запросы, начинающиеся с /api/
    if (url.pathname.startsWith('/api/')) {
      try {
        // Строим URL для вашего бэкенда
        const backendUrl = `https://dev.neon-chuckwalla.ts.net${url.pathname}${url.search}`;

        // Копируем заголовки, удаляем проблемные
        const newHeaders = new Headers(request.headers);
        newHeaders.delete('host');
        newHeaders.delete('origin');
        newHeaders.delete('referer');

        // Создаём запрос к бэкенду
        const backendRequest = new Request(backendUrl, {
          method: request.method,
          headers: newHeaders,
          body: request.method !== 'GET' && request.method !== 'HEAD'
            ? request.body
            : null,
        });

        // Отправляем и возвращаем ответ
        const backendResponse = await fetch(backendRequest);

        return new Response(backendResponse.body, {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: backendResponse.headers,
        });

      } catch (error) {
        console.error('Proxy error:', error);
        return new Response(
          JSON.stringify({
            error: 'Proxy error',
            message: error.message
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Все остальные запросы — статические файлы React
    return env.ASSETS.fetch(request);
  }
}
