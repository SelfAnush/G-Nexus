# 🎮 G-NEXUS | AI-Powered Gaming Hub

<div align="center">

**Your Central Repository for AI-Generated Games**

[![Made with Gemini](https://img.shields.io/badge/Made%20with-Gemini%203-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Games](https://img.shields.io/badge/Dynamic-Game%20Library-brightgreen?style=for-the-badge)](games/)

*A modern, curated hub for discovering and playing games developed by Gemini AI and other AI agents*

</div>

---

## 📖 About G-Nexus

**G-Nexus** is a dynamic gaming platform and repository designed to store, showcase, and provide easy access to all games developed by **Gemini 3** (Google DeepMind's advanced AI) and other AI-powered game development tools. The hub features a sleek, modern interface with automatic game detection, search functionality, and a beautiful bento-grid layout.

### 🌟 Key Features

- **🤖 AI-Powered Content**: All games are developed using AI assistance, primarily Gemini 3
- **🔍 Dynamic Game Detection**: Automatically scans and displays games from the `games/` directory
- **🎨 Modern UI/UX**: Beautiful bento-grid layout with glassmorphism and smooth animations
- **🌓 Theme Support**: Toggle between dark and light modes for optimal viewing comfort
- **🔎 Real-time Search**: Instantly filter games by title
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🚀 Zero Dependencies**: Pure HTML, CSS, and JavaScript - no frameworks required

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Basic web server (for local development) or GitHub Pages for hosting

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SelfAnush/G-Nexus.git
   cd G-Nexus
   ```

2. **Run a local server**
   
   Using Python:
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   
   Then open your browser to `http://localhost:8000`

3. **Or deploy to GitHub Pages**
   - Push to your GitHub repository
   - Enable GitHub Pages in repository settings
   - Your hub will be live at `https://yourusername.github.io/G-Nexus`

---

## 🎮 Adding New Games

### Game Structure

Each game should be placed in its own folder within the `games/` directory with the following structure:

```
games/
├── your-game-name/
│   ├── index.html        # Main game entry point (required)
│   ├── config.json       # Game metadata (required)
│   ├── thumbnail.png     # Game preview image (recommended)
│   ├── game.js           # Game logic
│   ├── game.css          # Game styles
│   └── ...               # Other game assets
```

### Configuration File

Create a `config.json` file in your game folder with the following format:

```json
{
  "title": "Your Game Title",
  "category": "Action",
  "size": "normal",
  "thumbnail": "thumbnail.png",
  "description": "A brief description of your game"
}
```

#### Configuration Options

| Property | Type | Required | Options | Description |
|----------|------|----------|---------|-------------|
| `title` | string | ✅ Yes | - | Display name of the game |
| `category` | string | ✅ Yes | `Racing`, `Action`, `Puzzle`, `Adventure`, `Simulation`, `Sports`, `Casual` | Game genre |
| `size` | string | ❌ No | `normal`, `wide`, `tall`, `large` | Grid tile size (default: `normal`) |
| `thumbnail` | string | ❌ No | - | Filename of preview image (default: `thumbnail.jpg`) |
| `description` | string | ❌ No | - | Short description for the game |

### Example: Adding a Game

1. Create a new folder in `games/`:
   ```bash
   mkdir games/my-awesome-game
   ```

2. Add your game files:
   ```bash
   games/my-awesome-game/
   ├── index.html
   ├── config.json
   ├── thumbnail.png
   └── game.js
   ```

3. Create `config.json`:
   ```json
   {
     "title": "My Awesome Game",
     "category": "Adventure",
     "size": "normal",
     "thumbnail": "thumbnail.png",
     "description": "An amazing adventure game built with AI"
   }
   ```

4. The game will automatically appear on the homepage! 🎉

---

## 🎨 Customization

### Themes

G-Nexus comes with built-in dark and light themes. Users can toggle between them using the theme switcher in the navigation bar.

### Category Colors

Categories are automatically color-coded in `script.js`:

```javascript
const colors = {
  'Racing': '#3b82f6',      // Blue
  'Action': '#f43f5e',      // Red/Pink
  'Puzzle': '#8b5cf6',      // Purple
  'Adventure': '#22c55e',   // Green
  'Simulation': '#84cc16',  // Lime
  'Sports': '#eab308',      // Yellow
  'Casual': '#06b6d4'       // Cyan
};
```

You can customize these colors by editing the `getCategoryColor()` function.

### Grid Sizes

Games can be displayed in different sizes:
- `normal`: Standard 1x1 tile
- `wide`: 2x1 tile (double width)
- `tall`: 1x2 tile (double height)
- `large`: 2x2 tile (quad size)

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic structure and markup |
| **CSS3** | Styling with CSS Grid, Flexbox, and custom properties |
| **JavaScript (ES6+)** | Dynamic game detection and interactivity |
| **Font Awesome** | Icons for UI elements |
| **Google Fonts** | Inter & Poppins typography |

---

## 📂 Project Structure

```
G-Nexus/
├── index.html              # Main homepage
├── styles.css              # Global styles and theme definitions
├── script.js               # Game detection and UI logic
├── README.md               # This file
├── games/                  # Game library directory
│   └── fighter-pummel/     # Example game
│       ├── index.html
│       ├── config.json
│       ├── thumbnail.png
│       ├── game.js
│       └── game.css
└── .gitattributes          # Git configuration
```

---

## 🎯 Roadmap

- [x] Dynamic game detection system
- [x] Search functionality
- [x] Theme switching (dark/light)
- [x] Responsive bento-grid layout
- [ ] Game rating system
- [ ] Game tags and advanced filtering
- [ ] Game collections/playlists
- [ ] Multiplayer game support
- [ ] Leaderboards and achievements
- [ ] Community features

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add Your AI-Generated Game**
   - Follow the game structure guidelines above
   - Ensure your `config.json` is properly formatted
   - Test locally before submitting

2. **Improve the Hub**
   - Submit bug reports
   - Suggest new features
   - Improve documentation
   - Enhance UI/UX

3. **Submit a Pull Request**
   ```bash
   git checkout -b feature/your-feature
   git commit -m "Add your feature"
   git push origin feature/your-feature
   ```

---

## 🎮 Featured Games

### 🥊 Fighter Pummel: ULTIMATE
**Category**: Action  
**Description**: Epic 3D fighting game featuring dynamic combat, special moves, and fruit & veggie weapons!

*More games coming soon...*

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google DeepMind** - For creating Gemini 3, the AI behind most games
- **Font Awesome** - For the beautiful icon library
- **Google Fonts** - For typography excellence
- All AI developers pushing the boundaries of creative AI

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/SelfAnush/G-Nexus/issues)
- **Discussions**: [Join the community](https://github.com/SelfAnush/G-Nexus/discussions)

---

<div align="center">

**Made with ❤️ and 🤖 AI**

*Showcasing the creative potential of AI in game development*

[![Star this repo](https://img.shields.io/github/stars/SelfAnush/G-Nexus?style=social)](https://github.com/SelfAnush/G-Nexus)

</div>
