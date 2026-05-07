export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_BASE_URL: string;
      NEXT_PUBLIC_BACKEND_BASE_URL?: string;
      GOOGLE_CLIENT_ID?: string;
      ENV: "test" | "dev" | "prod";
    }
  }
}
