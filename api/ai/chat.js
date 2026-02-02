/**
 * Vercel Serverless Function: /api/ai/chat
 * Proxies requests to OpenAI ChatGPT API
 */

const DEFAULTS = {
    openaiBaseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    timeoutMs: 30000,
    maxBodyBytes: 200000,
};

// Simple in-memory rate limiter (per-request basis for serverless)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 60;

function getRateLimit(ip) {
    const now = Date.now();
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

function sanitizeMessages(messages) {
    const sanitized = [];
    for (const message of messages) {
        if (!message || typeof message !== 'object') continue;
        const role = typeof message.role === 'string' ? message.role : '';
        const content = typeof message.content === 'string' ? message.content : '';
        if (!role || !content) continue;
        sanitized.push({ role, content });
    }
    return sanitized.length > 0 ? sanitized : null;
}

function buildOpenAIPayload(body, defaultModel) {
    if (!body || typeof body !== 'object') {
        return { ok: false, error: 'Request body must be a JSON object.' };
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const sanitizedMessages = sanitizeMessages(messages);
    if (!sanitizedMessages) {
        return { ok: false, error: 'Request must include a non-empty messages array.' };
    }

    const payload = {
        model: typeof body.model === 'string' && body.model.length > 0 ? body.model : defaultModel,
        messages: sanitizedMessages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.3,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 2000,
        top_p: typeof body.top_p === 'number' ? body.top_p : undefined,
        presence_penalty: typeof body.presence_penalty === 'number' ? body.presence_penalty : undefined,
        frequency_penalty: typeof body.frequency_penalty === 'number' ? body.frequency_penalty : undefined,
        response_format:
            body.response_format && typeof body.response_format === 'object' ? body.response_format : undefined,
    };

    // Strip undefined values
    return {
        ok: true,
        data: Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined)),
    };
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

    // Check auth if required
    const authRequired = process.env.AI_PROXY_AUTH_REQUIRED !== 'false';
    const authToken = process.env.AI_PROXY_AUTH_TOKEN ?? '';

    if (authRequired) {
        const header = req.headers.authorization ?? '';
        const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
        const tokenHeader = req.headers['x-api-token'] ?? '';
        const token = bearer || tokenHeader;

        if (!token || !authToken || token !== authToken) {
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
    if (!body) {
        return res.status(400).json({ error: { message: 'Request body required' } });
    }

    // Build OpenAI payload
    const model = process.env.AI_PROXY_MODEL ?? DEFAULTS.model;
    const payload = buildOpenAIPayload(body, model);
    if (!payload.ok) {
        return res.status(400).json({ error: { message: payload.error } });
    }

    // Call OpenAI
    try {
        const openaiUrl = process.env.AI_PROXY_OPENAI_BASE_URL ?? DEFAULTS.openaiBaseUrl;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULTS.timeoutMs);

        const response = await fetch(openaiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify(payload.data),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseBody = await response.text();
        const contentType = response.headers.get('content-type') ?? 'application/json';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(response.status).send(responseBody);

    } catch (error) {
        console.error('[api/ai/chat] OpenAI request failed:', error);

        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: { message: 'Request timeout. The AI service is taking too long to respond.' }
            });
        }

        return res.status(502).json({
            error: { message: 'Upstream OpenAI request failed.' }
        });
    }
}
