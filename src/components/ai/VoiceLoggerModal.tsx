'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, Check, RefreshCw, AlertCircle, Volume2, Clock, Edit3 } from 'lucide-react';
import { useVoiceScanner, VoiceRecordingStage } from '../../hooks/useVoiceScanner';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { VoiceDetectedFood } from '../../types/ai';
import { useNutritionAI } from '../../hooks/useNutritionAI';

interface VoiceLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (foods: VoiceDetectedFood[]) => void;
}

export function VoiceLoggerModal({ isOpen, onClose, onConfirm }: VoiceLoggerModalProps) {
  const {
    isListening,
    isProcessing,
    transcript,
    result,
    error,
    stage,
    recordingDuration,
    startListening,
    stopListening,
    reset,
  } = useVoiceScanner();

  const { analyzeFood } = useNutritionAI();
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  useEffect(() => {
    if (isOpen) {
      reset();
      setShowTextFallback(false);
      setTextInput('');
    }
  }, [isOpen, reset]);

  const handleStartListening = () => {
    console.log('[VoiceLoggerModal] Start Recording clicked');
    startListening();
  };

  const handleStopListening = () => {
    console.log('[VoiceLoggerModal] Stop Recording clicked');
    stopListening();
  };

  const handleConfirm = () => {
    if (result?.detectedFoods) {
      onConfirm(result.detectedFoods);
      onClose();
    }
  };

  const handleRetry = () => {
    reset();
    setShowTextFallback(false);
    setTextInput('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    setIsSubmittingText(true);
    try {
      const result = await analyzeFood(textInput);
      if (result) {
        onConfirm([{
          name: result.foodName,
          quantity: 1,
          unit: result.servingSize,
          estimatedCalories: Math.round(result.calories),
          macros: {
            protein_g: Math.round(result.protein_g),
            carbs_g: Math.round(result.carbs_g),
            fat_g: Math.round(result.fat_g),
          },
        }]);
        onClose();
      }
    } catch (err) {
      console.error('Text analysis failed:', err);
    } finally {
      setIsSubmittingText(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageLabel = (stage: VoiceRecordingStage): string => {
    switch (stage) {
      case 'requesting_permission': return 'Requesting microphone access...';
      case 'recording': return 'Recording...';
      case 'processing': return 'Processing audio...';
      case 'transcribing': return 'Transcribing speech...';
      case 'analyzing': return 'Analyzing food...';
      case 'success': return 'Done!';
      case 'error': return 'Error';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-600" />
            Voice Food Logger
          </DialogTitle>
          <DialogDescription>
            Describe what you ate, and I'll identify the foods and their nutrition.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stage Indicator */}
          {stage !== 'idle' && stage !== 'success' && stage !== 'error' && (
            <div className="text-center text-sm text-muted-foreground">
              {getStageLabel(stage)}
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center justify-center py-4">
            {stage === 'recording' && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                    <Mic className="w-10 h-10 text-red-600" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75"></div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-lg font-mono font-bold">{formatDuration(recordingDuration)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Speak now...</p>
              </div>
            )}

            {stage === 'requesting_permission' && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-yellow-600 animate-pulse" />
                </div>
                <p className="mt-3 text-sm font-medium text-yellow-600">
                  Allow microphone access...
                </p>
              </div>
            )}

            {(stage === 'processing' || stage === 'transcribing' || stage === 'analyzing') && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <p className="mt-3 text-sm font-medium text-blue-600">
                  {getStageLabel(stage)}
                </p>
              </div>
            )}

            {stage === 'idle' && !showTextFallback && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Mic className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  Tap the microphone and describe your meal
                </p>
              </div>
            )}

            {stage === 'success' && result && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-green-600">
                  Food identified!
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  {error.includes('denied') && (
                    <div className="mt-3 text-xs text-red-700 dark:text-red-300">
                      <p className="font-medium mb-1">To enable microphone access:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Click the lock/camera icon in your address bar</li>
                        <li>Find "Microphone" and set it to "Allow"</li>
                        <li>Refresh the page and try again</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setShowTextFallback(true)} className="flex-1">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Type Instead
                </Button>
              </div>
            </div>
          )}

          {/* Text Fallback Input */}
          {showTextFallback && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg border">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Type what you ate:
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder='e.g., "I had a chicken breast with rice and vegetables"'
                  className="w-full h-24 p-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTextFallback(false)}
                  className="flex-1"
                >
                  Back to Voice
                </Button>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isSubmittingText}
                  className="flex-1"
                >
                  {isSubmittingText ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Analyze
                </Button>
              </div>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium text-foreground mb-1">Heard:</p>
              <p className="text-foreground">{transcript}</p>
            </div>
          )}

          {/* Detected Foods */}
          {result?.detectedFoods && result.detectedFoods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Detected Foods:</p>
              <div className="space-y-2">
                {result.detectedFoods.map((food, index) => (
                  <DetectedFoodCard key={index} food={food} />
                ))}
              </div>
            </div>
          )}

          {/* Confidence Indicator */}
          {result && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <span
                className={`font-medium ${result.confidence > 0.8
                  ? 'text-green-600'
                  : result.confidence > 0.5
                    ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}
              >
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          )}

          {/* Action Buttons */}
          {!showTextFallback && (
            <div className="flex gap-2 pt-2">
              {stage === 'idle' && !result && (
                <Button
                  onClick={handleStartListening}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              )}

              {stage === 'recording' && (
                <Button
                  onClick={handleStopListening}
                  variant="destructive"
                  className="flex-1"
                >
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              )}

              {stage === 'success' && result && (
                <>
                  <Button variant="outline" onClick={handleRetry} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1">
                    <Check className="mr-2 h-4 w-4" />
                    Add to Log
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Tips */}
          {stage === 'idle' && !result && !showTextFallback && !error && (
            <p className="text-xs text-muted-foreground text-center">
              Try saying: "I had a chicken breast with rice and vegetables"
            </p>
          )}

          {/* Text fallback link */}
          {stage === 'idle' && !showTextFallback && !error && (
            <button
              onClick={() => setShowTextFallback(true)}
              className="text-xs text-primary hover:underline block w-full text-center"
            >
              Prefer to type? Click here
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetectedFoodCard({ food }: { food: VoiceDetectedFood }) {
  return (
    <div className="p-3 bg-card rounded-lg border shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-foreground">{food.name}</p>
          <p className="text-sm text-muted-foreground">
            {food.quantity} {food.unit}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-primary">
            {food.estimatedCalories} cal
          </p>
          <p className="text-xs text-muted-foreground">per serving</p>
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span>P: {food.macros.protein_g}g</span>
        <span>C: {food.macros.carbs_g}g</span>
        <span>F: {food.macros.fat_g}g</span>
      </div>
    </div>
  );
}

// Voice Waveform Visualizer Component
export function VoiceWaveform({ isListening }: { isListening: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(20).fill(10));

  useEffect(() => {
    if (!isListening) {
      setBars(Array(20).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setBars(Array(20).fill(0).map(() => Math.random() * 40 + 10));
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-1 bg-red-500 rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(height, 8)}px`,
            opacity: isListening ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Microphone Button Component for easy access
interface MicrophoneButtonProps {
  onClick: () => void;
  className?: string;
}

export function MicrophoneButton({ onClick, className = '' }: MicrophoneButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`rounded-full w-12 h-12 bg-red-600 hover:bg-red-700 ${className}`}
      size="icon"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
