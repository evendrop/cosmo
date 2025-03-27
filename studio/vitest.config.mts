import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ['./vitest.setup.ts'],
    alias: [
      { find: /^graphql$/, replacement: "graphql/index.js" },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
});
