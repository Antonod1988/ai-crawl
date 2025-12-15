# Aether Crawl - AI Roguelike

A dynamic, text-based RPG where Artificial Intelligence acts as your Dungeon Master, generating unique stories, enemies, and loot every time you play.

## 🚀 How to Run (Quick Start)

1.  **Install Node.js**: Make sure you have [Node.js](https://nodejs.org/) installed on your computer.
2.  **Open Terminal**: Open your command prompt or terminal in this project folder.
3.  **Install Dependencies**: Run the following command:
    ```bash
    npm install
    ```
4.  **Start the Game**: Run:
    ```bash
    npm start
    # OR if using Vite:
    npm run dev
    ```
5.  **Play**: Open the link shown in your terminal (usually `http://localhost:3000` or `http://localhost:5173`) in your web browser.

---

## 🧠 AI Configuration

You can play this game using different AI "brains". Click the **OPTIONS** button in the top right corner of the game to configure this.

### Option 1: Google Gemini (Default)
*   **Best for**: High quality, fast responses, and **Image Generation** support.
*   **Setup**:
    1.  Select **Provider**: `Gemini`.
    2.  Enter your [Google AI Studio Key](https://aistudio.google.com/).
    3.  Enable "AI Images" to see character portraits and enemy visuals.

### Option 2: Local LLM (Ollama)
*   **Best for**: Free, offline play, privacy.
*   **Setup**:
    1.  Download and install [Ollama](https://ollama.com/).
    2.  Run a model in your terminal (e.g., `ollama run mistral`).
    3.  In Game Options:
        *   **Provider**: `Local`
        *   **Base URL**: `http://localhost:11434/v1` (Default)
        *   **Model Name**: `mistral` (or whatever model you downloaded)

### Option 3: OpenRouter / OpenAI Compatible
*   **Best for**: Accessing specific models like Claude, GPT-4, or Llama 3 via API.
*   **Setup**:
    1.  Select **Provider**: `OpenRouter`.
    2.  Enter your API Key.
    3.  Enter the **Model Name** (e.g., `mistralai/mistral-7b-instruct`).

---

## 🎮 Features
*   **Infinite Replayability**: No two runs are the same.
*   **Class System**: Create "Cyber Ninjas" or "Cheese Wizards" - the game adapts stats and skills to your text.
*   **Loot**: Find weapons, armor, and potions.
*   **Visuals**: Dynamic AI image generation for heroes and monsters (Gemini only).
