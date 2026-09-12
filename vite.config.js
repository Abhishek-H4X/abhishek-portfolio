import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import viteApiPlugin from "./viteApiPlugin.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), viteApiPlugin(env)],
    server: {
      host: true,
    },
  };
});
