// --- AUDIO ENGINE (Synthesizer) ---
const AudioSys = {
    ctx: null,
    enabled: false,
    init: function () {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.enabled = true;
    },
    playTone: function (freq, type, dur, vol = 0.1) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.1, this.ctx.currentTime + dur);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    },
    playNoise: function (dur, vol = 0.2) {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    },
    sfx: {
        hit: () => { AudioSys.playTone(150, 'sawtooth', 0.1, 0.2); AudioSys.playNoise(0.1, 0.3); },
        block: () => AudioSys.playTone(800, 'square', 0.05, 0.1),
        swing: () => AudioSys.playTone(400, 'triangle', 0.15, 0.05),
        jump: () => AudioSys.playTone(300, 'sine', 0.2, 0.1),
        special: () => { AudioSys.playTone(200, 'sawtooth', 0.5, 0.3); AudioSys.playTone(100, 'square', 0.5, 0.3); },
        burst: () => { AudioSys.playTone(100, 'sine', 0.3, 0.4); AudioSys.playNoise(0.2, 0.3); },
        ko: () => { AudioSys.playTone(50, 'sawtooth', 2.0, 0.5); },
        splat: () => { AudioSys.playNoise(0.2, 0.5); AudioSys.playTone(60, 'square', 0.2, 0.4); }
    }
};

// --- GAME CONFIG ---
const CONSTANTS = {
    GRAVITY: 0.025,
    FRICTION: 0.8,
    SPEED: 0.35,
    JUMP: 0.65,
    ARENA_R: 16
};

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12); // Deep Tech Dark
scene.fog = new THREE.FogExp2(0x0a0a12, 0.03);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Initial camera position for menu bg
camera.position.set(0, 6, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
document.body.appendChild(renderer.domElement);

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xff0055, 0x00ccff, 0.4); // Cyberpunk ambient
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- ENVIRONMENT (Cel-Shaded Look) ---

// Floor
const floorGeo = new THREE.CylinderGeometry(CONSTANTS.ARENA_R, CONSTANTS.ARENA_R, 1, 32);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.5 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.y = -0.5;
floor.receiveShadow = true;
scene.add(floor);

// Grid Decal - Cyan
const gridHelper = new THREE.PolarGridHelper(CONSTANTS.ARENA_R, 16, 8, 64, 0x00c6ff, 0x00c6ff);
gridHelper.position.y = 0.02;
gridHelper.material.opacity = 0.3;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// Sakura Trees (Low Poly + Emissive) - Adjusted for Sci-Fi vibe
function createTree(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 3, 5),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    g.add(trunk);

    // Neon Pink Leaves
    const leafMat = new THREE.MeshToonMaterial({ color: 0xff0055, emissive: 0x330011 });
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 0), leafMat);
    leaves.position.y = 3.5;
    leaves.castShadow = true;
    g.add(leaves);

    scene.add(g);
}

createTree(-12, -10, 1.2);
createTree(12, -8, 1.4);
createTree(0, -15, 1.0);

// Torii Gate - Cyber style
const toriiGroup = new THREE.Group();
const redMat = new THREE.MeshToonMaterial({ color: 0xff3333, emissive: 0x330000 });
const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), redMat); pillar1.position.set(-4, 4, 0);
const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), redMat); pillar2.position.set(4, 4, 0);
const top1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 1.2), redMat); top1.position.set(0, 7, 0);
toriiGroup.add(pillar1, pillar2, top1);
toriiGroup.position.set(0, 0, 14);
scene.add(toriiGroup);

// --- UTILS: CEL-SHADING & 2D EFFECTS ---
function createOutline(mesh, thickness = 0.05, color = 0x000000) {
    const outlineMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.BackSide });
    const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
    outlineMesh.scale.multiplyScalar(1 + thickness);
    mesh.add(outlineMesh);
    return outlineMesh;
}

