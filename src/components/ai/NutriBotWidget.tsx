'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useNutriTutor, QUICK_PROMPTS } from '../../hooks/useNutriTutor';
import { EduMessage } from '../../types/ai';

export function NutriBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { session, status, error, sendMessage, clearSession, quickPrompts } = useNutriTutor();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || status === 'processing') return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    clearSession();
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center">
            AI
          </span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">NutriBot</h3>
                <p className="text-xs text-white/80">Your Nutrition Assistant</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!session && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to NutriBot!
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Ask me anything about nutrition, healthy eating, or food choices.
                </p>
                <div className="text-left">
                  <p className="text-xs text-gray-400 mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
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
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {session && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickPrompts.slice(0, 5).map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              <input
                id="nutribot-input"
                name="nutribot-input"
                type="text"
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about nutrition..."
                disabled={status === 'processing'}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || status === 'processing'}
                className="rounded-full px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: EduMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 ${isUser
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
          }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
                        ? 'bg-white/20 text-white'
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
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
