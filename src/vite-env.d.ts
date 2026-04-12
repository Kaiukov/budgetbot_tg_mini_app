/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  readonly VITE_SYNC_API_KEY?: string;
  readonly VITE_ENABLE_DEBUG_LOGS?: string;
  readonly VITE_E2E_SILENT_LOGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
