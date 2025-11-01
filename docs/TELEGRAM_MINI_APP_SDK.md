# Telegram Mini App SDK Documentation

Official documentation for developing Telegram Mini Apps with comprehensive SDK packages and examples.

## Overview

Telegram Mini Apps SDK provides a comprehensive JavaScript toolkit for building interactive applications within the Telegram messenger platform. It offers functionalities for UI components, bridge interactions, and platform features.

## Installation

### Core SDK Packages

#### @telegram-apps/sdk (General JavaScript)
```bash
pnpm i @telegram-apps/sdk
npm i @telegram-apps/sdk
yarn add @telegram-apps/sdk
```

#### @telegram-apps/sdk-react (React)
```bash
pnpm i @telegram-apps/sdk-react
npm i @telegram-apps/sdk-react
yarn add @telegram-apps/sdk-react
```

#### @tma.js/sdk (Alternative TypeScript SDK)
```bash
pnpm i @tma.js/sdk
npm i @tma.js/sdk
yarn add @tma.js/sdk
```

#### @tma.js/sdk-react (Alternative React SDK)
```bash
pnpm i @tma.js/sdk-react
npm i @tma.js/sdk-react
yarn add @tma.js/sdk-react
```

### Additional Packages

#### Bridge (Low-level Communication)
```bash
pnpm i @telegram-apps/bridge
npm i @telegram-apps/bridge
yarn add @telegram-apps/bridge
```

#### Init Data Node (Server-side)
```bash
pnpm i @telegram-apps/init-data-node
npm i @telegram-apps/init-data-node
yarn add @telegram-apps/init-data-node
```

#### Signals (State Management)
```bash
pnpm i @tma.js/signals
npm i @tma.js/signals
yarn add @tma.js/signals
```

## Basic Initialization

### TypeScript/JavaScript
```typescript
import { init, backButton } from '@telegram-apps/sdk';

// Initialize the SDK
init();

// Mount the Back Button component
backButton.mount();

// Show the Back Button
backButton.show();
```

### React
```tsx
import ReactDOM from 'react-dom/client';
import { init, backButton } from '@telegram-apps/sdk-react';
import { BackButton } from './BackButton.js';

// Initialize the package
init();

// Mount the Back Button
backButton.mount();

ReactDOM
  .createRoot(document.getElementById('root')!)
  .render(<BackButton/>);
```

### React (Alternative @tma.js/sdk-react)
```tsx
import { init, backButton } from '@tma.js/sdk-react';

// Initialize and mount
init();
backButton.mount();

// Handle back navigation
backButton.onClick(() => {
  window.history.back();
});
```

### Solid.js
```tsx
import { init, backButton } from '@telegram-apps/sdk-solid';
import { BackButton } from './BackButton.js';

init();
backButton.mount();

render(() => <BackButton/>, document.getElementById('root')!);
```

### Vue.js
```typescript
import { createApp } from 'vue';
import { init } from '@tma.js/sdk-vue';
import App from './App.vue';

init();

const app = createApp(App);
app.mount('#root');
```

### Svelte
```svelte
<script lang="ts">
  import { init, backButton } from '@telegram-apps/sdk-svelte';
  import { BackButton } from './BackButton.svelte';

  init();
</script>

<BackButton />
```

## Launch Parameters

### Get Launch Parameters (React Hook)
```typescript
import { useLaunchParams } from '@telegram-apps/sdk-react';

function Component() {
  const lp = useLaunchParams();
  return <div>Start param: {lp.startParam}</div>;
}
```

### Get Start Parameter
```typescript
import { initDataStartParam } from '@telegram-apps/sdk';

initDataStartParam(); // 'my-value'
```

### Get Raw Launch Parameters
```typescript
import { useRawLaunchParams } from '@tma.js/sdk-react';

function Component() {
  console.log(useRawLaunchParams());
  // tgWebAppBotInline=0&tgWebAppData=%7B%22user%22%3A%7B%7D...
}
```

## Mock Environment (Development)

### Setup Mock Telegram Environment
```typescript
import { mockTelegramEnv, parseInitData } from '@telegram-apps/sdk';

const initDataRaw = new URLSearchParams([
  ['user', JSON.stringify({
    id: 99281932,
    first_name: 'Andrew',
    last_name: 'Rogue',
    username: 'rogue',
    language_code: 'en',
    is_premium: true,
    allows_write_to_pm: true,
  })],
  ['hash', '89d6079ad6762351f38c6dbbc41bb53048019256a9443988af7a48bcad16ba31'],
  ['auth_date', '1716922846'],
  ['start_param', 'debug'],
  ['chat_type', 'sender'],
  ['chat_instance', '8428209589180549439'],
]).toString();

mockTelegramEnv({
  themeParams: {
    accentTextColor: '#6ab2f2',
    bgColor: '#17212b',
    buttonColor: '#5288c1',
    buttonTextColor: '#ffffff',
    destructiveTextColor: '#ec3942',
    headerBgColor: '#17212b',
    hintColor: '#708499',
    linkColor: '#6ab3f3',
    secondaryBgColor: '#232e3c',
    sectionBgColor: '#17212b',
    sectionHeaderTextColor: '#6ab3f3',
    subtitleTextColor: '#708499',
    textColor: '#f5f5f5',
  },
  initData: parseInitData(initDataRaw),
  initDataRaw,
  version: '7.2',
  platform: 'tdesktop',
});
```

