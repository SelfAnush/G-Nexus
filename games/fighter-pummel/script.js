/**
 * General Utilities and Systems
 */

// ==================== AUDIO SYSTEM ====================
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.5;
    }

    init() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            return true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
            return false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }

    playTone(freq, type, duration, volume = 0.1) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.1, 20), now + duration);

        gain.gain.setValueAtTime(volume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    playNoise(duration, volume = 0.2) {
        if (!this.enabled || !this.ctx) return;

        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        noise.buffer = buffer;
        gain.gain.setValueAtTime(volume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }

    hit() {
        this.playTone(150, 'sawtooth', 0.12, 0.25);
        this.playNoise(0.08, 0.35);
    }

    block() {
        this.playTone(800, 'square', 0.06, 0.15);
    }

    swing() {
        this.playTone(350, 'triangle', 0.12, 0.08);
    }

    special() {
        this.playTone(180, 'sawtooth', 0.6, 0.35);
        this.playTone(90, 'square', 0.6, 0.25);
    }

    dash() {
        this.playTone(200, 'sine', 0.15, 0.1);
    }

    ko() {
        this.playTone(60, 'sawtooth', 1.5, 0.5);
    }

    roundStart() {
        this.playTone(440, 'sine', 0.2, 0.2);
        setTimeout(() => this.playTone(660, 'sine', 0.3, 0.25), 200);
    }
}

const Audio = new AudioSystem();

// ==================== PARTICLE SYSTEM ====================
class ParticlePool {
    constructor(scene, maxParticles) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this.maxParticles = maxParticles;

        const geo = new THREE.BoxGeometry(1, 1, 1);
        for (let i = 0; i < maxParticles; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            scene.add(mesh);
            this.pool.push({
                mesh,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 1,
            });
        }
    }

    spawn(position, color, count = 5, scale = 0.2, speed = 0.5) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.find(p => p.life <= 0);
            if (!particle) break;

            particle.mesh.visible = true;
            particle.mesh.position.copy(position);
            particle.mesh.scale.setScalar(scale);
            particle.mesh.material.color.setHex(color);
            particle.mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            particle.velocity.set(
                (Math.random() - 0.5) * speed,
                Math.random() * speed * 0.8,
                (Math.random() - 0.5) * speed
            );

            particle.life = 1;
            particle.maxLife = 1;
            this.active.push(particle);
        }
    }

    update(deltaTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.life -= deltaTime * 2;

            if (p.life <= 0) {
                p.mesh.visible = false;
                this.active.splice(i, 1);
                continue;
            }

            // Note: CONFIG must be defined in game.js
            p.velocity.y -= (typeof CONFIG !== 'undefined' ? CONFIG.GRAVITY : 0.028) * 0.5;
            p.mesh.position.add(p.velocity);
            p.mesh.scale.multiplyScalar(0.95);
            p.mesh.rotation.x += 0.1;
            p.mesh.rotation.y += 0.1;
        }
    }

    clear() {
        this.active.forEach(p => {
            p.life = 0;
            p.mesh.visible = false;
        });
        this.active = [];
    }
}
