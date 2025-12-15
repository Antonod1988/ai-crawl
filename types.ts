
export enum GamePhase {
  LOBBY = 'LOBBY',
  COMBAT = 'COMBAT',
  LOOT = 'LOOT',
  LEVEL_UP = 'LEVEL_UP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  MERCHANT = 'MERCHANT'
}

export enum StatType {
  STR = 'Strength',
  DEX = 'Dexterity',
  INT = 'Intelligence',
  CON = 'Constitution'
}

export enum SkillEffect {
  DAMAGE = 'DAMAGE',
  HEAL = 'HEAL',
  STUN = 'STUN',
  LEECH = 'LEECH',
  ARMOR_BREAK = 'ARMOR_BREAK'
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  POTION = 'POTION',
  SCROLL = 'SCROLL'
}

export enum Difficulty {
  EASY = 'Easy',
  NORMAL = 'Normal',
  HARD = 'Hard',
  EXTREME = 'Extreme'
}

export enum AIProvider {
  OPENROUTER = 'OpenRouter',
  OPENAI = 'OpenAI',
  LOCAL = 'Local (Ollama/LM Studio)'
}

export interface GameSettings {
  apiKey: string;
  imageApiKey?: string;
  modelName: string;
  aiProvider: AIProvider;
  baseUrl?: string;
  difficulty: Difficulty;
  theme: string;
  language: string;
  enableImages: boolean;
  imageModel: string; // Added this one as it seems useful/new
  soundEnabled: boolean;
  xpMultiplier: number;
  lootChanceMultiplier: number;
  enemyHpMultiplier: number;
}

export type EnemyRole = 'TANK' | 'SWARM' | 'ASSASSIN' | 'BRUTE' | 'BALANCED';
export type CombatTrait =
  'Fire' | 'Ice' | 'Poison' | 'Lifesteal' | 'Armor_Pierce' |
  'Critical' | 'Execute' | 'Thorns' | 'Evasion' | 'Berserk' |
  'Glass_Cannon' | 'Midas' | 'Scavenger' | 'Stun' | 'Ignite' | 'Freeze' | 'Pierce' | 'Energy_Shield' | 'None';

export enum DamageType {
  SLASHING = 'SLASHING',
  BLUNT = 'BLUNT',
  PIERCING = 'PIERCING',
  MAGIC = 'MAGIC',
  FIRE = 'FIRE',
  ICE = 'ICE',
  POISON = 'POISON'
}

export enum MaterialType {
  FLESH = 'FLESH',
  LEATHER = 'LEATHER',
  PLATE = 'PLATE',
  BONE = 'BONE',
  SPIRIT = 'SPIRIT'
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  value: number; // Damage for weapons, Defense for armor, Heal amount for potions
  cost: number; // Gold cost
  statModifier?: StatType;
  trait?: CombatTrait; // New: Items can have traits
  damageType?: DamageType; // New: Weapons have damage types
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  damageScale: number; // Multiplier of base stat
  stat: StatType;
  damageType?: DamageType; // New: Skills have damage types
  effect?: SkillEffect;
  effectValue?: number; // e.g. stun duration in turns, or armor reduction amount
  cost?: number; // Gold cost to learn/forget
  trait?: CombatTrait; // New: Skills can have traits
  isActive?: boolean; // New: Is the skill equipped?
}

export interface StatusEffects {
  // New Scalable Effects
  toxic?: number;      // Stack count (5 + 5*Stack dmg)
  burning?: number;    // Turns remaining (10% Atk Dmg)
  frozen?: number;     // Turns remaining (0 Dex, -20% Dmg)
  bleeding?: number;   // Turns remaining (5% Max HP on Action)
  chilled?: number;    // Turns remaining (Legacy - maybe map to Frozen?)
  shocked?: number;    // Turns remaining (+1 Cooldowns)
  sundered?: number;   // Turns remaining (-50% Defense/Soak)
  blinded?: number;    // Turns remaining (-50% Hit Chance)
  stoneskin?: number;  // Turns remaining (+10 Defense)
  blur?: number;       // Turns remaining (+5 AC/Dodge)
  raged?: number;      // Turns remaining (+50% Dmg, -50% Def)
  shield?: number;     // Temporary HP
  focused?: boolean;   // Next skill crit/no cd

  // Legacy/Keep
  stunned?: number;    // Turns remaining
  regen?: number;      // Turns remaining
}

export interface Player {
  name: string;
  gender?: string; // Male, Female, Unknown, Custom
  mainStat?: StatType; // The stat chosen during generation
  classArchetype: string; // e.g. "Cyber-Samurai", "Cheese Wizard"
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  stats: {
    [key in StatType]: number;
  };
  statPoints: number;
  inventory: Item[];
  equipped: {
    weapon: Item | null;
    armor: Item | null;
  };
  skills: Skill[];
  statusEffects: StatusEffects;
  imageUrl?: string; // Base64 image
  ac: number; // Armor Class
  gold: number;
}

export interface Enemy {
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  level: number;
  difficulty: 'Minion' | 'Elite' | 'Boss';
  imageUrl?: string; // Base64 image
  ac: number; // Armor Class
  stats: {
    [key in StatType]: number;
  };
  statusEffects: StatusEffects; // Unified status effects
  role: EnemyRole; // New: Archetype Tag
  trait?: CombatTrait; // New: Special Trait
  weakness?: DamageType; // New: Damage type weakness
  resistance?: DamageType; // New: Damage type resistance
  damageType?: DamageType; // New: Enemy attack type
  material?: MaterialType;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'narrative' | 'combat' | 'loot' | 'system';
  timestamp: number;
  mechanics?: string; // Technical explanation of the roll/outcome
}

// API Response Structure
export interface TurnResponse {
  narrative: string;
  mechanics: string; // Explanation of the dice math
  enemyAction?: string; // Description of what enemy did
  damageDealtToPlayer: number;
  damageDealtToEnemy: number;
  isEnemyDefeated: boolean;
  lootDropped?: Item[]; // Only if enemy defeated
  xpGained: number;
  goldGained?: number;
  enemyState?: Enemy; // Use full Enemy interface
  newSkill?: { // Only on level up or specific event
    name: string;
    description: string;
    stat: string;
  };
  playerStatusUpdates?: StatusEffects; // Use full StatusEffects interface
}