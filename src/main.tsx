import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RootErrorBoundary } from "./components/ErrorBoundary.tsx"
import { ThemeProvider } from "./context/ThemeContext"
import { LanguageProvider } from "./context/LanguageContext"
import { AppProvider } from "./context/AppContext"
import { AuthProvider } from "./context/AuthContext"
import { DateProvider } from "./context/DateContext"
import { I18nextProvider } from "react-i18next"
import "./i18n/config"
import i18n from "./i18n/config"
import "./index.css"
import App from "./App.tsx"
import { getMonitoringConfig, initializeMonitoring } from "./utils/monitoring"

console.log("[main] Starting app initialization...")
console.log("[main] Environment check:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "SET" : "MISSING",
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING",
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
})

const monitoringConfig = getMonitoringConfig()
if (monitoringConfig.enabled && monitoringConfig.dsn) {
  initializeMonitoring(monitoringConfig)
    .then(() => console.info("[App] Monitoring initialized"))
    .catch(() => console.info("[App] Monitoring disabled"))
} else {
  console.info("[App] Monitoring disabled - running in development mode")
}

console.log("%c Build Timestamp: " + new Date().toISOString(), "background: #222; color: #bada55");

try {
  const rootElement = document.getElementById("root")
  if (!rootElement) {
    throw new Error("Root element not found!")
  }
  
  console.log("[main] Root element found, creating React root...")
  
  createRoot(rootElement).render(
    <StrictMode>
      <RootErrorBoundary>
        <ThemeProvider defaultTheme="system" storageKey="nutriai-theme">
          <I18nextProvider i18n={i18n}>
            <LanguageProvider>
              <AuthProvider>
                <AppProvider>
                  <DateProvider>
                    <App />
                  </DateProvider>
                </AppProvider>
              </AuthProvider>
            </LanguageProvider>
          </I18nextProvider>
        </ThemeProvider>
      </RootErrorBoundary>
    </StrictMode>,
  )
  
  console.log("[main] React root rendered successfully")
} catch (error) {
  console.error("[main] Critical error during app initialization:", error)
  // Show a fallback UI when React fails to initialize
  const rootElement = document.getElementById("root")
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; font-family: system-ui, sans-serif; padding: 20px; text-align: center;">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #666; margin-bottom: 8px;">The app failed to load. Please check the browser console for details.</p>
        <p style="color: #999; font-size: 14px;">Error: ${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `
  }
}
