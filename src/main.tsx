import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RootErrorBoundary } from "./components/ErrorBoundary.tsx"
import { ThemeProvider } from "./context/ThemeContext"
import { LanguageProvider } from "./context/LanguageContext"
import { AppProvider } from "./context/AppContext"
import { DateProvider } from "./context/DateContext"
import { I18nextProvider } from "react-i18next"
import "./i18n/config"
import i18n from "./i18n/config"
import "./index.css"
import App from "./App.tsx"
import { getMonitoringConfig, initializeMonitoring } from "./utils/monitoring"

const monitoringConfig = getMonitoringConfig()
if (monitoringConfig.enabled && monitoringConfig.dsn) {
  initializeMonitoring(monitoringConfig)
    .then(() => console.info("[App] Monitoring initialized"))
    .catch(() => console.info("[App] Monitoring disabled"))
} else {
  console.info("[App] Monitoring disabled - running in development mode")
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="nutriai-theme">
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <AppProvider>
              <DateProvider>
                <App />
              </DateProvider>
            </AppProvider>
          </LanguageProvider>
        </I18nextProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