// 2D Impact Sprite Generation
function createImpactTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 256);

    ctx.translate(128, 128);
    ctx.fillStyle = '#00c6ff';
    for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, -110);
        ctx.lineTo(-15, -110);
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}
const impactTexture = createImpactTexture();
const impactMat = new THREE.SpriteMaterial({ map: impactTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

// --- GAME SYSTEM: PARTICLES ---
const particles = [];
const particleGeo = new THREE.BoxGeometry(1, 1, 1);
function spawnImpact(pos, color, scale = 1) {
    const count = 8 * scale;
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(particleGeo, new THREE.MeshBasicMaterial({ color: color }));
        mesh.position.copy(pos);
        mesh.scale.setScalar(0.2 * scale);
        mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);

        scene.add(mesh);
        particles.push({
            mesh: mesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.8, (Math.random() - 0.5) * 0.8),
            life: 1.0
        });
    }
}

// --- CLASS: FIGHTER ---
class Fighter {
    constructor(id, color, type, isAI, name) {
        this.id = id; // 1 or 2
        this.color = color;
        this.isAI = isAI;
        this.name = name || `Player ${id}`;

        // Stats
        this.hp = 100;
        this.sp = 0; // Special meter (0-100)
        this.dead = false;
        this.combo = 0;
        this.comboTimer = 0;

        // Physics
        this.pos = new THREE.Vector3(id === 1 ? -5 : 5, 0, 0);
        this.vel = new THREE.Vector3();
        this.facing = id === 1 ? 1 : -1;
        this.isGrounded = false;

        // States
        this.state = 'IDLE'; // IDLE, RUN, ATTACK, BLOCK, HIT, SPECIAL, BURST
        this.timer = 0;

        // 3D Model
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.pos);
        scene.add(this.mesh);

        const mat = new THREE.MeshToonMaterial({ color: color });

        // Construct Body
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        this.body = new THREE.Mesh(bodyGeo, mat);
        this.body.position.y = 1.5;
        this.body.castShadow = true;
        createOutline(this.body, 0.05);
        this.mesh.add(this.body);

        // Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.1), eyeMat);
        eyeL.position.set(0.2, 0.5, 0.45);
        eyeL.rotation.z = 0.2;
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.1), eyeMat);
        eyeR.position.set(-0.2, 0.5, 0.45);
        eyeR.rotation.z = -0.2;
        this.body.add(eyeL); this.body.add(eyeR);

        // Weapon Group
        this.arm = new THREE.Group();
        this.arm.position.set(0.6, 0.2, 0);
        this.body.add(this.arm);

        this.weapon = new THREE.Group();
        if (type === 'banana') {
            const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 2.5, 6), new THREE.MeshToonMaterial({ color: 0xffd700 }));
            blade.rotation.z = -1;
            blade.position.set(0.5, 0.5, 0);
            createOutline(blade, 0.08, 0x553300);
            this.weapon.add(blade);
        } else {
            const club = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 8), new THREE.MeshToonMaterial({ color: 0xe67e22 }));
            club.rotation.z = -1.5;
            club.position.set(1, 0, 0);
            createOutline(club, 0.08, 0x552200);
            this.weapon.add(club);
        }
        this.arm.add(this.weapon);

        // 2D Ultimate Effect
        this.ultSprite = new THREE.Sprite(impactMat);
        this.ultSprite.scale.set(0, 0, 0);
        this.ultSprite.position.y = 2.5;
        this.mesh.add(this.ultSprite);

        // Controls
        this.keys = id === 1 ?
            { u: 'w', d: 's', l: 'a', r: 'd', atk: 'MOUSE_LEFT', blk: 'MOUSE_RIGHT', sp: 'e', burst: '1' } :
            { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight', atk: 'l', blk: 'k', sp: 'i', burst: 'm' };

        this.aiTimer = 0;
    }

    update(input, enemy) {
        if (this.dead) return;

        let ctrl = input;
        if (this.isAI) {
            ctrl = this.runAI(enemy);
        }

        // -- Combo Timer --
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                document.getElementById(`p${this.id}-combo`).style.opacity = 0;
            }
        }

        // -- State Machine --
        if (this.state === 'HIT') {
            this.timer--;
            if (this.timer <= 0) this.state = 'IDLE';
        }
        else if (this.state === 'ATTACK' || this.state === 'BURST') {
            this.timer--;
            if (this.timer <= 0) this.state = 'IDLE';
        }
        else if (this.state === 'SPECIAL') {
            this.timer--;
            const s = 8 + Math.sin(Date.now() * 0.05) * 2;
            this.ultSprite.scale.set(s, s, 1);
            this.ultSprite.rotation.z += 0.1;

            if (this.timer % 5 === 0) this.checkHit(enemy, 20, 2.5);

            if (this.timer <= 0) {
                this.state = 'IDLE';
                this.ultSprite.scale.set(0, 0, 0);
            }
        }
        else {
            // Actions
            let move = false;

            if (ctrl[this.keys.sp] && this.sp >= 100) {
                this.startAttack(enemy, 'SPECIAL');
            }
            else if (ctrl[this.keys.burst]) {
                this.startAttack(enemy, 'BURST');
            }
            else if (ctrl[this.keys.blk]) {
                this.state = 'BLOCK';
                this.vel.x *= 0.5;
                this.vel.z *= 0.5;
            }
            else {
                if (ctrl[this.keys.l]) { this.vel.x -= CONSTANTS.SPEED * 0.1; move = true; }
                if (ctrl[this.keys.r]) { this.vel.x += CONSTANTS.SPEED * 0.1; move = true; }
                if (ctrl[this.keys.u] && this.pos.z > -10) { this.vel.z -= CONSTANTS.SPEED * 0.1; move = true; }
                if (ctrl[this.keys.d] && this.pos.z < 10) { this.vel.z += CONSTANTS.SPEED * 0.1; move = true; }

                this.state = move ? 'RUN' : 'IDLE';

                if (ctrl[this.keys.atk]) this.startAttack(enemy, 'NORMAL');
            }

            // Face Enemy
            const dx = enemy.pos.x - this.pos.x;
            this.facing = dx > 0 ? 1 : -1;
            const targetRot = this.facing === 1 ? 0 : Math.PI;
            this.mesh.rotation.y += (targetRot - this.mesh.rotation.y) * 0.2;
        }

        // -- Physics Update --
        this.vel.x *= CONSTANTS.FRICTION;
        this.vel.z *= CONSTANTS.FRICTION;
        this.pos.add(this.vel);

        // Bounds
        const dist = Math.sqrt(this.pos.x ** 2 + this.pos.z ** 2);
        if (dist > CONSTANTS.ARENA_R) {
            const angle = Math.atan2(this.pos.z, this.pos.x);
            this.pos.x = Math.cos(angle) * CONSTANTS.ARENA_R;
            this.pos.z = Math.sin(angle) * CONSTANTS.ARENA_R;
        }

        this.mesh.position.copy(this.pos);
        this.animateModel();
    }

    animateModel() {
        const t = Date.now() * 0.01;

        if (this.state === 'IDLE') {
            this.body.position.y = 1.5 + Math.sin(t) * 0.05;
            this.arm.rotation.z = Math.sin(t) * 0.1;
        } else if (this.state === 'RUN') {
            this.body.rotation.z = this.facing * 0.15;
            this.arm.rotation.z = Math.cos(t * 2) * 1.0;
        } else if (this.state === 'ATTACK') {
            const p = 1 - (this.timer / 20);
            this.arm.rotation.z = 2 - (p * 5);
        } else if (this.state === 'BURST') {
            this.body.position.y = 1.0;
            this.arm.rotation.z = -1.0;
        } else if (this.state === 'BLOCK') {
            this.arm.rotation.z = 1.5;
            this.body.rotation.x = 0.2;
        }
    }

    startAttack(enemy, type) {
        if (type === 'NORMAL') {
            this.state = 'ATTACK';
            this.timer = 20;
            AudioSys.sfx.swing();
            setTimeout(() => {
                if (this.state === 'ATTACK' && !this.dead) this.checkHit(enemy, 8, 3.5);
            }, 100);
        }
        else if (type === 'SPECIAL') {
            this.state = 'SPECIAL';
            this.timer = 60;
            this.sp = 0;
            updateHUD();
            AudioSys.sfx.special();

            const flash = document.getElementById('flash-overlay');
            flash.style.background = '#00c6ff';
            flash.style.opacity = 0.5;
            setTimeout(() => flash.style.opacity = 0, 200);
        }
        else if (type === 'BURST') {
            this.state = 'BURST';
            this.timer = 25;
            AudioSys.sfx.burst();
            spawnImpact(this.pos, 0x00ff00, 2);
            const dist = this.pos.distanceTo(enemy.pos);
            if (dist < 6.0) {
                enemy.takeDamage(5);
                enemy.vel.x = this.facing * 2.0;
                Global.shake = 5;
            }
        }
    }

    checkHit(enemy, dmg, range) {
        const dist = this.pos.distanceTo(enemy.pos);
        const zDist = Math.abs(this.pos.z - enemy.pos.z);

        if (dist < range && zDist < 2.0) {
            if (enemy.state === 'BLOCK' && this.state !== 'SPECIAL') {
                AudioSys.sfx.block();
                spawnImpact(enemy.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xffffff);
                this.vel.x -= this.facing * 1.0;
            } else {
                AudioSys.sfx.hit();
                Global.hitStop = 5;
                Global.shake = 10;

                spawnImpact(enemy.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), enemy.color, 2);

                enemy.takeDamage(dmg);

                this.sp = Math.min(this.sp + 15, 100);
                this.combo++;
                this.comboTimer = 60;
                const el = document.getElementById(`p${this.id}-combo`);
                el.innerText = this.combo + (this.combo > 1 ? " HITS!" : " HIT!");
                el.style.opacity = 1;
                el.style.transform = `rotate(${Math.random() * 20 - 10}deg) scale(1.5)`;
                setTimeout(() => el.style.transform = `rotate(${this.id === 1 ? -5 : 5}deg) scale(1)`, 100);

                updateHUD();
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        this.state = 'HIT';
        this.timer = 15;
        this.vel.x += -this.facing * (amount * 0.1);

        this.body.material.emissive.setHex(0xff0000);
        setTimeout(() => this.body.material.emissive.setHex(0x000000), 100);

        updateHUD();

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
        AudioSys.sfx.ko();
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.5;
        Global.slowMo = 0.2;
        const winnerName = this.id === 1 ? p2.name : p1.name;
        endGame(winnerName);
    }

    runAI(enemy) {
        if (enemy.dead) {
            this.aiState = { moveDir: 0, actionTimer: 0, blockTimer: 0 };
            return {};
        }

        const inp = {};
        if (this.aiTimer > 0) { this.aiTimer--; return this.lastInput || {}; }

        const dist = this.pos.distanceTo(enemy.pos);
        const dx = enemy.pos.x - this.pos.x;

        if (enemy.state === 'ATTACK' && dist < 5 && Math.random() > 0.2) inp[this.keys.blk] = true;
        else if (this.sp >= 100 && dist < 4) inp[this.keys.sp] = true;
        else if (dist < 4 && Math.random() < 0.05) inp[this.keys.burst] = true;
        else if (dist < 3.5 && Math.abs(enemy.pos.z - this.pos.z) < 1) {
            if (Math.random() > 0.1) inp[this.keys.atk] = true;
        }
        else {
            if (dx > 1) inp[this.keys.r] = true;
            else if (dx < -1) inp[this.keys.l] = true;

            const dz = enemy.pos.z - this.pos.z;
            if (dz > 0.5) inp[this.keys.d] = true;
            else if (dz < -0.5) inp[this.keys.u] = true;
        }

        this.lastInput = inp;
        this.aiTimer = Math.floor(Math.random() * 10) + 5;
        return inp;
    }
}

