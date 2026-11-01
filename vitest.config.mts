import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      SKIP_ENV_VALIDATION: "1",
      NEXT_PUBLIC_APP_URL: "https://cadogy.com",
      NEXT_PUBLIC_WP_API_URL: "https://wp.example.com/wp-json/wp/v2",
    },
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/features/**/domain/**", "src/lib/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "server-only": path.resolve(import.meta.dirname, "./src/test/server-only-stub.ts"),
    },
  },
})
