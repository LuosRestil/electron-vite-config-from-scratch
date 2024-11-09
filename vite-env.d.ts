/// <reference types="vite/client" />

// Extend ImportMetaEnv only for custom variables if needed
interface ImportMetaEnv {
  readonly ELECTRON_APP_URL: string;
}