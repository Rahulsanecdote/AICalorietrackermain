'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, Check, RefreshCw, AlertCircle, Volume2 } from 'lucide-react';
import { useVoiceScanner } from '../../hooks/useVoiceScanner';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { VoiceDetectedFood } from '../../types/ai';

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
    startListening,
    stopListening,
    reset,
  } = useVoiceScanner();



  useEffect(() => {
    if (isOpen) {
      reset();

    }
  }, [isOpen, reset]);

  const handleStartListening = () => {

    startListening();
  };

  const handleStopListening = () => {
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

  };

  const handleClose = () => {
    reset();
    onClose();
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
          {/* Status Indicator */}
          <div className="flex items-center justify-center py-4">
            {isListening && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                    <Mic className="w-10 h-10 text-red-600" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75"></div>
                </div>
                <p className="mt-3 text-sm font-medium text-red-600">Listening...</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <p className="mt-3 text-sm font-medium text-blue-600">Processing...</p>
              </div>
            )}

            {!isListening && !isProcessing && !result && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-gray-400" />
                </div>
                <p className="mt-3 text-sm text-gray-500 text-center">
                  Tap the microphone and describe your meal
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  {error.includes('denied') && (
                    <div className="mt-3 text-xs text-red-700">
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
              {!error.includes('denied') && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Heard:</p>
              <p className="text-gray-900">{transcript}</p>
            </div>
          )}

          {/* Detected Foods */}
          {result?.detectedFoods && result.detectedFoods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Detected Foods:</p>
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
              <span className="text-gray-500">Confidence:</span>
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
          <div className="flex gap-2 pt-2">
            {!isListening && !result && (
              <Button
                onClick={handleStartListening}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            )}

            {isListening && (
              <Button
                onClick={handleStopListening}
                variant="destructive"
                className="flex-1"
              >
                <MicOff className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {result && (
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

          {/* Tips */}
          {!isListening && !result && (
            <p className="text-xs text-gray-400 text-center">
              Try saying: "I had a chicken breast with rice and vegetables"
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetectedFoodCard({ food }: { food: VoiceDetectedFood }) {
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{food.name}</p>
          <p className="text-sm text-gray-500">
            {food.quantity} {food.unit}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-indigo-600">
            {food.estimatedCalories} cal
          </p>
          <p className="text-xs text-gray-400">per serving</p>
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-xs text-gray-500">
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
