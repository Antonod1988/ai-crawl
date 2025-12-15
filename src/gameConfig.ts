import { GameSettings, Difficulty, AIProvider } from '../types';

export const DEFAULT_SETTINGS: GameSettings = {
    language: "Russian",
    difficulty: Difficulty.NORMAL,
    theme: "Dark Fantasy",
    enableImages: true,
    aiProvider: AIProvider.OPENROUTER,
    apiKey: "", // Enter your API Key here
    imageApiKey: "", // Optional, uses main key if empty
    modelName: "google/gemini-2.0-flash-001",
    imageModel: "openai/dall-e-3",
    baseUrl: "http://localhost:11434/v1",
    soundEnabled: true,
    xpMultiplier: 1.0,
    lootChanceMultiplier: 1.0,
    enemyHpMultiplier: 1.0
};