### Mock with @tma.js/bridge
```typescript
import { mockTelegramEnv, emitEvent } from '@tma.js/bridge';

const themeParams = {
  accent_text_color: '#6ab2f2',
  bg_color: '#17212b',
  button_color: '#5288c1',
  button_text_color: '#ffffff',
  destructive_text_color: '#ec3942',
  header_bg_color: '#17212b',
  hint_color: '#708499',
  link_color: '#6ab3f3',
  secondary_bg_color: '#232e3c',
  section_bg_color: '#17212b',
  section_header_text_color: '#6ab3f3',
  subtitle_text_color: '#708499',
  text_color: '#f5f5f5',
};

const noInsets = { left: 0, top: 0, bottom: 0, right: 0 };

mockTelegramEnv({
  launchParams: {
    tgWebAppThemeParams: themeParams,
    tgWebAppData: new URLSearchParams([
      ['user', JSON.stringify({ id: 1, first_name: 'Pavel' })],
      ['hash', ''],
      ['signature', ''],
      ['auth_date', Date.now().toString()],
    ]),
    tgWebAppStartParam: 'debug',
    tgWebAppVersion: '8',
    tgWebAppPlatform: 'tdesktop',
  },
  onEvent(event) {
    if (event.name === 'web_app_request_theme') {
      return emitEvent('theme_changed', { theme_params: themeParams });
    }
    if (event.name === 'web_app_request_viewport') {
      return emitEvent('viewport_changed', {
        height: window.innerHeight,
        width: window.innerWidth,
        is_expanded: true,
        is_state_stable: true,
      });
    }
    if (event.name === 'web_app_request_content_safe_area') {
      return emitEvent('content_safe_area_changed', noInsets);
    }
    if (event.name === 'web_app_request_safe_area') {
      return emitEvent('safe_area_changed', noInsets);
    }
  },
});
```

## Back Button Component

### Mount and Show
```typescript
import { init, backButton } from '@telegram-apps/sdk';

init();
backButton.mount();
backButton.show();
```

### React Hook with Navigation
```typescript
import { init, backButton } from '@tma.js/sdk';

init();
backButton.mount();

const off = backButton.onClick(() => {
  off();
  window.history.back();
});
```

## Cloud Storage

### Get Items
```typescript
const nonExistent = await cloudStorage.getItem('non-existent');
// Returns: ''

const existent = await cloudStorage.getItem('a');
// Returns: 'a-value'

const values = await cloudStorage.getItems(['a', 'b', 'non-existent']);
// Returns:
// {
//   a: 'a-value',
//   b: 'b-value',
//   'non-existent': '',
// }
```

## Navigation

### Create Browser Navigator
```typescript
import { createBrowserNavigatorFromLocation } from '@telegram-apps/sdk';

const navigator = createBrowserNavigatorFromLocation({
  hashMode: 'slash',
});
```

### Initialize Navigator with Session Storage
```typescript
import { initNavigator } from '@telegram-apps/sdk';

const n = initNavigator('app-navigator-state', {
  hashMode: 'slash',
});
```

### Get Current Pathname
```typescript
const navigator = new BrowserNavigator([{
  pathname: '/a',
  hash: '#mama',
  search: '?joe',
}], 0);

navigator.pathname; // '/a'
```

### Navigate History
```typescript
// Goes back by 3 entries
navigator.go(-3);

// Goes back to the oldest entry
navigator.go(-100000, true);

// Goes forward to the newest entry
navigator.go(100000, true);
```

## Signals (State Management)

### Create Signal
```typescript
import { signal } from '@tma.js/signals';

const isVisible = signal(false);
```

## Server-side Init Data Validation

### Node.js Signing
```typescript
import { sign } from '@tma.js/init-data-node';

sign(
  {
    can_send_after: 10000,
    chat: {
      id: 1,
      type: 'group',
      username: 'my-chat',
      title: 'chat-title',
      photo_url: 'chat-photo',
    },
    chat_instance: '888',
    chat_type: 'sender',
    query_id: 'QUERY',
    receiver: {
      added_to_attachment_menu: false,
      allows_write_to_pm: true,
      first_name: 'receiver-first-name',
      id: 991,
      is_bot: false,
      is_premium: true,
      language_code: 'ru',
      last_name: 'receiver-last-name',
      photo_url: 'receiver-photo',
      username: 'receiver-username',
    },
    start_param: 'debug',
    user: {
      added_to_attachment_menu: false,
      allows_write_to_pm: false,
      first_name: 'user-first-name',
      id: 222,
      is_bot: true,
      is_premium: false,
      language_code: 'en',
      last_name: 'user-last-name',
      photo_url: 'user-photo',
      username: 'user-username',
    },
  },
  '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8',
  new Date(1000),
);
```

