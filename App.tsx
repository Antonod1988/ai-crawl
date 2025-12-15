import React, { useState, useEffect, useCallback } from 'react';
import { GameMasterService } from './services/gemini';
import {
  Player, Enemy, GamePhase, LogEntry, StatType, Item, ItemType, Skill, GameSettings, Difficulty, AIProvider, DamageType
} from './types';
import { INITIAL_PLAYER, MAX_ROUNDS, CHARACTER_CLASSES } from './constants';
import PlayerPanel from './components/PlayerPanel';
import ActionLog from './components/ActionLog';
import InventoryModal from './components/InventoryModal';
import StatBar from './components/StatBar';
import OptionsModal from './components/OptionsModal';
import SupportModal from './components/SupportModal';
import LogsModal from './components/LogsModal';
import { MerchantModal } from './components/MerchantModal';
import SkillsModal from './components/SkillsModal';
import GuideModal from './components/GuideModal';
import { getTranslation } from './translations';

const gameService = new GameMasterService();

const DEFAULT_STYLES = [
  "Dark Fantasy Dungeon",
  "Cyberpunk Neo-Tokyo",
  "Post-Apocalyptic Wasteland",
  "Silly Cheese World",
  "Eldritch Horror",
  "Wild West Space Opera",
  "80s Action Movie",
  "Candy Kingdom",
  "Steampunk Airship",
  "Haunted Space Station"
];

import { DEFAULT_SETTINGS } from './src/gameConfig';

