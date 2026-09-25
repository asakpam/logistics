import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to the Express server in development
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
