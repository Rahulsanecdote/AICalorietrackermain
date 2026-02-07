import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"

const isBundleReport = process.env.BUNDLE_REPORT === "true" || process.env.BUNDLE_REPORT === "1"
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:3001"
const reportPlugins = isBundleReport
  ? [
    visualizer({
      filename: "dist/bundle-report.html",
      template: "treemap",
      gzipSize: true,
      brotliSize: true,
    }),
    visualizer({
      filename: "dist/bundle-report.json",
      template: "raw-data",
      gzipSize: true,
      brotliSize: true,
    }),
  ]
  : []

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    ...reportPlugins
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return

          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react-vendor"
          }

          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
            return "i18n"
          }

          if (id.includes("node_modules/@supabase")) {
            return "supabase"
          }

          if (
            id.includes("node_modules/chart.js") ||
            id.includes("node_modules/react-chartjs-2") ||
            id.includes("node_modules/recharts")
          ) {
            return "charts"
          }

          if (id.includes("node_modules/@radix-ui")) {
            return "radix"
          }

          if (id.includes("node_modules/lucide-react")) {
            return "icons"
          }

          if (
            id.includes("node_modules/uuid") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/class-variance-authority")
          ) {
            return "ui-utils"
          }
        },
      },
    },
  },
})
