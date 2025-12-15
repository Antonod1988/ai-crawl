
import React from 'react';
import { Difficulty, GameSettings, AIProvider } from '../types';
import { getTranslation } from '../translations';

interface OptionsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
  onRestart?: () => void; // Added optional prop
}

const LANGUAGES = ["English", "Russian"];

const OptionsModal: React.FC<OptionsModalProps> = ({ settings, onSave, onClose, onRestart }) => {
  const [localSettings, setLocalSettings] = React.useState<GameSettings>(settings);

  const handleChange = (key: keyof GameSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-md w-full m-4 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-custom">
        <h2 className="text-2xl font-fantasy text-amber-500 mb-6 border-b border-slate-700 pb-2">
          {getTranslation(settings.language, 'gameOptions')}
        </h2>

        <div className="space-y-6">

          {/* AI Configuration Section */}
          <div className="bg-slate-950/50 p-4 rounded border border-slate-700 space-y-4">
            <h3 className="text-slate-300 font-bold text-sm uppercase border-b border-slate-800 pb-2">{getTranslation(settings.language, 'aiBrainSettings')}</h3>

            {/* Provider */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">{getTranslation(settings.language, 'provider')}</label>
              <select
                value={localSettings.aiProvider}
                onChange={(e) => handleChange('aiProvider', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:border-amber-500 outline-none"
              >
                {Object.values(AIProvider).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* API Key */}
            {localSettings.aiProvider !== AIProvider.LOCAL && (
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">
                  {getTranslation(settings.language, 'apiKey')}
                </label>
                <input
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder={localSettings.aiProvider === AIProvider.OPENROUTER ? "sk-or-..." : "sk-..."}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:border-amber-500 outline-none placeholder-slate-600"
                />
              </div>
            )}

            {/* Model Name */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">{getTranslation(settings.language, 'modelName')}</label>
              <input
                type="text"
                value={localSettings.modelName}
                onChange={(e) => handleChange('modelName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:border-amber-500 outline-none font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                OpenRouter Example: <code>google/gemini-2.5-flash</code> or <code>anthropic/claude-3-haiku</code>
              </p>
            </div>

            {/* Local Base URL */}
            {localSettings.aiProvider === AIProvider.LOCAL && (
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">{getTranslation(settings.language, 'baseUrl')}</label>
                <input
                  type="text"
                  value={localSettings.baseUrl || ""}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:border-amber-500 outline-none font-mono text-xs"
                />
              </div>
            )}
          </div>

          {/* General Settings */}
          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">{getTranslation(settings.language, 'language')}</label>
              <select
                value={localSettings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 focus:border-amber-500 outline-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">{getTranslation(settings.language, 'difficulty')}</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Difficulty).map((diff) => {
                  let descKey = 'diffNormalDesc';
                  if (diff === Difficulty.EASY) descKey = 'diffEasyDesc';
                  if (diff === Difficulty.HARD) descKey = 'diffHardDesc';
                  if (diff === Difficulty.EXTREME) descKey = 'diffExtremeDesc';

                  return (
                    <button
                      key={diff}
                      onClick={() => handleChange('difficulty', diff)}
                      className={`px-4 py-2 rounded border text-sm transition-colors flex flex-col items-center justify-center gap-1 h-16 ${localSettings.difficulty === diff
                        ? 'bg-amber-700 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      <span className="font-bold">{diff}</span>
                      <span className="text-[10px] opacity-80 leading-tight">{getTranslation(settings.language, descKey as any)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Images Toggle */}
            <div className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
              <div>
                <div className="text-slate-200 font-bold text-sm">{getTranslation(settings.language, 'enableAiImages')}</div>
                <div className="text-xs text-slate-500">{getTranslation(settings.language, 'requiresGemini')}</div>
              </div>
              <button
                onClick={() => handleChange('enableImages', !localSettings.enableImages)}
                className={`w-12 h-6 rounded-full relative transition-colors ${localSettings.enableImages ? 'bg-green-600' : 'bg-slate-600'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.enableImages ? 'left-7' : 'left-1'
                  }`} />
              </button>
            </div>
          </div>

          {/* Balance Settings */}
          <div className="bg-slate-950/50 p-4 rounded border border-slate-700 space-y-4">
            <h3 className="text-slate-300 font-bold text-sm uppercase border-b border-slate-800 pb-2">Game Balance</h3>

            {/* XP Multiplier */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <label className="text-slate-400 font-bold uppercase">XP Gain</label>
                <span className="text-amber-500">{localSettings.xpMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={localSettings.xpMultiplier}
                onChange={(e) => handleChange('xpMultiplier', parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Loot Chance */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <label className="text-slate-400 font-bold uppercase">Loot Chance</label>
                <span className="text-amber-500">{localSettings.lootChanceMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={localSettings.lootChanceMultiplier}
                onChange={(e) => handleChange('lootChanceMultiplier', parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Enemy HP */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <label className="text-slate-400 font-bold uppercase">Enemy HP Scaling</label>
                <span className="text-amber-500">{localSettings.enemyHpMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={localSettings.enemyHpMultiplier}
                onChange={(e) => handleChange('enemyHpMultiplier', parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Image Model */}
        <div className="space-y-2 mt-6">
          <label className="block text-slate-400 text-xs font-bold uppercase mb-2">
            {getTranslation(settings.language, 'imageModel') || 'Image Model'}
          </label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600 font-mono text-xs"
            value={localSettings.imageModel || ''}
            onChange={(e) => handleChange('imageModel', e.target.value)}
            placeholder="imagen-3.0-generate-001"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Gemini: <code>imagen-3.0-generate-001</code>
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded border border-slate-600"
            >
              {getTranslation(settings.language, 'cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded font-bold shadow-lg"
            >
              {getTranslation(settings.language, 'saveChanges')}
            </button>
          </div>

          {onRestart && (
            <button
              onClick={onRestart}
              className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded border border-red-800/50 text-sm uppercase tracking-widest transition-colors"
            >
              Restart Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptionsModal;
