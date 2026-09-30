// ===== SISTEMA DE PARTÍCULAS — Coherencia con Estado del Alimento =====
// 🟢 Verde: Frescura alta / Estabilidad | 🟡 Amarillo: Maduración media | 🔴 Rojo: Deterioro

import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene, maxParticles = 1000) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.systems = [];
        this.texture = this.createParticleTexture();
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Emite partículas coherentes con el estado del alimento
     * @param {THREE.Vector3} center - Posición central
     * @param {THREE.Object3D} target - Objeto objetivo
     * @param {number} freshness - Frescura del alimento (0-1)
     */
    emit(center, target, freshness = 0.5) {
        const box = new THREE.Box3().setFromObject(target);
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) * 0.8;

        // Calcular proporciones de partículas según frescura
        // Frescura alta (0.7-1.0): más verde, menos rojo
        // Frescura media (0.4-0.7): equilibrio
        // Frescura baja (0.0-0.4): más rojo, menos verde

        const greenRatio = Math.max(0.1, freshness);
        const redRatio = Math.max(0.1, 1 - freshness);
        const yellowRatio = 0.3; // siempre hay algo de transformación

        // Crear capas con densidad proporcional al estado
        this.createParticleLayer(center, radius, 0x00ff88, greenRatio, 0.02, 'green');
        this.createParticleLayer(center, radius * 1.2, 0xffcc00, yellowRatio, 0.05, 'yellow');
        this.createParticleLayer(center, radius * 1.5, 0xff4444, redRatio, 0.08, 'red');
    }

    createParticleLayer(center, radius, color, densityRatio, speed, type) {
        // Número de partículas proporcional a la densidad
        const count = Math.floor(200 * densityRatio);
        const positions = new Float32Array(count * 3);
        const phases = [];

        for (let i = 0; i < count; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const r = radius * (0.8 + Math.random() * 0.4);

            positions[i * 3] = center.x + r * Math.sin(theta) * Math.cos(phi);
            positions[i * 3 + 1] = center.y + r * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = center.z + r * Math.cos(theta);

            phases.push(Math.random() * Math.PI * 2);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.03,
            map: this.texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        this.systems.push({
            points,
            phases,
            center: center.clone(),
            radius,
            type,
            material,
            age: 0,
            maxAge: 8
        });
    }

    update(delta, elapsed) {
        for (let i = this.systems.length - 1; i >= 0; i--) {
            const sys = this.systems[i];
            sys.age += delta;

            if (sys.age > sys.maxAge) {
                sys.material.opacity -= delta * 0.5;
                if (sys.material.opacity <= 0) {
                    this.scene.remove(sys.points);
                    sys.points.geometry.dispose();
                    sys.material.dispose();
                    this.systems.splice(i, 1);
                    continue;
                }
            }

            const positions = sys.points.geometry.attributes.position.array;
            const count = positions.length / 3;

            for (let j = 0; j < count; j++) {
                const j3 = j * 3;
                let angle = elapsed * 0.5 + sys.phases[j];

                if (sys.type === 'green') {
                    // Verde: movimiento suave y ordenado (estabilidad)
                    positions[j3] = sys.center.x + Math.sin(angle + j * 0.1) * sys.radius * 0.9;
                    positions[j3 + 1] = sys.center.y + Math.cos(angle * 0.7 + j * 0.05) * sys.radius * 0.5;
                    positions[j3 + 2] = sys.center.z + Math.cos(angle + j * 0.1) * sys.radius * 0.9;
                } else if (sys.type === 'yellow') {
                    // Amarillo: movimiento progresivo (transformación)
                    positions[j3] = sys.center.x + Math.sin(angle * 1.2 + j * 0.15) * sys.radius * 1.1;
                    positions[j3 + 1] = sys.center.y + Math.sin(angle * 0.8 + j * 0.1) * sys.radius * 0.7;
                    positions[j3 + 2] = sys.center.z + Math.cos(angle * 1.1 + j * 0.15) * sys.radius * 1.1;
                } else {
                    // Rojo: disperso e inestable (deterioro)
                    const noise = Math.sin(elapsed * 3 + j) * 0.3;
                    positions[j3] = sys.center.x + Math.sin(angle * 1.5 + j * 0.2 + noise) * sys.radius * 1.3;
                    positions[j3 + 1] = sys.center.y + Math.cos(angle * 2 + j * 0.15 + noise) * sys.radius * 0.9;
                    positions[j3 + 2] = sys.center.z + Math.sin(angle * 1.8 + j * 0.25 + noise) * sys.radius * 1.3;
                }
            }

            sys.points.geometry.attributes.position.needsUpdate = true;
        }
    }

    clear() {
        for (const sys of this.systems) {
            this.scene.remove(sys.points);
            sys.points.geometry.dispose();
            sys.material.dispose();
        }
        this.systems = [];
    }
}
