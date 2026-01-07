import { promises as fs } from "node:fs"
import path from "node:path"
import { gzipSync } from "node:zlib"

const assetsDir = path.join(process.cwd(), "dist", "assets")
const budgets = [
  { name: "index", pattern: /^index-.*\.js$/, maxGzipKb: 88 },
  { name: "styles", pattern: /^index-.*\.css$/, maxGzipKb: 13 },
  { name: "react-vendor", pattern: /^react-vendor-.*\.js$/, maxGzipKb: 58 },
  { name: "charts", pattern: /^charts-.*\.js$/, maxGzipKb: 70 },
  { name: "radix", pattern: /^radix-.*\.js$/, maxGzipKb: 27 },
  { name: "i18n", pattern: /^i18n-.*\.js$/, maxGzipKb: 16.5 },
  { name: "icons", pattern: /^icons-.*\.js$/, maxGzipKb: 7 },
  { name: "ui-utils", pattern: /^ui-utils-.*\.js$/, maxGzipKb: 8.5 },
  { name: "dashboard-analytics", pattern: /^AnalyticsDashboard-.*\.js$/, maxGzipKb: 6.0 },
  { name: "dashboard-calorie", pattern: /^CalorieDashboard-.*\.js$/, maxGzipKb: 1.3 },
  { name: "dashboard-insights", pattern: /^InsightsDashboard-.*\.js$/, maxGzipKb: 5.2 },
  { name: "dashboard-lifestyle", pattern: /^LifestyleDashboard-.*\.js$/, maxGzipKb: 8.9 },
  { name: "dashboard-meal-plan", pattern: /^MealPlanGenerator-.*\.js$/, maxGzipKb: 9.5 },
  { name: "dashboard-shopping-list", pattern: /^ShoppingListView-.*\.js$/, maxGzipKb: 2.4 },
]

const toKb = (bytes) => bytes / 1024
const formatKb = (bytes) => toKb(bytes).toFixed(1)

const writeSummary = async (lines) => {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return

  await fs.appendFile(summaryPath, `${lines.join("\n")}\n`)
}

const readStats = async () => {
  let files
  try {
    files = await fs.readdir(assetsDir)
  } catch (error) {
    console.error(`Bundle assets directory not found: ${assetsDir}`)
    process.exit(1)
  }

  const assetFiles = files.filter((file) => file.endsWith(".js") || file.endsWith(".css"))
  if (assetFiles.length === 0) {
    console.error(`No JavaScript or CSS assets found in ${assetsDir}`)
    process.exit(1)
  }

  const stats = await Promise.all(
    assetFiles.map(async (file) => {
      const filePath = path.join(assetsDir, file)
      const data = await fs.readFile(filePath)
      const gzipBytes = gzipSync(data).length

      return {
        file,
        rawBytes: data.length,
        gzipBytes,
      }
    })
  )

  return stats
}

const stats = await readStats()

const budgetResults = budgets.map((budget) => {
  const matches = stats.filter((stat) => budget.pattern.test(stat.file))
  if (matches.length === 0) {
    return {
      name: budget.name,
      rawBytes: 0,
      gzipBytes: 0,
      maxGzipBytes: budget.maxGzipKb * 1024,
      status: "missing",
    }
  }

  const rawBytes = matches.reduce((total, stat) => total + stat.rawBytes, 0)
  const gzipBytes = matches.reduce((total, stat) => total + stat.gzipBytes, 0)
  const maxGzipBytes = budget.maxGzipKb * 1024

  return {
    name: budget.name,
    rawBytes,
    gzipBytes,
    maxGzipBytes,
    status: gzipBytes > maxGzipBytes ? "over" : "ok",
  }
})

const largest = [...stats].sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, 6)

const summaryLines = [
  "## Bundle size report",
  "",
  "| Chunk | Raw (KB) | Gzip (KB) | Budget (KB) | Status |",
  "| --- | ---: | ---: | ---: | --- |",
  ...budgetResults.map((result) => {
    const budgetKb = result.maxGzipBytes ? formatKb(result.maxGzipBytes) : "-"
    return `| ${result.name} | ${formatKb(result.rawBytes)} | ${formatKb(result.gzipBytes)} | ${budgetKb} | ${result.status.toUpperCase()} |`
  }),
  "",
  "### Largest chunks (gzip)",
  "",
  "| File | Raw (KB) | Gzip (KB) |",
  "| --- | ---: | ---: |",
  ...largest.map((stat) => `| ${stat.file} | ${formatKb(stat.rawBytes)} | ${formatKb(stat.gzipBytes)} |`),
]

await writeSummary(summaryLines)

for (const result of budgetResults) {
  console.log(
    `${result.name}: ${formatKb(result.gzipBytes)}KB gzip (budget ${formatKb(result.maxGzipBytes)}KB) [${result.status}]`
  )
}

const failures = budgetResults.filter((result) => result.status !== "ok")
if (failures.length > 0) {
  console.error("Bundle budget check failed.")
  process.exit(1)
}
