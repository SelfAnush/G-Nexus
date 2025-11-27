// --- CONFIGURATION ---
const GAMES_FOLDER = 'games/';

// --- STATE ---
let gamesDB = [];

const grid = document.getElementById('gameGrid');
const searchInput = document.getElementById('searchInput');
const gameCountEl = document.getElementById('gameCount');
const emptyState = document.getElementById('emptyState');

// --- UTILS ---
function getCategoryColor(category) {
    const colors = {
        'Racing': '#3b82f6',
        'Action': '#f43f5e',
        'Puzzle': '#8b5cf6',
        'Adventure': '#22c55e',
        'Simulation': '#84cc16',
        'Sports': '#eab308',
        'Casual': '#06b6d4'
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

        const games = gamesData.map(gameData => ({
            id: gameData.folder,
            title: gameData.name,
            type: 'game',
            folder: gameData.folder,
            category: gameData.category || 'Casual',
            color: getCategoryColor(gameData.category || 'Casual'),
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
    const games = await detectGames();
    gamesDB = games;
    renderGrid(gamesDB);
    setupKeyboardShortcut();
}

// 3. Filter games by search
function filterGames() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filtered = gamesDB;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(game => 
            game.title.toLowerCase().includes(searchTerm) ||
            game.category.toLowerCase().includes(searchTerm)
        );
    }
    
    renderGrid(filtered);
}

// 4. Render Function
function renderGrid(data) {
    grid.innerHTML = '';
    
    // Update game count
    gameCountEl.textContent = `${data.length} game${data.length !== 1 ? 's' : ''}`;
    
    // Show/hide empty state
    if (data.length === 0) {
        emptyState.classList.add('visible');
        grid.style.display = 'none';
    } else {
        emptyState.classList.remove('visible');
        grid.style.display = 'grid';
    }

    data.forEach((item, index) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.animationDelay = `${index * 0.03}s`;

        const localThumb = item.thumbnail;
        const fallbackThumb = `https://placehold.co/300x400/${item.color.replace('#', '')}/ffffff?text=${encodeURIComponent(item.title)}`;

        tile.innerHTML = `
            <img src="${localThumb}" class="game-img" onerror="this.src='${fallbackThumb}'" alt="${item.title}" loading="lazy">
            <div class="tile-overlay">
                <div class="tile-title">${item.title}</div>
                <div class="tile-meta">${item.category}</div>
            </div>
            <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
        `;

        tile.onclick = () => {
            window.location.href = `${GAMES_FOLDER}${item.folder}/index.html`;
        };

        grid.appendChild(tile);
    });
}

// 5. Keyboard shortcut for search
function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
        // Press '/' to focus search
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        // Press 'Escape' to clear and blur search
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            searchInput.blur();
            filterGames();
        }
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

searchInput.addEventListener('input', () => {
    filterGames();
});

// Start
initApp();