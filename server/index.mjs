import http from "node:http"
import crypto from "node:crypto"
import { URL } from "node:url"

const DEFAULTS = {
  port: 3001,
  openaiBaseUrl: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
  timeoutMs: 30000,
  rateLimitWindowMs: 60_000,
  rateLimitMax: 60,
  maxBodyBytes: 200_000,
}

const config = {
  port: parseNumber(process.env.AI_PROXY_PORT, DEFAULTS.port),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.AI_PROXY_OPENAI_BASE_URL ?? DEFAULTS.openaiBaseUrl,
  model: process.env.AI_PROXY_MODEL ?? DEFAULTS.model,
  timeoutMs: parseNumber(process.env.AI_PROXY_TIMEOUT_MS, DEFAULTS.timeoutMs),
  rateLimitWindowMs: parseNumber(process.env.AI_PROXY_RATE_LIMIT_WINDOW_MS, DEFAULTS.rateLimitWindowMs),
  rateLimitMax: parseNumber(process.env.AI_PROXY_RATE_LIMIT_MAX, DEFAULTS.rateLimitMax),
  maxBodyBytes: parseNumber(process.env.AI_PROXY_MAX_BODY_BYTES, DEFAULTS.maxBodyBytes),
  authToken: process.env.AI_PROXY_AUTH_TOKEN ?? "",
  authRequired: parseBoolean(process.env.AI_PROXY_AUTH_REQUIRED, true),
  allowedOrigins: parseList(process.env.AI_PROXY_ALLOWED_ORIGINS),
}

if (config.authRequired && !config.authToken) {
  console.error("[ai-proxy] AI_PROXY_AUTH_TOKEN must be set when authentication is required.")
  process.exit(1)
}

const rateLimiter = createRateLimiter({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
})

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : ""

  applyCors(req, res, origin)

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: { message: "Unauthorized" } })
      return
    }

    if (!config.openaiApiKey) {
      sendJson(res, 503, {
        status: "misconfigured",
        message: "OpenAI API key is not configured on the server.",
        timestamp: new Date().toISOString(),
      })
      return
    }

    sendJson(res, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (url.pathname === "/api/ai/chat" && req.method === "POST") {
    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: { message: "Unauthorized" } })
      return
    }

    if (!config.openaiApiKey) {
      sendJson(res, 503, { error: { message: "OpenAI API key is not configured on the server." } })
      return
    }

    const clientIp = getClientIp(req)
    const limit = rateLimiter.check(clientIp)
    if (!limit.allowed) {
      res.setHeader("Retry-After", Math.ceil((limit.resetAt - Date.now()) / 1000))
      sendJson(res, 429, { error: { message: "Rate limit exceeded. Please retry later." } })
      return
    }

    let body
    try {
      body = await readJson(req, config.maxBodyBytes)
    } catch (error) {
      sendJson(res, 400, { error: { message: error instanceof Error ? error.message : "Invalid JSON body" } })
      return
    }

    const payload = buildOpenAIPayload(body)
    if (!payload.ok) {
      sendJson(res, 400, { error: { message: payload.error } })
      return
    }

    try {
      const response = await fetch(config.openaiBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify(payload.data),
        signal: AbortSignal.timeout(config.timeoutMs),
      })

      const responseBody = await response.text()
      const contentType = response.headers.get("content-type") ?? "application/json"
      res.writeHead(response.status, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      })
      res.end(responseBody)
    } catch (error) {
      sendJson(res, 502, { error: { message: "Upstream OpenAI request failed." } })
    }
    return
  }

  sendJson(res, 404, { error: { message: "Not Found" } })
})

server.listen(config.port, () => {
  console.log(`[ai-proxy] listening on http://localhost:${config.port}`)
})

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase())
}

function parseList(value) {
  if (!value) return []
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim()
  }
  return req.socket.remoteAddress ?? "unknown"
}

function applyCors(req, res, origin) {
  const allowedOrigin = resolveAllowedOrigin(origin)
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
    res.setHeader("Vary", "Origin")
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Token")
  res.setHeader("Access-Control-Max-Age", "86400")
}

function resolveAllowedOrigin(origin) {
  if (!origin) return ""
  if (config.allowedOrigins.length === 0) return ""
  if (config.allowedOrigins.includes("*")) return "*"
  return config.allowedOrigins.includes(origin) ? origin : ""
}

function isAuthorized(req) {
  if (!config.authRequired) return true

  const header = req.headers.authorization
  const bearer = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : ""
  const tokenHeader = req.headers["x-api-token"]
  const token = bearer || (Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader) || ""

  if (!token || !config.authToken) return false
  return timingSafeEqual(token, config.authToken)
}

function timingSafeEqual(a, b) {
  const bufferA = Buffer.from(String(a))
  const bufferB = Buffer.from(String(b))
  if (bufferA.length !== bufferB.length) {
    return false
  }
  return crypto.timingSafeEqual(bufferA, bufferB)
}

function createRateLimiter({ windowMs, max }) {
  const store = new Map()

  return {
    check(ip) {
      const now = Date.now()
      const entry = store.get(ip)

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + windowMs
        store.set(ip, { count: 1, resetAt })
        return { allowed: true, resetAt }
      }

      if (entry.count >= max) {
        return { allowed: false, resetAt: entry.resetAt }
      }

      entry.count += 1
      return { allowed: true, resetAt: entry.resetAt }
    },
  }
}

async function readJson(req, maxBytes) {
  const chunks = []
  let total = 0

  for await (const chunk of req) {
    total += chunk.length
    if (total > maxBytes) {
      throw new Error("Request body too large")
    }
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    throw new Error("Request body required")
  }

  const raw = Buffer.concat(chunks).toString("utf8")
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error("Malformed JSON body")
  }
}

function buildOpenAIPayload(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." }
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const sanitizedMessages = sanitizeMessages(messages)
  if (!sanitizedMessages) {
    return { ok: false, error: "Request must include a non-empty messages array." }
  }

  const payload = {
    model: typeof body.model === "string" && body.model.length > 0 ? body.model : config.model,
    messages: sanitizedMessages,
    temperature: typeof body.temperature === "number" ? body.temperature : 0.3,
    max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 2000,
    top_p: typeof body.top_p === "number" ? body.top_p : undefined,
    presence_penalty: typeof body.presence_penalty === "number" ? body.presence_penalty : undefined,
    frequency_penalty: typeof body.frequency_penalty === "number" ? body.frequency_penalty : undefined,
    response_format:
      body.response_format && typeof body.response_format === "object" ? body.response_format : undefined,
  }

  return { ok: true, data: stripUndefined(payload) }
}

function sanitizeMessages(messages) {
  const sanitized = []
  for (const message of messages) {
    if (!message || typeof message !== "object") continue
    const role = typeof message.role === "string" ? message.role : ""
    const content = typeof message.content === "string" ? message.content : ""
    if (!role || !content) continue
    sanitized.push({ role, content })
  }
  return sanitized.length > 0 ? sanitized : null
}

function stripUndefined(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(data),
  })
  res.end(data)
}
