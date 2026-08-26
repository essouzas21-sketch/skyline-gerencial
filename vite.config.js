import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/skyline-gerencial/" : "./",
  server: {
    host: true,
    port: 5174,
    proxy: {
      "/webhook": {
        target: "https://automacao.skylinemobile.com.br",
        changeOrigin: true,
        secure: true
      }
    }
  },
  preview: {
    host: true,
    port: 4174
  }
});