// --- GLOBAL STATE ---
const Global = {
    hitStop: 0,
    shake: 0,
    slowMo: 1.0,
    running: false
};

let p1, p2;
const keys = {};

// --- MAIN LOGIC ---
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    AudioSys.init();
    initGame();
}

function initGame() {
    // Cleanup
    if (p1) scene.remove(p1.mesh);
    if (p2) scene.remove(p2.mesh);

    // Initialize players with configurable names
    p1 = new Fighter(1, 0xffcc00, 'banana', false, 'Player 1');
    p2 = new Fighter(2, 0xff5500, 'carrot', true, 'Player 2');

    // Update HUD with player names
    document.querySelector('.player-hud:nth-child(1) .player-name').textContent = p1.name;
    document.querySelector('.player-hud:nth-child(2) .player-name').textContent = p2.name;

    Global.running = true;
    Global.slowMo = 1.0;

    // UI Reset
    updateHUD();
    const overlay = document.getElementById('message-overlay');
    const txt = document.getElementById('main-text');
    const btn = document.getElementById('rematch-btn');

    overlay.classList.remove('interactive');
    overlay.style.display = 'block';
    txt.innerText = "ROUND 1";
    txt.style.opacity = 1;
    txt.style.transform = 'scale(1)';
    btn.style.display = 'none';

    setTimeout(() => {
        txt.innerText = "FIGHT!";
        txt.style.color = "#ff0055";
        setTimeout(() => {
            txt.style.opacity = 0;
            txt.style.transform = 'scale(2)';
        }, 500);
    }, 1000);
}

