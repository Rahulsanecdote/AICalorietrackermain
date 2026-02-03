/**
 * Vercel Serverless Function: /api/ai/transcribe
 * Transcribes audio using OpenAI Whisper API
 */

import OpenAI from 'openai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    // CORS headers
    const origin = req.headers.origin ?? '';
    const allowedOrigins = process.env.AI_PROXY_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? ['*'];

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Token');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    console.log('[Transcribe] Request received');

    try {
        const { audio } = req.body;

        if (!audio) {
            console.error('[Transcribe] No audio data in request body');
            return res.status(400).json({ error: { message: 'Audio data is required' } });
        }

        console.log('[Transcribe] Audio data length:', audio.length);

        // Check OpenAI API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('[Transcribe] OPENAI_API_KEY not configured');
            return res.status(503).json({ error: { message: 'OpenAI API key not configured' } });
        }

        const openai = new OpenAI({ apiKey });

        // Convert Base64 (data URL) to Buffer
        const base64Data = audio.split(';base64,').pop();
        if (!base64Data) {
            console.error('[Transcribe] Invalid base64 format');
            return res.status(400).json({ error: { message: 'Invalid audio format' } });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        console.log('[Transcribe] Buffer size:', buffer.length);

        if (buffer.length === 0) {
            console.error('[Transcribe] Empty audio buffer');
            return res.status(400).json({ error: { message: 'Audio recording was empty' } });
        }

        // Determine filename and MIME type from data URL header
        let filename = 'audio.webm';
        let mimeType = 'audio/webm';

        if (audio.startsWith('data:audio/mp4')) {
            filename = 'audio.mp4';
            mimeType = 'audio/mp4';
        } else if (audio.startsWith('data:audio/m4a')) {
            filename = 'audio.m4a';
            mimeType = 'audio/m4a';
        } else if (audio.startsWith('data:audio/wav')) {
            filename = 'audio.wav';
            mimeType = 'audio/wav';
        } else if (audio.startsWith('data:audio/ogg')) {
            filename = 'audio.ogg';
            mimeType = 'audio/ogg';
        } else if (audio.startsWith('data:audio/mpeg')) {
            filename = 'audio.mp3';
            mimeType = 'audio/mpeg';
        }

        console.log('[Transcribe] Using filename:', filename, 'MIME:', mimeType);

        // Use OpenAI SDK's toFile helper (works in Node.js)
        const file = await OpenAI.toFile(buffer, filename, { type: mimeType });

        console.log('[Transcribe] Calling Whisper API...');

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'en',
        });

        console.log('[Transcribe] Success! Text:', transcription.text?.substring(0, 50) + '...');

        return res.status(200).json({ text: transcription.text });

    } catch (error) {
        console.error('[Transcribe] Error:', error.message || error);
        console.error('[Transcribe] Stack:', error.stack);

        // Return helpful error message
        let userMessage = 'Transcription failed';
        if (error.message?.includes('API key')) {
            userMessage = 'API configuration error';
        } else if (error.message?.includes('format')) {
            userMessage = 'Unsupported audio format';
        } else if (error.message?.includes('rate')) {
            userMessage = 'Too many requests. Please wait and try again.';
        }

        return res.status(500).json({
            error: { message: userMessage, details: error.message }
        });
    }
}
