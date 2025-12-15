# 🌌 Aether Crawl

**Aether Crawl** is an infinite, AI-generated roguelike RPG where an Large Language Model (LLM) acts as your Dungeon Master. 

Every run offers a unique story, custom enemies, and procedurally generated loot, visualized with on-the-fly AI image generation.

![Character Portrait Placeholder](https://via.placeholder.com/800x400?text=AI+Generated+Roleplaying)

## ✨ key Features

-   **♾️ Infinite Replayability**: The Dungeon Master (AI) generates encounters based on your chosen theme (Fantasy, Cyberpunk, Eldritch, or even "Cheese World").
-   **🎨 AI Image Generation**: Integrated support for DALL-E 3 (via OpenRouter) to generate stunning 4K portraits for your hero and enemies.
-   **⚔️ Deep Combat System**: Turn-based battles with:
    -   **Status Effects**: Bleed, Poison, Freeze, Burn, Stun.
    -   **Weapon Traits**: Life Steal, Armor Pierce, Critical Hits, Execute.
    -   **Economy Traits**: Midas Touch, Scavenger.
-   **🧠 Flexible AI Backend**: 
    -   **Cloud**: Supports OpenRouter (default) and OpenAI.
    -   **Local**: Fully compatible with local LLMs via Ollama for offline play.
-   **🛠️ Tech Stack**: Built with React, TypeScript, Vite, and TailwindCSS context.

## 🚀 Quick Start

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/ai-crawl.git
    cd ai-crawl
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the game**:
    ```bash
    npm run dev
    ```
4.  **Configure AI**:
    -   Click **Options** in the top-right.
    -   Enter your **OpenRouter API Key** (or use Local LLM).
    -   Enjoy!

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests for new combat mechanics, themes, or UI improvements.
