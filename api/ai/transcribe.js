/**
 * Vercel Serverless Function: /api/ai/transcribe
 * Transcribes audio using OpenAI Whisper API
 */

import OpenAI from "openai"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const MAX_AUDIO_BYTES = 10 * 1024 * 1024
const rateLimitStore = new Map()

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim()
  }
  return req.socket?.remoteAddress ?? "unknown"
}

function getRateLimit(ip) {
  const now = Date.now()

  // Opportunistic cleanup to avoid long-lived map growth.
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt <= now) {
        rateLimitStore.delete(key)
      }
    }
  }

  const entry = rateLimitStore.get(ip)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitStore.set(ip, { count: 1, resetAt })
    return { allowed: true, resetAt }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, resetAt: entry.resetAt }
}

function isAuthorized(req) {
  const authRequired = process.env.AI_PROXY_AUTH_REQUIRED === "true"
  const authToken = process.env.AI_PROXY_AUTH_TOKEN ?? ""
  if (!authRequired) return true
  if (!authToken) return false

  const header = req.headers.authorization ?? ""
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : ""
  const tokenHeader = req.headers["x-api-token"] ?? ""
  const token = bearer || tokenHeader

  return Boolean(token) && token === authToken
}

function getAllowedOrigins() {
  return process.env.AI_PROXY_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? ["*"]
}

function applyCors(req, res) {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.origin ?? ""
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins.includes("*") ? "*" : origin)
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Token")
  res.setHeader("Access-Control-Max-Age", "86400")
}

function resolveAudioFormat(audioDataUrl) {
  if (audioDataUrl.startsWith("data:audio/mp4")) return { filename: "audio.mp4", mimeType: "audio/mp4" }
  if (audioDataUrl.startsWith("data:audio/m4a")) return { filename: "audio.m4a", mimeType: "audio/m4a" }
  if (audioDataUrl.startsWith("data:audio/wav")) return { filename: "audio.wav", mimeType: "audio/wav" }
  if (audioDataUrl.startsWith("data:audio/ogg")) return { filename: "audio.ogg", mimeType: "audio/ogg" }
  if (audioDataUrl.startsWith("data:audio/mpeg")) return { filename: "audio.mp3", mimeType: "audio/mpeg" }
  return { filename: "audio.webm", mimeType: "audio/webm" }
}

export default async function handler(req, res) {
  applyCors(req, res)

  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } })
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: { message: "Unauthorized" } })
  }

  const clientIp = getClientIp(req)
  const limit = getRateLimit(clientIp)
  if (!limit.allowed) {
    res.setHeader("Retry-After", Math.ceil((limit.resetAt - Date.now()) / 1000))
    return res.status(429).json({ error: { message: "Rate limit exceeded. Please retry later." } })
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(503).json({ error: { message: "OpenAI API key not configured" } })
    }

    const { audio } = req.body ?? {}
    if (typeof audio !== "string" || !audio.startsWith("data:audio/") || !audio.includes(";base64,")) {
      return res.status(400).json({ error: { message: "Audio data is required and must be base64 data URL" } })
    }

    const base64Data = audio.split(";base64,").pop()
    if (!base64Data) {
      return res.status(400).json({ error: { message: "Invalid audio format" } })
    }

    const buffer = Buffer.from(base64Data, "base64")
    if (buffer.length === 0) {
      return res.status(400).json({ error: { message: "Audio recording was empty" } })
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({ error: { message: "Audio payload exceeds 10MB limit" } })
    }

    const { filename, mimeType } = resolveAudioFormat(audio)
    const file = await OpenAI.toFile(buffer, filename, { type: mimeType })

    const openai = new OpenAI({ apiKey })
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    })

    return res.status(200).json({ text: transcription.text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription failed"
    if (message.toLowerCase().includes("rate")) {
      return res.status(429).json({ error: { message: "Too many requests. Please wait and try again." } })
    }
    return res.status(500).json({ error: { message: "Transcription failed" } })
  }
}
