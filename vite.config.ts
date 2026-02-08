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
          if (id.includes("commonjsHelpers.js")) {
            return "chunk-helpers"
          }

          if (!id.includes("node_modules")) return

          const normalizedId = id.replace(/\\/g, "/")
          const isReactCore =
            /\/node_modules\/react(?:\/|$)/.test(normalizedId) ||
            /\/node_modules\/react-dom(?:\/|$)/.test(normalizedId) ||
            /\/node_modules\/scheduler(?:\/|$)/.test(normalizedId)

          if (
            isReactCore
          ) {
            return "react-vendor"
          }

          if (
            id.includes("node_modules/@floating-ui") ||
            id.includes("node_modules/react-remove-scroll") ||
            id.includes("node_modules/react-remove-scroll-bar") ||
            id.includes("node_modules/react-style-singleton") ||
            id.includes("node_modules/use-sidecar") ||
            id.includes("node_modules/aria-hidden") ||
            id.includes("node_modules/@radix-ui/react-popper") ||
            id.includes("node_modules/@radix-ui/react-menu") ||
            id.includes("node_modules/@radix-ui/react-dropdown-menu") ||
            id.includes("node_modules/@radix-ui/react-roving-focus") ||
            id.includes("node_modules/@radix-ui/react-collection") ||
            id.includes("node_modules/@radix-ui/react-arrow")
          ) {
            return "overlay-utils"
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
