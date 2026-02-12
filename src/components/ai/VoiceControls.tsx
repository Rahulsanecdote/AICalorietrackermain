'use client';

import { Mic, MicOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VoiceWaveformProps {
  isActive?: boolean;
  className?: string;
}

export function VoiceWaveform({ isActive = false, className }: VoiceWaveformProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex h-8 items-end justify-center gap-1', className)}
    >
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(
            'w-1 rounded-full bg-[hsl(var(--vm-primary))] transition-all duration-300',
            isActive ? 'h-6 animate-pulse' : 'h-3 opacity-60'
          )}
          style={isActive ? { animationDelay: `${bar * 90}ms` } : undefined}
        />
      ))}
    </div>
  );
}

interface MicrophoneButtonProps {
  isRecording?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function MicrophoneButton({
  isRecording = false,
  onClick,
  className,
  disabled = false,
}: MicrophoneButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--vm-border))] bg-[hsl(var(--vm-primary))] text-white shadow transition-colors',
        isRecording && 'bg-[hsl(var(--vm-danger))]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
