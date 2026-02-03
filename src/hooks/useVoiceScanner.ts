import { useState, useCallback, useRef } from 'react';
import { VoiceState, VoiceParsingResult } from '../types/ai';
import { useNutritionAI } from './useNutritionAI';

// Debug logging (dev-only)
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_VOICE === 'true';

function debugLog(...args: unknown[]) {
  if (DEBUG) {
    console.log('[VoiceScanner]', ...args);
  }
}

function debugError(...args: unknown[]) {
  console.error('[VoiceScanner]', ...args);
}

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/aac',
];

export type VoiceRecordingStage =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'transcribing'
  | 'analyzing'
  | 'success'
  | 'error';

interface ExtendedVoiceState extends VoiceState {
  stage: VoiceRecordingStage;
  recordingDuration: number;
}

export function useVoiceScanner() {
  const [state, setState] = useState<ExtendedVoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    result: null,
    error: null,
    stage: 'idle',
    recordingDuration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const { analyzeFood } = useNutritionAI();

  const getSupportedMimeType = (): string => {
    debugLog('Checking supported MIME types...');
    debugLog('isSecureContext:', window.isSecureContext);
    debugLog('mediaDevices exists:', !!navigator.mediaDevices);
    debugLog('MediaRecorder exists:', typeof MediaRecorder !== 'undefined');

    if (typeof MediaRecorder === 'undefined') {
      debugError('MediaRecorder not available');
      return '';
    }

    for (const type of MIME_TYPES) {
      const supported = MediaRecorder.isTypeSupported(type);
      debugLog(`  ${type}: ${supported ? '✓' : '✗'}`);
      if (supported) return type;
    }

    debugError('No supported MIME type found');
    return '';
  };

  const startListening = useCallback(async () => {
    debugLog('startListening() called');

    // Check browser support first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      debugError('mediaDevices.getUserMedia not available');
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: 'Voice recording is not supported in this browser. Please use Chrome, Firefox, or Safari.',
      }));
      return;
    }

    if (!window.isSecureContext) {
      debugError('Not a secure context (HTTPS required)');
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: 'Voice recording requires HTTPS. Please access this page over a secure connection.',
      }));
      return;
    }

    // Reset state
    setState({
      isListening: false,
      isProcessing: false,
      transcript: '',
      result: null,
      error: null,
      stage: 'requesting_permission',
      recordingDuration: 0,
    });

    try {
      debugLog('Requesting microphone permission...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      debugLog('Permission granted! Stream tracks:', stream.getTracks().length);

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format found in this browser.');
      }

      debugLog('Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        debugLog('ondataavailable, chunk size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        debugLog('onstop fired, total chunks:', audioChunksRef.current.length);

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Release microphone stream
        streamRef.current?.getTracks().forEach(track => {
          track.stop();
          debugLog('Track stopped:', track.kind);
        });

        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        debugLog('Final blob size:', audioBlob.size, 'type:', audioBlob.type);

        if (audioBlob.size === 0) {
          debugError('Audio blob is empty!');
          setState(prev => ({
            ...prev,
            stage: 'error',
            isProcessing: false,
            error: 'Recording was empty. Please speak clearly and try again.',
          }));
          return;
        }

        // Process the audio
        await processAudio(audioBlob);
      };

      mediaRecorder.onerror = (event: Event) => {
        debugError('MediaRecorder error:', event);
        setState(prev => ({
          ...prev,
          stage: 'error',
          isListening: false,
          error: 'Recording error occurred. Please try again.',
        }));
      };

      // Start recording with timeslice to get chunks periodically
      mediaRecorder.start(1000); // Get data every second
      debugLog('Recording started! State:', mediaRecorder.state);

      // Start duration timer
      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingDuration: prev.recordingDuration + 1,
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        isListening: true,
        stage: 'recording',
        error: null,
      }));

    } catch (err: unknown) {
      debugError('Failed to start recording:', err);

      const error = err as Error & { name?: string };
      let errorMessage = 'Failed to access microphone.';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings and reload the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps using the microphone.';
      } else if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
        errorMessage = 'Audio recording is not supported in this browser.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        stage: 'error',
        error: errorMessage,
      }));
    }
  }, []);

  const stopListening = useCallback(() => {
    debugLog('stopListening() called, recorder state:', mediaRecorderRef.current?.state);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: true,
        stage: 'processing',
      }));
    }
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    debugLog('processAudio() called, blob size:', audioBlob.size);

    setState(prev => ({ ...prev, stage: 'transcribing' }));

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          debugLog('Base64 conversion complete, length:', result.length);
          resolve(result);
        };
        reader.onerror = (e) => {
          debugError('FileReader error:', e);
          reject(new Error('Failed to read audio file'));
        };
        reader.readAsDataURL(audioBlob);
      });

      // Send to Transcription API
      debugLog('Sending to /api/ai/transcribe...');

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio }),
      });

      debugLog('Transcribe response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        debugError('Transcription API error:', errorData);
        throw new Error(errorData.error?.message || `Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      const transcriptText = data.text;

      debugLog('Transcript received:', transcriptText?.substring(0, 50) + '...');

      if (!transcriptText || !transcriptText.trim()) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          stage: 'error',
          error: 'No speech detected. Please try again and speak clearly.',
        }));
        return;
      }

      setState(prev => ({ ...prev, transcript: transcriptText, stage: 'analyzing' }));

      // Analyze the transcript
      debugLog('Analyzing food from transcript...');
      const result = await analyzeFood(transcriptText);

      if (result) {
        debugLog('Food analysis result:', result.foodName, result.calories, 'cal');

        const parsingResult: VoiceParsingResult = {
          transcript: transcriptText,
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
          confidence: 0.95,
          timestamp: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          isProcessing: false,
          stage: 'success',
          result: parsingResult,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          stage: 'error',
          error: 'Could not identify food in the recording. Try describing your meal more clearly.',
        }));
      }

    } catch (err: unknown) {
      const error = err as Error;
      debugError('processAudio error:', error.message);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        stage: 'error',
        error: error.message || 'Failed to process audio. Please check your connection and try again.',
      }));
    }
  };

  const reset = useCallback(() => {
    debugLog('reset() called');

    // Clean up any active recording
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach(track => track.stop());

    setState({
      isListening: false,
      isProcessing: false,
      transcript: '',
      result: null,
      error: null,
      stage: 'idle',
      recordingDuration: 0,
    });
  }, []);

  const dismissError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, stage: 'idle' }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    processTranscript: async () => { },
    reset,
    dismissError,
  };
}
