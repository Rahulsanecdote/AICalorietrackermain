import fs from "node:fs"
import path from "node:path"

const cwd = process.cwd()
const expectedRepo = process.env.EXPECTED_GITHUB_REPOSITORY
const currentRepo = process.env.GITHUB_REPOSITORY

const fail = (message) => {
  console.error(`❌ CI root guard failed: ${message}`)
  process.exit(1)
}

const assertExists = (relativePath, label = relativePath) => {
  if (!fs.existsSync(path.join(cwd, relativePath))) {
    fail(`Missing required file/directory: ${label}`)
  }
}

if (expectedRepo && currentRepo && currentRepo !== expectedRepo) {
  fail(`Workflow is running for "${currentRepo}" but expected "${expectedRepo}".`)
}

assertExists("package.json")
assertExists("src/App.tsx")
assertExists("vercel.json")
assertExists("scripts/bundle-budget.mjs")
assertExists(".github/workflows/production-deploy.yml")

const packageJsonPath = path.join(cwd, "package.json")
const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8")
const pkg = JSON.parse(packageJsonRaw)

if (pkg?.name !== "nutriai-calorie-tracker") {
  fail(`Unexpected package name "${pkg?.name ?? "undefined"}".`)
}

if (!pkg?.scripts?.build || !pkg?.scripts?.["bundle:budget"]) {
  fail('package.json must include both "build" and "bundle:budget" scripts.')
}

const nestedMirrorPath = path.join(cwd, "AICalorietrackermain", "package.json")
if (fs.existsSync(nestedMirrorPath)) {
  fail(
    'Detected nested "AICalorietrackermain/package.json". This indicates the workflow is running from a wrapper repo root.'
  )
}

console.log("✅ CI root guard passed.")
console.log(`Repository context: ${currentRepo ?? "unknown"}`)
console.log(`Working directory: ${cwd}`)
