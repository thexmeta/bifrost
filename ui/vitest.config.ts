import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@enterprise": path.resolve(__dirname, "app/_fallbacks/enterprise"),
      "@schemas": path.resolve(__dirname, "app/_fallbacks/enterprise/lib"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