### Web Crypto API Signing
```typescript
import { sign } from '@tma.js/init-data-node/web';

await sign(
  { /* init data object */ },
  '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8',
  new Date(1000),
);
```

### Functional Signing (fp-ts)
```typescript
import { signFp } from '@tma.js/init-data-node/web';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

pipe(
  signFp(
    { /* init data object */ },
    '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8',
    new Date(1000),
  ),
  // Handle TaskEither result
);
```

## Mini App Methods

### Post Events
```typescript
import { postEvent } from '@telegram-apps/sdk';

postEvent('web_app_set_header_color', { color_key: 'bg_color' });
```

### Start Gyroscope
```typescript
postEvent('web_app_start_gyroscope', { refresh_rate: 100 });
```

## Router Integration

### React Router
```bash
pnpm i @telegram-apps/react-router-integration
npm i @telegram-apps/react-router-integration
yarn add @telegram-apps/react-router-integration
```

### Solid Router
```bash
pnpm i @telegram-apps/solid-router-integration
npm i @telegram-apps/solid-router-integration
yarn add @telegram-apps/solid-router-integration
```

### Hash-Based Routing Example
```jsx
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        {/* Other routes */}
      </Switch>
    </Router>
  );
}
```

## Vite Configuration

### Enable Network Access
```bash
vite --host
```

Or in `vite.config.js`:
```javascript
export default {
  server: {
    host: '0.0.0.0'
  }
}
```

## Getting App Link (Local Testing)

### Using Localtunnel
```bash
npm install -g localtunnel
```

## Start Parameter Validation

### RegExp Pattern
```regex
/^[\w-]{0,512}$/
```

Allows alphanumeric characters, underscore, hyphen, max 512 characters.

## CLI Tools

### Mate CLI Installation
```bash
# Global installation with npm
npm i -g @telegram-apps/mate

# Global installation with pnpm
pnpm i -g @telegram-apps/mate

# Global installation with yarn
yarn global add @telegram-apps/mate

# Local development dependency
npm i -D @telegram-apps/mate
pnpm i -D @telegram-apps/mate
yarn add -D @telegram-apps/mate
```

### Mate CLI Usage
```bash
# Help
mate --help

# Or use without installation
npx @telegram-apps/mate@latest --help
pnpm dlx @telegram-apps/mate@latest --help
```

### Deployment with Mate
```bash
# Get deployment info
mate deploy info \
  --token {DEPLOYMENT_TOKEN} \
  --project {PROJECT_ID} \
  --tag {TAG}

# Upload assets
mate deploy upload \
  --dir dist \
  --token aabbccdd \
  --project 48 \
  --tag latest
```

## Migration from VK

### Get VK Launch Parameters
```javascript
const { sign, ...signParams } = await bridge.send('VKWebAppGetLaunchParams');
```

## Example Init Data

### Raw Format
```text
query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2
```

## Advanced Mount Options

### Synchronous Mounting (v3)
```typescript
import { themeParams, miniApp } from '@telegram-apps/bridge';

// Safe to call in any order
themeParams.mountSync();
miniApp.mountSync();
```

## Additional Framework-Specific Packages

### @telegram-apps/sdk-vue
```bash
pnpm i @telegram-apps/sdk-vue
npm i @telegram-apps/sdk-vue
yarn add @telegram-apps/sdk-vue
```

### @tma.js/sdk-vue
```bash
pnpm i @tma.js/sdk-vue
npm i @tma.js/sdk-vue
yarn add @tma.js/sdk-vue
```

### @telegram-apps/sdk-solid
```bash
pnpm i @telegram-apps/sdk-solid
npm i @telegram-apps/sdk-solid
yarn add @telegram-apps/sdk-solid
```

### @tma.js/sdk-solid
```bash
pnpm i @tma.js/sdk-solid
npm i @tma.js/sdk-solid
yarn add @tma.js/sdk-solid
```

### @telegram-apps/sdk-svelte
```bash
pnpm i @telegram-apps/sdk-svelte
npm i @telegram-apps/sdk-svelte
yarn add @telegram-apps/sdk-svelte
```

### @tma.js/sdk-svelte
```bash
pnpm i @tma.js/sdk-svelte
npm i @tma.js/sdk-svelte
yarn add @tma.js/sdk-svelte
```

## Resources

- **Official Documentation**: https://docs.telegram-mini-apps.com
- **Main Packages**: https://telegram-mini-apps.com
- **Core Telegram API**: https://core.telegram.org
- **GitHub Organization**: https://github.com/telegram-mini-apps
