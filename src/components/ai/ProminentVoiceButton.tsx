'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface ProminentVoiceButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * A large, prominent floating voice button that is highly visible
 * and accessible from anywhere in the app.
 */
export function ProminentVoiceButton({ onClick, className = '' }: ProminentVoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  if (!isSupported) {
    return null; // Don't show button if speech recognition isn't supported
  }

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center justify-center
        w-16 h-16 rounded-full
        bg-gradient-to-br from-red-500 to-red-600
        hover:from-red-600 hover:to-red-700
        text-white shadow-lg
        transition-all duration-300
        hover:scale-105 hover:shadow-xl
        active:scale-95
        ${className}
      `}
      title="Voice Log Your Meal"
      aria-label="Open voice meal logger"
    >
      {/* Pulse animation ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-25" />

      {/* Main icon */}
      <Mic className="w-7 h-7 transition-transform group-hover:scale-110" />

      {/* Tooltip on hover */}
      <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 
        px-3 py-1 bg-gray-900 text-white text-xs rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity
        whitespace-nowrap pointer-events-none">
        Voice Log Meal
      </span>
    </button>
  );
}

/**
 * A smaller inline voice button for use in toolbars
 */
export function InlineVoiceButton({ onClick, isActive = false, className = '' }: { onClick: () => void; isActive?: boolean; className?: string }) {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        transition-all duration-200
        ${isActive
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
        }
        ${className}
      `}
      title="Voice Input"
    >
      {isActive ? (
        <Mic className="w-5 h-5 animate-pulse" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
      <span className="font-medium">Voice</span>
    </button>
  );
}

/**
 * Voice permission status indicator
 */
export function VoicePermissionStatus() {
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if permissions API is available
    if (!navigator.permissions) {
      setPermissionState('unknown');
      return;
    }

    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then((permission) => {
        setPermissionState(permission.state);
        permission.onchange = () => {
          setPermissionState(permission.state);
        };
      })
      .catch(() => {
        setPermissionState('unknown');
      });
  }, []);

  if (permissionState === 'unknown' || permissionState === 'checking') {
    return null;
  }

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
      ${permissionState === 'granted'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      }
    `}>
      {permissionState === 'granted' ? (
        <>
          <Volume2 className="w-3 h-3" />
          <span>Mic Ready</span>
        </>
      ) : (
        <>
          <MicOff className="w-3 h-3" />
          <span>Mic Off</span>
        </>
      )}
    </div>
  );
}