export default function App() {
  // -- State --
  const [player, setPlayer] = useState<Player>({ ...INITIAL_PLAYER });
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [round, setRound] = useState<number>(1);
  const [newlyLearnedSkill, setNewlyLearnedSkill] = useState<Skill | null>(null);
  const [skillOptions, setSkillOptions] = useState<Skill[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  // UI States
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showSupport, setShowSupport] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [recentLoot, setRecentLoot] = useState<Item[]>([]);
  const [showMechanics, setShowMechanics] = useState<boolean>(false);
  const [merchantItems, setMerchantItems] = useState<Item[]>([]);
  const [showMerchant, setShowMerchant] = useState<boolean>(false);
  const [showSkills, setShowSkills] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Game Config State
  const [gameStyle, setGameStyle] = useState<string>("Dark Fantasy Dungeon");
  const [playerName, setPlayerName] = useState<string>("");
  const [playerGender, setPlayerGender] = useState<string>("Unknown");
  const [customGender, setCustomGender] = useState<string>("");
  const [classRotationIndex, setClassRotationIndex] = useState<number>(0);
  const [mainStat, setMainStat] = useState<string>("Random");
  const [characterGenerated, setCharacterGenerated] = useState<boolean>(false);
  const [runCount, setRunCount] = useState<number>(1);
  const [maxRounds, setMaxRounds] = useState<number>(MAX_ROUNDS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [visualPrompt, setVisualPrompt] = useState<string>("");

  // -- Helpers --
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'narrative', mechanics?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      text,
      type,
      timestamp: Date.now(),
      mechanics
    }]);
  }, []);

  const rollDice = () => Math.floor(Math.random() * 20) + 1;

  // -- Image Gen Helpers --
  const generateCharacterImage = async (prompt: string) => {
    if (!settings.enableImages) return;
    setIsGeneratingImage(true);
    const result = await gameService.generateImage(prompt + ` style: ${gameStyle} `, settings);
    if (result.url) {
      setPlayer(p => ({ ...p, imageUrl: result.url }));
      addLog(`Img URL: ${result.url}`, "mechanics"); // Log the URL for debugging
    }
    if (result.debug) {
      console.log("Raw Img Response:", result.debug);
      // addLog(`Debug Img: ${result.debug.substring(0, 150)}...`, "system"); 
    }
    if (result.error) {
      addLog(`Image Gen Error: ${result.error}`, "system");
    }
    setIsGeneratingImage(false);
  };

  const generateEnemyImage = async (enemyName: string, prompt: string) => {
    if (!settings.enableImages) return;
    const result = await gameService.generateImage(prompt + ` style: ${gameStyle} `, settings);
    if (result.url) {
      setEnemy(e => e && e.name === enemyName ? { ...e, imageUrl: result.url } : e);
      addLog(`Enemy Img URL: ${result.url}`, "mechanics"); // Log the URL for debugging
    }
    if (result.debug) {
      console.log("Raw Enemy Img Response:", result.debug);
      // addLog(`Debug Enemy Img: ${result.debug.substring(0, 100)}`, "system");
    }
    if (result.error) {
      addLog(`Enemy Image Error: ${result.error}`, "system");
    }
  };

  // -- Game Loop Actions --

  const handleGenerateCharacter = async () => {
    if (!gameStyle) return;
    setIsLoading(true);
    try {

      const genderToUse = playerGender === "Custom" ? customGender : playerGender;

      let currentClass;

      if (mainStat !== "Random") {
        // Manual Selection
        currentClass = CHARACTER_CLASSES.find(c => c.mainStat === mainStat);
        if (!currentClass) {
          // Fallback if something goes wrong, though UI shouldn't allow it
          currentClass = CHARACTER_CLASSES[0];
        }
        console.log(`Generating character with MANUAL class: ${currentClass.name} `);
      } else {
        // ROTATION LOGIC
        currentClass = CHARACTER_CLASSES[classRotationIndex % CHARACTER_CLASSES.length];
        console.log(`Generating character with ROTATION class: ${currentClass.name} `);

        // Increment rotation for next time ONLY if in rotation mode
        setClassRotationIndex(prev => prev + 1);
      }

      const charData = await gameService.generateCharacter(gameStyle, playerName, genderToUse, currentClass, settings);
      setVisualPrompt(charData.visualPrompt);

      const newPlayer: Player = {
        ...INITIAL_PLAYER,
        name: charData.name,
        classArchetype: charData.classArchetype,
        stats: charData.stats,
        hp: (charData.stats.Constitution || 10) * 5 + 20, // Base 20 + CON*5
        maxHp: (charData.stats.Constitution || 10) * 5 + 20,
        ac: 10 + Math.floor((charData.stats.Dexterity || 10) / 2), // AC = 10 + DEX/2
        equipped: {
          weapon: {
            id: 'starter-weapon', // Added ID
            name: charData.weapon.name!,
            type: ItemType.WEAPON,
            description: charData.weapon.description || "A simple weapon",
            value: charData.weapon.value || 2,
            cost: charData.weapon.cost || 10, // Added cost
            statModifier: charData.weapon.statModifier || StatType.STR,
            damageType: charData.weapon.damageType
          },
          armor: {
            id: `a - ${Date.now()} `,
            name: charData.armor.name!,
            type: ItemType.ARMOR,
            description: charData.armor.description || "Basic protection",
            value: charData.armor.value || 1,
            cost: charData.armor.cost || 5 // Added cost
          }
        },
        skills: [{
          id: `s - ${Date.now()} `,
          name: charData.firstSkill.name!,
          description: charData.firstSkill.description || "A basic skill",
          cooldown: 3,
          currentCooldown: 0,
          damageScale: 1.5,
          stat: (charData.firstSkill.stat as StatType) || StatType.STR,
          damageType: charData.firstSkill.damageType
        }],
        inventory: []
      };

      newPlayer.inventory.push({
        id: 'start-pot',
        name: 'Starter Potion',
        type: ItemType.POTION,
        description: 'Heals minor wounds',
        value: 15,
        cost: 10 // Added cost
      });

      setPlayer(newPlayer);
      setCharacterGenerated(true);

      if (settings.enableImages && charData.visualPrompt) {
        generateCharacterImage(charData.visualPrompt);
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      addLog(`Failed to generate character.Error: ${errorMessage} `, "system");
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async () => {
    setLogs([]);
    setRound(1);
    setRecentLoot([]);
    setPhase(GamePhase.LOBBY);
    addLog(`Initializing world: ${gameStyle}...`, "system");
    await startRound(1);
  };

  const startRound = async (roundNum: number) => {
    if (isLoading) return; // Prevent double calls
    setPhase(GamePhase.COMBAT);
    setIsLoading(true);
    try {
      const result = await gameService.generateEncounter(roundNum, player.level, player.maxHp, gameStyle, settings);
      setEnemy(result.enemy);
      addLog(`Round ${roundNum}: ${result.narrative} `, "narrative");
      addLog(`A ${result.enemy.name} appears!(HP: ${result.enemy.hp}, AC: ${result.enemy.ac})`, "combat");

      if (settings.enableImages && result.visualPrompt) {
        generateEnemyImage(result.enemy.name, result.visualPrompt);
      }

    } catch (error: any) {
      console.error(error);
      addLog(`Failed to summon enemy: ${error.message || "Unknown error"}. Please try again.`, "system");
      // Do NOT return to lobby. Stay in COMBAT state so we can retry.
      // We will show a "Retry" button in the UI if enemy is null.
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerAction = async (actionType: 'ATTACK' | 'SKILL', skill?: Skill) => {
    if (isLoading) return;
    console.log(`handlePlayerAction: ${actionType}`, skill); // DEBUG
    setIsLoading(true);
    if (phase !== GamePhase.COMBAT || !enemy || isLoading) return;

    setIsLoading(true);
    const d20 = rollDice();
    setDiceRoll(d20);

    if (skill) {
      const updatedSkills = player.skills.map(s =>
        s.id === skill.id ? { ...s, currentCooldown: s.cooldown } : s
      );
      setPlayer(p => ({ ...p, skills: updatedSkills }));
    }

    const actionDesc = skill
      ? `uses skill ${skill.name} `
      : `attacks with ${player.equipped.weapon?.name || 'fists'} `;

    addLog(`You rolled a ${d20} !`, "system");

    try {
      const result = await gameService.processTurn(player, enemy, actionDesc, d20, gameStyle, settings);

      addLog(result.narrative, "narrative", result.mechanics);

      // Check for Game Over
      if (player.hp - result.damageDealtToPlayer <= 0) {
        setPlayer(p => ({ ...p, hp: 0 }));
        setPhase(GamePhase.GAME_OVER);
        addLog("You have been defeated by the " + enemy.name + "!", "system");
        setIsLoading(false);
        return;
      }

      if (result.damageDealtToPlayer !== 0) {
        setPlayer(p => ({
          ...p,
          hp: Math.min(p.maxHp, Math.max(0, p.hp - result.damageDealtToPlayer)),
          statusEffects: {
            ...p.statusEffects,
            ...(result.playerStatusUpdates || {})
          }
        }));
        if (result.damageDealtToPlayer > 0) {
          addLog(`You took ${result.damageDealtToPlayer} damage.`, "combat");
        } else {
          addLog(`You healed for ${Math.abs(result.damageDealtToPlayer)} HP.`, "combat");
        }
      } else if (result.playerStatusUpdates) {
        // Even if no damage (e.g. just applied poison but no initial dmg?), update status
        setPlayer(p => ({
          ...p,
          statusEffects: {
            ...p.statusEffects,
            ...result.playerStatusUpdates
          }
        }));
      }

      if (result.isEnemyDefeated) {
        setEnemy(null);
        addLog(`${enemy.name} was defeated!`, "combat");

        if (result.goldGained) {
          setPlayer(prev => ({
            ...prev,
            gold: prev.gold + result.goldGained!,
            statusEffects: {} // Clear combat status effects
          }));
          addLog(`Gained ${result.goldGained} gold.`, "system");
        } else {
          // Ensure we clear effects even if no gold gained (rare but possible)
          setPlayer(prev => ({ ...prev, statusEffects: {} }));
        }

        if (result.lootDropped && result.lootDropped.length > 0) {
          const newItems = result.lootDropped.map((item, idx) => ({
            ...item,
            id: `loot - ${Date.now()} -${idx} `
          }));
          setRecentLoot(newItems);
          addLog(`The enemy dropped ${newItems.length} item(s).`, "loot");
        } else {
          setRecentLoot([]);
        }

        const willLevelUp = player.xp + result.xpGained >= player.maxXp;

        if (result.xpGained > 0) {
          handleGainXp(result.xpGained);
        }

        if (willLevelUp) {
          setPhase(GamePhase.LEVEL_UP);
        } else {
          setPhase(GamePhase.LOOT);
        }

      } else {
        const newEnemyHp = result.enemyState?.hp ?? Math.max(0, enemy.hp - result.damageDealtToEnemy);
        setEnemy(e => e ? { ...e, hp: newEnemyHp } : null);
        if (result.damageDealtToEnemy > 0) {
          addLog(`Enemy took ${result.damageDealtToEnemy} damage.`, "combat");
        }
      }

      setPlayer(p => ({
        ...p,
        skills: p.skills.map(s => ({ ...s, currentCooldown: Math.max(0, s.currentCooldown - ((p.statusEffects?.shocked || 0) > 0 ? 0 : 1)) }))
      }));

    } catch (error) {
      addLog("The timeline fractures... (Error processing turn. Check console/settings)", "system");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGainXp = (amount: number) => {
    // INT Effect: +2% XP Gain per INT point
    const intBonus = 1 + ((player.stats.Intelligence || 10) * 0.02);
    const finalAmount = Math.floor(amount * intBonus);

    setPlayer(p => {
      let newXp = p.xp + finalAmount;
      let newLevel = p.level;
      let currentMaxXp = p.maxXp;
      let currentMaxHp = p.maxHp;
      let currentHp = p.hp;
      let didLevelUp = false;

      // Handle multiple level ups
      while (newXp >= currentMaxXp) {
        newXp -= currentMaxXp;
        newLevel++;
        currentMaxXp = Math.floor(currentMaxXp * 1.5);
        currentMaxHp += 10;
        currentHp = currentMaxHp; // Full heal on level up
        didLevelUp = true;
      }

      if (didLevelUp) {
        addLog(`Level Up! You are now level ${newLevel}.`, "system");

        // Trigger skill generation if it's a multiple of 5 (or just every level?)
        // The previous logic was: if (newLevel % 5 === 0) generate skills.
        // But the UI forces a stat choice every level.
        // And the stat choice triggers skill generation.
        // So we just need to set the phase to LEVEL_UP.
        // The skill generation happens AFTER the user picks a stat.

        // Wait, the previous code had:
        // if (newLevel % 5 === 0) { generateNewSkill... }
        // This seems to be a legacy auto-learn system?
        // The NEW system (lines 451+) generates skills AFTER stat selection.
        // So we should remove the auto-generation here to avoid confusion/duplicates.

        // We need to ensure we set the phase to LEVEL_UP.
        // But we can't set phase inside setPlayer updater.
        // We'll handle phase change outside.

        return {
          ...p,
          level: newLevel,
          xp: newXp,
          maxXp: currentMaxXp,
          maxHp: currentMaxHp,
          hp: currentHp,
          stats: p.stats
        };
      } else {
        return { ...p, xp: newXp };
      }
    });

    addLog(`Gained ${finalAmount} XP.`, "system");
  };

  const handleImproveStat = (stat: StatType) => {
    if (player.statPoints > 0) {
      setPlayer(p => {
        const newStats = { ...p.stats, [stat]: p.stats[stat] + 1 };
        let newMaxHp = p.maxHp;
        let newHp = p.hp;

        // If CON increased, recalculate Max HP
        if (stat === StatType.CON) {
          // Formula: 20 + (CON * 5)
          const oldMaxHp = 20 + (p.stats[StatType.CON] * 5);
          newMaxHp = 20 + (newStats[StatType.CON] * 5);

          // Increase current HP by the same amount to keep damage taken constant
          // or just heal the difference? Let's add the difference.
          const diff = newMaxHp - oldMaxHp;
          newHp = Math.min(newMaxHp, p.hp + diff);
        }

        return {
          ...p,
          stats: newStats,
          maxHp: newMaxHp,
          hp: newHp,
          statPoints: p.statPoints - 1
        };
      });
      addLog(`Increased ${stat} to ${player.stats[stat] + 1}.`, "system");
    }
  };

  const handleSelectSkill = (skill: Skill) => {
    setPlayer(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    setNewlyLearnedSkill(skill);
    setSkillOptions([]); // Clear options after selection
    addLog(`Learned new skill: ${skill.name} !`, "system");
  };

  const handleTakeLoot = (item: Item) => {
    setPlayer(p => ({ ...p, inventory: [...p.inventory, item] }));
    setRecentLoot(prev => prev.filter(i => i.id !== item.id));
    addLog(`Picked up ${item.name}.`, "loot");
  };

  const handleBuyItem = (item: Item) => {
    if (player.gold >= item.cost) {
      setPlayer(prev => ({
        ...prev,
        gold: prev.gold - item.cost,
        inventory: [...prev.inventory, { ...item, id: `bought - ${Date.now()} ` }]
      }));
      // Remove from merchant
      setMerchantItems(prev => prev.filter(i => i.id !== item.id));
      addLog(`Bought ${item.name} for ${item.cost} gold.`, "system");
    } else {
      addLog("Not enough gold!", "system");
    }
  };

  const handleSellItem = (item: Item) => {
    const sellPrice = Math.floor(item.value / 2); // Assuming 'value' is the base price
    setPlayer(prev => ({
      ...prev,
      gold: prev.gold + sellPrice,
      inventory: prev.inventory.filter(i => i.id !== item.id),
      equipped: {
        weapon: prev.equipped.weapon?.id === item.id ? null : prev.equipped.weapon,
        armor: prev.equipped.armor?.id === item.id ? null : prev.equipped.armor
      }
    }));
    addLog(`Sold ${item.name} for ${sellPrice} gold.`, "system");
  };

  const handleForgetSkill = (skill: Skill) => {
    const cost = skill.cost || (player.level * 100);
    if (player.gold >= cost) {
      setPlayer(prev => ({
        ...prev,
        gold: prev.gold - cost,
        skills: prev.skills.filter(s => s.id !== skill.id)
      }));
      addLog(`Forgot skill ${skill.name} for ${cost} gold.`, "system");
    } else {
      addLog(`Not enough gold to forget skill! Need ${cost}.`, "system");
    }
  };

  const handleToggleSkill = (skill: Skill) => {
    setPlayer(prev => {
      const isActive = skill.isActive;
      const activeCount = prev.skills.filter(s => s.isActive).length;

      if (!isActive && activeCount >= 5) {
        addLog("Max 5 active skills!", "system");
        return prev;
      }

      return {
        ...prev,
        skills: prev.skills.map(s =>
          s.id === skill.id ? { ...s, isActive: !isActive } : s
        )
      };
    });
  };

  const handleStatIncrease = async (stat: StatType) => {
    setPlayer(p => {
      const newStats = {
        ...p.stats,
        [stat]: (p.stats[stat] || 0) + 2
      };

      let newMaxHp = p.maxHp;
      let newHp = p.hp;
      let newAc = p.ac;

      // Update derived stats
      if (stat === StatType.CON) {
        // CON: Max HP = Base (20) + (CON * 5)
        newMaxHp = 20 + (newStats[StatType.CON] * 5);
        newHp = p.hp + 10; // +2 CON * 5 = +10 HP
      } else if (stat === StatType.DEX) {
        // DEX: Update AC display (10 + DEX/2)
        newAc = 10 + Math.floor(newStats[StatType.DEX] / 2);
      }

      return {
        ...p,
        stats: newStats,
        maxHp: newMaxHp,
        hp: newHp,
        ac: newAc
      };
    });

    setIsLoading(true);

    // Generate 3 skill options using the new batched method
    try {
      const skills = await gameService.generateSkillOptions(
        stat,
        player.skills.map(s => s.name),
        settings
      );

      const validSkills = skills.map((s, i) => ({
        ...s,
        id: `skill - opt - ${Date.now()} -${i} `,
        currentCooldown: 0,
        stat: Object.values(StatType).includes(s.stat as StatType) ? s.stat : stat
      } as Skill));

      setSkillOptions(validSkills);
      // Stay in LEVEL_UP phase to let user choose skill
    } catch (e) {
      console.error("Failed to generate skills", e);
      addLog("The gods remain silent... (Skill generation failed)", "system");
      setPhase(GamePhase.LOOT);
    } finally {
      setIsLoading(false);
    }
  };

  const nextRound = async () => {
    if (player.hp <= 0) return;

    // Check if we just finished the boss round
    if (round >= maxRounds) {
      // Boss defeated -> Go to Merchant, then New Run
      setPhase(GamePhase.MERCHANT);
      setIsLoading(true);
      try {
        const items = await gameService.generateMerchantItems(player.level, settings);
        setMerchantItems(items);
        addLog("You have defeated the Boss! The Merchant awaits...", "loot");
      } catch (e) {
        console.error("Failed to generate merchant items", e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setRound(r => r + 1);
    startRound(round + 1);
  };

  const startNextRun = () => {
    setRunCount(prev => prev + 1);
    setMaxRounds(prev => prev + 1); // Increase difficulty by adding a round
    setRound(1);
    setPhase(GamePhase.COMBAT);
    setMerchantItems([]); // Clear merchant
    setShowMerchant(false); // Close merchant modal if open (though we use phase now)

    addLog(`Starting Run ${runCount + 1} !The dungeon grows deeper...`, "system");
    startRound(1);
  };

  const equipItem = (item: Item) => {
    if (item.type === ItemType.WEAPON) {
      const oldWeapon = player.equipped.weapon;
      setPlayer(p => ({
        ...p,
        inventory: p.inventory.filter(i => i.id !== item.id).concat(oldWeapon ? [oldWeapon] : []),
        equipped: { ...p.equipped, weapon: item }
      }));
    } else if (item.type === ItemType.ARMOR) {
      const oldArmor = player.equipped.armor;
      // Armor provides Defense (Soak), not AC (Avoidance). AC is DEX based.

      setPlayer(p => ({
        ...p,
        inventory: p.inventory.filter(i => i.id !== item.id).concat(oldArmor ? [oldArmor] : []),
        equipped: { ...p.equipped, armor: item }
        // AC is not changed by armor in Four Pillars
      }));
    }
    addLog(`Equipped ${item.name}.`, "system");
  };

  const useItem = (item: Item) => {
    if (item.type === ItemType.POTION) {
      const healAmount = item.value;
      setPlayer(p => ({
        ...p,
        hp: Math.min(p.maxHp, p.hp + healAmount),
        inventory: p.inventory.filter(i => i.id !== item.id)
      }));
      addLog(`Used ${item.name} and healed ${healAmount} HP.`, "combat");
    }
  };

  // -- Persistence --
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-crawl-settings');
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-crawl-settings', JSON.stringify(settings));
  }, [settings]);

  // -- Restart Logic --
  const handleRestart = () => {
    setPlayer({ ...INITIAL_PLAYER });
    setEnemy(null);
    setLogs([]);
    setRound(1);
    setPhase(GamePhase.LOBBY);
    setRecentLoot([]);
    setMerchantItems([]);
    setDiceRoll(null);
    setCharacterGenerated(false);
    setNewlyLearnedSkill(null);
    setSkillOptions([]);
    addLog("Welcome back to the Aether.", "system");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6 h-[90vh]">

        {/* Left Col: Player Stats */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto scrollbar-hide pb-4">
          <PlayerPanel
            player={player}
            onRegenerateImage={() => generateCharacterImage(visualPrompt)}
            isGeneratingImage={isGeneratingImage}
            language={settings.language}
          />

          {/* Skills Panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg shrink-0">
            <h3 className="text-lg font-fantasy text-blue-400 mb-3 border-b border-slate-700 pb-1">{getTranslation(settings.language, 'skills')}</h3>
            <div className="space-y-2">
              {player.skills.map(skill => {
                const estimatedDmg = Math.floor(player.stats[skill.stat] * skill.damageScale);
                return (
                  <button
                    key={skill.id}
                    disabled={phase !== GamePhase.COMBAT || skill.currentCooldown > 0 || isLoading}
                    onClick={() => handlePlayerAction('SKILL', skill)}
                    className={`w-full text-left p-2 rounded border text-sm transition-all relative group
                      ${skill.currentCooldown > 0
                        ? 'bg-slate-900 border-slate-800 text-slate-600'
                        : 'bg-slate-900/50 border-slate-600 text-slate-200 hover:border-blue-500 hover:bg-slate-800'
                      }
`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold pr-6">{skill.name}</span>
                      <span className="text-xs shrink-0">{skill.currentCooldown > 0 ? `${skill.currentCooldown}t` : 'Ready'}</span>
                    </div>
                    {skill.damageType && (
                      <div className="absolute top-2 right-2 text-xs" title={skill.damageType}>
                        {skill.damageType === DamageType.FIRE ? '🔥' :
                          skill.damageType === DamageType.ICE ? '❄️' :
                            skill.damageType === DamageType.POISON ? '☠️' :
                              skill.damageType === DamageType.MAGIC ? '✨' :
                                skill.damageType === DamageType.SLASHING ? '🗡️' :
                                  skill.damageType === DamageType.BLUNT ? '🔨' :
                                    skill.damageType === DamageType.PIERCING ? '🏹' : '⚔️'}
                      </div>
                    )}
                    <div className="text-xs text-amber-600 font-mono my-0.5">
                      ~{estimatedDmg} Dmg (Scales w/ {skill.stat})
                    </div>
                    <div className="text-xs text-slate-500 truncate">{skill.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Col: Main View */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">

          {/* Game Header/HUD */}
          <div className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800 flex-none">
            <div className="flex items-center gap-4">
              <div className="text-slate-400 font-mono text-sm">
                {getTranslation(settings.language, 'round')} {round} / {maxRounds} <span className="text-amber-500 text-xs ml-2">Run {runCount}</span>
              </div>
              {phase !== GamePhase.LOBBY && (
                <button
                  onClick={() => setShowMechanics(!showMechanics)}
                  className={`text - xs border border - slate - 700 px - 2 py - 1 rounded transition - colors ${showMechanics ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'text-slate-600 hover:text-slate-400'} `}
                  title="Toggle dice roll explanations"
                >
                  {showMechanics ? getTranslation(settings.language, 'hideLogic') : getTranslation(settings.language, 'showLogic')}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowInventory(true)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded border border-slate-700 text-sm transition-colors"
                >
                  {getTranslation(settings.language, 'inventory')}
                </button>
                <button
                  onClick={() => setShowSkills(true)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded border border-slate-700 text-sm transition-colors"
                >
                  {getTranslation(settings.language, 'manageSkills')}
                </button>
              </div>
              <button
                onClick={() => setShowOptions(true)}
                className="text-slate-400 hover:text-white font-mono text-sm border border-slate-700 px-3 py-1 rounded hover:bg-slate-800"
              >
                {getTranslation(settings.language, 'options')}
              </button>
              <button
                onClick={() => setShowLogs(true)}
                className="text-slate-400 hover:text-white font-mono text-sm border border-slate-700 px-3 py-1 rounded hover:bg-slate-800"
              >
                {getTranslation(settings.language, 'logs')}
              </button>
              <button
                onClick={() => setShowGuide(true)}
                className="text-slate-400 hover:text-white font-mono text-sm border border-slate-700 px-3 py-1 rounded hover:bg-slate-800"
              >
                Guide
              </button>
              <button
                onClick={() => setShowSupport(true)}
                className="text-pink-400 hover:text-pink-300 font-mono text-sm border border-pink-900/50 px-3 py-1 rounded hover:bg-pink-900/20"
                title={getTranslation(settings.language, 'buyMeBeerTooltip')}
              >
                {getTranslation(settings.language, 'support')}
              </button>

            </div>
          </div>

          {/* Main Content Container */}
          <div className="flex-1 bg-black/30 rounded-lg border border-slate-800 relative overflow-hidden flex flex-col">

            {/* Top Part: Enemy/Lobby */}
            <div className={`relative flex flex-col items-center justify-center border-b border-slate-800 bg-slate-900/40 transition-all overflow-hidden
                ${phase === GamePhase.LOBBY ? 'h-full' : 'h-[50%] flex-none p-6'}
`}>
              {phase === GamePhase.LOBBY ? (
                <div className="text-center w-full max-w-lg px-4 animate-fade-in z-10 overflow-y-auto max-h-full py-10 scrollbar-hide">
                  <h1 className="text-5xl md:text-6xl font-fantasy text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 mb-2 drop-shadow-sm">{getTranslation(settings.language, 'title')}</h1>
                  <p className="text-slate-400 mb-8 font-mono text-sm">{getTranslation(settings.language, 'subtitle')}</p>

                  <div className="bg-slate-900/90 backdrop-blur-sm p-6 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden text-left transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

                    {!characterGenerated && (
                      <div className="mb-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-amber-500 text-xs font-bold uppercase tracking-widest">
                            {getTranslation(settings.language, 'characterName')} <span className="text-slate-600 font-normal normal-case">{getTranslation(settings.language, 'optionalLabel')}</span>
                          </label>
                          <button onClick={() => setShowOptions(true)} className="text-xs text-slate-500 hover:text-white underline">Options</button>
                        </div>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-600 text-slate-100 p-3 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono text-md placeholder-slate-700 transition-all mb-4"
                          placeholder="The Nameless One"
                        />

                        <label className="block text-amber-500 text-xs font-bold mb-2 uppercase tracking-widest flex justify-between">
                          <span>{getTranslation(settings.language, 'worldTheme')}</span>
                          <span className="text-slate-500 font-normal normal-case opacity-50 cursor-help" title="The AI will act as DM based on this style">?</span>
                        </label>
                        <div className="relative group mb-4">
                          <input
                            type="text"
                            value={gameStyle}
                            onChange={(e) => setGameStyle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-600 text-slate-100 p-3 pr-12 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono text-md placeholder-slate-700 transition-all"
                            placeholder="e.g. Cyberpunk, Cheese World..."
                          />
                          <button
                            onClick={() => setGameStyle(DEFAULT_STYLES[Math.floor(Math.random() * DEFAULT_STYLES.length)])}
                            className="absolute right-2 top-2 bottom-2 w-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded flex items-center justify-center transition-colors border border-slate-700"
                            title={getTranslation(settings.language, 'randomizeTheme')}
                          >
                            🎲
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {DEFAULT_STYLES.slice(0, 4).map(style => (
                            <button
                              key={style}
                              onClick={() => setGameStyle(style)}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 transition-colors uppercase tracking-wide"
                            >
                              {style}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <label className="block text-amber-500 text-xs font-bold mb-2 uppercase tracking-widest">{getTranslation(settings.language, 'gender')}</label>
                            <select
                              value={playerGender}
                              onChange={(e) => setPlayerGender(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-600 text-slate-100 p-3 rounded-lg focus:border-amber-500 outline-none"
                            >
                              <option value="Unknown">{getTranslation(settings.language, 'unknown')}</option>
                              <option value="Male">{getTranslation(settings.language, 'male')}</option>
                              <option value="Female">{getTranslation(settings.language, 'female')}</option>
                              <option value="Custom">{getTranslation(settings.language, 'custom')}</option>
                            </select>
                            {playerGender === "Custom" && (
                              <input
                                type="text"
                                value={customGender}
                                onChange={(e) => setCustomGender(e.target.value)}
                                className="w-full mt-2 bg-slate-950 border border-slate-600 text-slate-100 p-2 rounded-lg text-sm"
                                placeholder={getTranslation(settings.language, 'specifyGender')}
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-amber-500 text-xs font-bold mb-2 uppercase tracking-widest">{getTranslation(settings.language, 'mainStat')}</label>
                            <select
                              value={mainStat}
                              onChange={(e) => setMainStat(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-600 text-slate-100 p-3 rounded-lg focus:border-amber-500 outline-none"
                            >
                              <option value="Random">{getTranslation(settings.language, 'random')}</option>
                              <option value="Strength">{getTranslation(settings.language, 'strength')}</option>
                              <option value="Dexterity">{getTranslation(settings.language, 'dexterity')}</option>
                              <option value="Intelligence">{getTranslation(settings.language, 'intelligence')}</option>
                              <option value="Constitution">{getTranslation(settings.language, 'constitution')}</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateCharacter}
                          disabled={isLoading || !gameStyle}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-amber-100 p-3 rounded-lg font-bold tracking-widest border border-slate-600 hover:border-amber-500 transition-all flex items-center justify-center"
                        >
                          {isLoading ? getTranslation(settings.language, 'summoning') : getTranslation(settings.language, 'createCharacter')}
                        </button>
                      </div>
                    )}

                    {characterGenerated && (
                      <div className="animate-fade-in">
                        <h3 className="text-amber-400 font-fantasy text-xl mb-4 text-center border-b border-slate-700 pb-2">{getTranslation(settings.language, 'characterSheet')}</h3>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800 mb-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xl font-bold text-white">{player.name}</span>
                            <span className="text-sm text-slate-400 font-mono">{player.classArchetype}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                            <div className="bg-slate-900 p-1 rounded border border-slate-800">
                              <div className="text-slate-500">STR</div>
                              <div className="font-bold">{player.stats.Strength}</div>
                            </div>
                            <div className="bg-slate-900 p-1 rounded border border-slate-800">
                              <div className="text-slate-500">DEX</div>
                              <div className="font-bold">{player.stats.Dexterity}</div>
                            </div>
                            <div className="bg-slate-900 p-1 rounded border border-slate-800">
                              <div className="text-slate-500">INT</div>
                              <div className="font-bold">{player.stats.Intelligence}</div>
                            </div>
                            <div className="bg-slate-900 p-1 rounded border border-slate-800">
                              <div className="text-slate-500">CON</div>
                              <div className="font-bold">{player.stats.Constitution}</div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 space-y-1">
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span>Weapon:</span>
                              <span className="text-slate-200">{player.equipped.weapon?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span>Armor:</span>
                              <span className="text-slate-200">{player.equipped.armor?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ability:</span>
                              <span className="text-slate-200">{player.skills[0]?.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setCharacterGenerated(false)}
                            className="flex-1 bg-slate-800 text-slate-400 py-3 rounded border border-slate-700 hover:text-white hover:bg-slate-700 text-xs uppercase tracking-widest"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleGenerateCharacter}
                            disabled={isLoading}
                            className="flex-1 bg-slate-800 text-amber-500 py-3 rounded border border-amber-900/30 hover:text-amber-400 hover:bg-slate-700 text-xs uppercase tracking-widest"
                          >
                            {isLoading ? '...' : 'Regenerate'}
                          </button>
                          <button
                            onClick={startGame}
                            className="flex-[2] bg-gradient-to-r from-amber-700 to-orange-900 hover:from-amber-600 hover:to-orange-800 text-amber-100 py-3 rounded font-bold tracking-widest border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all transform active:scale-[0.98]"
                          >
                            START ADVENTURE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : phase === GamePhase.COMBAT && isLoading && !enemy ? (
                <div className="w-full max-w-md text-center animate-fade-in flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(245,158,11,0.2)]"></div>
                  <h3 className="text-amber-500 text-xl mb-2 font-fantasy tracking-widest animate-pulse">{getTranslation(settings.language, 'summoning')}</h3>
                  <p className="text-slate-500 text-sm italic">The dungeon is shifting...</p>
                </div>
              ) : phase === GamePhase.COMBAT && !enemy ? (
                <div className="w-full max-w-md text-center animate-fade-in flex flex-col items-center justify-center h-full">
                  <h3 className="text-red-400 text-xl mb-4 font-fantasy">Encounter Generation Failed</h3>
                  <p className="text-slate-400 mb-6">The mists of the Aether are too thick...</p>
                  <button
                    onClick={() => startRound(round)}
                    className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded border border-amber-500 shadow-lg transition-all"
                  >
                    Retry Encounter
                  </button>
                </div>
              ) : enemy ? (
                <div className="w-full max-w-md text-center animate-fade-in flex flex-col h-full">
                  <div className="flex-1 flex flex-col justify-center min-h-0 overflow-y-auto scrollbar-hide">
                    {/* Enemy Image Container */}
                    {enemy.imageUrl && (
                      <div className="mb-2 flex justify-center shrink-0">
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-red-900/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                          <img src={enemy.imageUrl} alt={enemy.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    <h2 className="text-2xl md:text-3xl font-fantasy text-red-500 mb-1 drop-shadow-md tracking-wider shrink-0">
                      {enemy.name}
                    </h2>

                    <div className="flex justify-center gap-2 mb-2 shrink-0">
                      <div className="inline-block bg-red-900/30 border border-red-900/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest text-red-300">
                        {enemy.difficulty} • Lvl {enemy.level}
                      </div>
                      <div className="inline-block bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest text-blue-300">
                        AC {enemy.ac}
                      </div>
                    </div>

                    {/* Enemy Stats */}
                    <div className="flex flex-col items-center mb-2">
                      <div className="flex gap-2 text-xs font-bold mb-1">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 border border-amber-500/30">{enemy.role || 'BALANCED'}</span>
                        {enemy.material && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600/30" title="Material Type">
                            {getTranslation(settings.language, enemy.material.toLowerCase())}
                          </span>
                        )}
                        {enemy.trait && enemy.trait !== 'None' && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-purple-400 border border-purple-500/30">{enemy.trait}</span>
                        )}
                      </div>
                      <div className="flex justify-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>STR:{enemy.stats.Strength}</span>
                        <span>DEX:{enemy.stats.Dexterity}</span>
                        <span>INT:{enemy.stats.Intelligence}</span>
                        <span>CON:{enemy.stats.Constitution}</span>
                      </div>
                    </div>

                    <p className="text-slate-400 italic text-sm mb-2 max-w-sm mx-auto overflow-y-auto scrollbar-custom max-h-[60px] pr-1">
                      {enemy.description}
                    </p>

                    <div className="shrink-0">
                      <StatBar
                        label="Enemy HP"
                        current={enemy.hp}
                        max={enemy.maxHp}
                        colorClass="bg-purple-600"
                      />
                    </div>
                  </div>
                </div>
              ) : phase === GamePhase.VICTORY ? (
                <div className="text-center animate-fade-in">
                  <h2 className="text-4xl font-fantasy text-amber-500 mb-2">VICTORY</h2>
                  <p className="text-slate-400">You have survived the dungeon.</p>
                  <button onClick={handleRestart} className="mt-4 bg-amber-700 text-amber-100 px-6 py-2 rounded hover:bg-amber-600">Play Again</button>
                </div>
              ) : phase === GamePhase.GAME_OVER ? (
                <div className="text-center animate-fade-in">
                  <h2 className="text-4xl font-fantasy text-red-900 mb-2">DEFEAT</h2>
                  <button onClick={handleRestart} className="mt-4 bg-red-900 text-red-100 px-6 py-2 rounded hover:bg-red-800">Main Menu</button>
                </div>
              ) : phase === GamePhase.LOOT ? (
                <div className="text-center animate-fade-in">
                  <h2 className="text-4xl font-fantasy text-amber-500 mb-2">AREA CLEAR</h2>
                  <p className="text-slate-400 mb-6">The enemy lies defeated.</p>
                </div>
              ) : phase === GamePhase.LEVEL_UP ? (
                <div className="text-center animate-fade-in">
                  <h2 className="text-4xl font-fantasy text-cyan-400 mb-2">LEVEL UP!</h2>
                  <p className="text-slate-400">Choose a stat to improve below.</p>
                </div>
              ) : (
                <div className="text-slate-600 animate-pulse flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                  <span>Consulting the Oracle...</span>
                </div>
              )}
            </div>

            {/* Logs Section */}
            {phase !== GamePhase.LOBBY && <ActionLog logs={logs} showMechanics={showMechanics} />}
          </div>

          {/* Combat Controls */}
          {phase !== GamePhase.LOBBY && (
            <div className="bg-slate-900 p-4 rounded border border-slate-800 min-h-[100px] flex items-center justify-center gap-4 flex-none">
              {phase === GamePhase.COMBAT && (
                <>
                  <div className="flex flex-col gap-2 w-full max-w-md">
                    <button
                      onClick={() => handlePlayerAction('ATTACK')}
                      disabled={isLoading}
                      className="bg-red-900/80 hover:bg-red-800 text-red-100 px-8 py-4 rounded border border-red-700 font-fantasy text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full transition-all active:scale-95"
                    >
                      {isLoading ? '...' : getTranslation(settings.language, 'attack')}
                    </button>

                    {/* Skill Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {player.skills.filter(s => s.isActive).map(skill => (
                        <button
                          key={skill.id}
                          onClick={() => handlePlayerAction('SKILL', skill)}
                          disabled={isLoading || skill.currentCooldown > 0}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-100 p-2 rounded border border-slate-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center min-h-[60px] relative group transition-all active:scale-95"
                          title={skill.description}
                        >
                          <span className="font-bold text-center leading-tight mb-1">{skill.name}</span>
                          <span className="text-[10px] text-blue-400">{skill.currentCooldown > 0 ? `${skill.currentCooldown}t` : 'Ready'}</span>
                          {skill.damageType && (
                            <span className="absolute top-1 right-1 text-xs" title={skill.damageType}>
                              {skill.damageType === DamageType.FIRE ? '🔥' :
                                skill.damageType === DamageType.ICE ? '❄️' :
                                  skill.damageType === DamageType.POISON ? '☠️' :
                                    skill.damageType === DamageType.MAGIC ? '✨' :
                                      skill.damageType === DamageType.SLASHING ? '🗡️' :
                                        skill.damageType === DamageType.BLUNT ? '🔨' :
                                          skill.damageType === DamageType.PIERCING ? '🏹' : '⚔️'}
                            </span>
                          )}
                          {/* Tooltip for skill details */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black/90 text-white text-xs p-2 rounded w-48 z-10 pointer-events-none">
                            <div className="font-bold text-amber-500 mb-1">{skill.name}</div>
                            <div className="mb-1">{skill.description}</div>
                            <div className="text-blue-300">Scales w/ {skill.stat}</div>
                            {skill.damageType && <div className="text-slate-400">Type: {skill.damageType}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {diceRoll && (
                    <div className="bg-slate-800 w-16 h-16 flex items-center justify-center rounded border border-slate-600 shrink-0">
                      <div className="text-center">
                        <div className="text-xs text-slate-500">D20</div>
                        <div className="text-2xl font-bold text-white">{diceRoll}</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {phase === GamePhase.LEVEL_UP && (
                <div className="w-full">
                  {skillOptions.length > 0 ? (
                    <>
                      <h3 className="text-center text-cyan-400 font-fantasy mb-4">{getTranslation(settings.language, 'chooseSkill')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {skillOptions.map(skill => (
                          <button
                            key={skill.id}
                            onClick={() => {
                              handleSelectSkill(skill);
                              setPhase(GamePhase.LOOT);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-left p-3 rounded transition-colors flex flex-col gap-1 group"
                          >
                            <span className="font-bold text-amber-400 group-hover:text-amber-300">{skill.name}</span>
                            <span className="text-xs text-slate-400">{skill.description}</span>
                            <span className="text-xs text-blue-400 mt-1">{getTranslation(settings.language, 'scalesWith')} {skill.stat}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-center text-amber-400 font-fantasy mb-4">{getTranslation(settings.language, 'levelUp')}</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {[StatType.STR, StatType.DEX, StatType.INT, StatType.CON].map(stat => (
                          <button
                            key={stat}
                            onClick={() => handleStatIncrease(stat)}
                            disabled={isLoading}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +2 {stat}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {phase === GamePhase.LOOT && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="text-center text-slate-500 text-sm italic mb-4">
                    {recentLoot.length > 0 ? getTranslation(settings.language, 'lootPrompt') : getTranslation(settings.language, 'preparePrompt')}
                  </div>

                  {recentLoot.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                      {recentLoot.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleTakeLoot(item)}
                          className="bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-100 px-4 py-2 rounded flex items-center gap-2 animate-fade-in"
                        >
                          <span>{item.type === ItemType.WEAPON ? '⚔️' : item.type === ItemType.ARMOR ? '🛡️' : '⚗️'}</span>
                          <span>{item.name}</span>
                          <span className="text-xs bg-slate-950 px-1 rounded text-amber-500">Take</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={nextRound}
                    className="bg-amber-700 text-amber-100 px-8 py-3 rounded hover:bg-amber-600 font-fantasy text-xl shadow-lg transition-all active:scale-95 w-full max-w-md"
                  >
                    {round >= maxRounds ? "Face the Boss" : "Next Round"}
                  </button>
                </div>
              )}

              {phase === GamePhase.MERCHANT && (
                <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
                  <h2 className="text-3xl font-fantasy text-amber-500">Victory!</h2>
                  <p className="text-slate-400 text-center max-w-md">
                    You have defeated the boss. The merchant has arrived to trade before you descend further.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowMerchant(true)}
                      className="bg-slate-800 text-amber-500 px-6 py-3 rounded border border-amber-500/50 hover:bg-slate-700"
                    >
                      Open Shop
                    </button>
                    <button
                      onClick={startNextRun}
                      className="bg-gradient-to-r from-amber-700 to-orange-900 text-white px-8 py-3 rounded font-bold shadow-lg hover:from-amber-600 hover:to-orange-800"
                    >
                      Start Run {runCount + 1}
                    </button>
                  </div>
                </div>
              )}

              {phase === GamePhase.GAME_OVER && (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                  <h2 className="text-5xl font-fantasy text-red-600 mb-4 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">GAME OVER</h2>
                  <p className="text-slate-400 mb-8 text-center max-w-md">
                    Your journey has come to an end. The Aether claims another soul.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md text-center">
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase tracking-widest">Level</div>
                      <div className="text-2xl font-bold text-white">{player.level}</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase tracking-widest">Round</div>
                      <div className="text-2xl font-bold text-white">{round}</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase tracking-widest">Gold</div>
                      <div className="text-2xl font-bold text-amber-500">{player.gold}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleRestart}
                    className="bg-red-900 hover:bg-red-800 text-white px-8 py-3 rounded border border-red-700 font-fantasy text-xl shadow-lg transition-all active:scale-95"
                  >
                    Restart Adventure
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showInventory && (
        <InventoryModal
          player={player}
          onEquip={equipItem}
          onUse={useItem}
          onClose={() => setShowInventory(false)}
          language={settings.language}
        />
      )}

      {showOptions && (
        <OptionsModal
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            setShowOptions(false);
          }}
          onClose={() => setShowOptions(false)}
          onRestart={() => {
            handleRestart();
            setShowOptions(false);
          }}
        />
      )}

      {showSupport && (
        <SupportModal
          onClose={() => setShowSupport(false)}
          language={settings.language}
        />
      )}

      {showLogs && (
        <LogsModal
          logs={logs}
          onClose={() => setShowLogs(false)}
          language={settings.language}
        />
      )}

      {showMerchant && (
        <MerchantModal
          player={player}
          merchantItems={merchantItems}
          onBuy={handleBuyItem}
          onSell={handleSellItem}
          onForgetSkill={handleForgetSkill}
          onClose={() => {
            setShowMerchant(false);
          }}
          language={settings.language}
        />
      )}

      {showSkills && (
        <SkillsModal
          player={player}
          onToggleSkill={handleToggleSkill}
          onClose={() => setShowSkills(false)}
          language={settings.language}
        />
      )}

      {showGuide && (
        <GuideModal
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          language={settings.language}
        />
      )}
    </div>
  );
}


