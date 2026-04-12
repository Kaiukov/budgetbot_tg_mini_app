/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_DEBUG_LOGS?: string;
  readonly VITE_E2E_SILENT_LOGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
