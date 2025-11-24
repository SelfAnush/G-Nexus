// --- CONFIGURATION ---
const GAMES_FOLDER = 'games/';

// --- STATE ---
let gamesDB = [];
const grid = document.getElementById('gameGrid');
const searchInput = document.getElementById('searchInput');

// --- UTILS ---
function getCategoryColor(category) {
    const colors = {
        'Racing': '#3b82f6',   // Blue
        'Action': '#f43f5e',   // Red/Pink
        'Puzzle': '#8b5cf6',   // Purple
        'Adventure': '#22c55e', // Green
        'Simulation': '#84cc16', // Lime
        'Sports': '#eab308',   // Yellow
        'Casual': '#06b6d4'    // Cyan
    };
    return colors[category] || '#64748b';
}

// --- CORE LOGIC ---

// 1. Load games from game-index.json
async function detectGames() {
    try {
        console.log('Loading games from game-index.json...');
        const response = await fetch(`${GAMES_FOLDER}game-index.json`);

        if (!response.ok) {
            throw new Error('Cannot load game-index.json');
        }

        const gamesData = await response.json();

        // Transform the data to match our internal format
        const games = gamesData.map(gameData => ({
            id: gameData.folder,
            title: gameData.name,
            type: 'game',
            folder: gameData.folder,
            category: gameData.category || 'Casual',
            color: getCategoryColor(gameData.category || 'Casual'),
            size: gameData.size || 'normal',
            thumbnail: gameData.thumbnail || 'thumbnail.jpg',
            description: gameData.description || ''
        }));

        console.log(`Successfully loaded ${games.length} games from index.`);
        return games;

    } catch (e) {
        console.error('Failed to load games from index:', e);
        return [];
    }
}

// Helper function for title formatting (fallback)
function formatTitle(folderName) {
    return folderName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// 2. Initialize the App
async function initApp() {
    // Load Games
    const games = await detectGames();

    gamesDB = games;
    renderGrid(gamesDB);
}

// 3. Render Function
function renderGrid(data) {
    grid.innerHTML = '';

    data.forEach(item => {
        const tile = document.createElement('div');
        tile.className = `tile ${item.size}`;

        // Game Tile - thumbnail already has the full path from game-index.json
        const localThumb = item.thumbnail;
        // Fallback if local thumb fails (using onerror)
        const fallbackThumb = `https://placehold.co/600x600/${item.color.replace('#', '')}/ffffff?text=${encodeURIComponent(item.title)}`;

        tile.innerHTML = `
            <img src="${localThumb}" class="game-img" onerror="this.src='${fallbackThumb}'" alt="${item.title}">
            <div class="tile-overlay">
                <div class="tile-title">${item.title}</div>
                <div class="tile-meta">
                    <span>${item.category}</span>
                </div>
            </div>
            <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
        `;

        tile.onclick = () => {
            window.location.href = `${GAMES_FOLDER}${item.folder}/index.html`;
        };

        grid.appendChild(tile);
    });
}

// Event Listeners
let isDark = true;
const themeBtn = document.getElementById('themeToggle');
themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeBtn.innerHTML = isDark
        ? '<i class="fa-regular fa-moon"></i>'
        : '<i class="fa-regular fa-sun"></i>';
});

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const results = gamesDB.filter(item => item.title.toLowerCase().includes(term));
    renderGrid(results);
});

// Start
initApp();
