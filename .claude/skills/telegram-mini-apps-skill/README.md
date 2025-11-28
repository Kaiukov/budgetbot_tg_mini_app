# Telegram Mini Apps SDK Skill Package

Complete skill package for developing Telegram Mini Apps with comprehensive documentation, utilities, and templates.

## 📦 Package Contents

### 📄 Core Files
- **SKILL.md** - Main documentation and quick start guide

### 📚 References (`references/`)
- **api-methods.md** - Complete API methods reference
- **events.md** - All events and event handling patterns
- **security.md** - Security best practices and validation guides

### 🔧 Scripts (`scripts/`)
- **validation-utils.js** - Server-side initData validation utilities
- **init-app.js** - Client-side app initialization

### 🎨 Assets (`assets/`)
- **template.html** - Simple HTML template
- **react-component.jsx** - React component with hooks
- **styles.css** - Comprehensive CSS with Telegram theming

## 🚀 Quick Start

### 1. Basic HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
  <div class="container">
    <h1>My Mini App</h1>
    <button class="button full-width">Click Me</button>
  </div>
  
  <script src="scripts/init-app.js"></script>
  <script>
    const tma = initTelegramMiniApp({ debugMode: true });
  </script>
</body>
</html>
```

### 2. React Setup

```jsx
import MyMiniApp from 'assets/react-component.jsx';

export default MyMiniApp;
```

### 3. Server Validation

```javascript
const { validateInitData } = require('scripts/validation-utils.js');

app.post('/api/action', (req, res) => {
  const initData = req.headers['x-telegram-init-data'];
  if (!validateInitData(initData, BOT_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ ok: true });
});
```

## 📚 Documentation

- **SKILL.md** - Core concepts and quick reference
- **references/api-methods.md** - All WebApp API methods
- **references/events.md** - Event handling reference
- **references/security.md** - Security and validation

## 🔐 Security

1. Always validate `initData` on server
2. Use `validateInitData()` to verify signatures
3. Check data freshness with `isDataFresh()`
4. Use HTTPS only
5. Never expose bot token in client code

See `references/security.md` for detailed guides.

## 🎨 Theming

The CSS supports Telegram themes with:
- CSS variables for all theme colors
- Automatic dark mode
- Safe area support
- Responsive design

## ✅ Best Practices

1. Call `ready()` immediately on load
2. Expand to full screen
3. Handle theme changes
4. Debounce frequent events
5. Test on real devices
6. Always validate server-side
7. Support both themes
8. Use HTTPS

## 📱 Supported Platforms

- iOS (Telegram 9.5+)
- Android (Telegram 9.5+)  
- Web
- Desktop

## 📖 Official Resources

- Docs: https://core.telegram.org/bots/webapps
- Bot API: https://core.telegram.org/bots/api
- BotFather: https://t.me/BotFather

## 📄 License

MIT

---

Build amazing Telegram Mini Apps! 🚀
