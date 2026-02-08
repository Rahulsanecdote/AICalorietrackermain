/**
 * Vercel Serverless Function: /api/ai/chat
 * Uses Vercel AI SDK with OpenAI provider
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 60;
const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 20000;
const rateLimitStore = new Map();

function getRateLimit(ip) {
    const now = Date.now();

    if (rateLimitStore.size > 1000) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetAt <= now) {
                rateLimitStore.delete(key);
            }
        }
    }

    const entry = rateLimitStore.get(ip);

    if (!entry || entry.resetAt <= now) {
        const resetAt = now + RATE_LIMIT_WINDOW_MS;
        rateLimitStore.set(ip, { count: 1, resetAt });
        return { allowed: true, resetAt };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return { allowed: false, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return { allowed: true, resetAt: entry.resetAt };
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? 'unknown';
}

export default async function handler(req, res) {
    // CORS headers
    const origin = req.headers.origin ?? '';
    const allowedOrigins = process.env.AI_PROXY_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? ['*'];

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Token');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    // Check auth if enabled (disabled by default for simpler setup)
    const authRequired = process.env.AI_PROXY_AUTH_REQUIRED === 'true';
    const authToken = process.env.AI_PROXY_AUTH_TOKEN ?? '';

    if (authRequired && authToken) {
        const header = req.headers.authorization ?? '';
        const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
        const tokenHeader = req.headers['x-api-token'] ?? '';
        const token = bearer || tokenHeader;

        if (!token || token !== authToken) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
    }

    // Check OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        return res.status(503).json({
            error: { message: 'OpenAI API key is not configured on the server.' }
        });
    }

    // Rate limiting
    const clientIp = getClientIp(req);
    const limit = getRateLimit(clientIp);
    if (!limit.allowed) {
        res.setHeader('Retry-After', Math.ceil((limit.resetAt - Date.now()) / 1000));
        return res.status(429).json({ error: { message: 'Rate limit exceeded. Please retry later.' } });
    }

    // Parse request body
    const body = req.body;
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: { message: 'Request body required' } });
    }

    // Validate messages
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
        return res.status(400).json({ error: { message: 'Request must include a non-empty messages array.' } });
    }

    const sanitizedMessages = messages
        .filter((m) => m && typeof m === 'object')
        .map((m) => ({
            role: m.role,
            content: m.content,
        }))
        .filter((m) =>
            (m.role === 'system' || m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.length > 0 &&
            m.content.length <= MAX_MESSAGE_CHARS
        );

    if (sanitizedMessages.length === 0) {
        return res.status(400).json({ error: { message: 'No valid messages were provided.' } });
    }

    // Call OpenAI using Vercel AI SDK
    try {
        const modelId = body.model || process.env.AI_PROXY_MODEL || 'gpt-4o-mini';
        const temperature = typeof body.temperature === 'number' ? body.temperature : 0.3;
        const maxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : 2000;

        const result = await generateText({
            model: openai(modelId),
            messages: sanitizedMessages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            temperature,
            maxTokens,
        });

        // Format response to match OpenAI API format for backwards compatibility
        const response = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: modelId,
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: result.text,
                    },
                    finish_reason: result.finishReason || 'stop',
                },
            ],
            usage: {
                prompt_tokens: result.usage?.promptTokens ?? 0,
                completion_tokens: result.usage?.completionTokens ?? 0,
                total_tokens: result.usage?.totalTokens ?? 0,
            },
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json(response);

    } catch (error) {
        console.error('[api/ai/chat] AI SDK error:', error);

        // Handle specific error types
        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: { message: 'Request timeout. The AI service is taking too long to respond.' }
            });
        }

        if (error.message?.includes('rate')) {
            return res.status(429).json({
                error: { message: 'Rate limit exceeded. Please retry later.' }
            });
        }

        return res.status(502).json({
            error: { message: error.message || 'AI request failed.' }
        });
    }
}
