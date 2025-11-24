import path from "node:path";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  root: __dirname,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/seqdia/src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {},
  },
});