function updateHUD() {
    if (!p1 || !p2) return;
    document.getElementById('p1-hp').style.width = p1.hp + '%';
    document.getElementById('p2-hp').style.width = p2.hp + '%';

    const sp1 = document.getElementById('p1-sp');
    const sp2 = document.getElementById('p2-sp');
    sp1.style.width = p1.sp + '%';
    sp2.style.width = p2.sp + '%';

    if (p1.sp >= 100) sp1.classList.add('special-ready'); else sp1.classList.remove('special-ready');
    if (p2.sp >= 100) sp2.classList.add('special-ready'); else sp2.classList.remove('special-ready');
}

function endGame(winner) {
    Global.running = false;
    const overlay = document.getElementById('message-overlay');
    const txt = document.getElementById('main-text');
    const btn = document.getElementById('rematch-btn');

    overlay.classList.add('interactive'); // Enable clicking the button
    txt.innerHTML = winner + "<br><span style='font-size:60px; color:#fff; font-style:italic'>VICTORIOUS</span>";
    txt.style.opacity = 1;
    txt.style.transform = 'scale(1)';
    btn.style.display = 'block';
}

window.resetGame = initGame;

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Mouse Input Support
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) keys['MOUSE_LEFT'] = true;
    if (e.button === 2) keys['MOUSE_RIGHT'] = true;
});
window.addEventListener('mouseup', (e) => {
    if (e.button === 0) keys['MOUSE_LEFT'] = false;
    if (e.button === 2) keys['MOUSE_RIGHT'] = false;
});
window.addEventListener('contextmenu', e => e.preventDefault());

// --- RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);

    if (!p1 || !p2) {
        // Rotate camera on start screen
        const time = Date.now() * 0.0002;
        camera.position.x = Math.sin(time) * 25;
        camera.position.z = Math.cos(time) * 25;
        camera.lookAt(0, 2, 0);
        renderer.render(scene, camera);
        return;
    }

    // Hit Stop Logic
    if (Global.hitStop > 0) {
        Global.hitStop--;
        renderer.render(scene, camera);
        return;
    }

    if (Global.running || Global.slowMo < 1.0) {
        p1.update(keys, p2);
        p2.update(keys, p1);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= 0.05;
            p.mesh.position.add(p.vel);
            p.mesh.scale.multiplyScalar(0.9);
            p.mesh.rotation.x += 0.1;
            if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
        }
    }

    // Camera Logic
    const midX = (p1.pos.x + p2.pos.x) / 2;
    const dist = Math.abs(p1.pos.x - p2.pos.x);

    let camX = midX;
    let camZ = 12 + (dist * 0.6);
    let camY = 6;

    if (Global.shake > 0) {
        camX += (Math.random() - 0.5) * (Global.shake * 0.1);
        camY += (Math.random() - 0.5) * (Global.shake * 0.1);
        Global.shake *= 0.9;
        if (Global.shake < 0.5) Global.shake = 0;
    }

    camera.position.x += (camX - camera.position.x) * 0.1;
    camera.position.y += (camY - camera.position.y) * 0.1;
    camera.position.z += (camZ - camera.position.z) * 0.1;
    camera.lookAt(midX, 2, 0);

    renderer.render(scene, camera);
}

animate();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
