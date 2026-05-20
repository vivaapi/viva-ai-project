/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_WECHAT_SUPPORT: string
  readonly VITE_MORE_DETAILS_LINK: string
  readonly VITE_CASES_LINK: string
  readonly VITE_MAIN_SITE_LINK: string
  readonly VITE_EXCHANGE_RATE: string
  readonly VITE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
