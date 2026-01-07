import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const args = process.argv.slice(2)
const envFile = process.env.ENV_FILE || ".env.server"

if (args.length === 0) {
  console.error("Usage: node scripts/with-env.mjs <command> [...args]")
  console.error(`Example: ENV_FILE=${envFile} node scripts/with-env.mjs pnpm server`)
  process.exit(1)
}

if (!fs.existsSync(envFile)) {
  console.error(`Missing ${envFile}. Copy .env.server.example to ${envFile} and fill in values.`)
  process.exit(1)
}

const fileContents = fs.readFileSync(envFile, "utf8")
const parsed = parseEnv(fileContents)
const env = { ...process.env, ...parsed }

const [command, ...commandArgs] = args
const child = spawn(command, commandArgs, {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
})

child.on("exit", (code) => {
  process.exit(code ?? 1)
})

function parseEnv(contents) {
  const envVars = {}
  const lines = contents.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed
    const index = normalized.indexOf("=")
    if (index === -1) continue

    const key = normalized.slice(0, index).trim()
    let value = normalized.slice(index + 1).trim()
    if (!key) continue

    value = stripQuotes(value)
    envVars[key] = value
  }

  return envVars
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}
