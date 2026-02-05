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

  // State-specific helper text
  const getHelperText = (stage: VoiceRecordingStage): string => {
    switch (stage) {
      case 'idle': return 'Describe what you ate — I’ll detect foods and estimate nutrition.';
      case 'requesting_permission': return 'Allow microphone access...';
      case 'recording': return 'Listening...';
      case 'processing': return 'Processing audio...';
      case 'transcribing': return 'Transcribing...';
      case 'analyzing': return 'Analyzing food details...';
      case 'success': return 'Food identified!';
      case 'error': return 'Transcription failed.';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="voice-modal-theme sm:max-w-md bg-[hsl(var(--vm-surface))] border-[hsl(var(--vm-border))] shadow-2xl backdrop-blur-[2px] p-0 gap-0 overflow-hidden ring-1 ring-[hsl(var(--vm-border))] transition-colors duration-200">

        {/* Permission Banner */}
        {error && error.includes('denied') && (
          <div className="bg-[hsl(var(--vm-warning))]/10 border-b border-[hsl(var(--vm-warning))]/20 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[hsl(var(--vm-warning))] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[hsl(var(--vm-warning))]">Microphone permission is blocked.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-[hsl(var(--vm-warning))] hover:text-[hsl(var(--vm-warning))]/80 underline mt-1"
              >
                Enable in settings and reload
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {stage === 'error' && !error?.includes('denied') && (
          <div className="bg-[hsl(var(--vm-warning))]/10 border-b border-[hsl(var(--vm-warning))]/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[hsl(var(--vm-warning))]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Transcription failed. Try again — or type it instead.</span>
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-[hsl(var(--vm-border))]/10 bg-[hsl(var(--vm-bg))] relative z-10 text-[hsl(var(--vm-text))]">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-[hsl(var(--vm-text-muted))]" />
            <div>
              <DialogTitle className="text-lg font-semibold text-[hsl(var(--vm-text))]">Voice Food Logger</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-[hsl(var(--vm-surface))]">
          {/* Main Status Area */}
          <div className="flex flex-col items-center justify-center py-2">

            {/* Mic Interaction Area */}
            <div className="relative mb-4">
              {stage === 'recording' && (
                <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--vm-danger))] animate-[ping_1.6s_ease-in-out_infinite] opacity-20"></div>
              )}

              {(stage === 'processing' || stage === 'transcribing' || stage === 'analyzing') && (
                <div className="absolute inset-[-4px] rounded-full border-2 border-[hsl(var(--vm-focus))] opacity-60 animate-[pulse_2s_ease-in-out_infinite]"></div>
              )}

              <button
                onClick={stage === 'recording' ? handleStopListening : handleStartListening}
                disabled={stage === 'processing' || stage === 'transcribing' || stage === 'analyzing'}
                className={`
                  relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 group
                  ${stage === 'recording'
                    ? 'bg-[hsl(var(--vm-surface))] border-2 border-[hsl(var(--vm-danger))] shadow-[0_0_15px_hsla(var(--vm-danger),0.3)]'
                    : (stage === 'processing' || stage === 'transcribing' || stage === 'analyzing')
                      ? 'bg-[hsl(var(--vm-surface))] border-2 border-[hsl(var(--vm-focus))]'
                      : 'bg-[hsl(var(--vm-raised))] border border-[hsl(var(--vm-border))] hover:border-[hsl(var(--vm-primary))] hover:shadow-[0_0_10px_hsla(var(--vm-primary),0.2)]'
                  }
                  ${(stage === 'processing' || stage === 'transcribing' || stage === 'analyzing') ? 'cursor-not-allowed' : ''}
                `}
              >
                {stage === 'processing' || stage === 'transcribing' || stage === 'analyzing' ? (
                  <RefreshCw className="w-8 h-8 text-[hsl(var(--vm-focus))] animate-spin" />
                ) : (
                  <Mic className={`w-8 h-8 transition-colors duration-300 ${stage === 'recording'
                      ? 'text-[hsl(var(--vm-danger))] animate-pulse'
                      : 'text-[hsl(var(--vm-text))] group-hover:text-[hsl(var(--vm-primary))]'
                    }`} />
                )}
              </button>
            </div>

            {/* Timer or Helper Text */}
            <div className="min-h-[2rem] text-center">
              {stage === 'recording' ? (
                <div className="flex items-center gap-2 text-[hsl(var(--vm-danger))] font-mono text-lg font-medium animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(recordingDuration)}</span>
                </div>
              ) : (stage === 'processing' || stage === 'transcribing') ? (
                <p className="text-sm text-[hsl(var(--vm-focus))] font-medium animate-pulse">
                  Transcribing...
                </p>
              ) : (
                <p className="text-sm text-[hsl(var(--vm-text-muted))] font-medium px-4 leading-relaxed">
                  {getHelperText(stage)}
                </p>
              )}
            </div>
          </div>

          {/* Transcript Preview */}
          {transcript && (
            <div className="text-center px-4 py-2 bg-[hsl(var(--vm-bg))] rounded-lg border border-[hsl(var(--vm-border))]">
              <p className="text-sm italic text-[hsl(var(--vm-text-muted))]">"{transcript}"</p>
            </div>
          )}

          {/* Detected Foods Result */}
          {result?.detectedFoods && result.detectedFoods.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[hsl(var(--vm-text))]">Detected Foods</h3>
                <span className="text-xs text-[hsl(var(--vm-primary))] font-medium">High Confidence</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {result.detectedFoods.map((food, index) => (
                  <DetectedFoodCard key={index} food={food} />
                ))}
              </div>

              <Button onClick={handleConfirm} className="w-full bg-[hsl(var(--vm-primary))] hover:bg-[hsl(var(--vm-primary-hover))] text-white mt-2 border-0">
                <Check className="mr-2 h-4 w-4" />
                Add to Log
              </Button>
            </div>
          )}

          {/* Primary CTA Button (Toggle based on state) */}
          {!result && !showTextFallback && (
            <div className="space-y-3">
              <Button
                onClick={stage === 'recording' ? handleStopListening : handleStartListening}
                disabled={stage === 'processing' || stage === 'transcribing' || stage === 'analyzing' || (!!error && error.includes('denied'))}
                className={`
                  w-full h-12 text-base font-medium transition-all border-0
                  ${stage === 'recording'
                    ? 'bg-[hsl(var(--vm-danger))] hover:bg-[hsl(var(--vm-danger))]/90 text-white shadow-[0_4px_14px_hsla(var(--vm-danger),0.4)]'
                    : 'bg-[hsl(var(--vm-primary))] hover:bg-[hsl(var(--vm-primary-hover))] text-[hsl(var(--vm-bg))] shadow-[0_4px_14px_hsla(var(--vm-primary),0.3)]'
                  }
                `}
              >
                {stage === 'recording' ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording
                  </>
                )}
              </Button>

              {/* Text Link Fallback */}
              <button
                onClick={() => setShowTextFallback(true)}
                className="w-full text-center text-sm text-[hsl(var(--vm-focus))] font-medium hover:text-[hsl(var(--vm-focus))]/80 hover:underline decoration-[hsl(var(--vm-focus))]/50 underline-offset-4 transition-all focus-visible:outline-[hsl(var(--vm-focus))]"
              >
                Prefer to type?
              </button>
            </div>
          )}

          {/* Text Input Mode */}
          {showTextFallback && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g., I had a grilled salmon with quinoa"
                className="w-full h-32 p-3 bg-[hsl(var(--vm-bg))] border border-[hsl(var(--vm-border))] rounded-lg text-[hsl(var(--vm-text))] focus:ring-2 focus:ring-[hsl(var(--vm-focus))] focus:border-transparent resize-none placeholder:text-[hsl(var(--vm-text-muted))]/70"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTextFallback(false)} className="flex-1 border-[hsl(var(--vm-border))] hover:bg-[hsl(var(--vm-bg))] text-[hsl(var(--vm-text-muted))]">
                  Cancel
                </Button>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isSubmittingText}
                  className="flex-1 bg-[hsl(var(--vm-primary))] hover:bg-[hsl(var(--vm-primary-hover))] text-white border-0"
                >
                  {isSubmittingText ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetectedFoodCard({ food }: { food: VoiceDetectedFood }) {
  return (
    <div className="p-3 bg-[hsl(var(--vm-card))] rounded-lg border border-[hsl(var(--vm-border))] shadow-sm flex justify-between items-start group hover:border-[hsl(var(--vm-primary))]/50 transition-colors">
      <div>
        <p className="font-medium text-[hsl(var(--vm-text))] group-hover:text-[hsl(var(--vm-primary))] transition-colors">{food.name}</p>
        <p className="text-xs text-[hsl(var(--vm-text-muted))]">{food.quantity} {food.unit}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[hsl(var(--vm-primary))]">{food.estimatedCalories} cal</p>
        <div className="text-[10px] text-[hsl(var(--vm-text-muted))] flex gap-1 mt-1">
          <span className="bg-[hsl(var(--vm-bg))] px-1 rounded">P:{food.macros.protein_g}</span>
          <span className="bg-[hsl(var(--vm-bg))] px-1 rounded">C:{food.macros.carbs_g}</span>
          <span className="bg-[hsl(var(--vm-bg))] px-1 rounded">F:{food.macros.fat_g}</span>
        </div>
      </div>
    </div>
  );
}
