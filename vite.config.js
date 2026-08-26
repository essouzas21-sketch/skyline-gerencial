import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/skyline-gerencial/" : "./",
  server: {
    host: true,
    port: 5174
  },
  preview: {
    host: true,
    port: 4174
  }
});
