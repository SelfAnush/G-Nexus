class SoundFX {
            constructor() {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }

            playClick() {
                if(this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.05);
            }

            playMove() {
                if(this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.1);
            }

            playGlitch() {
                if(this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
                osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
            }

            playWarp() {
                if(this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.3);
            }

            playWin() {
                if(this.ctx.state === 'suspended') this.ctx.resume();
                const notes = [440, 554.37, 659.25];
                let time = this.ctx.currentTime;
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.05, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
                    osc.start(time);
                    osc.stop(time + 0.5);
                    time += 0.1; 
                });
            }
            
            playLose() {
                if(this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.8);
                gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.8);
            }
        }
        
        const sfx = new SoundFX();

        class GridBackground {
            constructor() {
                this.canvas = document.getElementById('bgCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.pixels = [];
                this.gridSize = 40;
                this.resize();
                window.addEventListener('resize', () => this.resize());
                for(let i = 0; i < 40; i++) this.pixels.push(this.createPixel());
                this.animate();
            }
            resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
            createPixel() {
                const col = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
                const row = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
                return {
                    x: col * this.gridSize, y: row * this.gridSize,
                    targetX: col * this.gridSize, targetY: row * this.gridSize,
                    speed: 1 + Math.random() * 2, color: Math.random() > 0.5 ? '#ffffff' : '#6b7280',
                    alpha: Math.random() * 0.3 + 0.1, size: 2 + Math.random() * 2,
                    direction: Math.floor(Math.random() * 4), wait: 0
                };
            }
            updatePixel(p) {
                if(p.wait > 0) { p.wait--; return; }
                const atTarget = Math.abs(p.x - p.targetX) < p.speed && Math.abs(p.y - p.targetY) < p.speed;
                if(atTarget) {
                    p.x = p.targetX; p.y = p.targetY;
                    if(Math.random() < 0.1) { p.wait = 20 + Math.random() * 30; return; }
                    if(Math.random() < 0.3) { p.direction = Math.floor(Math.random() * 4); }
                    switch(p.direction) {
                        case 0: p.targetY -= this.gridSize; break;
                        case 1: p.targetX += this.gridSize; break;
                        case 2: p.targetY += this.gridSize; break;
                        case 3: p.targetX -= this.gridSize; break;
                    }
                    if(p.targetX < 0) { p.x = this.canvas.width; p.targetX = p.x - this.gridSize; }
                    if(p.targetX > this.canvas.width) { p.x = 0; p.targetX = this.gridSize; }
                    if(p.targetY < 0) { p.y = this.canvas.height; p.targetY = p.y - this.gridSize; }
                    if(p.targetY > this.canvas.height) { p.y = 0; p.targetY = this.gridSize; }
                } else {
                    if(p.targetX > p.x) p.x += p.speed; else if(p.targetX < p.x) p.x -= p.speed;
                    if(p.targetY > p.y) p.y += p.speed; else if(p.targetY < p.y) p.y -= p.speed;
                }
            }
            animate() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                for(let x = 0; x <= this.canvas.width; x += this.gridSize) { this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); }
                for(let y = 0; y <= this.canvas.height; y += this.gridSize) { this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); }
                this.ctx.stroke();
                this.pixels.forEach(p => {
                    this.updatePixel(p);
                    this.ctx.globalAlpha = p.alpha;
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
                    this.ctx.globalAlpha = 1;
                });
                requestAnimationFrame(() => this.animate());
            }
        }

        class MazeGame {
            constructor(canvasId, stage, onWin, onLose) {
                this.canvas = document.getElementById(canvasId);
                this.ctx = this.canvas.getContext('2d');
                this.stage = stage;
                this.onWin = onWin;
                this.onLose = onLose;
                this.running = false;
                this.timeDisplay = document.getElementById('timeDisplay');
                
                let config;
                if (stage === 'rnd') {
                     let size = Math.floor(Math.random() * (45 - 20) + 20);
                     if (size % 2 === 0) size++; 
                     const light = Math.floor(Math.random() * (100 - 40) + 40); 
                     const time = Math.floor(size * 3);
                     config = { cols: size, rows: size, lightRadius: light, wallColor: '#475569', timeLimit: time };
                } else {
                    const configs = {
                        1: { cols: 25, rows: 25, lightRadius: 75, wallColor: '#64748b', timeLimit: 60 }, 
                        2: { cols: 35, rows: 35, lightRadius: 50, wallColor: '#475569', timeLimit: 90 }, 
                        3: { cols: 45, rows: 45, lightRadius: 40, wallColor: '#334155', timeLimit: 120 } 
                    };
                    config = configs[stage];
                }
                
                this.config = config;
                this.baseLightRadius = config.lightRadius;
                this.grid = [];
                this.player = { x: 1, y: 1 };
                
                // Time Limit
                this.timeLeft = this.config.timeLimit;
                this.lastFrameTime = performance.now();
                
                // Random Stage Mechanics
                this.goalFleeCount = 0;
                
                // Debuff System (Simplified)
                this.debuffs = ['SLOW MOVEMENT', 'REVERSE CONTROLS', 'PURE DARKNESS', 'MAZE FLIP'];
                this.activeDebuff = null;
                this.lastDebuff = null;
                this.debuffDuration = 0;
                // Initial delay 20s
                this.nextDebuffTime = performance.now() + 20000;
                
                this.moveDelay = 0;
                this.lastMoveTime = 0;

                this.animX = 1; 
                this.animY = 1;
                
                this.resize();
                this.generateMaze();
                this.placeRandomGoal();
                
                this.handleInput = this.handleInput.bind(this);
                window.addEventListener('keydown', this.handleInput);
                
                this.touchStartX = 0;
                this.touchStartY = 0;
                this.handleTouchStart = this.handleTouchStart.bind(this);
                this.handleTouchEnd = this.handleTouchEnd.bind(this);
                window.addEventListener('touchstart', this.handleTouchStart, {passive: false});
                window.addEventListener('touchend', this.handleTouchEnd, {passive: false});

                this.running = true;
                this.loop();
            }

            resize() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                const maxCellW = (this.canvas.width - 40) / this.config.cols;
                const maxCellH = (this.canvas.height - 40) / this.config.rows;
                this.cellSize = Math.floor(Math.max(Math.min(maxCellW, maxCellH, 50), 8)); 
                this.offsetX = (this.canvas.width - (this.config.cols * this.cellSize)) / 2;
                this.offsetY = (this.canvas.height - (this.config.rows * this.cellSize)) / 2;
            }

            generateMaze() {
                for(let y = 0; y < this.config.rows; y++) {
                    const row = [];
                    for(let x = 0; x < this.config.cols; x++) row.push(1);
                    this.grid.push(row);
                }
                const stack = [];
                const startX = 1; const startY = 1;
                this.grid[startY][startX] = 0;
                stack.push({x: startX, y: startY});

                while(stack.length > 0) {
                    const current = stack[stack.length - 1];
                    const neighbors = [];
                    const dirs = [{dx: 0, dy: -2}, {dx: 2, dy: 0}, {dx: 0, dy: 2}, {dx: -2, dy: 0}];
                    for(const d of dirs) {
                        const nx = current.x + d.dx; const ny = current.y + d.dy;
                        if(nx > 0 && nx < this.config.cols - 1 && ny > 0 && ny < this.config.rows - 1 && this.grid[ny][nx] === 1) {
                            neighbors.push({x: nx, y: ny, dx: d.dx / 2, dy: d.dy / 2});
                        }
                    }
                    if(neighbors.length > 0) {
                        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                        this.grid[chosen.y][chosen.x] = 0;
                        this.grid[current.y + chosen.dy][current.x + chosen.dx] = 0;
                        stack.push({x: chosen.x, y: chosen.y});
                    } else { stack.pop(); }
                }
            }

            placeRandomGoal() {
                const candidates = [];
                const minDistance = Math.min(this.config.cols, this.config.rows) / 1.5;
                for(let y = 0; y < this.config.rows; y++) {
                    for(let x = 0; x < this.config.cols; x++) {
                        if(this.grid[y][x] === 0 && (x !== 1 || y !== 1)) {
                            const dist = Math.sqrt(Math.pow(x - 1, 2) + Math.pow(y - 1, 2));
                            if (dist > minDistance) candidates.push({x, y});
                        }
                    }
                }
                if(candidates.length > 0) {
                    const choice = candidates[Math.floor(Math.random() * candidates.length)];
                    this.goal = { x: choice.x, y: choice.y };
                } else {
                    this.goal = { x: this.config.cols - 2, y: this.config.rows - 2 };
                    this.grid[this.goal.y][this.goal.x] = 0;
                }
            }
            
            triggerGoalFlee() {
                if (this.goalFleeCount >= 3) return;
                
                const candidates = [];
                for(let y = 0; y < this.config.rows; y++) {
                    for(let x = 0; x < this.config.cols; x++) {
                        if(this.grid[y][x] === 0) {
                             const dist = Math.sqrt(Math.pow(x - this.player.x, 2) + Math.pow(y - this.player.y, 2));
                             if (dist > 8 && dist < 15) { 
                                 candidates.push({x, y});
                             }
                        }
                    }
                }
                
                if(candidates.length > 0) {
                    const choice = candidates[Math.floor(Math.random() * candidates.length)];
                    this.goal = { x: choice.x, y: choice.y };
                    this.goalFleeCount++;
                    sfx.playWarp();
                    
                    const alert = document.getElementById('goalFleeAlert');
                    alert.style.display = 'block';
                    setTimeout(() => alert.style.display = 'none', 2000);
                }
            }

            updateDebuffs() {
                const now = performance.now();

                // Start Debuff
                if (!this.activeDebuff && now > this.nextDebuffTime) {
                    let newDebuff;
                    let attempts = 0;
                    do {
                        newDebuff = this.debuffs[Math.floor(Math.random() * this.debuffs.length)];
                        attempts++;
                    } while (newDebuff === this.lastDebuff && attempts < 5);
                    
                    this.activeDebuff = newDebuff;
                    this.lastDebuff = newDebuff;
                    
                    const duration = 10000 + Math.random() * 5000;
                    this.debuffDuration = now + duration;
                    // Cooldown: 30s gap AFTER debuff ends
                    this.nextDebuffTime = this.debuffDuration + 30000; 
                    
                    const ui = document.getElementById('debuffAlert');
                    ui.style.display = 'flex';
                    document.getElementById('debuffName').innerText = this.activeDebuff;
                    sfx.playGlitch();
                    
                    if (this.activeDebuff === 'PURE DARKNESS') {
                        this.config.lightRadius = 30; 
                    }
                }

                // End Debuff
                if (this.activeDebuff && now > this.debuffDuration) {
                    this.activeDebuff = null;
                    document.getElementById('debuffAlert').style.display = 'none';
                    this.config.lightRadius = this.baseLightRadius;
                }
            }

            handleInput(e) {
                if(!this.running) return;
                
                if (this.activeDebuff === 'SLOW MOVEMENT') {
                    const now = performance.now();
                    if (now - this.lastMoveTime < 400) return; 
                    this.lastMoveTime = now;
                }

                let dx = 0; let dy = 0;
                switch(e.key.toLowerCase()) {
                    case 'w': case 'arrowup': dy = -1; break;
                    case 's': case 'arrowdown': dy = 1; break;
                    case 'a': case 'arrowleft': dx = -1; break;
                    case 'd': case 'arrowright': dx = 1; break;
                }

                if (this.activeDebuff === 'REVERSE CONTROLS') {
                    dx = -dx;
                    dy = -dy;
                }

                this.movePlayer(dx, dy);
            }

            handleTouchStart(e) {
                this.touchStartX = e.changedTouches[0].screenX;
                this.touchStartY = e.changedTouches[0].screenY;
            }

            handleTouchEnd(e) {
                if(!this.running) return;
                const endX = e.changedTouches[0].screenX;
                const endY = e.changedTouches[0].screenY;
                const diffX = endX - this.touchStartX;
                const diffY = endY - this.touchStartY;

                let dx = 0; let dy = 0;
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (Math.abs(diffX) > 30) dx = diffX > 0 ? 1 : -1;
                } else {
                    if (Math.abs(diffY) > 30) dy = diffY > 0 ? 1 : -1;
                }

                if (this.activeDebuff === 'REVERSE CONTROLS') { dx = -dx; dy = -dy; }
                if (this.activeDebuff === 'SLOW MOVEMENT') {
                     const now = performance.now();
                     if (now - this.lastMoveTime < 400) return;
                     this.lastMoveTime = now;
                }

                if (dx !== 0 || dy !== 0) this.movePlayer(dx, dy);
            }

            movePlayer(dx, dy) {
                const newX = this.player.x + dx;
                const newY = this.player.y + dy;
                // Check Bounds and Wall
                if(this.grid[newY] && this.grid[newY][newX] === 0) {
                    this.player.x = newX;
                    this.player.y = newY;
                    sfx.playMove();
                    
                    if (this.stage === 'rnd' && this.goalFleeCount < 3) {
                         const dist = Math.sqrt(Math.pow(this.player.x - this.goal.x, 2) + Math.pow(this.player.y - this.goal.y, 2));
                         if (dist < 4) {
                             this.triggerGoalFlee();
                         }
                    }

                    if(this.player.x === this.goal.x && this.player.y === this.goal.y) {
                        this.running = false;
                        sfx.playWin();
                        setTimeout(this.onWin, 500);
                    }
                    const instructions = document.getElementById('instructionOverlay');
                    if(instructions && instructions.style.opacity !== '0') {
                        instructions.style.transition = 'opacity 1s';
                        instructions.style.opacity = '0';
                    }
                }
            }
            
            loop() {
                if(!this.running && this.activeDebuff === null) return;
                
                const now = performance.now();
                const dt = (now - this.lastFrameTime) / 1000;
                this.lastFrameTime = now;
                
                // Update Time
                if(this.running) {
                    this.timeLeft -= dt;
                    if(this.timeLeft <= 0) {
                        this.timeLeft = 0;
                        this.running = false;
                        sfx.playLose();
                        this.onLose();
                    }
                    // Format Time
                    const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
                    const s = Math.floor(this.timeLeft % 60).toString().padStart(2, '0');
                    this.timeDisplay.innerText = `${m}:${s}`;
                    // Color Logic
                    if (this.timeLeft < 10) this.timeDisplay.classList.add('text-red-500');
                    else this.timeDisplay.classList.remove('text-red-500');
                }
                
                this.updateDebuffs();

                // Lerp
                this.animX += (this.player.x - this.animX) * 0.2;
                this.animY += (this.player.y - this.animY) * 0.2;
                
                this.draw();
                
                if (this.running || Math.abs(this.animX - this.player.x) > 0.01) {
                    requestAnimationFrame(() => this.loop());
                }
            }

            draw() {
                if(!this.ctx) return;
                const w = this.canvas.width;
                const h = this.canvas.height;

                this.ctx.save(); 
                this.ctx.clearRect(0, 0, w, h);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, w, h);

                if (this.activeDebuff === 'MAZE FLIP') {
                    this.ctx.translate(w/2, h/2);
                    this.ctx.rotate(Math.PI);
                    this.ctx.translate(-w/2, -h/2);
                }
                
                const px = this.offsetX + (this.animX * this.cellSize) + (this.cellSize/2);
                const py = this.offsetY + (this.animY * this.cellSize) + (this.cellSize/2);
                
                let radius = this.config.lightRadius;

                // Layers
                const viewRangeCells = Math.ceil(radius / this.cellSize) + 2;
                const minRow = Math.max(0, this.player.y - viewRangeCells);
                const maxRow = Math.min(this.config.rows, this.player.y + viewRangeCells);
                const minCol = Math.max(0, this.player.x - viewRangeCells);
                const maxCol = Math.min(this.config.cols, this.player.x + viewRangeCells);

                // Walls
                this.ctx.fillStyle = this.config.wallColor;
                for(let y = minRow; y < maxRow; y++) {
                    for(let x = minCol; x < maxCol; x++) {
                        if(this.grid[y][x] === 1) {
                            this.ctx.fillRect(
                                this.offsetX + x * this.cellSize + 1,
                                this.offsetY + y * this.cellSize + 1,
                                this.cellSize - 2, this.cellSize - 2
                            );
                        }
                    }
                }
                
                // Goal
                const gx = this.offsetX + (this.goal.x * this.cellSize) + (this.cellSize/2);
                const gy = this.offsetY + (this.goal.y * this.cellSize) + (this.cellSize/2);
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#fff';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(gx, gy, this.cellSize/3, 0, Math.PI*2);
                this.ctx.fill();

                // Mask
                this.ctx.restore(); 
                
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'source-over'; 
                
                const grad = this.ctx.createRadialGradient(px, py, this.cellSize/2, px, py, radius);
                grad.addColorStop(0, 'rgba(0,0,0,0.2)'); 
                grad.addColorStop(0.8, 'rgba(0,0,0,0.95)');
                grad.addColorStop(1, 'rgba(0,0,0,1)');

                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.rect(-w*2, -h*2, w*4, h*4);
                this.ctx.arc(px, py, radius, 0, Math.PI * 2, true);
                this.ctx.fill();

                this.ctx.restore(); 

                // Player
                this.ctx.save();
                 if (this.activeDebuff === 'MAZE FLIP') {
                    this.ctx.translate(w/2, h/2);
                    this.ctx.rotate(Math.PI);
                    this.ctx.translate(-w/2, -h/2);
                }
                
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#fff';
                // SLOW MOVEMENT VISUAL: Yellow Player
                this.ctx.fillStyle = (this.activeDebuff === 'SLOW MOVEMENT') ? '#fbbf24' : '#fff';
                this.ctx.beginPath();
                this.ctx.arc(px, py, this.cellSize/4, 0, Math.PI*2);
                this.ctx.fill();

                this.ctx.restore();
            }

            destroy() {
                window.removeEventListener('keydown', this.handleInput);
                window.removeEventListener('touchstart', this.handleTouchStart);
                window.removeEventListener('touchend', this.handleTouchEnd);
                this.running = false;
            }
        }

        const app = {
            currentGame: null,
            init: function() {
                this.particles = new GridBackground();
                this.showHome();
            },
            showHome: function() {
                if(this.currentGame) { this.currentGame.destroy(); this.currentGame = null; }
                this.setActiveScreen('homeScreen');
                this.toggleGameCanvas(false);
            },
            showStageSelect: function() {
                this.setActiveScreen('stageScreen');
                this.toggleGameCanvas(false);
                if(this.currentGame) { this.currentGame.destroy(); this.currentGame = null; }
            },
            startRandomGame: function() {
                this.setActiveScreen('loadingScreen');
                document.getElementById('loadingScreen').classList.add('loading-active');
                const msgs = ["GENERATING TOPOLOGY...", "SCRAMBLING LIGHT RAYS...", "INJECTING FOG...", "CALCULATING NAV MESH..."];
                let step = 0;
                const txt = document.getElementById('loadingText');
                const interval = setInterval(() => { step++; if(step < msgs.length) txt.innerText = msgs[step]; }, 400);
                setTimeout(() => {
                    clearInterval(interval);
                    document.getElementById('loadingScreen').classList.remove('loading-active');
                    this.startGame('rnd');
                }, 2000);
            },
            startGame: function(stage) {
                this.setActiveScreen('gameHUD');
                this.toggleGameCanvas(true);
                document.getElementById('instructionOverlay').style.opacity = '1';
                document.getElementById('victoryModal').classList.add('hidden');
                document.getElementById('gameOverModal').classList.add('hidden');
                document.getElementById('debuffAlert').style.display = 'none'; // Reset HUD
                
                const titles = {1: 'SECTOR ALPHA', 2: 'SECTOR BETA', 3: 'SECTOR OMEGA', 'rnd': 'SECTOR RND'};
                document.getElementById('levelDisplay').innerText = titles[stage] || 'UNKNOWN';
                this.currentGame = new MazeGame('gameCanvas', stage, 
                    () => { this.handleWin(); },
                    () => { this.handleGameOver(); }
                );
            },
            stopGame: function() {
                if(this.currentGame) { this.currentGame.destroy(); this.currentGame = null; }
                this.showStageSelect();
            },
            handleWin: function() {
                document.getElementById('victoryModal').classList.remove('hidden');
            },
            handleGameOver: function() {
                document.getElementById('gameOverModal').classList.remove('hidden');
            },
            setActiveScreen: function(id) {
                document.querySelectorAll('.screen').forEach(el => {
                    el.classList.remove('active');
                    if(el.id === id) { el.style.display = 'flex'; setTimeout(() => el.classList.add('active'), 50); }
                    else { el.classList.remove('active'); setTimeout(() => el.style.display = 'none', 500); }
                });
                if(id === 'gameHUD') {
                    const hud = document.getElementById('gameHUD');
                    hud.style.display = 'flex'; setTimeout(() => hud.classList.add('active'), 50);
                }
            },
            toggleGameCanvas: function(show) {
                const cvs = document.getElementById('gameCanvas');
                cvs.style.display = show ? 'block' : 'none';
            }
        };

        window.onload = () => app.init();