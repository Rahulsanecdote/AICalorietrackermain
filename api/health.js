/**
 * Vercel Serverless Function: /api/health
 * Simple health check endpoint
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        return res.status(503).json({
            status: 'misconfigured',
            message: 'OpenAI API key is not configured on the server.',
            timestamp: new Date().toISOString(),
        });
    }

    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
