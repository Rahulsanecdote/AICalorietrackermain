import { useState, useCallback, useRef } from 'react';
import { VoiceState, VoiceParsingResult } from '../types/ai';
import { useNutritionAI } from './useNutritionAI';

export function useVoiceScanner() {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    result: null,
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const { analyzeFood } = useNutritionAI();

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition is not supported in your browser',
      }));
      return;
    }

    // Reset state
    setState({
      isListening: true,
      isProcessing: false,
      transcript: '',
      result: null,
      error: null,
    });

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcript = result[0].transcript;

      setState((prev) => ({
        ...prev,
        transcript: transcript,
      }));

      if (result.isFinal) {
        processTranscript(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      // Handle specific error types with user-friendly messages
      if (event.error === 'not-allowed') {
        setState((prev) => ({
          ...prev,
          isListening: false,
          error: 'Microphone access denied. Please allow microphone access in your browser settings and try again.',
        }));
        return;
      }

      if (event.error === 'network') {
        // Network errors are expected in some browsers, don't log as error
        setState((prev) => ({
          ...prev,
          isListening: false,
          error: null, // Don't show network errors to user
        }));
        return;
      }

      if (event.error === 'no-speech') {
        setState((prev) => ({
          ...prev,
          isListening: false,
          error: 'No speech detected. Please try again and speak clearly.',
        }));
        return;
      }

      if (event.error === 'audio-capture') {
        setState((prev) => ({
          ...prev,
          isListening: false,
          error: 'No microphone found. Please connect a microphone and try again.',
        }));
        return;
      }

      // Log other errors for debugging but show user-friendly message
      console.warn('Speech recognition error:', event.error);
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: 'Voice recognition error. Please try again.',
      }));
    };

    recognition.onend = () => {
      setState((prev) => {
        if (prev.isProcessing) return prev; // Don't stop if processing
        return {
          ...prev,
          isListening: false,
        };
      });
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: 'Failed to start microphone. Please try again.',
      }));
    }
  }, [analyzeFood]);

  const processTranscript = useCallback(async (transcript: string) => {
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      isListening: false,
    }));

    try {
      // Try to analyze the transcript as food input
      const result = await analyzeFood(transcript);

      if (result) {
        const parsingResult: VoiceParsingResult = {
          transcript,
          detectedFoods: [
            {
              name: result.foodName,
              quantity: 1,
              unit: result.servingSize,
              estimatedCalories: Math.round(result.calories),
              macros: {
                protein_g: Math.round(result.protein_g),
                carbs_g: Math.round(result.carbs_g),
                fat_g: Math.round(result.fat_g),
              },
            },
          ],
          confidence: 0.85,
          timestamp: new Date().toISOString(),
        };

        setState({
          isListening: false,
          isProcessing: false,
          transcript,
          result: parsingResult,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: 'Could not recognize food items. Please try again.',
        }));
      }
    } catch (err) {
      console.error('Processing error:', err);
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to process speech. Please try again.',
      }));
    }
  }, [analyzeFood]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isListening: false,
      isProcessing: false,
      transcript: '',
      result: null,
      error: null,
    });
  }, []);

  const dismissError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    processTranscript,
    reset,
    dismissError,
  };
}
