/**
 * Fighter Pummel: ULTIMATE
 * @version 2.1.0
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
    GRAVITY: 0.028,
    FRICTION: 0.85,
    AIR_FRICTION: 0.98,
    GROUND_Y: 0,

    MOVE_SPEED: 0.32,
    JUMP_FORCE: 0.7,
    DASH_SPEED: 1.2,
    DASH_DURATION: 8,
    DASH_COOLDOWN: 30,

    ATTACK_RANGE: 3.2,
    ATTACK_DAMAGE: 8,
    SPECIAL_DAMAGE: 18,
    HITSTUN_DURATION: 18,
    BLOCKSTUN_DURATION: 10,
    COMBO_TIMEOUT: 90,
    DAMAGE_SCALING: 0.92,

    ARENA_RADIUS: 16,

    MAX_HEALTH: 100,
    MAX_SPECIAL: 100,
    SPECIAL_GAIN_HIT: 12,
    SPECIAL_GAIN_DAMAGE: 8,
    ROUND_TIME: 99,
    ROUNDS_TO_WIN: 2,

    HIT_STOP_DURATION: 4,
    SHAKE_INTENSITY: 0.15,
    SLOW_MO_FACTOR: 0.25,

    TARGET_FPS: 60,
    MAX_PARTICLES: 50,
    SHADOW_MAP_SIZE: 1024,
};

const AI_CONFIG = {
    easy: {
        reactionTime: 25,
        aggressiveness: 0.3,
        blockChance: 0.2,
        specialChance: 0.02,
    },
    normal: {
        reactionTime: 15,
        aggressiveness: 0.5,
        blockChance: 0.4,
        specialChance: 0.05,
    },
    hard: {
        reactionTime: 8,
        aggressiveness: 0.7,
        blockChance: 0.6,
        specialChance: 0.08,
    },
};

// ==================== FIGHTER CLASS ====================
class Fighter {
    constructor(id, color, isAI, name) {
        this.id = id;
        this.color = color;
        this.isAI = isAI;
        this.name = name;

        this.hp = CONFIG.MAX_HEALTH;
        this.sp = 0;
        this.wins = 0;

        this.position = new THREE.Vector3(id === 1 ? -5 : 5, 0, 0);
        this.velocity = new THREE.Vector3();
        this.facing = id === 1 ? 1 : -1;
        this.isGrounded = true;

        this.state = 'IDLE';
        this.stateTimer = 0;
        this.hitstun = 0;
        this.blockstun = 0;

        this.combo = 0;
        this.comboTimer = 0;
        this.damageScale = 1;
        this.lastHitBy = null;

        this.dashCooldown = 0;
        this.dashDirection = new THREE.Vector3();

        this.aiTimer = 0;
        this.aiInput = {};
        this.aiDifficulty = AI_CONFIG.normal;

        this.controls = id === 1 ? {
            up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
            attack: 'MOUSE_LEFT', block: 'MOUSE_RIGHT',
            special: 'KeyE', dash: 'ShiftLeft'
        } : {
            up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
            attack: 'KeyL', block: 'KeyK',
            special: 'KeyI', dash: 'KeyM'
        };

        this.createModel();
    }

    createModel() {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);

        const mat = new THREE.MeshToonMaterial({ color: this.color });
        const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });

        const bodyGeo = new THREE.CylinderGeometry(0.45, 0.5, 2.2, 8);
        this.body = new THREE.Mesh(bodyGeo, mat);
        this.body.position.y = 1.5;
        this.body.castShadow = true;

        const bodyOutline = new THREE.Mesh(bodyGeo, outlineMat);
        bodyOutline.scale.multiplyScalar(1.05);
        this.body.add(bodyOutline);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);

        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        this.body.add(eyeL);

        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        this.body.add(eyeR);

        // Fix eye positions based on facing
        // Actually the original code had fixed positions, let's keep them
        eyeL.position.set(0.18, 0.45, 0.42);
        eyeL.rotation.z = 0.15;

        eyeR.position.set(-0.18, 0.45, 0.42);
        eyeR.rotation.z = -0.15;

        this.mesh.add(this.body);

        this.arm = new THREE.Group();
        this.arm.position.set(0.55, 0.15, 0);

        const weaponMat = new THREE.MeshToonMaterial({
            color: this.id === 1 ? 0xffd700 : 0xe67e22
        });
        const weaponGeo = this.id === 1
            ? new THREE.CylinderGeometry(0.08, 0.04, 2.2, 6)
            : new THREE.ConeGeometry(0.35, 2, 8);

        this.weapon = new THREE.Mesh(weaponGeo, weaponMat);
        this.weapon.rotation.z = -1.2;
        this.weapon.position.set(0.6, 0.4, 0);
        this.weapon.castShadow = true;

        const weaponOutline = new THREE.Mesh(weaponGeo, outlineMat);
        weaponOutline.scale.multiplyScalar(1.08);
        this.weapon.add(weaponOutline);

        this.arm.add(this.weapon);
        this.body.add(this.arm);

        this.specialSprite = this.createSpecialSprite();
        this.specialSprite.visible = false;
        this.mesh.add(this.specialSprite);
    }

    createSpecialSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.translate(128, 128);
        ctx.fillStyle = '#00c6ff';

        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(12, -100);
            ctx.lineTo(-12, -100);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const sprite = new THREE.Sprite(mat);
        sprite.position.y = 2;
        sprite.scale.set(0, 0, 1);

        return sprite;
    }

    reset(startX) {
        this.hp = CONFIG.MAX_HEALTH;
        this.sp = 0;
        this.position.set(startX, 0, 0);
        this.velocity.set(0, 0, 0);
        this.facing = startX < 0 ? 1 : -1;
        this.state = 'IDLE';
        this.stateTimer = 0;
        this.hitstun = 0;
        this.blockstun = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.damageScale = 1;
        this.dashCooldown = 0;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.set(0, this.facing === 1 ? 0 : Math.PI, 0);
        this.body.rotation.set(0, 0, 0);
        this.body.position.y = 1.5;
        this.specialSprite.visible = false;
        this.specialSprite.scale.set(0, 0, 1);
    }

    update(input, enemy, deltaTime) {
        if (this.hp <= 0) return;

        const ctrl = this.isAI ? this.runAI(enemy) : input;

        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime * 60;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.damageScale = 1;
                this.hideCombo();
            }
        }

        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime * 60;
        }

        this.updateState(ctrl, enemy, deltaTime);
        this.updatePhysics(deltaTime);

        if (this.state !== 'HIT' && this.state !== 'DASH') {
            const dx = enemy.position.x - this.position.x;
            this.facing = dx > 0 ? 1 : -1;
        }

        this.mesh.position.copy(this.position);
        const targetRot = this.facing === 1 ? 0 : Math.PI;
        this.mesh.rotation.y += (targetRot - this.mesh.rotation.y) * 0.15;

        this.animate(deltaTime);
    }

    updateState(ctrl, enemy, deltaTime) {
        const dt60 = deltaTime * 60;

        switch (this.state) {
            case 'HIT':
                this.hitstun -= dt60;
                if (this.hitstun <= 0) {
                    this.state = 'IDLE';
                }
                break;

            case 'BLOCK':
                this.blockstun -= dt60;
                if (this.blockstun <= 0 && !ctrl[this.controls.block]) {
                    this.state = 'IDLE';
                }
                break;

            case 'ATTACK':
                this.stateTimer -= dt60;
                if (this.stateTimer <= 12 && this.stateTimer > 10) {
                    this.checkHit(enemy, CONFIG.ATTACK_DAMAGE, CONFIG.ATTACK_RANGE);
                }
                if (this.stateTimer <= 0) {
                    this.state = 'IDLE';
                }
                break;

            case 'SPECIAL':
                this.stateTimer -= dt60;
                this.specialSprite.visible = true;
                const scale = 6 + Math.sin(Date.now() * 0.05) * 1.5;
                this.specialSprite.scale.set(scale, scale, 1);
                this.specialSprite.rotation.z += 0.08;

                if (Math.floor(this.stateTimer) % 6 === 0) {
                    this.checkHit(enemy, CONFIG.SPECIAL_DAMAGE * 0.4, 4);
                }

                if (this.stateTimer <= 0) {
                    this.state = 'IDLE';
                    this.specialSprite.visible = false;
                    this.specialSprite.scale.set(0, 0, 1);
                }
                break;

            case 'DASH':
                this.stateTimer -= dt60;
                this.velocity.copy(this.dashDirection).multiplyScalar(CONFIG.DASH_SPEED);
                if (this.stateTimer <= 0) {
                    this.state = 'IDLE';
                }
                break;

            default:
                this.handleInput(ctrl, enemy);
                break;
        }
    }

    handleInput(ctrl, enemy) {
        let moving = false;

        if (ctrl[this.controls.special] && this.sp >= CONFIG.MAX_SPECIAL) {
            this.startSpecial();
            return;
        }

        if (ctrl[this.controls.block]) {
            this.state = 'BLOCK';
            this.blockstun = 0;
            this.velocity.multiplyScalar(0.5);
            return;
        }

        if (ctrl[this.controls.dash] && this.dashCooldown <= 0) {
            this.startDash(ctrl);
            return;
        }

        if (ctrl[this.controls.attack]) {
            this.startAttack();
            return;
        }

        if (ctrl[this.controls.left]) {
            this.velocity.x -= CONFIG.MOVE_SPEED * 0.12;
            moving = true;
        }
        if (ctrl[this.controls.right]) {
            this.velocity.x += CONFIG.MOVE_SPEED * 0.12;
            moving = true;
        }
        if (ctrl[this.controls.up]) {
            this.velocity.z -= CONFIG.MOVE_SPEED * 0.12;
            moving = true;
        }
        if (ctrl[this.controls.down]) {
            this.velocity.z += CONFIG.MOVE_SPEED * 0.12;
            moving = true;
        }

        this.state = moving ? 'RUN' : 'IDLE';
    }

    startAttack() {
        this.state = 'ATTACK';
        this.stateTimer = 22;
        Audio.swing();
    }

    startSpecial() {
        this.state = 'SPECIAL';
        this.stateTimer = 50;
        this.sp = 0;
        Audio.special();
        Game.flashScreen('#00c6ff', 0.4);
    }

    startDash(ctrl) {
        this.state = 'DASH';
        this.stateTimer = CONFIG.DASH_DURATION;
        this.dashCooldown = CONFIG.DASH_COOLDOWN;

        this.dashDirection.set(0, 0, 0);
        if (ctrl[this.controls.left]) this.dashDirection.x = -1;
        if (ctrl[this.controls.right]) this.dashDirection.x = 1;
        if (ctrl[this.controls.up]) this.dashDirection.z = -1;
        if (ctrl[this.controls.down]) this.dashDirection.z = 1;

        if (this.dashDirection.length() === 0) {
            this.dashDirection.x = this.facing;
        }
        this.dashDirection.normalize();

        Audio.dash();
        Game.particles.spawn(this.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffffff, 3);
    }

    checkHit(enemy, damage, range) {
        if (enemy.hp <= 0) return;

        const dist = this.position.distanceTo(enemy.position);
        const zDist = Math.abs(this.position.z - enemy.position.z);

        if (dist < range && zDist < 2) {
            if (enemy.state === 'BLOCK' && this.state !== 'SPECIAL') {
                Audio.block();
                enemy.blockstun = CONFIG.BLOCKSTUN_DURATION;
                this.velocity.x -= this.facing * 0.8;
                Game.particles.spawn(
                    enemy.position.clone().add(new THREE.Vector3(0, 2, 0)),
                    0xffffff, 4
                );
            } else {
                const scaledDamage = Math.floor(damage * this.damageScale);
                enemy.takeDamage(scaledDamage, this);

                this.combo++;
                this.comboTimer = CONFIG.COMBO_TIMEOUT;
                this.damageScale *= CONFIG.DAMAGE_SCALING;
                this.sp = Math.min(this.sp + CONFIG.SPECIAL_GAIN_HIT, CONFIG.MAX_SPECIAL);

                this.showCombo();

                Audio.hit();
                Game.hitStop = CONFIG.HIT_STOP_DURATION;
                Game.shakeIntensity = 8;

                Game.particles.spawn(
                    enemy.position.clone().add(new THREE.Vector3(0, 2, 0)),
                    enemy.color, 8, 0.25, 0.8
                );

                Game.spawnHitSparks(enemy.position, this.facing);
            }
        }
    }

    takeDamage(amount, attacker) {
        this.hp = Math.max(0, this.hp - amount);
        this.sp = Math.min(this.sp + CONFIG.SPECIAL_GAIN_DAMAGE, CONFIG.MAX_SPECIAL);

        this.state = 'HIT';
        this.hitstun = CONFIG.HITSTUN_DURATION;
        this.velocity.x = -this.facing * (amount * 0.12);

        this.lastHitBy = attacker;

        this.body.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            if (this.body.material) {
                this.body.material.emissive.setHex(0x000000);
            }
        }, 80);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        Audio.ko();
        Game.slowMo = CONFIG.SLOW_MO_FACTOR;

        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.5;

        if (this.lastHitBy) {
            this.lastHitBy.wins++;
        }
    }

    updatePhysics(deltaTime) {
        const friction = this.isGrounded ? CONFIG.FRICTION : CONFIG.AIR_FRICTION;
        this.velocity.x *= friction;
        this.velocity.z *= friction;

        this.position.add(this.velocity);

        const dist = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
        if (dist > CONFIG.ARENA_RADIUS) {
            const angle = Math.atan2(this.position.z, this.position.x);
            this.position.x = Math.cos(angle) * CONFIG.ARENA_RADIUS;
            this.position.z = Math.sin(angle) * CONFIG.ARENA_RADIUS;
        }

        this.position.z = Math.max(-10, Math.min(10, this.position.z));
    }

    animate(deltaTime) {
        const t = Date.now() * 0.01;

        switch (this.state) {
            case 'IDLE':
                this.body.position.y = 1.5 + Math.sin(t) * 0.04;
                this.body.rotation.z = 0;
                this.arm.rotation.z = Math.sin(t) * 0.08;
                break;

            case 'RUN':
                this.body.rotation.z = this.facing * 0.12;
                this.arm.rotation.z = Math.cos(t * 2.5) * 0.8;
                break;

            case 'ATTACK':
                const progress = 1 - (this.stateTimer / 22);
                this.arm.rotation.z = 2 - (progress * 4.5);
                break;

            case 'BLOCK':
                this.arm.rotation.z = 1.4;
                this.body.rotation.x = 0.15;
                break;

            case 'HIT':
                this.body.rotation.z = -this.facing * 0.3;
                break;

            case 'DASH':
                this.body.rotation.z = this.dashDirection.x * 0.4;
                break;
        }
    }

    showCombo() {
        const el = document.getElementById(`p${this.id}-combo`);
        if (!el) return;

        el.textContent = `${this.combo} ${this.combo > 1 ? 'HITS!' : 'HIT!'}`;
        el.classList.add('visible', 'hit');

        setTimeout(() => el.classList.remove('hit'), 150);
    }

    hideCombo() {
        const el = document.getElementById(`p${this.id}-combo`);
        if (el) el.classList.remove('visible');
    }

    runAI(enemy) {
        if (enemy.hp <= 0) return {};

        this.aiTimer--;
        if (this.aiTimer > 0) return this.aiInput;

        this.aiTimer = this.aiDifficulty.reactionTime + Math.floor(Math.random() * 10);
        this.aiInput = {};

        const dist = this.position.distanceTo(enemy.position);
        const dx = enemy.position.x - this.position.x;
        const dz = enemy.position.z - this.position.z;

        if (enemy.state === 'ATTACK' && dist < 5) {
            if (Math.random() < this.aiDifficulty.blockChance) {
                this.aiInput[this.controls.block] = true;
                return this.aiInput;
            }
        }

        if (this.sp >= CONFIG.MAX_SPECIAL && dist < 5) {
            if (Math.random() < this.aiDifficulty.specialChance) {
                this.aiInput[this.controls.special] = true;
                return this.aiInput;
            }
        }

        if (dist < CONFIG.ATTACK_RANGE && Math.abs(dz) < 1.5) {
            if (Math.random() < this.aiDifficulty.aggressiveness) {
                this.aiInput[this.controls.attack] = true;
                return this.aiInput;
            }
        }

        if (dist > CONFIG.ATTACK_RANGE * 0.8) {
            if (dx > 0.5) this.aiInput[this.controls.right] = true;
            else if (dx < -0.5) this.aiInput[this.controls.left] = true;

            if (dz > 0.5) this.aiInput[this.controls.down] = true;
            else if (dz < -0.5) this.aiInput[this.controls.up] = true;
        }

        return this.aiInput;
    }

    setDifficulty(level) {
        this.aiDifficulty = AI_CONFIG[level] || AI_CONFIG.normal;
    }
}

// ==================== GAME MANAGER ====================
const Game = {
    scene: null,
    camera: null,
    renderer: null,

    player1: null,
    player2: null,
    particles: null,

    state: 'LOADING',
    round: 1,
    timer: CONFIG.ROUND_TIME,
    timerInterval: null,

    hitStop: 0,
    shakeIntensity: 0,
    slowMo: 1,

    settings: {
        sfx: true,
        music: true,
        volume: 50,
        difficulty: 'normal',
        roundTime: 99,
        shake: true,
        reducedMotion: false,
        showFps: false,
    },

    keys: {},
    touchInput: {},

    lastTime: 0,
    deltaTime: 0,
    frameCount: 0,
    fpsTime: 0,
    currentFps: 0,

    // Track if settings were opened from pause menu
    settingsOpenedFromPause: false,

    init() {
        this.setupThreeJS();
        this.createEnvironment();
        this.createFighters();
        this.setupInput();
        this.setupUI();
        this.loadSettings();

        this.simulateLoading();
    },

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a12);
        this.scene.fog = new THREE.FogExp2(0x0a0a12, 0.025);

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 6, 25);
        this.camera.lookAt(0, 2, 0);

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer = new THREE.WebGLRenderer({
            antialias: pixelRatio < 2,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.onResize());

        this.particles = new ParticlePool(this.scene, CONFIG.MAX_PARTICLES);
    },

    createEnvironment() {
        const hemiLight = new THREE.HemisphereLight(0xff0055, 0x00ccff, 0.35);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
        dirLight.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        this.scene.add(dirLight);

        const floorGeo = new THREE.CylinderGeometry(
            CONFIG.ARENA_RADIUS, CONFIG.ARENA_RADIUS, 1, 32
        );
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.6,
            metalness: 0.4
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const grid = new THREE.PolarGridHelper(
            CONFIG.ARENA_RADIUS, 16, 8, 64, 0x00c6ff, 0x00c6ff
        );
        grid.position.y = 0.02;
        grid.material.opacity = 0.25;
        grid.material.transparent = true;
        this.scene.add(grid);

        this.createTrees();
        this.createTorii();
    },

    createTrees() {
        const positions = [
            { x: -12, z: -10, s: 1.2 },
            { x: 12, z: -8, s: 1.4 },
            { x: 0, z: -15, s: 1.0 },
        ];

        positions.forEach(({ x, z, s }) => {
            const group = new THREE.Group();
            group.position.set(x, 0, z);
            group.scale.setScalar(s);

            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.5, 3, 5),
                trunkMat
            );
            trunk.position.y = 1.5;
            trunk.castShadow = true;
            group.add(trunk);

            const leafMat = new THREE.MeshToonMaterial({
                color: 0xff0055,
                emissive: 0x220011
            });
            const leaves = new THREE.Mesh(
                new THREE.IcosahedronGeometry(2, 0),
                leafMat
            );
            leaves.position.y = 3.5;
            leaves.castShadow = true;
            group.add(leaves);

            this.scene.add(group);
        });
    },

    createTorii() {
        const group = new THREE.Group();
        const mat = new THREE.MeshToonMaterial({ color: 0xff3333, emissive: 0x220000 });

        const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), mat);
        pillar1.position.set(-4, 4, 0);
        pillar1.castShadow = true;

        const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), mat);
        pillar2.position.set(4, 4, 0);
        pillar2.castShadow = true;

        const top = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 1.2), mat);
        top.position.set(0, 7, 0);
        top.castShadow = true;

        group.add(pillar1, pillar2, top);
        group.position.set(0, 0, 14);
        this.scene.add(group);
    },

    createFighters() {
        this.player1 = new Fighter(1, 0xffcc00, false, 'PLAYER 1');
        this.scene.add(this.player1.mesh);

        this.player2 = new Fighter(2, 0xff5500, true, 'CPU');
        this.scene.add(this.player2.mesh);
    },

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'Escape') {
                if (document.getElementById('settings-modal')?.classList.contains('visible')) {
                    this.closeSettings();
                } else {
                    this.togglePause();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.keys['MOUSE_LEFT'] = true;
            if (e.button === 2) this.keys['MOUSE_RIGHT'] = true;
            Audio.resume();
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.keys['MOUSE_LEFT'] = false;
            if (e.button === 2) this.keys['MOUSE_RIGHT'] = false;
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());

        this.setupMobileControls();
    },

    setupMobileControls() {
        const joystickZone = document.getElementById('joystick-zone');
        const joystick = document.getElementById('joystick');

        if (!joystickZone || !joystick) return;

        let joystickActive = false;
        let joystickStart = { x: 0, y: 0 };

        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            const touch = e.touches[0];
            const rect = joystickZone.getBoundingClientRect();
            joystickStart = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            Audio.resume();
        });

        joystickZone.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            e.preventDefault();

            const touch = e.touches[0];
            const dx = touch.clientX - joystickStart.x;
            const dy = touch.clientY - joystickStart.y;
            const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 35);
            const angle = Math.atan2(dy, dx);

            const jx = Math.cos(angle) * dist;
            const jy = Math.sin(angle) * dist;

            joystick.style.transform = `translate(${jx}px, ${jy}px)`;

            this.touchInput = {};
            if (jx < -10) this.touchInput['KeyA'] = true;
            if (jx > 10) this.touchInput['KeyD'] = true;
            if (jy < -10) this.touchInput['KeyW'] = true;
            if (jy > 10) this.touchInput['KeyS'] = true;
        });

        const endJoystick = () => {
            joystickActive = false;
            joystick.style.transform = 'translate(0, 0)';
            this.touchInput = {};
        };

        joystickZone.addEventListener('touchend', endJoystick);
        joystickZone.addEventListener('touchcancel', endJoystick);

        const setupButton = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchInput[key] = true;
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchInput[key] = false;
            });
        };

        setupButton('mobile-attack', 'MOUSE_LEFT');
        setupButton('mobile-block', 'MOUSE_RIGHT');
        setupButton('mobile-special', 'KeyE');
        setupButton('mobile-dash', 'ShiftLeft');
    },

    setupUI() {
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.settingsOpenedFromPause = false;
            this.openSettings();
        });

        document.getElementById('settings-save')?.addEventListener('click', () => {
            this.closeSettings();
        });

        document.getElementById('settings-reset')?.addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        // Fix: Pause menu settings button opens settings modal as overlay
        document.getElementById('pause-settings-btn')?.addEventListener('click', () => {
            // Hide pause menu first
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) {
                pauseMenu.classList.remove('visible');
            }
            // Mark that settings was opened from pause
            this.settingsOpenedFromPause = true;
            // Open settings modal as separate overlay
            this.openSettings();
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.togglePause();
            this.resetRound();
        });

        document.getElementById('quit-btn')?.addEventListener('click', () => {
            this.togglePause();
            this.returnToMenu();
        });

        document.getElementById('rematch-btn')?.addEventListener('click', () => {
            this.resetMatch();
        });

        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.returnToMenu();
        });

        // Settings controls
        document.getElementById('settings-sfx')?.addEventListener('change', (e) => {
            this.settings.sfx = e.target.checked;
            Audio.enabled = e.target.checked;
        });

        document.getElementById('settings-music')?.addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            Audio.musicEnabled = e.target.checked;
        });

        document.getElementById('settings-volume')?.addEventListener('input', (e) => {
            this.settings.volume = parseInt(e.target.value);
            Audio.setVolume(this.settings.volume / 100);
        });

        document.getElementById('settings-difficulty')?.addEventListener('change', (e) => {
            this.settings.difficulty = e.target.value;
            if (this.player2) {
                this.player2.setDifficulty(e.target.value);
            }
        });

        document.getElementById('settings-round-time')?.addEventListener('change', (e) => {
            this.settings.roundTime = e.target.value === 'infinite' ? Infinity : parseInt(e.target.value);
        });

        document.getElementById('settings-shake')?.addEventListener('change', (e) => {
            this.settings.shake = e.target.checked;
        });

        document.getElementById('settings-reduced-motion')?.addEventListener('change', (e) => {
            this.settings.reducedMotion = e.target.checked;
        });

        document.getElementById('settings-fps')?.addEventListener('change', (e) => {
            this.settings.showFps = e.target.checked;
            document.getElementById('fps-counter')?.classList.toggle('visible', e.target.checked);
        });
    },

    openSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('visible');
        }
    },

    closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
        this.saveSettings();

        // If settings was opened from pause menu, return to pause menu
        if (this.settingsOpenedFromPause && this.state === 'PAUSED') {
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) {
                pauseMenu.classList.add('visible');
            }
            this.settingsOpenedFromPause = false;
        }
    },

    resetSettings() {
        this.settings = {
            sfx: true,
            music: true,
            volume: 50,
            difficulty: 'normal',
            roundTime: 99,
            shake: true,
            reducedMotion: false,
            showFps: false,
        };
        this.applySettings();
        this.saveSettings();
    },

    applySettings() {
        Audio.enabled = this.settings.sfx;
        Audio.musicEnabled = this.settings.music;
        Audio.setVolume(this.settings.volume / 100);

        if (this.player2) {
            this.player2.setDifficulty(this.settings.difficulty);
        }

        const sfxEl = document.getElementById('settings-sfx');
        const musicEl = document.getElementById('settings-music');
        const volumeEl = document.getElementById('settings-volume');
        const diffEl = document.getElementById('settings-difficulty');
        const timeEl = document.getElementById('settings-round-time');
        const shakeEl = document.getElementById('settings-shake');
        const motionEl = document.getElementById('settings-reduced-motion');
        const fpsEl = document.getElementById('settings-fps');

        if (sfxEl) sfxEl.checked = this.settings.sfx;
        if (musicEl) musicEl.checked = this.settings.music;
        if (volumeEl) volumeEl.value = this.settings.volume;
        if (diffEl) diffEl.value = this.settings.difficulty;
        if (timeEl) timeEl.value = this.settings.roundTime === Infinity ? 'infinite' : this.settings.roundTime.toString();
        if (shakeEl) shakeEl.checked = this.settings.shake;
        if (motionEl) motionEl.checked = this.settings.reducedMotion;
        if (fpsEl) fpsEl.checked = this.settings.showFps;

        document.getElementById('fps-counter')?.classList.toggle('visible', this.settings.showFps);
    },

    simulateLoading() {
        const progress = document.getElementById('load-progress');
        const text = document.getElementById('load-text');
        let loaded = 0;

        const steps = [
            'Initializing engine...',
            'Loading fighters...',
            'Preparing arena...',
            'Ready!'
        ];

        const interval = setInterval(() => {
            loaded += Math.random() * 30 + 10;
            if (loaded > 100) loaded = 100;

            if (progress) progress.style.width = `${loaded}%`;
            if (text) text.textContent = steps[Math.min(Math.floor(loaded / 25), 3)];

            if (loaded >= 100) {
                clearInterval(interval);
                setTimeout(() => this.showStartScreen(), 300);
            }
        }, 200);
    },

    showStartScreen() {
        document.getElementById('loading-screen')?.classList.add('hidden');
        document.getElementById('start-screen')?.classList.add('visible');
        this.state = 'MENU';
        this.animate(0);
    },

    startGame() {
        Audio.init();
        Audio.resume();

        document.getElementById('start-screen')?.classList.remove('visible');
        document.getElementById('game-ui')?.classList.add('visible');

        this.player1.wins = 0;
        this.player2.wins = 0;
        this.round = 1;

        if (this.player2) {
            this.player2.setDifficulty(this.settings.difficulty);
        }

        CONFIG.ROUND_TIME = this.settings.roundTime === Infinity ? 9999 : this.settings.roundTime;

        this.startRound();
    },

    startRound() {
        this.state = 'COUNTDOWN';

        this.player1.reset(-5);
        this.player2.reset(5);

        this.timer = CONFIG.ROUND_TIME;
        this.updateTimerDisplay();

        this.updateHUD();
        this.updateRoundIndicator();

        const mainText = document.getElementById('main-text');
        const overlay = document.getElementById('message-overlay');

        if (mainText && overlay) {
            overlay.classList.remove('interactive');
            mainText.textContent = `ROUND ${this.round}`;
            mainText.classList.add('visible');
            mainText.classList.remove('exit');

            Audio.roundStart();

            setTimeout(() => {
                mainText.textContent = 'FIGHT!';
                mainText.style.color = '#ff0055';

                setTimeout(() => {
                    mainText.classList.add('exit');
                    setTimeout(() => {
                        mainText.classList.remove('visible', 'exit');
                        mainText.style.color = '';
                        this.state = 'FIGHTING';
                        this.startTimer();
                    }, 300);
                }, 600);
            }, 1000);
        }
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            if (this.state !== 'FIGHTING') return;

            this.timer--;
            this.updateTimerDisplay();

            if (this.timer <= 0) {
                this.timeUp();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    timeUp() {
        this.stopTimer();

        if (this.player1.hp > this.player2.hp) {
            this.player1.wins++;
            this.endRound(this.player1);
        } else if (this.player2.hp > this.player1.hp) {
            this.player2.wins++;
            this.endRound(this.player2);
        } else {
            this.endRound(null);
        }
    },

    endRound(winner) {
        this.state = 'ROUND_END';
        this.stopTimer();
        this.slowMo = 1;

        const mainText = document.getElementById('main-text');
        const subText = document.getElementById('sub-text');
        const overlay = document.getElementById('message-overlay');

        if (!mainText || !overlay) return;

        const matchWinner = this.player1.wins >= CONFIG.ROUNDS_TO_WIN ? this.player1 :
            this.player2.wins >= CONFIG.ROUNDS_TO_WIN ? this.player2 : null;

        if (matchWinner) {
            mainText.textContent = matchWinner.name;
            if (subText) {
                subText.textContent = 'WINS!';
                subText.classList.add('visible');
            }
            mainText.classList.add('visible');
            overlay.classList.add('interactive');
        } else {
            mainText.textContent = winner ? `${winner.name} WINS` : 'DRAW';
            mainText.classList.add('visible');

            this.updateRoundIndicator();

            setTimeout(() => {
                mainText.classList.add('exit');
                setTimeout(() => {
                    mainText.classList.remove('visible', 'exit');
                    this.round++;
                    this.startRound();
                }, 300);
            }, 2000);
        }
    },

    resetRound() {
        const mainText = document.getElementById('main-text');
        const subText = document.getElementById('sub-text');
        const overlay = document.getElementById('message-overlay');

        if (mainText) mainText.classList.remove('visible', 'exit');
        if (subText) subText.classList.remove('visible');
        if (overlay) overlay.classList.remove('interactive');

        this.slowMo = 1;
        this.startRound();
    },

    resetMatch() {
        const subText = document.getElementById('sub-text');
        if (subText) subText.classList.remove('visible');

        this.player1.wins = 0;
        this.player2.wins = 0;
        this.round = 1;
        this.slowMo = 1;

        this.resetRound();
    },

    returnToMenu() {
        this.state = 'MENU';
        this.stopTimer();
        this.slowMo = 1;

        document.getElementById('game-ui')?.classList.remove('visible');
        document.getElementById('start-screen')?.classList.add('visible');

        const mainText = document.getElementById('main-text');
        const subText = document.getElementById('sub-text');
        const overlay = document.getElementById('message-overlay');

        if (mainText) mainText.classList.remove('visible', 'exit');
        if (subText) subText.classList.remove('visible');
        if (overlay) overlay.classList.remove('interactive');

        this.player1.reset(-5);
        this.player2.reset(5);
        this.player1.wins = 0;
        this.player2.wins = 0;
    },

    togglePause() {
        if (this.state === 'MENU' || this.state === 'LOADING') return;

        const pauseMenu = document.getElementById('pause-menu');
        if (!pauseMenu) return;

        if (this.state === 'PAUSED') {
            pauseMenu.classList.remove('visible');
            this.state = this.previousState || 'FIGHTING';
        } else {
            this.previousState = this.state;
            this.state = 'PAUSED';
            pauseMenu.classList.add('visible');
        }
    },

    updateHUD() {
        const p1Hp = document.getElementById('p1-hp');
        const p2Hp = document.getElementById('p2-hp');
        const p1HpDmg = document.getElementById('p1-hp-damage');
        const p2HpDmg = document.getElementById('p2-hp-damage');
        const p1HpText = document.getElementById('p1-hp-text');
        const p2HpText = document.getElementById('p2-hp-text');

        const p1Percent = (this.player1.hp / CONFIG.MAX_HEALTH) * 100;
        const p2Percent = (this.player2.hp / CONFIG.MAX_HEALTH) * 100;

        if (p1Hp) p1Hp.style.width = `${p1Percent}%`;
        if (p2Hp) p2Hp.style.width = `${p2Percent}%`;
        if (p1HpDmg) p1HpDmg.style.width = `${p1Percent}%`;
        if (p2HpDmg) p2HpDmg.style.width = `${p2Percent}%`;
        if (p1HpText) p1HpText.textContent = Math.ceil(this.player1.hp);
        if (p2HpText) p2HpText.textContent = Math.ceil(this.player2.hp);

        const p1Sp = document.getElementById('p1-sp');
        const p2Sp = document.getElementById('p2-sp');

        if (p1Sp) {
            p1Sp.style.width = `${this.player1.sp}%`;
            p1Sp.classList.toggle('ready', this.player1.sp >= CONFIG.MAX_SPECIAL);
        }
        if (p2Sp) {
            p2Sp.style.width = `${this.player2.sp}%`;
            p2Sp.classList.toggle('ready', this.player2.sp >= CONFIG.MAX_SPECIAL);
        }

        const p1Wins = document.getElementById('p1-wins');
        const p2Wins = document.getElementById('p2-wins');

        if (p1Wins) p1Wins.textContent = `${this.player1.wins} WIN${this.player1.wins !== 1 ? 'S' : ''}`;
        if (p2Wins) p2Wins.textContent = `${this.player2.wins} WIN${this.player2.wins !== 1 ? 'S' : ''}`;
    },

    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = this.timer > 999 ? '∞' : this.timer;
            timerEl.classList.toggle('warning', this.timer <= 10 && this.timer < 999);
        }
    },

    updateRoundIndicator() {
        const roundNum = document.getElementById('round-number');
        if (roundNum) roundNum.textContent = this.round;

        const p1Dots = document.querySelectorAll('#p1-rounds .round-dot');
        const p2Dots = document.querySelectorAll('#p2-rounds .round-dot');

        p1Dots.forEach((dot, i) => {
            dot.classList.toggle('won', i < this.player1.wins);
        });

        p2Dots.forEach((dot, i) => {
            dot.classList.toggle('won', i < this.player2.wins);
        });
    },

    flashScreen(color, opacity) {
        const flash = document.getElementById('flash-overlay');
        if (!flash) return;

        flash.style.background = color;
        flash.style.opacity = opacity;

        setTimeout(() => {
            flash.style.opacity = 0;
        }, 100);
    },

    spawnHitSparks(position, direction) {
        const container = document.getElementById('hit-effects');
        if (!container) return;

        const vector = position.clone();
        vector.y += 2;
        vector.project(this.camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'hit-spark';
            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;

            const angle = (Math.random() - 0.5) * Math.PI + (direction > 0 ? 0 : Math.PI);
            const dist = 50 + Math.random() * 100;
            spark.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
            spark.style.setProperty('--ty', `${Math.sin(angle) * dist - 50}px`);

            container.appendChild(spark);

            setTimeout(() => spark.remove(), 400);
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('fighterPummelSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
            this.applySettings();
        } catch (e) {
            console.warn('Could not load settings');
        }
    },

    saveSettings() {
        try {
            localStorage.setItem('fighterPummelSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings');
        }
    },

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate(currentTime) {
        requestAnimationFrame((t) => this.animate(t));

        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // FPS counter
        this.frameCount++;
        if (currentTime - this.fpsTime >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;

            const fpsEl = document.getElementById('fps-counter');
            if (fpsEl && this.settings.showFps) {
                fpsEl.textContent = `${this.currentFps} FPS`;
            }
        }

        const effectiveDelta = this.deltaTime * this.slowMo;

        if (this.hitStop > 0) {
            this.hitStop -= this.deltaTime * 60;
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (this.state === 'MENU') {
            const time = currentTime * 0.0002;
            this.camera.position.x = Math.sin(time) * 25;
            this.camera.position.z = Math.cos(time) * 25;
            this.camera.lookAt(0, 2, 0);
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (this.state === 'PAUSED') {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (this.state === 'FIGHTING' || this.state === 'ROUND_END') {
            const input = { ...this.keys, ...this.touchInput };

            this.player1.update(input, this.player2, effectiveDelta);
            this.player2.update(input, this.player1, effectiveDelta);

            if (this.state === 'FIGHTING') {
                if (this.player1.hp <= 0) {
                    this.player2.wins++;
                    this.endRound(this.player2);
                } else if (this.player2.hp <= 0) {
                    this.player1.wins++;
                    this.endRound(this.player1);
                }
            }

            this.updateHUD();
        }

        this.particles.update(effectiveDelta);

        if (this.slowMo < 1) {
            this.slowMo = Math.min(this.slowMo + this.deltaTime * 0.5, 1);
        }

        this.updateCamera();

        this.renderer.render(this.scene, this.camera);
    },

    updateCamera() {
        if (!this.player1 || !this.player2) return;

        const midX = (this.player1.position.x + this.player2.position.x) / 2;
        const dist = Math.abs(this.player1.position.x - this.player2.position.x);

        let targetX = midX;
        let targetY = 5.5;
        let targetZ = 14 + dist * 0.5;

        if (this.shakeIntensity > 0 && this.settings.shake) {
            targetX += (Math.random() - 0.5) * this.shakeIntensity * CONFIG.SHAKE_INTENSITY;
            targetY += (Math.random() - 0.5) * this.shakeIntensity * CONFIG.SHAKE_INTENSITY;
            this.shakeIntensity *= 0.9;
            if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
        }

        this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;

        this.camera.lookAt(midX, 2, 0);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Game.init());
} else {
    Game.init();
}
