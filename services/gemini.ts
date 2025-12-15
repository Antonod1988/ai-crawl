
import { Type, Schema } from "@google/genai";
import { Player, Enemy, TurnResponse, ItemType, StatType, Skill, Item, Difficulty, GameSettings, AIProvider, SkillEffect, StatusEffects, DamageType, MaterialType } from "../types";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "imagen-4.0-generate-001";

// Define the schema for the model's output (Used for Gemini SDK)
const turnResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: "Atmospheric description of the event." },
    mechanics: { type: Type.STRING, description: "Short technical explanation of the dice roll and result (e.g., 'Rolled 15 + 3 STR = 18 vs Enemy AC 14. Hit!')." },
    enemyAction: { type: Type.STRING, description: "What the enemy tried to do (e.g. 'The Goblin swings its club')." },
    damageDealtToPlayer: { type: Type.INTEGER, description: "Final calculated damage the player takes." },
    damageDealtToEnemy: { type: Type.INTEGER, description: "Final calculated damage the enemy takes." },
    isEnemyDefeated: { type: Type.BOOLEAN, description: "True if enemy HP reaches 0." },
    xpGained: { type: Type.INTEGER, description: "XP awarded for this action (usually 0 unless enemy defeated)." },
    enemyState: {
      type: Type.OBJECT,
      description: "Current status of the enemy. If defeated, leave null.",
      nullable: true,
      properties: {
        hp: { type: Type.INTEGER },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
      }
    },
    lootDropped: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: [ItemType.WEAPON, ItemType.ARMOR, ItemType.POTION, ItemType.SCROLL] },
          description: { type: Type.STRING },
          value: { type: Type.INTEGER, description: "Power level (dmg/armor/heal amount). Keep balanced." },
          statModifier: { type: Type.STRING, enum: [StatType.STR, StatType.DEX, StatType.INT, StatType.CON], nullable: true }
        }
      }
    }
  },
  required: ["narrative", "mechanics", "damageDealtToPlayer", "damageDealtToEnemy", "isEnemyDefeated", "xpGained"]
};

const skillGenerationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    stat: { type: Type.STRING, enum: [StatType.STR, StatType.DEX, StatType.INT, StatType.CON] },
    effect: { type: Type.STRING, enum: [SkillEffect.DAMAGE, SkillEffect.HEAL, SkillEffect.STUN, SkillEffect.LEECH, SkillEffect.ARMOR_BREAK], nullable: true },
    effectValue: { type: Type.INTEGER, nullable: true }
  }
};

const characterGenerationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative name fitting the theme." },
    classFlavorName: { type: Type.STRING, description: "A creative class name fitting the theme (e.g. 'Neon Ninja' for Rogue, 'Cheese Wizard' for Mage)." },
    visualPrompt: { type: Type.STRING, description: "A descriptive prompt to generate an image of this character." },
    weapon: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
      }
    },
    armor: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
      }
    },
    firstSkill: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
      }
    }
  },
  required: ["name", "classFlavorName", "weapon", "armor", "firstSkill", "visualPrompt"]
};

export class GameMasterService {

  private getApiKey(settings: GameSettings): string {
    if (settings.apiKey && settings.apiKey.trim() !== "") {
      return settings.apiKey;
    }
    try {
      return process.env.API_KEY || '';
    } catch (e) {
      return '';
    }
  }

  // Consolidated generic LLM call for all providers (OpenRouter, OpenAI, Local)
  private async callGenericLLM(settings: GameSettings, prompt: string, schema: Schema, systemInstruction?: string): Promise<any> {
    const apiKey = this.getApiKey(settings);
    const model = settings.modelName || "mistralai/mistral-7b-instruct";

    let url = "";
    if (settings.aiProvider === AIProvider.OPENROUTER) { // Start with OpenRouter as default/fallback
      url = "https://openrouter.ai/api/v1/chat/completions";
    } else if (settings.aiProvider === AIProvider.OPENAI) {
      url = "https://api.openai.com/v1/chat/completions";
    } else { // LOCAL
      url = settings.baseUrl ? `${settings.baseUrl}/chat/completions` : "http://localhost:11434/v1/chat/completions";
    }

    // Prepare Schema in System Prompt (as many models don't support JSON mode strictly via API)
    // We convert the Schema object to a description string or TypeScript definition.
    const schemaDesc = JSON.stringify(schema, null, 2);

    let fullSystemPrompt = `${systemInstruction || ''}\nIMPORTANT: You must respond with valid JSON only. Do not wrap in markdown code blocks. The JSON must follow this schema:\n${schemaDesc}`;

    // Adjust body based on provider quirks if needed
    const body: any = {
      model: model,
      messages: [
        { role: "system", content: fullSystemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.8
    };

    // Some models support response_format: { type: "json_object" }
    if (settings.aiProvider === AIProvider.OPENAI || settings.aiProvider === AIProvider.LOCAL || settings.aiProvider === AIProvider.OPENROUTER) {
      body.response_format = { type: "json_object" };
    }

    try {
      const headers: any = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      };

      if (settings.aiProvider === AIProvider.OPENROUTER) {
        headers["HTTP-Referer"] = "https://aether-crawl.com";
        headers["X-Title"] = "Aether Crawl";
      }

      console.log(`Calling ${settings.aiProvider} at ${url} with model ${model}`);

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      console.log("Generic LLM Response:", JSON.stringify(data, null, 2));

      let content = data.choices?.[0]?.message?.content || "{}";

      // Cleanup markdown if present
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse JSON from LLM:", content);
        // Attempt to find JSON object in text if mixed content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Invalid JSON response from AI");
      }
    } catch (e) {
      console.error("Generic LLM Call Failed:", e);
      throw e;
    }
  }

