
import { Player, StatType, ItemType } from './types';

export const CHARACTER_CLASSES = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'A strong fighter who relies on brute force.',
    mainStat: StatType.STR,
    stats: {
      [StatType.STR]: 16,
      [StatType.DEX]: 12,
      [StatType.INT]: 8,
      [StatType.CON]: 14,
    },
    weaponType: 'Heavy Weapon',
    armorType: 'Heavy Armor',
    skillType: 'Physical Attack'
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'A spellcaster who wields arcane power.',
    mainStat: StatType.INT,
    stats: {
      [StatType.STR]: 8,
      [StatType.DEX]: 12,
      [StatType.INT]: 16,
      [StatType.CON]: 10,
    },
    weaponType: 'Staff or Wand',
    armorType: 'Robes',
    skillType: 'Magic Spell'
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A swift and stealthy operative.',
    mainStat: StatType.DEX,
    stats: {
      [StatType.STR]: 10,
      [StatType.DEX]: 16,
      [StatType.INT]: 12,
      [StatType.CON]: 12,
    },
    weaponType: 'Dagger or Bow',
    armorType: 'Light Armor',
    skillType: 'Stealth or Precision'
  },
  {
    id: 'tank',
    name: 'Guardian',
    description: 'A resilient protector who can withstand heavy blows.',
    mainStat: StatType.CON,
    stats: {
      [StatType.STR]: 12,
      [StatType.DEX]: 10,
      [StatType.INT]: 8,
      [StatType.CON]: 16,
    },
    weaponType: 'Shield and Mace',
    armorType: 'Heavy Plate',
    skillType: 'Defense or Taunt'
  }
];

export const INITIAL_PLAYER: Player = {
  name: "Wanderer",
  classArchetype: "Adventurer",
  level: 1,
  xp: 0,
  maxXp: 100,
  hp: 30,
  maxHp: 30,
  stats: {
    [StatType.STR]: 10,
    [StatType.DEX]: 10,
    [StatType.INT]: 10,
    [StatType.CON]: 10,
  },
  gold: 0,
  statPoints: 0,
  inventory: [
    {
      id: 'potion-1',
      name: 'Minor Health Potion',
      type: ItemType.POTION,
      description: 'Restores 15 HP',
      value: 15,
      cost: 10
    }
  ],
  equipped: {
    weapon: {
      id: 'weapon-0',
      name: 'Rusty Dagger',
      type: ItemType.WEAPON,
      description: 'Better than nothing.',
      value: 4, // Base damage
      cost: 20,
      statModifier: StatType.DEX
    },
    armor: {
      id: 'armor-0',
      name: 'Tattered Tunic',
      type: ItemType.ARMOR,
      description: 'Offers minimal protection.',
      value: 1, // Base defense
      cost: 15
    }
  },
  skills: [
    {
      id: 'skill-1',
      name: 'Power Strike',
      description: 'A heavy blow.',
      cooldown: 3,
      currentCooldown: 0,
      damageScale: 1.5,
      stat: StatType.STR,
      isActive: true
    }
  ],
  statusEffects: {
    poisoned: 0
  },
  ac: 15 // Base 10 + (10 DEX / 2) = 15
};

export const MAX_ROUNDS = 6; // 5 rounds + 1 Boss