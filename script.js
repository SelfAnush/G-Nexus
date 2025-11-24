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

// 1. Detect games by scanning for config.json files
async function detectGames() {
    try {
        console.log('Scanning for games with config.json...');
        const response = await fetch(GAMES_FOLDER);

        if (!response.ok) {
            throw new Error('Cannot access games directory');
        }

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));

        const detectedGames = [];

        for (const link of links) {
            const href = link.getAttribute('href');
            if (href === '../' || href === '/' || href.startsWith('?')) continue;

            let folderName = href.replace(/\/$/, '');
            folderName = folderName.replace(/^\//, '').replace(/^games\//, '');

            if (folderName.includes('.') || !folderName || folderName === 'games' || folderName === '..') continue;

            console.log('Checking folder:', folderName);

            // Try to load config.json for this game
            try {
                const configResponse = await fetch(`${GAMES_FOLDER}${folderName}/config.json`);
                if (!configResponse.ok) {
                    console.warn(`Skipping ${folderName}: no config.json found`);
                    continue;
                }

                const config = await configResponse.json();

                const game = {
                    id: folderName,
                    title: config.title || formatTitle(folderName),
                    type: 'game',
                    folder: folderName,
                    category: config.category || 'Casual',
                    color: getCategoryColor(config.category || 'Casual'),
                    size: config.size || 'normal',
                    thumbnail: config.thumbnail || 'thumbnail.jpg',
                    description: config.description || ''
                };

                detectedGames.push(game);
                console.log(`Loaded game: ${game.title}`);
            } catch (e) {
                console.warn(`Error loading config for ${folderName}:`, e);
                continue;
            }
        }

        if (detectedGames.length > 0) {
            console.log(`Successfully detected ${detectedGames.length} games.`);
            return detectedGames;
        } else {
            console.warn('No games found with valid config.json files');
            return [];
        }

    } catch (e) {
        console.error('Failed to detect games:', e);
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

        // Game Tile
        const localThumb = `${GAMES_FOLDER}${item.folder}/${item.thumbnail}`;
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
