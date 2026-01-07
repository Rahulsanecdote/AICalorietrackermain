import { useState, useCallback, useRef } from 'react';
import { EduMessage, EduSession, QuickPrompt, AIProcessingStatus } from '../types/ai';
import { v4 as uuidv4 } from 'uuid';
import { API_CONFIG } from '../constants';
import { postAIChat } from '../utils/aiClient';

const SYSTEM_PROMPT = `You are NutriBot, a friendly and knowledgeable nutrition education assistant. Your role is to:

1. Explain nutrition concepts in simple, easy-to-understand language
2. Provide practical, actionable advice
3. Be encouraging and supportive
4. Keep answers concise but informative (aim for 100-200 words)
5. Use relevant examples and analogies
6. Acknowledge when something is complex and break it down

You should:
- Focus on evidence-based nutrition science
- Be honest about limitations and context
- Encourage users to consult professionals for specific medical advice
- Suggest related topics they might want to learn about

Current date context: ${new Date().toLocaleDateString()}

Remember: You're helping people make better food choices, so be helpful and inspiring!`;

export const QUICK_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'What is a calorie?', prompt: 'Explain what a calorie is in simple terms', category: 'basics' },
  { id: '2', label: 'Protein explained', prompt: 'Why is protein important for health?', category: 'macros' },
  { id: '3', label: 'Carbs: Good vs Bad', prompt: 'What are healthy vs unhealthy carbohydrates?', category: 'macros' },
  { id: '4', label: 'Keto basics', prompt: 'Explain the ketogenic diet simply', category: 'diets' },
  { id: '5', label: 'Intermittent Fasting', prompt: 'What is intermittent fasting?', category: 'diets' },
  { id: '6', label: 'Why fiber matters', prompt: 'Why is dietary fiber important?', category: 'health' },
  { id: '7', label: 'Meal timing', prompt: 'Does when you eat matter?', category: 'health' },
  { id: '8', label: 'Read food labels', prompt: 'How to read nutrition labels effectively', category: 'basics' },
  { id: '9', label: 'Sugar addiction', prompt: 'Tips for reducing sugar cravings', category: 'health' },
  { id: '10', label: 'Healthy snacks', prompt: 'What are some healthy snack options?', category: 'health' },
];

export function useNutriTutor() {
  const [session, setSession] = useState<EduSession | null>(null);
  const [status, setStatus] = useState<AIProcessingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createSession = useCallback((context?: EduSession['context']) => {
    const newSession: EduSession = {
      id: uuidv4(),
      messages: [
        {
          id: 'system',
          role: 'system',
          content: SYSTEM_PROMPT,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm NutriBot, your nutrition education assistant. Ask me anything about nutrition, healthy eating, or how to reach your health goals. What would you like to learn about today?",
          timestamp: new Date().toISOString(),
          relatedTopics: ['calories', 'macros', 'balanced diet'],
        },
      ],
      createdAt: new Date().toISOString(),
      context,
    };
    setSession(newSession);
    return newSession;
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!session) {
      createSession();
    }

    const currentSession = session || createSession();

    // Add user message
    const userMessage: EduMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentSession.messages, userMessage];

    setSession({
      ...currentSession,
      messages: updatedMessages,
    });

    setStatus('processing');
    setError(null);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const conversationHistory = updatedMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await postAIChat(
        {
          model: API_CONFIG.MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory,
          ],
          temperature: 0.7,
          max_tokens: 400,
        },
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response');
      }

      const data = await response.json();
      const assistantContent = data.choices[0]?.message?.content;

      if (!assistantContent) {
        throw new Error('No response from NutriBot');
      }

      // Extract related topics from response or generate them
      const relatedTopics = generateRelatedTopics(content, assistantContent);

      const assistantMessage: EduMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        relatedTopics,
      };

      setSession({
        ...currentSession,
        messages: [...updatedMessages, assistantMessage],
      });
      setStatus('success');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('NutriBot error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
      setStatus('error');
    }
  }, [session, createSession]);

  const clearSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSession(null);
    setStatus('idle');
    setError(null);
  }, []);

  const getQuickPrompt = useCallback((promptId: string): QuickPrompt | undefined => {
    return QUICK_PROMPTS.find((p) => p.id === promptId);
  }, []);

  return {
    session,
    status,
    error,
    isActive: session !== null,
    createSession,
    sendMessage,
    clearSession,
    getQuickPrompt,
    quickPrompts: QUICK_PROMPTS,
  };
}

// Helper to generate related topics based on the conversation
function generateRelatedTopics(userQuestion: string, assistantAnswer: string): string[] {
  const topics: string[] = [];
  const lowerAnswer = assistantAnswer.toLowerCase();

  const topicKeywords: Record<string, string[]> = {
    'protein': ['protein', 'macros', 'amino acids', 'muscle'],
    'carbs': ['carbohydrates', 'sugar', 'fiber', 'energy'],
    'fat': ['fats', 'omega', 'healthy fats', 'cholesterol'],
    'calories': ['calorie', 'energy', 'weight'],
    'fiber': ['fiber', 'digestion', 'gut health'],
    'hydration': ['water', 'hydration', 'fluids'],
    'vitamins': ['vitamins', 'minerals', 'micronutrients'],
    'meal planning': ['meal', 'planning', 'prep', 'schedule'],
  };

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some((kw) => lowerAnswer.includes(kw))) {
      topics.push(topic);
    }
  });

  // Add contextual suggestions based on question
  const lowerQuestion = userQuestion.toLowerCase();
  if (lowerQuestion.includes('weight') || lowerQuestion.includes('lose')) {
    topics.push('calorie deficit', 'exercise');
  }
  if (lowerQuestion.includes('muscle') || lowerQuestion.includes('build')) {
    topics.push('protein', 'recovery');
  }
  if (lowerQuestion.includes('energy') || lowerQuestion.includes('tired')) {
    topics.push('balanced meals', 'complex carbs');
  }

  return [...new Set(topics)].slice(0, 4);
}
