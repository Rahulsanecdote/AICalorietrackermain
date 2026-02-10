'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/button';
import { AssistantPromptPill } from '../ui/assistant-prompt-pill';
import { useNutriTutor, QUICK_PROMPTS } from '../../hooks/useNutriTutor';
import { EduMessage } from '../../types/ai';

interface NutriBotWidgetProps {
  launcherClassName?: string;
}

export function NutriBotWidget({ launcherClassName }: NutriBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { session, status, error, sendMessage, clearSession, quickPrompts } = useNutriTutor();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    clearSession();
  }, [clearSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const handleSend = async () => {
    if (!inputValue.trim() || status === 'processing') return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleOpenAssistant = () => {
    setIsOpen(true);
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!prompt.trim() || status === 'processing') return;
    setIsOpen(true);
    await sendMessage(prompt.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Launcher */}
      {!isOpen && (
        <AssistantPromptPill
          onOpenAssistant={handleOpenAssistant}
          onSubmitPrompt={handlePromptSubmit}
          disabled={status === 'processing'}
          placeholder="Ask NutriAI"
          className={launcherClassName}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close NutriBot panel"
              onClick={handleClose}
              className="assistant-widget-overlay fixed inset-0 z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.2, ease: 'easeOut' }}
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="nutribot-title"
              tabIndex={-1}
              className="fixed inset-x-3 bottom-4 z-[80] flex h-[min(33rem,calc(100vh-5rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(36rem,calc(100vh-4rem))] sm:w-[22rem]"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card/20">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 id="nutribot-title" className="font-semibold">NutriBot</h3>
                    <p className="text-xs text-white/80">Your Nutrition Assistant</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1 transition-colors hover:bg-card/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  aria-label="Close NutriBot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {!session && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="mb-2 font-medium text-foreground dark:text-white">
                      Welcome to NutriBot!
                    </h4>
                    <p className="mb-4 text-sm text-muted-foreground dark:text-muted-foreground">
                      Ask me anything about nutrition, healthy eating, or food choices.
                    </p>
                    <div className="text-left">
                      <p className="mb-2 text-xs text-muted-foreground">Try asking:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                          <button
                            key={prompt.id}
                            onClick={() => handleQuickPrompt(prompt.prompt)}
                            className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            {prompt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {session?.messages
                  .filter((m) => m.role !== 'system')
                  .map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}

                {status === 'processing' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {session && (
                <div className="border-t border-border px-4 py-2">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                    {quickPrompts.slice(0, 5).map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className="flex-shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-card dark:text-muted-foreground dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    id="nutribot-input"
                    name="nutribot-input"
                    type="text"
                    autoComplete="off"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about nutrition..."
                    disabled={status === 'processing'}
                    className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-card dark:text-white"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || status === 'processing'}
                    className="rounded-full px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message }: { message: EduMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 ${isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-accent dark:bg-card text-foreground dark:text-white rounded-bl-md'
          }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-primary dark:text-indigo-400" />
            </div>
          )}
          <div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

            {/* Related Topics */}
            {message.relatedTopics && message.relatedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.relatedTopics.map((topic) => (
                  <span
                    key={topic}
                    className={`text-xs px-2 py-0.5 rounded-full ${isUser
                        ? 'bg-card/20 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      }`}
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            )}
          </div>
          {isUser && (
            <div className="w-6 h-6 bg-card/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for embedding in other components
export function NutriBotButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
    >
      <Sparkles className="mr-2 h-4 w-4" />
      Ask NutriBot
    </Button>
  );
}