  private async callAI(settings: GameSettings, prompt: string, schema: Schema, systemInstruction?: string): Promise<any> {
    const timeoutMs = 60000; // Increased timeout for slower models

    // Redirect Gemini setting to Generic/OpenRouter logic if it persists in UI but we removed SDK
    const aiCall = this.callGenericLLM(settings, prompt, schema, systemInstruction);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
    });

    return Promise.race([aiCall, timeoutPromise]);
  }

  // --- Helper Methods for Hardcoded Logic ---

  // Helper methods removed as they are no longer used in the new system
  // calculateDamage and getStatForAction were replaced by direct Four Pillars logic

  private generateLootItem(level: number, difficulty: string = 'Minion'): { type: ItemType, value: number, cost: number, statModifier?: StatType, damageType?: DamageType } {
    const rand = Math.random();
    let difficultyMultiplier = 1;
    if (difficulty === 'Elite') difficultyMultiplier = 1.5;
    if (difficulty === 'Boss') difficultyMultiplier = 2.5;

    if (rand < 0.4) {
      // Weapon (40%)
      const baseDmg = 4 + Math.floor(level * 1.5);
      const variance = Math.floor(Math.random() * 3);
      const value = Math.floor((baseDmg + variance) * difficultyMultiplier);

      // Assign Damage Type (New Logic)
      const physicalTypes = [DamageType.SLASHING, DamageType.BLUNT, DamageType.PIERCING];
      const damageType = Math.random() > 0.7
        ? [DamageType.MAGIC, DamageType.FIRE, DamageType.ICE, DamageType.POISON][Math.floor(Math.random() * 4)]
        : physicalTypes[Math.floor(Math.random() * physicalTypes.length)];

      return {
        type: ItemType.WEAPON,
        value: value,
        cost: value * 20,
        statModifier: Math.random() > 0.5 ? StatType.STR : StatType.DEX,
        damageType: damageType
      };
    } else if (rand < 0.7) {
      // Armor (30%)
      const baseDef = 1 + Math.floor(level * 0.8);
      const value = Math.floor(baseDef * difficultyMultiplier);
      return {
        type: ItemType.ARMOR,
        value: value,
        cost: value * 30
      };
    } else {
      // Potion (30%)
      const value = Math.floor((20 + (level * 10)) * difficultyMultiplier);
      return {
        type: ItemType.POTION,
        value: value,
        cost: Math.floor(value / 2)
      };
    }
  }

  async generateMerchantItems(level: number, settings: GameSettings): Promise<Item[]> {
    const rawItems: any[] = [];
    const count = 5;

    // 1. Generate Mechanical Stats
    for (let i = 0; i < count; i++) {
      const loot = this.generateLootItem(level, 'Minion');
      rawItems.push({ ...loot, id: `merch-${Date.now()}-${i}`, isElite: false });
    }
    // Add one better item
    const eliteLoot = this.generateLootItem(level, 'Elite');
    rawItems.push({ ...eliteLoot, id: `merch-elite-${Date.now()}`, isElite: true });

    // 2. AI Generation for Names/Descriptions
    const prompt = `
      Generate names and descriptions for these RPG items.
      LANGUAGE: ${settings.language}
      THEME: Fantasy/Sci-Fi (fitting the game world)
      
      ITEMS:
      ${rawItems.map((item, index) => `${index + 1}. ${item.isElite ? 'ELITE ' : ''}${item.type} (Value: ${item.value})`).join('\n')}
      
      Return JSON array of objects with 'name' and 'description'.
    `;

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name", "description"]
      }
    };

    let aiData: any[] = [];
    try {
      aiData = await this.callAI(settings, prompt, schema);
    } catch (e) {
      console.error("Merchant Item Generation Failed", e);
      // Fallback
      aiData = rawItems.map(item => ({
        name: `${item.isElite ? 'Elite ' : ''}${item.type}`,
        description: "A standard item."
      }));
    }

    // 3. Merge
    return rawItems.map((item, index) => ({
      id: item.id,
      name: aiData[index]?.name || `${item.type}`,
      description: aiData[index]?.description || "A mysterious item.",
      type: item.type,
      value: item.value,
      cost: item.cost,
      statModifier: item.statModifier
    }));
  }

  async generateSkill(playerClass: string, level: number, settings: GameSettings): Promise<Partial<Skill>> {
    // ... existing single skill generation (keep for fallback or other uses) ...
    return this.generateSkillOptions(StatType.STR, [], settings, 1)[0]; // Fallback
  }

  async generateSkillOptions(stat: StatType, existingSkills: string[], settings: GameSettings, count: number = 3): Promise<Partial<Skill>[]> {
    const prompt = `
      Generate ${count} UNIQUE and DISTINCT RPG skills based on the stat: ${stat}.
      Language: ${settings.language}.
      
      Do NOT use any of these existing skill names: ${existingSkills.join(", ")}.
      
      Return a JSON object with a "skills" array containing ${count} skill objects.
      Each skill must have:
      - name: Creative name
      - description: Short description
      - stat: Must be "${stat}"
      - effect: One of [DAMAGE, HEAL, STUN, LEECH, ARMOR_BREAK]
      - damageType: "DamageType (SLASHING, BLUNT, PIERCING, MAGIC, FIRE, ICE, POISON) - Choose based on skill nature"
      - effectValue: number (e.g. 1 for stun, 2 for break, 0 for others)
      
      Example JSON:
      {
        "skills": [
          { "name": "Bash", "description": "Hit hard", "stat": "Strength", "effect": "DAMAGE", "effectValue": 0 },
          ...
        ]
      }
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        skills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              stat: { type: Type.STRING, enum: [StatType.STR, StatType.DEX, StatType.INT, StatType.CON] },
              effect: { type: Type.STRING, enum: [SkillEffect.DAMAGE, SkillEffect.HEAL, SkillEffect.STUN, SkillEffect.LEECH, SkillEffect.ARMOR_BREAK], nullable: true },
              effectValue: { type: Type.INTEGER, nullable: true },
              damageType: { type: Type.STRING, enum: Object.values(DamageType), nullable: true }
            },
            required: ["name", "description", "stat"]
          }
        }
      }
    };

    try {
      const data = await this.callAI(settings, prompt, schema);
      if (data && data.skills && Array.isArray(data.skills)) {
        return data.skills.map((s: any) => ({
          name: s.name,
          description: s.description,
          stat: stat,
          damageScale: 1.5, // Base scale
          cooldown: 3,
          effect: s.effect || SkillEffect.DAMAGE,
          effectValue: s.effectValue || 0,
          cost: 100,
          isActive: false,
          damageType: (s.damageType && Object.values(DamageType).includes(s.damageType as DamageType)) ? s.damageType as DamageType : DamageType.MAGIC
        }));
      }
      throw new Error("Invalid skill data format");
    } catch (e) {
      console.error("Error generating skill options:", e);
      // Fallback: Generate generic skills
      return Array.from({ length: count }).map((_, i) => ({
        name: `Skill ${i + 1}`,
        description: "A basic skill.",
        stat: stat,
        damageScale: 1.5,
        cooldown: 3,
        effect: SkillEffect.DAMAGE,
        effectValue: 0,
        cost: 100,
        isActive: false,
        damageType: DamageType.MAGIC
      }));
    }
  }

  // --- Public Methods ---

  async generateImage(prompt: string, settings: GameSettings): Promise<{ url?: string, error?: string, debug?: string }> {
    // Consolidated Image Generation for OpenRouter, OpenAI, and Local
    const provider = settings.aiProvider;

    try {
      const apiKey = settings.imageApiKey || this.getApiKey(settings);
      const model = settings.imageModel || "dall-e-3";

      let url = "";
      let body: any = {};
      const headers: any = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      };

      if (provider === AIProvider.OPENROUTER) {
        // OpenRouter uses chat/completions for image generation models (like DALL-E 3)
        url = "https://openrouter.ai/api/v1/chat/completions";
        headers["HTTP-Referer"] = "https://aether-crawl.com";
        headers["X-Title"] = "Aether Crawl";
        body = {
          model: model,
          messages: [{
            role: "user",
            content: [{
              type: "text",
              text: prompt + " Generate a high quality, digital art, rpg character portrait, detailed, 4k. Return ONLY the markdown image link."
            }]
          }],
          // Required for image models on OpenRouter (e.g. DALL-E 3) to accept the request
          modalities: ["image", "text"]
          // size: "1024x1024" 
        };
      } else if (provider === AIProvider.OPENAI) {
        url = "https://api.openai.com/v1/images/generations";
        body = {
          model: model,
          prompt: prompt + " high quality, digital art, rpg character portrait, detailed, 4k",
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        };
      } else { // LOCAL
        url = settings.baseUrl ? `${settings.baseUrl}/images/generations` : "http://localhost:11434/v1/images/generations";
        body = {
          model: model,
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        };
      }

      console.log(`Generating image via ${provider} at ${url} with model ${model}`);

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Image API Error: ${response.status} - ${errText}`);
        return { error: `API Error ${response.status}: ${errText}` };
      }

      const data = await response.json();
      console.log("DEBUG RAW IMAGE RESPONSE:", JSON.stringify(data, null, 2));
      console.log("Image Response:", JSON.stringify(data, null, 2));

      // 1. Check for OpenRouter "images" array in content (Gemini Flash format)
      // Format: choices[0].message.images[0].image_url
      const message = data.choices?.[0]?.message;
      if (message?.images && message.images.length > 0 && message.images[0].image_url) {
        return { url: message.images[0].image_url };
      }

      // 2. Check for Standard OpenAI Image Format (data[0].url or b64_json)
      if (data.data && data.data.length > 0) {
        if (data.data[0].b64_json) return { url: `data:image/jpeg;base64,${data.data[0].b64_json}` };
        if (data.data[0].url) return { url: data.data[0].url };
      }

      // 3. Check text content for markdown/urls
      const content = message?.content;
      if (content) {
        const markdownMatch = content.match(/!\[.*?\]\((.*?)\)/);
        if (markdownMatch && markdownMatch[1]) return { url: markdownMatch[1], debug: content };

        const urlMatch = content.match(/https?:\/\/[^\s)]+/);
        if (urlMatch) return { url: urlMatch[0], debug: content };

        const b64Match = content.match(/data:image\/[a-zA-Z]+;base64,[^\s)]+/);
        if (b64Match) return { url: b64Match[0], debug: content };

        return { error: `No image found.`, debug: content };
      }

      return { error: "No image data found.", debug: JSON.stringify(data) };

    } catch (e: any) {
      console.error("Image generation failed:", e);
      return { error: e.message || "Image Gen Failed" };
    }
  }

  async generateCharacter(theme: string, playerName: string | undefined, gender: string | undefined, characterClass: any, settings: GameSettings): Promise<{
    name: string;
    classArchetype: string;
    stats: Record<StatType, number>;
    weapon: Partial<Item>;
    armor: Partial<Item>;
    firstSkill: Partial<Skill>;
    visualPrompt: string;
    gold: number;
  }> {
    const prompt = `
      Generate flavor text for a Level 1 RPG character.
      THEME: "${theme}"
      LANGUAGE: ${settings.language}
      
      USER REQUIREMENTS:
      1. Name: ${playerName ? `Must be strictly "${playerName}"` : 'Fitting for the setting.'}
      2. Gender: ${gender && gender !== 'Unknown' ? `STRICTLY "${gender}"` : 'Any fitting the theme'}
      3. Base Class: ${characterClass.name}
         - Description: ${characterClass.description}
         - Main Stat: ${characterClass.mainStat}
         - Weapon Type: ${characterClass.weaponType}
         - Armor Type: ${characterClass.armorType}
         - Skill Type: ${characterClass.skillType}

      INSTRUCTIONS:
      - Do NOT generate stats or numbers. They are hardcoded.
      - Generate a creative "Class Flavor Name" (e.g. if Base Class is Warrior and theme is Cyberpunk, call it "Street Samurai").
      - Generate names and descriptions for the starting Weapon, Armor, and First Skill that fit the Theme and Base Class.
      
      Return STRICT JSON:
      {
        "name": "string",
        "classFlavorName": "string",
        "visualPrompt": "string",
        "weapon": { "name": "string", "description": "string", "damageType": "DamageType (SLASHING, BLUNT, PIERCING, MAGIC, FIRE, ICE, POISON)" },
        "armor": { "name": "string", "description": "string" },
        "firstSkill": { "name": "string", "description": "string", "damageType": "DamageType (SLASHING, BLUNT, PIERCING, MAGIC, FIRE, ICE, POISON)" }
      }
    `;

    try {
      const data = await this.callAI(settings, prompt, characterGenerationSchema);

      // MERGE LLM FLAVOR WITH HARDCODED STATS
      return {
        name: data.name,
        classArchetype: data.classFlavorName || characterClass.name,
        stats: characterClass.stats, // HARDCODED STATS
        weapon: {
          name: data.weapon?.name || "Basic Weapon",
          description: data.weapon?.description || "A simple weapon.",
          damageType: (data.weapon?.damageType && Object.values(DamageType).includes(data.weapon.damageType as DamageType)) ? data.weapon.damageType as DamageType : DamageType.BLUNT,
          value: 4,
          type: ItemType.WEAPON,
          cost: 50,
          statModifier: characterClass.mainStat
        },
        armor: {
          name: data.armor?.name || "Basic Armor",
          description: data.armor?.description || "Simple protection.",
          value: 1,
          type: ItemType.ARMOR,
          cost: 30
        },
        firstSkill: {
          name: data.firstSkill?.name || "Basic Attack",
          description: data.firstSkill?.description || "A simple attack.",
          damageType: (data.firstSkill?.damageType && Object.values(DamageType).includes(data.firstSkill.damageType as DamageType)) ? data.firstSkill.damageType as DamageType : DamageType.BLUNT,
          stat: characterClass.mainStat
        },
        visualPrompt: data.visualPrompt,
        gold: 0
      };
    } catch (e) {
      console.error("Error generating character:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      return {
        name: playerName || "Glitch Walker",
        classArchetype: `Error: ${errorMessage.substring(0, 30)}...`,
        stats: characterClass.stats,
        weapon: { name: "Debug Stick", description: "Unknown object", value: 4, statModifier: characterClass.mainStat, cost: 10 },
        armor: { name: "Null Robes", description: "Offers no protection", value: 1, cost: 5 },
        firstSkill: { name: "Reboot", description: "Try again.", stat: characterClass.mainStat },
        visualPrompt: "A glitchy silhouette",
        gold: 0
      };
    }
  }

  async generateEncounter(round: number, playerLevel: number, playerHp: number, style: string, settings: GameSettings): Promise<{ enemy: Enemy, narrative: string, visualPrompt: string }> {
    const isBoss = round >= 6;
    let difficulty = settings.difficulty;

    // --- ARCHETYPE TAGGING GENERATION ---

    const prompt = `
      Context: The player is in a ${style} setting.
      Create a unique enemy for this environment.
      Player Level: ${playerLevel}.
      Language: ${settings.language} (Generate Name and Description in this language).
      
      Pick ONE Combat Role: [TANK, SWARM, ASSASSIN, BRUTE, BALANCED].
      Pick ONE Special Trait: [Fire, Poison, Lifesteal, Armor_Pierce, None].
      Pick ONE Material: [FLESH, LEATHER, PLATE, BONE, SPIRIT].
      Pick ONE DamageType: "DamageType (SLASHING, BLUNT, PIERCING, MAGIC, FIRE, ICE, POISON) - Choose appropriate type".
      
      Return JSON format:
      {
        "name": "String",
        "description": "String",
        "role": "String",
        "trait": "String",
        "material": "String",
        "damageType": "String"
      }
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        role: { type: Type.STRING, enum: ['TANK', 'SWARM', 'ASSASSIN', 'BRUTE', 'BALANCED'] },
        trait: { type: Type.STRING, enum: ['Fire', 'Poison', 'Lifesteal', 'Armor_Pierce', 'None'] },
        material: { type: Type.STRING, enum: Object.values(MaterialType) },
        damageType: { type: Type.STRING, enum: Object.values(DamageType) }
      },
      required: ["name", "description", "role", "trait", "material", "damageType"]
    };

    let enemyData: any;
    try {
      enemyData = await this.callAI(settings, prompt, schema);
    } catch (e) {
      console.error("AI Generation failed, using fallback", e);
      enemyData = {
        name: "Glitch Entity",
        description: "A distorted figure formed from corrupted data.",
        role: "BALANCED",
        trait: "None",
        material: MaterialType.FLESH, // Use a valid enum value for fallback
        damageType: DamageType.MAGIC
      };
    }

    // --- MATH CONFIGURATION (The "Rosetta Stone") ---
    const ROLE_STATS: Record<string, { hp: number, dmg: number, acc: number, def: number, pierce: number }> = {
      "TANK": { hp: 1.5, dmg: 0.8, acc: -1, def: 4, pierce: 0 },
      "SWARM": { hp: 0.5, dmg: 0.6, acc: 4, def: 0, pierce: 0 },
      "ASSASSIN": { hp: 0.7, dmg: 1.3, acc: 2, def: 0, pierce: 0.3 },
      "BRUTE": { hp: 1.3, dmg: 1.5, acc: -2, def: 0, pierce: 0 },
      "BALANCED": { hp: 1.0, dmg: 1.0, acc: 0, def: 1, pierce: 0 }
    };

    const DIFF_MULT: Record<string, { hp: number, dmg: number, pierce: number }> = {
      [Difficulty.EASY]: { hp: 0.8, dmg: 0.8, pierce: 0 },
      [Difficulty.NORMAL]: { hp: 1.0, dmg: 1.0, pierce: 0 },
      [Difficulty.HARD]: { hp: 1.3, dmg: 1.3, pierce: 0.25 },
      [Difficulty.EXTREME]: { hp: 1.5, dmg: 1.5, pierce: 0.50 }
    };

    // 1. Base Stats (Anchors)
    const baseHp = Math.floor(playerHp * 0.8 * (settings.enemyHpMultiplier || 1.0));
    const baseDmg = 4 + (playerLevel * 2.5);
    const baseAcc = playerLevel + 3; // This is a modifier, not raw DEX. 
    const baseDex = 10 + playerLevel;

    // 2. Multipliers
    const role = (enemyData.role || "BALANCED").toUpperCase();
    const trait = enemyData.trait || "None";
    const roleStats = ROLE_STATS[role] || ROLE_STATS["BALANCED"];
    const diffStats = DIFF_MULT[settings.difficulty] || DIFF_MULT[Difficulty.NORMAL];

    // 3. Final Calculation
    const finalHp = Math.max(20, Math.floor(baseHp * roleStats.hp * diffStats.hp)); // Min 20 HP
    const targetDmg = Math.floor(baseDmg * roleStats.dmg * diffStats.dmg);
    const finalStr = Math.max(1, targetDmg - 2); // Simplified

    // DEX Calculation
    const finalDex = Math.floor(baseDex + roleStats.acc);

    // CON Calculation
    const finalCon = Math.max(1, Math.floor((finalHp - 20) / 5));

    // INT Calculation (Arbitrary for now, maybe based on Role?)
    let finalInt = 10 + playerLevel;
    if (role === 'ASSASSIN') finalInt += 5;

    const material = (enemyData.material && Object.values(MaterialType).includes(enemyData.material as MaterialType))
      ? enemyData.material as MaterialType
      : MaterialType.FLESH; // Default to Flesh if missing/invalid

    // Assign Weakness/Resistance based on Material (Fixed rules, not random)
    let weakness: DamageType = DamageType.SLASHING;
    let resistance: DamageType = DamageType.BLUNT;

    switch (material) {
      case MaterialType.FLESH:
        weakness = DamageType.SLASHING;
        resistance = DamageType.BLUNT;
        break;
      case MaterialType.LEATHER:
        weakness = DamageType.PIERCING;
        resistance = DamageType.SLASHING;
        break;
      case MaterialType.PLATE:
        weakness = DamageType.BLUNT; // Crushing plate
        resistance = DamageType.SLASHING;
        break;
      case MaterialType.BONE:
        weakness = DamageType.BLUNT; // Smashing bones
        resistance = DamageType.PIERCING;
        break;
      case MaterialType.SPIRIT:
        weakness = DamageType.MAGIC;
        resistance = DamageType.SLASHING; // General physical resistance (handled in damage calc)
        break;
    }

    const enemy: Enemy = {
      name: enemyData.name,
      description: enemyData.description,
      role: role as any,
      trait: trait as any,
      material: material,
      weakness: weakness,
      resistance: resistance,
      level: playerLevel,
      difficulty: isBoss ? 'Boss' : (settings.difficulty === Difficulty.HARD ? 'Elite' : 'Minion'),
      hp: finalHp,
      maxHp: finalHp,
      ac: 10 + Math.floor(finalDex / 2), // Display AC
      stats: {
        Strength: finalStr,
        Dexterity: finalDex,
        Intelligence: finalInt,
        Constitution: finalCon
      },
      statusEffects: {},
      damageType: enemyData.damageType
    };

    return {
      narrative: `You encounter a ${enemy.name}. ${enemy.description}`,
      enemy: enemy,
      visualPrompt: `A ${style} style enemy: ${enemy.description}`
    };
  }

  async processTurn(
    player: Player,
    enemy: Enemy | null,
    action: string,
    diceRoll: number,
    style: string,
    settings: GameSettings,
    skill?: Skill
  ): Promise<TurnResponse> {

    if (!enemy) {
      throw new Error("No enemy to fight!");
    }

    // --- 1. INITIALIZE STATS & EFFECTS ---
    const pStr = player.stats.Strength || 10;
    const pDex = player.stats.Dexterity || 10;
    const pInt = player.stats.Intelligence || 10;
    const pCon = player.stats.Constitution || 10;

    const eStr = enemy.stats?.Strength || 10;
    const eDex = enemy.stats?.Dexterity || 10;

    // Initialize effects if missing (safe copy)
    const pEffects: StatusEffects = { ...player.statusEffects };
    const eEffects: StatusEffects = { ...enemy.statusEffects };

    // Traits & Materials
    const playerTrait = skill?.trait || player.equipped.weapon?.trait || 'None';
    const enemyTrait = enemy.trait || 'None';
    const enemyMaterial = enemy.material || MaterialType.FLESH;

    // Infer Player Armor Material
    let playerMaterial = MaterialType.FLESH;
    const armorName = player.equipped.armor?.name.toLowerCase() || '';
    if (armorName.includes('plate') || armorName.includes('mail') || armorName.includes('metal')) playerMaterial = MaterialType.PLATE;
    else if (armorName.includes('leather') || armorName.includes('hide') || armorName.includes('skin')) playerMaterial = MaterialType.LEATHER;
    else if (armorName.includes('bone')) playerMaterial = MaterialType.BONE;

    let mechanicsLog = "";
    let playerDamage = 0;
    let playerHeal = 0;

    // --- 2. START OF TURN TICKS (Status Effects) ---
    const processTicks = (effects: StatusEffects, entityName: string, maxHp: number) => {
      let damage = 0;
      let heal = 0;
      let log = "";

      // Toxic (Stacking Damage: 2, 4, 8, 16, 32 -> Reset)
      // Toxic: 5 Fixed + 5 per Stack
      if ((effects.toxic || 0) > 0) {
        const toxicDmg = 5 + (5 * (effects.toxic || 1));
        damage += toxicDmg;
        log += `(Toxic: -${toxicDmg} HP) `;
        effects.toxic = (effects.toxic || 0) + 1;
      }

      // Burning: 10% Max HP (Proxy for 10% Atk Dmg to keep it scalable/dangerous)
      if ((effects.burning || 0) > 0) {
        const burnDmg = Math.max(1, Math.ceil(maxHp * 0.10));
        damage += burnDmg;
        log += `(Burn: -${burnDmg} HP) `;
        effects.burning = (effects.burning || 0) - 1;
        // Cancel Regen
        if ((effects.regen || 0) > 0) {
          effects.regen = 0;
          log += `(Regen cancelled) `;
        }
      }

      // Regen
      if ((effects.regen || 0) > 0) {
        heal += 2; // Base regen
        if (pCon >= 20 && entityName === 'Player') heal += 1; // Con Bonus
        log += `(Regen: +${heal} HP) `;
        effects.regen = (effects.regen || 0) - 1;
      }

      // Decrement Durations
      const decrement = (key: keyof StatusEffects) => {
        if (typeof effects[key] === 'number' && (effects[key] as number) > 0) {
          (effects[key] as number) = (effects[key] as number) - 1;
        }
      };

      decrement('frozen');
      decrement('bleeding');
      decrement('chilled');
      decrement('shocked');
      decrement('sundered');
      decrement('blinded');
      decrement('stoneskin');
      decrement('blur');
      decrement('raged');
      decrement('stunned');
      decrement('shield'); // Temporary HP fades if implemented as duration, but Shield is usually absolute value. 
      // If Shield is `number` representing HP, we clear it? 
      // User says "Shield lasts for 1 turn". So yes, decrement duration.
      // But wait, shield in `StatusEffects` is usually boolean or value? 
      // In my types, `shield` is number (HP).
      // So if I want it to expire, I should probably check duration. 
      // For now, let's assume `shield` in StatusEffects is the Amount, and we need another tracker `shieldDuration`? 
      // Or just clear it at start of turn? "Shield lasts for 1 turn".
      // I will implement "Clear Shield" logic if current turn > 0. 
      // But `processTicks` runs at START of turn. So if I have shield, does it expire now?
      // "Grants Temp HP ... lasts 1 turn".
      // Let's simplified: Shield persists until next turn start.
      if ((effects.shield || 0) > 0) {
        log += `(Shield Fades) `;
        effects.shield = 0;
      }

      return { damage, heal, log };
    };

    // Process Player Ticks
    const pTick = processTicks(pEffects, 'Player', player.maxHp);
    let playerDamageTaken = pTick.damage;
    let playerHealVal = pTick.heal;
    if (pTick.log) mechanicsLog += `[Player]: ${pTick.log}`;

    // Process Enemy Ticks
    const eTick = processTicks(eEffects, 'Enemy', enemy.hp);
    let enemyDamageTaken = eTick.damage;
    let enemyHealVal = eTick.heal;
    if (eTick.log) mechanicsLog += ` [Enemy]: ${eTick.log}`;

    // --- 3. ACTION PHASE ---
    const playerStunned = (pEffects.stunned || 0) > 0;
    const enemyStunned = (eEffects.stunned || 0) > 0;

    // --- PLAYER ACTION ---
    if (playerStunned) {
      mechanicsLog += "You are Stunned! Turn skipped. ";
    } else {
      // Calculate Player Stats with Effects
      let effectiveDex = pDex;
      if ((pEffects.chilled || 0) > 0) effectiveDex = Math.floor(effectiveDex * 0.5);
      if ((pEffects.frozen || 0) > 0) effectiveDex = 0; // Frozen = 0 Dex

      let hitChanceMod = 0;
      if ((pEffects.blinded || 0) > 0) hitChanceMod -= 50;

      const playerHitBonus = Math.floor(effectiveDex / 2);

      // Enemy AC Calculation
      let enemyAc = enemy.ac;
      let effectiveEnemyDex = eDex;
      if ((eEffects.chilled || 0) > 0) effectiveEnemyDex = Math.floor(effectiveEnemyDex * 0.5);
      if ((eEffects.frozen || 0) > 0) effectiveEnemyDex = 0; // Frozen = 0 Dex

      // AC from Dex
      enemyAc = 10 + Math.floor(effectiveEnemyDex / 2);

      // Evasion Trait (Enemy)
      let enemyDodged = false;
      if (enemyTrait === 'Evasion' && Math.random() < 0.10) {
        enemyDodged = true;
        mechanicsLog += "(Enemy Evaded!) ";
      }

      if ((eEffects.blur || 0) > 0) enemyAc += 5;

      const playerRoll = diceRoll;
      let playerHitTotal = playerRoll + playerHitBonus;
      if ((pEffects.blinded || 0) > 0) playerHitTotal = Math.floor(playerHitTotal * 0.5); // Blind penalty

      // Critical Trait Check
      const hasCritTrait = playerTrait === 'Critical';
      const traitCritSuccess = hasCritTrait && Math.random() < 0.20;

      const isPlayerCrit = playerRoll === 20 || (pEffects.focused === true) || traitCritSuccess;
      if (pEffects.focused) {
        pEffects.focused = false; // Consume Focus
        mechanicsLog += "(Focused! Auto-Crit) ";
      }
      if (traitCritSuccess) mechanicsLog += "(Crit Trait!) ";

      const playerHits = !enemyDodged && (isPlayerCrit || (playerHitTotal >= enemyAc && playerRoll !== 1));

      mechanicsLog += `Roll: ${playerRoll}+${playerHitBonus}=${playerHitTotal} vs AC ${enemyAc}. `;

      if (playerHits) {
        const weaponDmg = player.equipped.weapon?.value || 2;
        let dmgType = player.equipped.weapon?.damageType || DamageType.BLUNT; // Fists are Blunt

        let rawDmg = 0;

        if (skill) {
          // Skill Logic
          console.log("Processing Skill:", skill.name, "Damage Type:", skill.damageType); // DEBUG
          const skillPower = 1 + (pInt * 0.02);
          const baseSkillDmg = Math.floor((player.stats[skill.stat] || 10) * skill.damageScale);
          rawDmg = Math.floor(baseSkillDmg * skillPower);
          dmgType = skill.damageType || DamageType.MAGIC; // Use skill's damage type, fallback to Magic
          mechanicsLog += `(Skill: ${dmgType}) `; // Explicitly log skill type

          // Skill Effects Application
          if (skill.effect === SkillEffect.HEAL) {
            playerDamage = 0;
            playerHeal = skill.effectValue || Math.floor(rawDmg * 0.5);
            mechanicsLog += `Heal: +${playerHeal}. `;
            rawDmg = 0; // No damage to enemy
          } else if (skill.effect === SkillEffect.STUN) {
            eEffects.stunned = Math.max(eEffects.stunned || 0, skill.effectValue || 1);
            mechanicsLog += `Stunned! `;
          } else if (skill.effect === SkillEffect.ARMOR_BREAK) {
            eEffects.sundered = Math.max(eEffects.sundered || 0, skill.effectValue || 2);
            mechanicsLog += `Sundered! `;
          } else if (skill.trait === 'Poison' || skill.damageType === DamageType.POISON || skill.trait === 'Fire' || skill.trait === 'Ice') {
            // Handle explicit trait/type effects here? 
            // Logic below handles generic trait/type mapping
          }
        } else {
          // Basic Attack
          let baseDmg = weaponDmg + pStr;
          if (isPlayerCrit) { baseDmg *= 2; mechanicsLog += "CRIT! "; }
          const wobble = 0.9 + (Math.random() * 0.2);
          rawDmg = Math.floor(baseDmg * wobble);
        }

        if (rawDmg > 0) {
          // Modifiers: Rage, Frozen
          if ((pEffects.raged || 0) > 0) {
            rawDmg = Math.floor(rawDmg * 1.5);
            mechanicsLog += "(Rage) ";
          }
          if ((pEffects.frozen || 0) > 0) {
            rawDmg = Math.floor(rawDmg * 0.8); // -20% Dmg if Frozen
            mechanicsLog += "(FrozenWeak) ";
          }

          // Berserk Trait: +1% Dmg per 1% Missing HP
          if (playerTrait === 'Berserk') {
            const missingHpPct = 1 - (player.hp / player.maxHp);
            const bonus = 1 + missingHpPct; // e.g. 50% missing -> 1.5x
            rawDmg = Math.floor(rawDmg * bonus);
            mechanicsLog += `(Berserk x${bonus.toFixed(1)}) `;
          }

          // Glass Cannon: +50% Dmg
          if (playerTrait === 'Glass_Cannon') {
            rawDmg = Math.floor(rawDmg * 1.5);
            mechanicsLog += "(Glass Cannon) ";
          }

          // Material Interaction Matrix (Weakness/Resistance)
          let multiplier = 1.0;
          if (
            (enemyMaterial === MaterialType.FLESH && dmgType === DamageType.SLASHING) ||
            (enemyMaterial === MaterialType.LEATHER && dmgType === DamageType.PIERCING) ||
            (enemyMaterial === MaterialType.PLATE && (dmgType === DamageType.BLUNT || dmgType === DamageType.MAGIC)) ||
            (enemyMaterial === MaterialType.BONE && (dmgType === DamageType.BLUNT || dmgType === DamageType.MAGIC)) ||
            (enemyMaterial === MaterialType.SPIRIT && (dmgType === DamageType.MAGIC || dmgType === DamageType.FIRE))
          ) {
            multiplier = 1.5;
            mechanicsLog += `(Weakness! 1.5x) `;
          }
          if (
            (enemyMaterial === MaterialType.PLATE && dmgType === DamageType.SLASHING) ||
            (enemyMaterial === MaterialType.BONE && dmgType === DamageType.PIERCING) ||
            (enemyMaterial === MaterialType.SPIRIT && (dmgType === DamageType.SLASHING || dmgType === DamageType.BLUNT || dmgType === DamageType.PIERCING))
          ) {
            multiplier = 0.5;
            mechanicsLog += `(Resisted! 0.5x) `;
          }
          rawDmg = Math.floor(rawDmg * multiplier);

          // Enemy Defense (Soak)
          let enemyDef = Math.floor(enemy.level / 2);
          if (enemy.role === 'TANK') enemyDef += 4;
          if (enemy.role === 'BALANCED') enemyDef += 1;
          if (enemy.difficulty === 'Elite') enemyDef += 2;
          if (enemy.difficulty === 'Boss') enemyDef += 5;

          // Stoneskin (+10 Soak)
          if ((eEffects.stoneskin || 0) > 0) enemyDef += 10;
          // Sundered (-50% Soak)
          if ((eEffects.sundered || 0) > 0) enemyDef = Math.floor(enemyDef * 0.5);

          // Armor Penetration Checks
          let isPierce = dmgType === DamageType.PIERCING || playerTrait === 'Armor_Pierce' || playerTrait === 'Pierce';
          if (isPierce) {
            enemyDef = Math.floor(enemyDef * 0.5);
            mechanicsLog += "(Pierce) ";
          }

          const finalEnemyDef = Math.max(0, enemyDef);
          playerDamage = Math.max(1, rawDmg - finalEnemyDef);
          mechanicsLog += `Hit! ${rawDmg} - ${finalEnemyDef} (Def) = ${playerDamage}. `;

          // Execute Logic
          if (playerTrait === 'Execute' && enemy.difficulty !== 'Boss' && (enemy.hp - playerDamage) < (enemy.maxHp * 0.15)) {
            playerDamage = enemy.hp + 10; // Ensure kill
            mechanicsLog += "(EXECUTE!) ";
          }

          // Apply Weapon Effects (Status & Traits)
          if (dmgType === DamageType.POISON || playerTrait === 'Poison') {
            if (enemyMaterial !== MaterialType.SPIRIT && enemyMaterial !== MaterialType.BONE) {
              eEffects.toxic = (eEffects.toxic || 0) + 1; mechanicsLog += "Toxic! ";
            }
          }
          if (dmgType === DamageType.FIRE || playerTrait === 'Fire' || playerTrait === 'Ignite') { eEffects.burning = 3; mechanicsLog += "Burn! "; }
          if (dmgType === DamageType.ICE || playerTrait === 'Ice' || playerTrait === 'Freeze') { eEffects.frozen = 2; mechanicsLog += "Freeze! "; }

          if (playerTrait === 'Stun' && Math.random() < 0.15) {
            eEffects.stunned = 1; mechanicsLog += "(Stun Trait) ";
          }

          // Life Drain
          if (playerTrait === 'Lifesteal') {
            const drain = Math.ceil(playerDamage * 0.2);
            playerHeal += drain;
            mechanicsLog += `(Drain +${drain}) `;
          }

          // Energy Shield
          if (playerTrait === 'Energy_Shield') {
            const shieldAmt = Math.ceil(player.maxHp * 0.05);
            pEffects.shield = (pEffects.shield || 0) + shieldAmt;
            mechanicsLog += `(Shield +${shieldAmt}) `;
          }

          // Thorns on Enemy?
          if (enemyTrait === 'Thorns') {
            const thornsDmg = Math.ceil(playerDamage * 0.3);
            playerDamageTaken += thornsDmg;
            mechanicsLog += `(Thorns: You take ${thornsDmg}) `;
          }
        }
      } else {
        mechanicsLog += "MISS. ";
      }
    }

    // --- ENEMY ACTION ---
    let enemyDamage = 0;

    // Initial check before enemy action
    let tempEnemyHp = enemy.hp - enemyDamageTaken - playerDamage;
    let isEnemyDefeated = tempEnemyHp <= 0;

    // Check Bleed Trigger on Action Attempt
    if (!isEnemyDefeated && !enemyStunned && (eEffects.bleeding || 0) > 0) {
      const bleedDmg = Math.ceil(enemy.maxHp * 0.05);
      enemyDamageTaken += bleedDmg;
      mechanicsLog += `(Bleed: Enemy takes ${bleedDmg}) `;

      // Update HP state
      tempEnemyHp -= bleedDmg;
      isEnemyDefeated = tempEnemyHp <= 0;
    }

    if (!isEnemyDefeated && !enemyStunned) {
      // Enemy Stats
      let effectiveEnemyDex = eDex;
      if ((eEffects.chilled || 0) > 0) effectiveEnemyDex = Math.floor(effectiveEnemyDex * 0.5);
      if ((eEffects.frozen || 0) > 0) effectiveEnemyDex = 0;

      let enemyHitBonus = Math.floor(effectiveEnemyDex / 2);
      if ((eEffects.blinded || 0) > 0) enemyHitBonus = Math.floor(enemyHitBonus * 0.5); // Blind penalty

      // Player AC calculation
      let playerAc = player.ac;
      let effectivePlayerDex = pDex;
      if ((pEffects.chilled || 0) > 0) effectivePlayerDex = Math.floor(effectivePlayerDex * 0.5);
      if ((pEffects.frozen || 0) > 0) effectivePlayerDex = 0;

      // AC from Dex
      playerAc = 10 + Math.floor(effectivePlayerDex / 2);

      // Player Evasion Trait
      let playerDodged = false;
      if (playerTrait === 'Evasion' && Math.random() < 0.10) {
        playerDodged = true;
        mechanicsLog += "(Dodge!) ";
      }

      if ((pEffects.blur || 0) > 0) playerAc += 5;
      if ((pEffects.raged || 0) > 0) playerAc -= 5;

      const enemyRoll = Math.floor(Math.random() * 20) + 1;
      const enemyHitTotal = enemyRoll + enemyHitBonus;
      const enemyHits = !playerDodged && (enemyRoll === 20 || (enemyHitTotal >= playerAc && enemyRoll !== 1));

      if (enemyHits) {
        const enemyWeaponDmg = Math.max(2, Math.floor(enemy.level * 1.5));
        let baseEnemyDmg = enemyWeaponDmg + eStr;
        if (enemyRoll === 20) baseEnemyDmg *= 2;

        let rawEnemyDmg = Math.floor(baseEnemyDmg * (0.9 + Math.random() * 0.2));

        // Modifiers
        if ((eEffects.frozen || 0) > 0) {
          rawEnemyDmg = Math.floor(rawEnemyDmg * 0.8);
          mechanicsLog += "(FrozenWeakns) ";
        }

        // Player Defense (Soak)
        let playerArmor = player.equipped.armor?.value || 0;
        if ((pEffects.stoneskin || 0) > 0) playerArmor += 10;
        if ((pEffects.sundered || 0) > 0) playerArmor = Math.floor(playerArmor * 0.5);
        if ((pEffects.raged || 0) > 0) playerArmor = Math.floor(playerArmor * 0.5);
        if (playerTrait === 'Glass_Cannon') playerArmor = Math.floor(playerArmor * 0.75); // Or take more damage?
        // "Increases Damage taken by 25%". This usually means Final Damage * 1.25.
        // I will apply raw multiplier.

        if (enemyTrait === 'Pierce' || enemyTrait === 'Armor_Pierce') {
          playerArmor = Math.floor(playerArmor * 0.5);
          mechanicsLog += "(Enemy Pierce) ";
        }

        const finalPlayerArmor = Math.max(0, playerArmor);

        enemyDamage = Math.max(1, rawEnemyDmg - finalPlayerArmor);

        // Glass Cannon Vulnerability
        if (playerTrait === 'Glass_Cannon') {
          enemyDamage = Math.floor(enemyDamage * 1.25);
          mechanicsLog += "(Glass Cannon Vuln) ";
        }

        mechanicsLog += `| Enemy Hit! ${rawEnemyDmg} - ${playerArmor} = ${enemyDamage}. `;

        // Enemy Trait Effects
        if (enemyTrait === 'Poison') {
          pEffects.toxic = (pEffects.toxic || 0) + 1;
          mechanicsLog += "(Toxic) ";
        }

        // Player Thorns?
        if (playerTrait === 'Thorns') {
          const thornsDmg = Math.ceil(enemyDamage * 0.3);
          enemyDamageTaken += thornsDmg;
          mechanicsLog += `(Thorns: Enemy takes ${thornsDmg}) `;
        }
      } else {
        mechanicsLog += `| Enemy Missed. `;
      }
    } else if (enemyStunned && !isEnemyDefeated) {
      mechanicsLog += "| Enemy Stunned! ";
    }

    // --- 4. CALCULATE TOTALS ---
    const totalPlayerDamage = playerDamageTaken + enemyDamage;
    const totalPlayerHeal = playerHealVal + playerHeal;
    const netPlayerDamage = totalPlayerDamage - totalPlayerHeal;

    const totalEnemyDamage = enemyDamageTaken + playerDamage;
    const totalEnemyHeal = enemyHealVal;
    const netEnemyDamage = totalEnemyDamage - totalEnemyHeal;

    const newEnemyHp = enemy.hp - netEnemyDamage;
    isEnemyDefeated = newEnemyHp <= 0;

    // Loot & XP
    let xpGained = 0;
    let goldGained = 0;
    let lootDrop = false;
    let generatedLootItem: { type: ItemType, value: number, cost: number, statModifier?: StatType, damageType?: DamageType } | null = null;
    let finalLoot: Item[] = [];

    if (isEnemyDefeated) {
      xpGained = 50 * enemy.level;
      goldGained = 10 * enemy.level + Math.floor(Math.random() * 10);

      if (enemy.difficulty === 'Elite') { xpGained *= 2; goldGained *= 2; }
      if (enemy.difficulty === 'Boss') { xpGained *= 5; goldGained *= 5; }

      // Midas Touch Trait
      if (playerTrait === 'Midas') {
        goldGained = Math.floor(goldGained * 1.20);
      }

      let lootChance = 0.6 * (settings.lootChanceMultiplier || 1.0);
      if (enemy.difficulty === 'Elite') lootChance = 0.8;
      if (enemy.difficulty === 'Boss') lootChance = 1.0;

      // Scavenger Trait
      if (playerTrait === 'Scavenger') lootChance = Math.min(1.0, lootChance * 1.5);

      lootDrop = Math.random() < lootChance;

      if (lootDrop) {
        generatedLootItem = this.generateLootItem(enemy.level, enemy.difficulty);
      }
    }

    // --- 5. AI NARRATIVE ---
    const combatContext = `
    WORLD CONTEXT:
    - Theme: ${style}
    - Language: ${settings.language}

    PLAYER CONTEXT:
    - Name: ${player.name}
    - HP: ${player.hp}/${player.maxHp}

    ENEMY CONTEXT:
    - Name: ${enemy.name}
    - HP: ${enemy.hp}/${enemy.maxHp}
    `;

    const outcomeSummary = `
      ACTION REPORT:
      - Player Action: ${action}
      - Player Damage: ${playerDamage}
      - Enemy Damage: ${enemyDamage}
      - Status: ${isEnemyDefeated ? 'DEFEATED' : 'ALIVE'}
    `;

    const prompt = `
      Generate a narrative for this combat turn.
      CONTEXT: ${combatContext}
      OUTCOME: ${outcomeSummary}
      LOOT: ${isEnemyDefeated && lootDrop && generatedLootItem ? generatedLootItem.type : 'None'}
      
      Return JSON: { "narrative": "string", "lootName": "string?", "lootDescription": "string?" }
    `;

    const narrativeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        narrative: { type: Type.STRING },
        lootName: { type: Type.STRING, nullable: true },
        lootDescription: { type: Type.STRING, nullable: true }
      },
      required: ["narrative"]
    };

    try {
      const aiResponse = await this.callAI(settings, prompt, narrativeSchema);

      // Final Rewards
      let diffMult = 1.0;
      if (settings.difficulty === Difficulty.EASY) diffMult = 0.8;
      if (settings.difficulty === Difficulty.HARD) diffMult = 1.5;
      if (settings.difficulty === Difficulty.EXTREME) diffMult = 2.0;

      xpGained = isEnemyDefeated ? Math.floor(xpGained * diffMult * (settings.xpMultiplier || 1.0)) : 0;
      goldGained = isEnemyDefeated ? Math.floor(goldGained * diffMult) : 0;

      if (isEnemyDefeated && lootDrop && generatedLootItem) {
        finalLoot.push({
          id: `loot-${Date.now()}`,
          name: aiResponse.lootName || `Unknown ${generatedLootItem.type}`,
          description: aiResponse.lootDescription || "A mysterious item.",
          type: generatedLootItem.type,
          value: generatedLootItem.value,
          cost: generatedLootItem.cost,
          statModifier: generatedLootItem.statModifier
        });
      }

      return {
        narrative: aiResponse.narrative,
        mechanics: mechanicsLog,
        damageDealtToPlayer: netPlayerDamage,
        damageDealtToEnemy: netEnemyDamage,
        isEnemyDefeated: isEnemyDefeated,
        xpGained: xpGained,
        goldGained: goldGained,
        enemyState: isEnemyDefeated ? undefined : { ...enemy, hp: newEnemyHp, statusEffects: eEffects },
        playerStatusUpdates: pEffects,
        lootDropped: finalLoot
      };
    } catch (e) {
      console.error("Narrative Generation Failed:", e);
      return {
        narrative: `You ${action}. You deal ${playerDamage} damage. The enemy deals ${enemyDamage} damage.`,
        mechanics: mechanicsLog + " (AI Narrative Failed)",
        damageDealtToPlayer: netPlayerDamage,
        damageDealtToEnemy: netEnemyDamage,
        isEnemyDefeated: isEnemyDefeated,
        xpGained: xpGained,
        goldGained: goldGained,
        enemyState: isEnemyDefeated ? undefined : { ...enemy, hp: newEnemyHp, statusEffects: eEffects },
        playerStatusUpdates: pEffects,
        lootDropped: finalLoot
      };
    }
  }
}
