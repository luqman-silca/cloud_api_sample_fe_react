/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENVIRONMENT: string
  readonly VITE_APP_APIGATEWAY_BACKEND_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
