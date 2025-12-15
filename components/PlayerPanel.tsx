
import React from 'react';
import { Player, StatType, DamageType } from '../types';
import StatBar from './StatBar';

import { getTranslation } from '../translations';

interface PlayerPanelProps {
  player: Player;
  onRegenerateImage?: () => void;
  isGeneratingImage?: boolean;
  language: string;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ player, onRegenerateImage, isGeneratingImage, language }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-lg flex flex-col">
      {/* Header with Name and Gold */}
      <div className="flex justify-between items-start mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">{player.name}</h2>
          <div className="text-sm text-slate-400 font-mono">{player.classArchetype} • Lvl {player.level}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-amber-400 font-bold flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span>{player.gold}</span>
            <span className="text-xs">🪙</span>
          </div>
        </div>
      </div>

      {/* Character Image */}
      {player.imageUrl ? (
        <div className="mb-4 relative group w-full aspect-square shrink-0">
          <img
            src={player.imageUrl}
            alt="Character Portrait"
            className="w-full h-full object-cover rounded border border-slate-600 shadow-md"
          />
          {onRegenerateImage && (
            <button
              onClick={onRegenerateImage}
              disabled={isGeneratingImage}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title={getTranslation(language, 'regeneratePortrait')}
            >
              {isGeneratingImage ? '...' : '↻'}
            </button>
          )}
        </div>
      ) : onRegenerateImage && (
        <div className="mb-4 w-full aspect-square bg-slate-900 rounded border border-slate-700 flex items-center justify-center shrink-0">
          <button
            onClick={onRegenerateImage}
            disabled={isGeneratingImage}
            className="text-slate-500 hover:text-amber-500 text-sm flex flex-col items-center gap-2 transition-colors"
          >
            <span className="text-2xl">🎨</span>
            {isGeneratingImage ? getTranslation(language, 'painting') : getTranslation(language, 'generatePortrait')}
          </button>
        </div>
      )}

      <StatBar
        label={getTranslation(language, 'health')}
        current={player.hp}
        max={player.maxHp}
        colorClass="bg-red-600"
      />
      <StatBar
        label={getTranslation(language, 'experience')}
        current={player.xp}
        max={player.maxXp}
        colorClass="bg-amber-500"
      />

      <div className="grid grid-cols-4 gap-1 mt-2 text-xs shrink-0">
        <div className="bg-slate-900 p-1.5 rounded relative group text-center border border-slate-800">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider">STR</div>
          <div className="text-slate-200 font-bold text-sm">{player.stats[StatType.STR]}</div>
          <div className="text-[9px] text-slate-500 leading-none mt-0.5">
            +{player.stats[StatType.STR]} {getTranslation(language, 'damage')}
            {player.stats[StatType.STR] >= 20 && <span className="block text-amber-500">{getTranslation(language, 'armorBreak')} (2)</span>}
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded relative group text-center border border-slate-800">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider">DEX</div>
          <div className="text-slate-200 font-bold text-sm">{player.stats[StatType.DEX]}</div>
          <div className="text-[9px] text-slate-500 leading-none mt-0.5">
            {getTranslation(language, 'hit')} {60 + player.stats[StatType.DEX]}%
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded relative group text-center border border-slate-800">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider">INT</div>
          <div className="text-slate-200 font-bold text-sm">{player.stats[StatType.INT]}</div>
          <div className="text-[9px] text-slate-500 leading-none mt-0.5">
            {getTranslation(language, 'pwr')} {100 + (player.stats[StatType.INT] * 2)}%
            {player.stats[StatType.INT] >= 20 && <span className="block text-blue-400">{getTranslation(language, 'healBonus')}</span>}
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded relative group text-center border border-slate-800">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider">CON</div>
          <div className="text-slate-200 font-bold text-sm">{player.stats[StatType.CON]}</div>
          <div className="text-[9px] text-slate-500 leading-none mt-0.5">
            {getTranslation(language, 'hpShort')} {20 + (player.stats[StatType.CON] * 5)}
            {player.stats[StatType.CON] >= 20 && <span className="block text-green-500">{getTranslation(language, 'regen')} +1</span>}
          </div>
        </div>
      </div>

      {/* Active Effects Section */}
      {/* Active Effects Section */}
      {player.statusEffects && Object.values(player.statusEffects).some(val => (typeof val === 'number' && val > 0) || (typeof val === 'boolean' && val === true)) && (
        <div className="mt-2 shrink-0">
          <div className="text-xs text-slate-400 uppercase mb-1">{getTranslation(language, 'activeEffects')}</div>
          <div className="flex flex-wrap gap-1">
            {/* Debuffs */}
            {(player.statusEffects.toxic || 0) > 0 && (
              <div className="bg-green-900/30 border border-green-700/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-green-400 animate-pulse">
                <span>☠️ {getTranslation(language, 'toxic')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">
                  {Math.ceil(player.maxHp * (0.10 + 0.01 * ((player.statusEffects.toxic || 1) - 1)))} dmg
                </span>
              </div>
            )}
            {(player.statusEffects.burning || 0) > 0 && (
              <div className="bg-orange-900/30 border border-orange-700/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-orange-400 animate-pulse">
                <span>🔥 {getTranslation(language, 'burning')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.burning}t</span>
              </div>
            )}
            {(player.statusEffects.chilled || 0) > 0 && (
              <div className="bg-cyan-900/30 border border-cyan-700/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-cyan-400">
                <span>❄️ {getTranslation(language, 'chilled')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.chilled}t</span>
              </div>
            )}
            {(player.statusEffects.shocked || 0) > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-yellow-400">
                <span>⚡ {getTranslation(language, 'shocked')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.shocked}t</span>
              </div>
            )}
            {(player.statusEffects.sundered || 0) > 0 && (
              <div className="bg-red-900/20 border border-red-800 px-2 py-1 rounded flex items-center gap-2 text-xs text-red-400">
                <span>💔 {getTranslation(language, 'sundered')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.sundered}t</span>
              </div>
            )}
            {(player.statusEffects.blinded || 0) > 0 && (
              <div className="bg-gray-800 border border-gray-600 px-2 py-1 rounded flex items-center gap-2 text-xs text-gray-400">
                <span>👁️ {getTranslation(language, 'blinded')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.blinded}t</span>
              </div>
            )}
            {(player.statusEffects.stunned || 0) > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-yellow-400">
                <span>💫 {getTranslation(language, 'stunned')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.stunned}t</span>
              </div>
            )}

            {/* Buffs */}
            {(player.statusEffects.regen || 0) > 0 && (
              <div className="bg-emerald-900/30 border border-emerald-600/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-emerald-400">
                <span>❤️ {getTranslation(language, 'regen')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.regen}t</span>
              </div>
            )}
            {(player.statusEffects.stoneskin || 0) > 0 && (
              <div className="bg-stone-800 border border-stone-500 px-2 py-1 rounded flex items-center gap-2 text-xs text-stone-300">
                <span>🛡️ {getTranslation(language, 'stoneskin')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.stoneskin}t</span>
              </div>
            )}
            {(player.statusEffects.blur || 0) > 0 && (
              <div className="bg-blue-900/20 border border-blue-500/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-blue-300">
                <span>👻 {getTranslation(language, 'blur')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.blur}t</span>
              </div>
            )}
            {(player.statusEffects.raged || 0) > 0 && (
              <div className="bg-red-900/40 border border-red-500/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-red-300">
                <span>🩸 {getTranslation(language, 'raged')}</span>
                <span className="bg-black/50 px-1 rounded text-[10px]">{player.statusEffects.raged}t</span>
              </div>
            )}
            {player.statusEffects.focused && (
              <div className="bg-purple-900/40 border border-purple-500/50 px-2 py-1 rounded flex items-center gap-2 text-xs text-purple-300">
                <span>🔋 {getTranslation(language, 'focused')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipped Section - Explicitly rendered with shrink-0 to prevent crushing */}
      <div className="mt-4 space-y-2 shrink-0">
        <div className="text-xs text-slate-400 uppercase">{getTranslation(language, 'equipped')}</div>

        {/* Weapon */}
        <div className="flex items-center bg-slate-900/50 p-2 rounded border border-slate-700/50">
          <div className="w-8 h-8 bg-red-900/20 rounded flex items-center justify-center mr-2 text-red-500 shrink-0">
            ⚔️
          </div>
          <div className="overflow-hidden">
            <div className="text-sm text-slate-200 truncate">{player.equipped?.weapon?.name || 'Fists'}</div>
            <div className="text-xs text-slate-500 flex gap-2">
              <span>{getTranslation(language, 'damage')}: {player.equipped?.weapon?.value || 1}</span>
              {player.equipped?.weapon?.damageType && (
                <span className="text-amber-500">
                  {player.equipped.weapon.damageType === DamageType.FIRE ? '🔥' :
                    player.equipped.weapon.damageType === DamageType.ICE ? '❄️' :
                      player.equipped.weapon.damageType === DamageType.POISON ? '☠️' :
                        player.equipped.weapon.damageType === DamageType.MAGIC ? '✨' :
                          player.equipped.weapon.damageType === DamageType.SLASHING ? '🗡️' :
                            player.equipped.weapon.damageType === DamageType.BLUNT ? '🔨' :
                              player.equipped.weapon.damageType === DamageType.PIERCING ? '🏹' : '⚔️'}
                  {' '}
                  {getTranslation(language, player.equipped.weapon.damageType.toLowerCase())}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Armor */}
        <div className="flex items-center bg-slate-900/50 p-2 rounded border border-slate-700/50">
          <div className="w-8 h-8 bg-blue-900/20 rounded flex items-center justify-center mr-2 text-blue-500 shrink-0">
            🛡️
          </div>
          <div>
            <div className="text-sm text-slate-200">{player.equipped?.armor?.name || 'Rags'}</div>
            <div className="text-xs text-slate-500">{getTranslation(language, 'defense')}: {player.equipped?.armor?.value || 0}</div>
          </div>
        </div>

        {/* AC */}
        <div className="flex items-center bg-slate-900/50 p-2 rounded border border-slate-700/50">
          <div className="w-8 h-8 bg-slate-700/20 rounded flex items-center justify-center mr-2 text-slate-400 shrink-0">
            🛡️
          </div>
          <div>
            <div className="text-sm text-slate-200" title={`10 + ${Math.floor(player.stats[StatType.DEX] / 2)} (DEX) + ${player.equipped?.armor?.value || 0} (Armor)`}>{getTranslation(language, 'armorClass')}</div>
            <div className="text-xs text-slate-500">
              {(() => {
                const armorName = player.equipped?.armor?.name.toLowerCase() || "";
                let mat = "FLESH";
                if (armorName.includes("plate") || armorName.includes("mail") || armorName.includes("iron") || armorName.includes("steel")) mat = "PLATE";
                else if (armorName.includes("leather") || armorName.includes("hide") || armorName.includes("skin")) mat = "LEATHER";
                else if (armorName.includes("bone") || armorName.includes("skull")) mat = "BONE";
                else if (armorName.includes("robe") || armorName.includes("cloth") || armorName.includes("silk")) mat = "FLESH";
                return getTranslation(language, mat.toLowerCase() as any);
              })()}
            </div>
            <div className="text-xs text-slate-500">{player.ac}</div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default PlayerPanel;
