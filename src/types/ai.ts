// Voice Input Types
export interface VoiceParsingResult {
  transcript: string;
  detectedFoods: VoiceDetectedFood[];
  confidence: number;
  timestamp: string;
}

export interface VoiceDetectedFood {
  name: string;
  quantity: number;
  unit: string;
  estimatedCalories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  result: VoiceParsingResult | null;
  error: string | null;
}

// Food Comparison Types
export interface FoodComparisonData {
  foodA: ComparisonFoodItem;
  foodB: ComparisonFoodItem;
  verdict: ComparisonVerdict;
  comparisonTimestamp: string;
  hasIncompleteData?: boolean;
}

export interface ComparisonFoodItem {
  id?: string;
  name: string;
  servingSize: string;
  servingAmount?: number;
  servingUnit?: 'g' | 'ml' | 'oz' | 'cup' | 'piece';
  calories: number | null;  // null = unknown
  macros: {
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g?: number | null;
    sugar_g?: number | null;
    sodium_mg?: number | null;
  };
  category?: string;
  source?: 'database' | 'logged' | 'manual' | 'preset';
  dataCompleteness?: number;  // 0-100%
}

export interface ComparisonVerdict {
  summary: string;
  winner: 'A' | 'B' | 'tie' | 'insufficient-data';
  keyDifferences: string[];
  recommendations: string[];
  context: 'weight-loss' | 'muscle-gain' | 'general-health' | 'energy';
  disclaimers?: string[];
}

// Nutritional Education Types
export interface EduMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  relatedTopics?: string[];
}

export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  category: 'basics' | 'macros' | 'diets' | 'health';
}

export interface EduSession {
  id: string;
  messages: EduMessage[];
  createdAt: string;
  context?: {
    currentMeal?: {
      name: string;
      macros: { protein_g: number; carbs_g: number; fat_g: number };
    };
    dailyGoals?: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
  };
}

// Search/Discovery Types
export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  category: string;
}

// AI Processing Types
export type AIProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface AIResponse<T> {
  data: T | null;
  status: AIProcessingStatus;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Global Window Extension for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
