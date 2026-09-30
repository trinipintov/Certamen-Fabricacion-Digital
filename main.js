import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HUD } from './hud.js';
import { ParticleSystem } from './particles.js';
import { VoiceSynthesis } from './audio.js';

// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    camera: {
        fov: 70,
        near: 0.1,
        far: 120,
        position: { x: 0, y: 1.68, z: 6 },
        eyeHeight: 1.68,
        // Rotación libre en 3 ejes (yaw, pitch, roll) como cabeza humana
        initialRotation: { x: 0, y: 0, z: 0 },
        rotationSpeed: 0.003
    },
    scan: {
        dwellTime: 1.3,
        particleCount: 600
    },
    movement: {
        walkSpeed: 1.4
    }
};

// ===== ESTADO GLOBAL =====
let scene, camera, renderer, controls;
let raycaster, foodItems = [];
let hud, particles, voice;
let currentTarget = null;
let activeScanningTarget = null;
let dwellTimer = 0;
let isScanning = false;
let isShowingInfo = false;
let scanProgress = 0;
let clock;
let cameraRotation = { yaw: 0, pitch: 0, roll: 0 };
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
const keys = {};

// Inercia suave para caminar como una persona real
const moveVelocity = new THREE.Vector3();

// Elementos dinámicos
let peopleList = [];
let holoBox = null;
let mistParticles = null;
let glbModelGroup = null;

// ===== INICIALIZACIÓN =====
async function init() {
    console.log('[INIT] Iniciando Supermercado RV con Smart Glasses POV (Modo Humano)...');

    try {
        const canvas = document.getElementById('scene');
        if (!canvas) {
            console.error('[ERROR] Canvas no encontrado');
            return;
        }

        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        scene.fog = new THREE.FogExp2(0xf8fafc, 0.008);

        camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        camera.position.set(CONFIG.camera.position.x, CONFIG.camera.eyeHeight, CONFIG.camera.position.z);

        // Sistema de cámara con rotación libre en 3 ejes (yaw, pitch, roll)
        // Permite mirar en todas direcciones desde un punto de altura fija
        controls = {
            target: new THREE.Vector3(CONFIG.camera.position.x, CONFIG.camera.eyeHeight, CONFIG.camera.position.z),
            update: function() {
                // La cámara rota según los ángulos almacenados
                camera.rotation.order = 'YXZ';
                camera.rotation.y = this.target.y; // Yaw (horizontal)
                camera.rotation.x = this.target.x; // Pitch (vertical)
                camera.rotation.z = this.target.z; // Roll (inclinación lateral)
            }
        };

        // Estado de rotación de cámara (yaw, pitch, roll)
        cameraRotation = {
            yaw: 0,      // Rotación horizontal (eje Y) - 360°
            pitch: 0,    // Rotación vertical (eje X) - limitada para no marear
            roll: 0      // Inclinación lateral (eje Z) - sutil
        };

        setupLighting();
        buildRealisticSupermarket();
        setupHolographicTargetBox();
        loadBandaGLB();

        hud = new HUD();
        particles = new ParticleSystem(scene, CONFIG.scan.particleCount);
        voice = new VoiceSynthesis();
        hud.voice = voice;

        clock = new THREE.Clock();
        raycaster = new THREE.Raycaster();

        setupEvents();
        setupQuickHUDButtons();

        console.log(`[INIT] Escena hiperrealista generada (${foodItems.length} alimentos escaneables)`);
        animate();

    } catch (err) {
        console.error('[FATAL INIT ERROR]', err);
    }
}

// ===== ILUMINACIÓN BRILLANTE Y BLANCA =====
function setupLighting() {
    // Luz ambiental muy brillante
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    // Luz principal brillante
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(8, 14, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 40;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    // Luz de relleno brillante
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-6, 10, -4);
    scene.add(fillLight);

    // Luz desde atrás
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 8, -10);
    scene.add(backLight);

    const produceLight1 = new THREE.SpotLight(0xffecc4, 2.4, 16, Math.PI / 3, 0.5, 1.2);
    produceLight1.position.set(-4, 5.2, 0);
    produceLight1.target.position.set(-4, 0.8, 0);
    scene.add(produceLight1);
    scene.add(produceLight1.target);

    const produceLight2 = new THREE.SpotLight(0xffecc4, 2.4, 16, Math.PI / 3, 0.5, 1.2);
    produceLight2.position.set(4, 5.2, 0);
    produceLight2.target.position.set(4, 0.8, 0);
    scene.add(produceLight2);
    scene.add(produceLight2.target);

    for (let x = -12; x <= 12; x += 8) {
        for (let z = -10; z <= 10; z += 10) {
            const pLight = new THREE.PointLight(0xf8fafc, 0.6, 12, 1.5);
            pLight.position.set(x, 4.8, z);
            scene.add(pLight);
        }
    }
}

// ===== GENERADORES DE TEXTURAS PROCEDURALES HD =====
function createTileFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#eaeef2';
    ctx.fillRect(0, 0, 1024, 1024);

    const tileSize = 256;
    for (let x = 0; x < 1024; x += tileSize) {
        for (let y = 0; y < 1024; y += tileSize) {
            const shade = Math.floor(Math.random() * 12);
            ctx.fillStyle = `rgb(${234 + shade}, ${238 + shade}, ${242 + shade})`;
            ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

            for (let i = 0; i < 40; i++) {
                const px = x + 4 + Math.random() * (tileSize - 8);
                const py = y + 4 + Math.random() * (tileSize - 8);
                const alpha = Math.random() * 0.12;
                ctx.fillStyle = `rgba(140, 160, 180, ${alpha})`;
                ctx.fillRect(px, py, 2, 2);
            }

            ctx.strokeStyle = '#c5d0db';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, tileSize, tileSize);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#c89666';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 512; i += 4) {
        const tone = Math.sin(i * 0.08) * 25 + Math.random() * 15;
        ctx.fillStyle = `rgba(${160 + tone}, ${110 + tone}, ${70 + tone}, 0.25)`;
        ctx.fillRect(0, i, 512, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createSignTexture(text, bgColor = '#1b4332', textColor = '#ffffff', subtitle = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText(text, 256, subtitle ? 56 : 76);

    if (subtitle) {
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.fillStyle = '#bbf7d0';
        ctx.fillText(subtitle, 256, 96);
    }

    return new THREE.CanvasTexture(canvas);
}

// ===== CONSTRUCCIÓN DEL ESPACIO REALISTA =====
function buildRealisticSupermarket() {
    createFloor();
    createWallsAndDecor();
    createCeilingAndDucts();
    createAisleHangingSigns();

    createProduceIslandAisles();
    createGroceryAisleShelves();
    createRefrigeratedCoolers();
    createCheckoutLanes();
    createShoppersAndStaff();
    createShoppingCartsAndBaskets();
    createVegetableMistingSystem();
}

function createFloor() {
    const floorGeo = new THREE.PlaneGeometry(36, 32);
    const floorTexture = createTileFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.18,
        metalness: 0.12
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

function createWallsAndDecor() {
    // Paredes blancas brillantes
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.05 });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(36, 6), wallMat);
    backWall.position.set(0, 3, -16);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(36, 6), wallMat);
    frontWall.position.set(0, 3, 16);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(32, 6), wallMat);
    leftWall.position.set(-18, 3, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const woodTexture = createWoodTexture();
    woodTexture.repeat.set(8, 2);
    const woodPanelMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.7 });
    const woodPanel = new THREE.Mesh(new THREE.PlaneGeometry(28, 2.5), woodPanelMat);
    woodPanel.position.set(-17.95, 2.5, 0);
    woodPanel.rotation.y = Math.PI / 2;
    scene.add(woodPanel);

    const bannerTex = createSignTexture('MERCADO FRESCO & BIO', '#2d6a4f', '#ffffff', '100% Cosecha de Calidad Seleccionada');
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4 }));
    banner.position.set(-17.9, 4.2, 0);
    banner.rotation.y = Math.PI / 2;
    scene.add(banner);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(32, 6), wallMat);
    rightWall.position.set(18, 3, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

function createCeilingAndDucts() {
    // Techo blanco brillante
    const ceilingGeo = new THREE.PlaneGeometry(36, 32);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 5.6;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const beamMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    for (let z = -14; z <= 14; z += 7) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(36, 0.35, 0.2), beamMat);
        beam.position.set(0, 5.3, z);
        scene.add(beam);
    }

    const ductMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const duct1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 32, 16), ductMat);
    duct1.rotation.x = Math.PI / 2;
    duct1.position.set(-6, 4.9, 0);
    scene.add(duct1);

    const duct2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 32, 16), ductMat);
    duct2.rotation.x = Math.PI / 2;
    duct2.position.set(6, 4.9, 0);
    scene.add(duct2);

    const ledHousingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
    const ledDiffuserMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });

    for (let x of [-10, -4, 4, 10]) {
        for (let z = -10; z <= 10; z += 6) {
            const fixture = new THREE.Group();
            const housing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 3.5), ledHousingMat);
            const tube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 3.4), ledDiffuserMat);
            tube.position.y = -0.06;
            fixture.add(housing);
            fixture.add(tube);

            const wireMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
            const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6), wireMat);
            wire1.position.set(0, 0.35, -1.4);
            const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6), wireMat);
            wire2.position.set(0, 0.35, 1.4);
            fixture.add(wire1);
            fixture.add(wire2);

            fixture.position.set(x, 4.8, z);
            scene.add(fixture);
        }
    }
}

function createAisleHangingSigns() {
    const signs = [
        { text: 'PASILLO 1: FRUTAS FRESCAS', sub: 'Manzanas • Naranjas • Plátanos • Cítricos', x: -5, z: -3, color: '#166534' },
        { text: 'PASILLO 2: HUERTA & VERDURAS', sub: 'Tomates • Zanahorias • Lechugas • Brócoli', x: 5, z: -3, color: '#15803d' },
        { text: 'PASILLO 3: GOURMET & BIO', sub: 'Paltas Hass • Berries • Tropicales', x: -5, z: 3, color: '#0f766e' },
        { text: 'PASILLO 4: REFRIGERADOS & LÁCTEOS', sub: 'Jugos Naturales • Ensaladas • Bebidas', x: 5, z: 3, color: '#0369a1' }
    ];

    signs.forEach(({ text, sub, x, z, color }) => {
        const signGroup = new THREE.Group();

        const cableGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.4);
        const cableMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
        const c1 = new THREE.Mesh(cableGeo, cableMat);
        c1.position.set(-1.2, 0.7, 0);
        const c2 = new THREE.Mesh(cableGeo, cableMat);
        c2.position.set(1.2, 0.7, 0);
        signGroup.add(c1);
        signGroup.add(c2);

        const signTex = createSignTexture(text, color, '#ffffff', sub);
        const signGeo = new THREE.BoxGeometry(3.0, 0.8, 0.06);
        const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3 });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signGroup.add(signMesh);

        signGroup.position.set(x, 4.2, z);
        scene.add(signGroup);
    });
}

// ===== ISLA CENTRAL DE FRUTERÍA Y VERDULERÍA =====
function createProduceIslandAisles() {
    createProduceDisplayTable(-5, 0, -6, 'manzanas', 'Manzana Fuji', '$1.890 / kg');
    createProduceDisplayTable(-5, 0, -2, 'manzanas_verdes', 'Manzana Granny Smith', '$2.190 / kg');
    createProduceDisplayTable(-5, 0, 2, 'naranjas', 'Naranja Valencia Jugo', '$1.490 / kg');
    createProduceDisplayTable(-5, 0, 6, 'platanos', 'Plátano de Canarias', '$1.790 / kg');

    createProduceDisplayTable(5, 0, -6, 'tomates', 'Tomate en Racimo', '$2.290 / kg');
    createProduceDisplayTable(5, 0, -2, 'zanahorias', 'Zanahorias de Huerta', '$1.190 / kg');
    createProduceDisplayTable(5, 0, 2, 'lechugas', 'Lechuga Hidropónica', '$1.350 / un');
    createProduceDisplayTable(5, 0, 6, 'paltas', 'Palta / Aguacate Hass', '$4.990 / kg');

    createProduceDisplayTable(-8, 0, 0, 'pimientos', 'Pimientos Tricolor', '$2.490 / kg');
    createProduceDisplayTable(8, 0, 0, 'uvas', 'Uvas de Mesa Sweet', '$3.290 / kg');
    createProduceDisplayTable(-8, 0, -4, 'limones', 'Limón Eureka Fresco', '$1.690 / kg');
    createProduceDisplayTable(8, 0, -4, 'frutillas', 'Frutillas Seleccionadas', '$2.890 / bandeja');
}

function createProduceDisplayTable(x, y, z, foodType, labelTitle, priceTag) {
    const tableGroup = new THREE.Group();

    const woodTexture = createWoodTexture();
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.65 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });

    const tableW = 2.4;
    const tableD = 1.3;
    const tableH = 0.95;

    const legGeo = new THREE.BoxGeometry(0.08, tableH, 0.08);
    const legPositions = [
        [-tableW/2 + 0.1, -tableD/2 + 0.1],
        [tableW/2 - 0.1, -tableD/2 + 0.1],
        [-tableW/2 + 0.1, tableD/2 - 0.1],
        [tableW/2 - 0.1, tableD/2 - 0.1]
    ];
    legPositions.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, tableH / 2, lz);
        leg.castShadow = true;
        tableGroup.add(leg);
    });

    const lowerBoard = new THREE.Mesh(new THREE.BoxGeometry(tableW - 0.1, 0.04, tableD - 0.1), woodMat);
    lowerBoard.position.set(0, 0.25, 0);
    lowerBoard.castShadow = true;
    tableGroup.add(lowerBoard);

    const topBoard = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.06, tableD), woodMat);
    topBoard.position.set(0, tableH, 0);
    topBoard.rotation.x = -0.16;
    topBoard.castShadow = true;
    topBoard.receiveShadow = true;
    tableGroup.add(topBoard);

    const acrylicMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        transmission: 0.8
    });
    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.14, 0.02), acrylicMat);
    frontRail.position.set(0, tableH + 0.08, tableD / 2 - 0.04);
    frontRail.rotation.x = -0.16;
    tableGroup.add(frontRail);

    const tagGroup = createDigitalPriceTag(labelTitle, priceTag);
    tagGroup.position.set(0, tableH + 0.18, tableD / 2 + 0.02);
    tableGroup.add(tagGroup);

    populateFoodOnTable(tableGroup, foodType, tableW, tableD, tableH);

    tableGroup.position.set(x, y, z);
    scene.add(tableGroup);
}

function createDigitalPriceTag(title, price) {
    const group = new THREE.Group();

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12), stemMat);
    stem.position.y = 0.06;
    group.add(stem);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 128, 38);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(price, 128, 86);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('CALIDAD BIO CERTIFICADA', 128, 114);

    const tagTex = new THREE.CanvasTexture(canvas);
    const tagMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.2, 0.02),
        new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.3 })
    );
    tagMesh.position.y = 0.15;
    group.add(tagMesh);

    return group;
}

// ===== ALIMENTOS ESCULPIDOS =====
function populateFoodOnTable(tableGroup, foodType, tableW, tableD, tableH) {
    const rows = 4;
    const cols = 7;
    const stepX = (tableW - 0.4) / cols;
    const stepZ = (tableD - 0.3) / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const food = createSculptedRealisticFood(foodType);

            const posX = -tableW / 2 + 0.25 + c * stepX + (Math.random() - 0.5) * 0.04;
            const posZ = -tableD / 2 + 0.2 + r * stepZ;
            const posY = tableH + 0.08 - Math.sin(-0.16) * posZ + (Math.random() * 0.02);

            food.position.set(posX, posY, posZ);
            food.rotation.x = -0.16;
            food.rotation.y = Math.random() * Math.PI * 2;
            food.rotation.z = (Math.random() - 0.5) * 0.15;

            const baseFreshness = 0.88 + Math.random() * 0.11;
            const displayName = getFoodDisplayName(foodType);

            food.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData = {
                        isFood: true,
                        foodType: foodType,
                        freshness: baseFreshness,
                        scannedName: displayName
                    };
                    foodItems.push(child);
                }
            });

            tableGroup.add(food);
        }
    }
}

function getFoodDisplayName(type) {
    const map = {
        manzanas: 'Manzana Fuji Premium',
        manzanas_verdes: 'Manzana Granny Smith',
        naranjas: 'Naranja Valencia',
        platanos: 'Plátano de Canarias',
        tomates: 'Tomate en Racimo',
        zanahorias: 'Zanahoria de Campo',
        lechugas: 'Lechuga Hidropónica',
        paltas: 'Palta / Aguacate Hass',
        pimientos: 'Pimiento Morrón',
        uvas: 'Uvas de Mesa Sweet',
        limones: 'Limón Eureka Fresco',
        frutillas: 'Frutillas Seleccionadas'
    };
    return map[type] || 'Fruta / Verdura Fresca';
}

function createSculptedRealisticFood(type) {
    const group = new THREE.Group();

    switch (type) {
        case 'manzanas': {
            const appleGeo = new THREE.SphereGeometry(0.094, 28, 28);
            const pos = appleGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                const len = Math.sqrt(x * x + z * z);
                const theta = Math.atan2(z, x);

                if (y > 0.05) pos.setY(i, y - (1 - len / 0.09) * 0.022);
                if (y < -0.05) pos.setY(i, y + (1 - len / 0.09) * 0.018);
                const factorY = (y + 0.1) / 0.2;
                const scaleXZ = 0.88 + factorY * 0.22 + Math.sin(theta * 5) * 0.02;
                pos.setX(i, x * scaleXZ);
                pos.setZ(i, z * scaleXZ);
            }
            appleGeo.computeVertexNormals();

            const appleMat = new THREE.MeshStandardMaterial({ color: 0xc81e2b, roughness: 0.24, metalness: 0.08 });
            group.add(new THREE.Mesh(appleGeo, appleMat));

            const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.045, 8), stemMat);
            stem.position.set(0.006, 0.088, 0);
            stem.rotation.z = 0.2;
            group.add(stem);
            break;
        }

        case 'manzanas_verdes': {
            const greenGeo = new THREE.SphereGeometry(0.092, 28, 28);
            const pos = greenGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                const len = Math.sqrt(x * x + z * z);
                const theta = Math.atan2(z, x);

                if (y > 0.05) pos.setY(i, y - (1 - len / 0.09) * 0.02);
                if (y < -0.05) pos.setY(i, y + (1 - len / 0.09) * 0.015);
                const factorY = (y + 0.1) / 0.2;
                const scaleXZ = 0.88 + factorY * 0.2 + Math.sin(theta * 5) * 0.015;
                pos.setX(i, x * scaleXZ);
                pos.setZ(i, z * scaleXZ);
            }
            greenGeo.computeVertexNormals();

            const greenMat = new THREE.MeshStandardMaterial({ color: 0x5ea500, roughness: 0.22, metalness: 0.04 });
            group.add(new THREE.Mesh(greenGeo, greenMat));

            const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.04, 8), stemMat);
            stem.position.set(0.004, 0.086, 0);
            stem.rotation.z = -0.15;
            group.add(stem);
            break;
        }

        case 'naranjas': {
            const orangeGeo = new THREE.SphereGeometry(0.098, 24, 24);
            const pos = orangeGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setY(i, pos.getY(i) * 0.92);
                pos.setX(i, pos.getX(i) * 1.03);
                pos.setZ(i, pos.getZ(i) * 1.03);
            }
            orangeGeo.computeVertexNormals();

            const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.42, metalness: 0.04 });
            group.add(new THREE.Mesh(orangeGeo, orangeMat));

            const calyxMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
            const calyx = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.008, 6), calyxMat);
            calyx.position.y = 0.09;
            group.add(calyx);

            const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 });
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.006, 0.022), leafMat);
            leaf.position.set(0.025, 0.096, 0);
            leaf.rotation.z = -0.35;
            group.add(leaf);
            break;
        }

        case 'platanos': {
            const bananaMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45, metalness: 0.02 });
            const darkTipMat = new THREE.MeshStandardMaterial({ color: 0x3d1a04, roughness: 0.9 });
            const crownMat = new THREE.MeshStandardMaterial({ color: 0x4d380f, roughness: 0.9 });

            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.06, 8), crownMat);
            crown.position.set(-0.13, 0.04, 0);
            crown.rotation.z = Math.PI / 3;
            group.add(crown);

            for (let b = 0; b < 4; b++) {
                const angleOffset = (b - 1.5) * 0.22;
                const zOffset = (b - 1.5) * 0.042;
                const curve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-0.12, 0.03, zOffset),
                    new THREE.Vector3(-0.05, 0.048 + Math.cos(angleOffset) * 0.01, zOffset * 0.8),
                    new THREE.Vector3(0.01, 0.052, zOffset * 0.7),
                    new THREE.Vector3(0.08, 0.032, zOffset * 0.9),
                    new THREE.Vector3(0.14, 0.005, zOffset)
                ]);
                const bananaGeo = new THREE.TubeGeometry(curve, 18, 0.027, 5, false);
                group.add(new THREE.Mesh(bananaGeo, bananaMat));

                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.022, 5), darkTipMat);
                tip.position.set(0.142, 0.004, zOffset);
                tip.rotation.z = -Math.PI / 3;
                group.add(tip);
            }
            break;
        }

        case 'tomates': {
            const tomatoGeo = new THREE.SphereGeometry(0.09, 24, 24);
            const pos = tomatoGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                const theta = Math.atan2(z, x);
                const lobeFactor = 1.0 + Math.sin(theta * 5) * 0.035;
                pos.setX(i, x * lobeFactor);
                pos.setZ(i, z * lobeFactor);
                pos.setY(i, y * 0.86);
            }
            tomatoGeo.computeVertexNormals();

            const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.16, metalness: 0.08 });
            group.add(new THREE.Mesh(tomatoGeo, tomatoMat));

            const sepalMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
            for (let s = 0; s < 5; s++) {
                const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.042, 4), sepalMat);
                sepal.position.set(0, 0.076, 0);
                sepal.rotation.z = Math.PI / 2.2;
                sepal.rotation.y = (s * Math.PI * 2) / 5;
                group.add(sepal);
            }

            const vineMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.5 });
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.035, 6), vineMat);
            vine.position.set(0, 0.095, 0);
            vine.rotation.z = 0.25;
            group.add(vine);
            break;
        }

        case 'zanahorias': {
            const carrotGeo = new THREE.ConeGeometry(0.032, 0.25, 16);
            const pos = carrotGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const y = pos.getY(i);
                const ringFactor = 1.0 + Math.sin(y * 60) * 0.03;
                pos.setX(i, pos.getX(i) * ringFactor);
                pos.setZ(i, pos.getZ(i) * ringFactor);
            }
            carrotGeo.computeVertexNormals();

            const carrotMat = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.48 });
            const carrot = new THREE.Mesh(carrotGeo, carrotMat);
            carrot.rotation.z = Math.PI / 2;
            group.add(carrot);

            const greensMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.5 });
            for (let f = 0; f < 4; f++) {
                const leafStem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.12, 6), greensMat);
                leafStem.position.set(-0.17, Math.sin(f) * 0.02, Math.cos(f) * 0.02);
                leafStem.rotation.z = Math.PI / 2 + (f - 1.5) * 0.15;
                group.add(leafStem);
            }
            break;
        }

        case 'lechugas': {
            const coreMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.6 });
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), coreMat);
            core.scale.set(1.1, 0.75, 1.1);
            group.add(core);

            const outerMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
            for (let l = 0; l < 8; l++) {
                const angle = (l * Math.PI * 2) / 8;
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), outerMat);
                leaf.position.set(Math.cos(angle) * 0.045, 0.03, Math.sin(angle) * 0.045);
                leaf.scale.set(1.3, 0.45, 1.1);
                leaf.rotation.y = angle;
                leaf.rotation.x = 0.3;
                group.add(leaf);
            }
            break;
        }

        case 'paltas': {
            const avoGeo = new THREE.SphereGeometry(0.08, 20, 20);
            const pos = avoGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                const neckFactor = y > 0 ? (1.0 - (y / 0.08) * 0.35) : (1.0 + Math.abs(y / 0.08) * 0.15);
                pos.setX(i, x * neckFactor);
                pos.setZ(i, z * neckFactor);
                pos.setY(i, y * 1.15);
            }
            avoGeo.computeVertexNormals();

            const avoMat = new THREE.MeshStandardMaterial({ color: 0x1b2712, roughness: 0.88, metalness: 0.04 });
            group.add(new THREE.Mesh(avoGeo, avoMat));

            const stemButton = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.012, 0.015, 6),
                new THREE.MeshStandardMaterial({ color: 0x451a03 })
            );
            stemButton.position.y = 0.092;
            group.add(stemButton);
            break;
        }

        case 'pimientos': {
            const colors = [0xdc2626, 0xeab308, 0x16a34a];
            const pColor = colors[Math.floor(Math.random() * colors.length)];

            const pepperGeo = new THREE.BoxGeometry(0.12, 0.15, 0.12, 8, 8, 8);
            const pos = pepperGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                const theta = Math.atan2(z, x);
                const lobe = 1.0 + Math.sin(theta * 4) * 0.12;
                pos.setX(i, x * lobe);
                pos.setZ(i, z * lobe);
                if (y > 0.05) {
                    const r = Math.sqrt(x * x + z * z);
                    if (r < 0.035) pos.setY(i, y - 0.02);
                }
            }
            pepperGeo.computeVertexNormals();

            const pepperMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.22, metalness: 0.08 });
            group.add(new THREE.Mesh(pepperGeo, pepperMat));

            const pedicelMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.045, 6), pedicelMat);
            stem.position.set(0, 0.082, 0);
            stem.rotation.z = 0.2;
            group.add(stem);
            break;
        }

        case 'uvas': {
            const grapeMat = new THREE.MeshStandardMaterial({ color: 0x4a044e, roughness: 0.24, metalness: 0.08 });
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9 });

            const centralStem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.16, 6), stemMat);
            centralStem.position.y = -0.04;
            group.add(centralStem);

            for (let g = 0; g < 24; g++) {
                const layer = Math.floor(g / 6);
                const radius = 0.05 * (1 - layer * 0.22);
                const angle = (g * 1.3);
                const grape = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), grapeMat);
                grape.scale.set(1.0, 1.15, 1.0);
                grape.position.set(
                    Math.cos(angle) * radius,
                    -layer * 0.028 + (Math.random() - 0.5) * 0.01,
                    Math.sin(angle) * radius
                );
                group.add(grape);
            }
            break;
        }

        case 'limones': {
            const lemonGeo = new THREE.SphereGeometry(0.075, 20, 20);
            const pos = lemonGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.setZ(i, pos.getZ(i) * 1.35);
            }
            lemonGeo.computeVertexNormals();

            const lemonMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.38, metalness: 0.05 });
            group.add(new THREE.Mesh(lemonGeo, lemonMat));
            break;
        }

        case 'frutillas': {
            const berryGeo = new THREE.ConeGeometry(0.045, 0.09, 14);
            berryGeo.rotateX(Math.PI);
            const berryMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, metalness: 0.05 });
            group.add(new THREE.Mesh(berryGeo, berryMat));

            const capMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
            const cap = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.015, 6), capMat);
            cap.position.y = 0.048;
            group.add(cap);
            break;
        }

        default: {
            const defMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 });
            group.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), defMat));
        }
    }

    return group;
}

// ===== ESTANTERÍAS DE PASILLOS LATERALES =====
function createGroceryAisleShelves() {
    createAisleGondola(-13, 0, -5);
    createAisleGondola(-13, 0, 3);
    createAisleGondola(13, 0, -5);
    createAisleGondola(13, 0, 3);
}

function createAisleGondola(x, y, z) {
    const gondola = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

    const w = 5.2;
    const h = 2.2;
    const d = 0.9;

    const divider = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), metalMat);
    divider.position.y = h / 2;
    gondola.add(divider);

    const levels = [0.4, 0.9, 1.4, 1.9];
    levels.forEach(lvl => {
        const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), shelfMat);
        shelfMesh.position.y = lvl;
        shelfMesh.castShadow = true;
        shelfMesh.receiveShadow = true;
        gondola.add(shelfMesh);

        const items = 14;
        for (let i = 0; i < items; i++) {
            const boxColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
            const pMat = new THREE.MeshStandardMaterial({ color: boxColors[i % boxColors.length], roughness: 0.4 });
            const pBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.14), pMat);
            pBox.position.set(-w / 2 + 0.35 + i * 0.35, lvl + 0.15, (Math.random() > 0.5 ? 0.25 : -0.25));
            pBox.castShadow = true;
            gondola.add(pBox);
        }
    });

    gondola.position.set(x, y, z);
    scene.add(gondola);
}

// ===== NEVERAS MURALES =====
function createRefrigeratedCoolers() {
    const coolerGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, transmission: 0.9, ior: 1.5 });
    const coolLedMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.2 });

    const coolerWidth = 18;
    const coolerHeight = 3.2;

    const back = new THREE.Mesh(new THREE.BoxGeometry(coolerWidth, coolerHeight, 0.8), frameMat);
    back.position.set(0, coolerHeight / 2, -15.4);
    coolerGroup.add(back);

    const doorCount = 8;
    const doorW = coolerWidth / doorCount;
    for (let i = 0; i < doorCount; i++) {
        const door = new THREE.Mesh(new THREE.PlaneGeometry(doorW - 0.05, coolerHeight - 0.3), glassMat);
        door.position.set(-coolerWidth / 2 + doorW / 2 + i * doorW, coolerHeight / 2, -14.98);
        coolerGroup.add(door);

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8), frameMat);
        handle.position.set(-coolerWidth / 2 + (i + 1) * doorW - 0.08, coolerHeight / 2, -14.95);
        coolerGroup.add(handle);
    }

    for (let h of [0.8, 1.6, 2.4]) {
        const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(coolerWidth - 0.4, 0.03, 0.03), coolLedMat);
        ledStrip.position.set(0, h, -15.0);
        coolerGroup.add(ledStrip);
    }

    const coolerSignTex = createSignTexture('ZONA REFRIGERADA & LÁCTEOS', '#0369a1', '#ffffff', 'Jugos Frescos • Yogurts • Bebidas');
    const coolerSign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.2), new THREE.MeshStandardMaterial({ map: coolerSignTex }));
    coolerSign.position.set(0, coolerHeight + 0.7, -15.4);
    coolerGroup.add(coolerSign);

    scene.add(coolerGroup);
}

// ===== CAJAS DE COBRO =====
function createCheckoutLanes() {
    const lanePositions = [-6, 0, 6];

    lanePositions.forEach(lx => {
        const lane = new THREE.Group();
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
        const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 3.2), counterMat);
        base.position.set(0, 0.45, 12);
        base.castShadow = true;
        lane.add(base);

        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 2.8), beltMat);
        belt.position.set(-0.25, 0.92, 12);
        lane.add(belt);

        const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x22c55e, emissiveIntensity: 0.35 });
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.04), screenMat);
        screen.position.set(0.5, 1.25, 11.2);
        screen.rotation.y = -0.4;
        lane.add(screen);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5), counterMat);
        pole.position.set(0.7, 1.25, 13.2);
        lane.add(pole);

        const laneNumMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8 });
        const laneSign = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.08), laneNumMat);
        laneSign.position.set(0.7, 2.5, 13.2);
        lane.add(laneSign);

        scene.add(lane);
    });
}

// ===== PERSONAS QUE CAMINAN HACIA ADELANTE CON CARROS =====
function createShoppersAndStaff() {
    const peopleConfig = [
        { x: -3.5, z: -5.5, rot: 1.8, outfit: 0x0284c7, hair: 0x3e2723, role: 'caminante', hasCart: true, walkSpeed: 0.18 },
        { x: 3.2, z: -2.2, rot: -1.2, outfit: 0xd97706, hair: 0x1f2937, role: 'caminante', hasCart: true, walkSpeed: 0.15 },
        { x: -3.2, z: 2.2, rot: 1.5, outfit: 0x059669, hair: 0x4a154b, role: 'caminante', hasCart: true, walkSpeed: 0.13 },
        { x: 3.5, z: 5.8, rot: -0.8, outfit: 0x7c3aed, hair: 0x78350f, role: 'caminante', hasCart: true, walkSpeed: 0.2 },
        { x: -10, z: -4, rot: 0.6, outfit: 0xe11d48, hair: 0x18181b, role: 'caminante', hasCart: true, walkSpeed: 0.16 },
        { x: 10, z: 3, rot: -0.4, outfit: 0x475569, hair: 0x451a03, role: 'caminante', hasCart: true, walkSpeed: 0.19 },
        { x: -0.2, z: 10.8, rot: 0.0, outfit: 0x15803d, hair: 0x1e293b, role: 'cajero', hasCart: false, walkSpeed: 0 },
        { x: 0, z: 13.5, rot: Math.PI, outfit: 0x4338ca, hair: 0x581c87, role: 'cliente_pago', hasCart: false, walkSpeed: 0 },
        { x: -9, z: 8, rot: -0.9, outfit: 0xb45309, hair: 0x27272a, role: 'caminante', hasCart: true, walkSpeed: 0.15 },
        { x: 7, z: -7, rot: 0.3, outfit: 0x0ea5e9, hair: 0x292524, role: 'caminante', hasCart: true, walkSpeed: 0.17 },
        { x: -6, z: 6, rot: -0.5, outfit: 0xdc2626, hair: 0x1c1917, role: 'caminante', hasCart: true, walkSpeed: 0.14 }
    ];

    peopleConfig.forEach(cfg => {
        const person = createRealisticHumanFigure(cfg.outfit, cfg.hair, cfg.role);
        person.position.set(cfg.x, 0, cfg.z);
        person.rotation.y = cfg.rot;
        person.userData.originalRotY = cfg.rot;
        person.userData.role = cfg.role;
        person.userData.walkSpeed = cfg.walkSpeed;
        person.userData.baseX = cfg.x;
        person.userData.baseZ = cfg.z;
        person.userData.walkPhase = Math.random() * Math.PI * 2; // Fase aleatoria para desincronizar

        // Agregar carrito de supermercado si corresponde
        if (cfg.hasCart) {
            const cart = createRealisticCartMesh();
            cart.scale.set(0.9, 0.9, 0.9);
            cart.position.set(0, 0, 0.55);
            person.add(cart);
        }

        peopleList.push(person);
        scene.add(person);
    });
}

function createRealisticHumanFigure(shirtColor, hairColor, role) {
    const person = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    person.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), hairMat);
    hair.position.set(0, 1.66, -0.02);
    hair.scale.set(1.02, 0.9, 1.05);
    person.add(hair);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.65, 12), shirtMat);
    torso.position.y = 1.2;
    torso.castShadow = true;
    person.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08), skinMat);
    neck.position.y = 1.52;
    person.add(neck);

    // Brazos con pivote en el hombro para animación de caminata
    const armMat = shirtMat;
    const leftArm = new THREE.Group();
    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.55), armMat);
    leftArmMesh.position.y = -0.275;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    leftArm.position.set(-0.24, 1.45, 0);
    person.add(leftArm);

    const rightArm = new THREE.Group();
    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.55), armMat);
    rightArmMesh.position.y = -0.275;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    rightArm.position.set(0.24, 1.45, 0);
    person.add(rightArm);

    if (role === 'cliente_examinando') {
        rightArm.rotation.x = -Math.PI / 3;
        const appleInHand = createSculptedRealisticFood('manzanas');
        appleInHand.scale.set(0.8, 0.8, 0.8);
        appleInHand.position.set(0, -0.55, 0.1);
        rightArm.add(appleInHand);
    } else if (role === 'cajero') {
        leftArm.rotation.x = -Math.PI / 4;
        rightArm.rotation.x = -Math.PI / 4;
    }

    // Piernas con pivote en la cadera para animación de caminata
    const leftLeg = new THREE.Group();
    const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.75), pantsMat);
    leftLegMesh.position.y = -0.375;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), shoeMat);
    leftShoe.position.set(0, -0.75, 0.04);
    leftLeg.add(leftShoe);
    leftLeg.position.set(-0.1, 0.85, 0);
    person.add(leftLeg);

    const rightLeg = new THREE.Group();
    const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.75), pantsMat);
    rightLegMesh.position.y = -0.375;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), shoeMat);
    rightShoe.position.set(0, -0.75, 0.04);
    rightLeg.add(rightShoe);
    rightLeg.position.set(0.1, 0.85, 0);
    person.add(rightLeg);

    // Guardar referencias para animación
    person.userData.leftArm = leftArm;
    person.userData.rightArm = rightArm;
    person.userData.leftLeg = leftLeg;
    person.userData.rightLeg = rightLeg;

    return person;
}

// ===== CARRITOS Y CANASTAS =====
function createShoppingCartsAndBaskets() {
    const cart1 = createRealisticCartMesh();
    cart1.position.set(3.2, 0, -1.3);
    cart1.rotation.y = -Math.PI / 2;
    scene.add(cart1);

    const cart2 = createRealisticCartMesh();
    cart2.position.set(-1.5, 0, 4.5);
    cart2.rotation.y = 0.5;
    scene.add(cart2);

    const basketGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
        const bMat = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xdc2626 : 0x16a34a,
            roughness: 0.5
        });
        const basket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.32), bMat);
        basket.position.y = 0.12 + i * 0.08;
        basketGroup.add(basket);
    }
    basketGroup.position.set(-4, 0, 13);
    scene.add(basketGroup);
}

function createRealisticCartMesh() {
    const cart = new THREE.Group();

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.2 });
    const redGripMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    const basketGeo = new THREE.BoxGeometry(0.65, 0.45, 0.9);
    const basketMesh = new THREE.Mesh(basketGeo, chromeMat);
    basketMesh.position.y = 0.72;
    basketMesh.castShadow = true;
    cart.add(basketMesh);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.85), chromeMat);
    chassis.position.y = 0.22;
    cart.add(chassis);

    const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
    [[-0.24, -0.36], [0.24, -0.36], [-0.24, 0.36], [0.24, 0.36]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.06, wz);
        cart.add(wheel);
    });

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), redGripMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.98, -0.46);
    cart.add(handle);

    const bagMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const groceryBag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.25), bagMat);
    groceryBag.position.set(0.1, 0.75, 0.1);
    cart.add(groceryBag);

    return cart;
}

// ===== SISTEMA DE NEBLINA =====
function createVegetableMistingSystem() {
    const mistGeo = new THREE.BufferGeometry();
    const count = 120;
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        pos[i * 3] = 5 + (Math.random() - 0.5) * 2.2;
        pos[i * 3 + 1] = 1.05 + Math.random() * 0.35;
        pos[i * 3 + 2] = 2 + (Math.random() - 0.5) * 1.2;
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mistMat = new THREE.PointsMaterial({
        color: 0xe0f2fe,
        size: 0.04,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });

    mistParticles = new THREE.Points(mistGeo, mistMat);
    scene.add(mistParticles);
}

// ===== CARGA GLB =====
function loadBandaGLB() {
    const loader = new GLTFLoader();

    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(-11, 0, 8);

    const baseGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.9, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const pedestalMesh = new THREE.Mesh(baseGeo, baseMat);
    pedestalMesh.position.y = 0.45;
    pedestalGroup.add(pedestalMesh);

    const ringGeo = new THREE.RingGeometry(0.72, 0.78, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
    const glowRing = new THREE.Mesh(ringGeo, ringMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.91;
    pedestalGroup.add(glowRing);

    const kioskSignTex = createSignTexture('NEUROSCAN™ AR DOCK', '#064e3b', '#00ff88', 'Anteojos Inteligentes con Visión IA');
    const kioskSign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshStandardMaterial({ map: kioskSignTex }));
    kioskSign.position.set(0, 1.8, 0);
    pedestalGroup.add(kioskSign);

    scene.add(pedestalGroup);

    loader.load(
        'assets/banda-optimizada.glb',
        (gltf) => {
            console.log('[GLTF] Modelo banda-optimizada.glb cargado exitosamente');
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            model.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 0.75;
            const scale = targetSize / (maxDim || 1);
            model.scale.set(scale, scale, scale);

            model.position.y = 1.15;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.metalness = 0.8;
                        child.material.roughness = 0.25;
                    }
                }
            });

            glbModelGroup = model;
            pedestalGroup.add(model);
        },
        undefined,
        (error) => {
            console.warn('[GLTF] Nota sobre carga de GLB:', error.message || error);
        }
    );
}

// ===== TARGET BOX HOLOGRÁFICA 3D AR =====
function setupHolographicTargetBox() {
    const boxGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.85
    });

    holoBox = new THREE.LineSegments(wireGeo, boxMat);
    holoBox.visible = false;
    scene.add(holoBox);
}

function updateHolographicTargetBox(target) {
    if (!target) {
        if (holoBox) holoBox.visible = false;
        return;
    }

    const worldPos = new THREE.Vector3();
    target.getWorldPosition(worldPos);

    holoBox.position.copy(worldPos);
    holoBox.rotation.y += 0.02;
    holoBox.visible = true;

    if (isScanning) {
        holoBox.material.color.setHex(0x00e5ff);
    } else {
        holoBox.material.color.setHex(0x00ff88);
    }
}

// ===== EVENTOS Y CONTROLES HUMANOS =====
function setupEvents() {
    window.addEventListener('resize', onResize);

    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        if (e.code === 'KeyM') {
            const active = voice.toggle();
            const btn = document.getElementById('btnVoiceToggle');
            if (btn) btn.textContent = active ? '🔊 Voz Activa' : '🔇 Voz Muteada';
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Desplazamiento sutil hacia adelante/atrás con rueda (movimiento humano suave horizontal, sin rebotes)
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0; // Desplazamiento horizontal para no alterar la altura humana
        dir.normalize();

        const step = (e.deltaY < 0 ? 1 : -1) * 0.12; // Pequeño paso suave sin saltos violentos
        camera.position.addScaledVector(dir, step);
        controls.target.addScaledVector(dir, step);

        clampCameraBounds();
    }, { passive: false });

    // Rotación libre de cámara en 3 ejes con mouse (yaw, pitch, roll)
    window.addEventListener('pointerdown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        if (voice) voice.resumeAudio();
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // Yaw (rotación horizontal eje Y) - 360° completo
        cameraRotation.yaw -= deltaX * CONFIG.camera.rotationSpeed;

        // Pitch (rotación vertical eje X) - limitado para no marear (-80° a +80°)
        cameraRotation.pitch -= deltaY * CONFIG.camera.rotationSpeed;
        cameraRotation.pitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, cameraRotation.pitch));

        // Roll (inclinación lateral eje Z) - sutil (-15° a +15°)
        cameraRotation.roll = Math.sin(cameraRotation.yaw * 0.5) * 0.02;
        cameraRotation.roll = Math.max(-Math.PI * 0.08, Math.min(Math.PI * 0.08, cameraRotation.roll));

        // Actualizar rotación de cámara
        camera.rotation.order = 'YXZ';
        camera.rotation.y = cameraRotation.yaw;
        camera.rotation.x = cameraRotation.pitch;
        camera.rotation.z = cameraRotation.roll;
    });

    // Scroll para avanzar/retroceder en el espacio
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        const step = (e.deltaY < 0 ? 1 : -1) * 0.12;
        camera.position.addScaledVector(dir, step);
        clampCameraBounds();
    }, { passive: false });
}

function setupQuickHUDButtons() {
    const btnReset = document.getElementById('btnResetView');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            camera.position.set(CONFIG.camera.position.x, CONFIG.camera.eyeHeight, CONFIG.camera.position.z);
            controls.target.set(CONFIG.camera.target.x, CONFIG.camera.eyeHeight, CONFIG.camera.target.z);
            dismissCurrentFoodAnalysis();
        });
    }

    const btnScan = document.getElementById('btnScanTarget');
    if (btnScan) {
        btnScan.addEventListener('click', () => {
            if (currentTarget) {
                startScanning(currentTarget);
            } else if (foodItems.length > 0) {
                startScanning(foodItems[0]);
            }
        });
    }
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== LOOP PRINCIPAL DE ANIMACIÓN =====
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    updateHumanWalkingMovement(delta);
    updateRaycastingAndGaze(delta);

    // Aplicar rotación de cámara (yaw, pitch, roll)
    camera.rotation.order = 'YXZ';
    camera.rotation.y = cameraRotation.yaw;
    camera.rotation.x = cameraRotation.pitch;
    camera.rotation.z = cameraRotation.roll;

    // Mantener altura fija a nivel de ojos (sin forzar, solo clamp)
    clampCameraBounds();

    if (glbModelGroup) {
        glbModelGroup.rotation.y = elapsed * 0.4;
    }

    peopleList.forEach((person, idx) => {
        // Animación de caminar hacia adelante en la dirección que miran
        if (person.userData.walkSpeed > 0) {
            // Dirección de mirada (hacia adelante según rotación Y)
            const forwardX = Math.sin(person.userData.originalRotY);
            const forwardZ = Math.cos(person.userData.originalRotY);

            // Movimiento hacia adelante a velocidad moderada
            const walkDistance = elapsed * person.userData.walkSpeed;
            person.position.x = person.userData.baseX + forwardX * walkDistance;
            person.position.z = person.userData.baseZ + forwardZ * walkDistance;

            // Mantener siempre la dirección de mirada hacia adelante
            person.rotation.y = person.userData.originalRotY;

            // Animación de caminata realista - frecuencia moderada
            const walkCycle = elapsed * 2.2 + person.userData.walkPhase;

            // Piernas: movimiento alternado
            if (person.userData.leftLeg && person.userData.rightLeg) {
                person.userData.leftLeg.rotation.x = Math.sin(walkCycle) * 0.45;
                person.userData.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.45;
            }

            // Brazos: movimiento alternado opuesto a las piernas
            if (person.userData.leftArm && person.userData.rightArm) {
                person.userData.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
                person.userData.rightArm.rotation.x = Math.sin(walkCycle) * 0.3;
            }

            // Balanceo vertical sutil
            person.position.y = Math.abs(Math.sin(walkCycle)) * 0.02;

            // Inclinación lateral sutil
            person.rotation.z = Math.sin(walkCycle) * 0.025;
        } else {
            // Personas estáticas (cajero, cliente en caja)
            person.position.y = Math.sin(elapsed * 2 + idx) * 0.005;
            person.rotation.y = person.userData.originalRotY + Math.sin(elapsed * 0.8 + idx) * 0.04;
        }
    });

    if (particles) {
        particles.update(delta, elapsed);
    }

    if (mistParticles) {
        const positions = mistParticles.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] += 0.0015;
            if (positions[i] > 1.45) positions[i] = 1.05;
        }
        mistParticles.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

// ===== MOVIMIENTO HUMANO PAUSADO Y FLUIDO =====
function updateHumanWalkingMovement(delta) {
    const inputDir = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp']) inputDir.z -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) inputDir.z += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) inputDir.x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) inputDir.x += 1;

    const isInputActive = inputDir.lengthSq() > 0;

    if (isInputActive) {
        inputDir.normalize();
        inputDir.applyQuaternion(camera.quaternion);
        inputDir.y = 0; // Caminata sobre el suelo horizontal
        inputDir.normalize();

        const targetSpeed = CONFIG.movement.walkSpeed;
        inputDir.multiplyScalar(targetSpeed);
    }

    // Inercia suave (aceleración y desaceleración fluida tipo paso humano)
    const damping = Math.min(1.0, delta * 7.0);
    moveVelocity.lerp(inputDir, damping);

    if (moveVelocity.lengthSq() > 0.0001) {
        const step = moveVelocity.clone().multiplyScalar(delta);
        camera.position.add(step);
        controls.target.add(step);
        clampCameraBounds();
    }
}

function clampCameraBounds() {
    camera.position.x = Math.max(-16, Math.min(16, camera.position.x));
    camera.position.z = Math.max(-14, Math.min(14, camera.position.z));
    camera.position.y = CONFIG.camera.eyeHeight;
}

// ===== SISTEMA DE MIRADA Y RAYCASTING (APARTAR LA VISTA DETIENE EL AUDIO) =====
function updateRaycastingAndGaze(delta) {
    if (isScanning) {
        updateScanning(delta);
        return;
    }

    // Raycast desde la retícula central (POV de los anteojos)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    // recursive: true es necesario porque los alimentos son Groups con meshes hijos
    const intersects = raycaster.intersectObjects(foodItems, true);

    if (intersects.length > 0) {
        const target = intersects[0].object;
        const foodType = target?.userData?.foodType;

        // Si cambia a otro alimento diferente, actualiza el objetivo
        if (currentTarget !== target) {
            // Si estaba analizando otro alimento previamente, se descarta para dar paso al nuevo
            if (activeScanningTarget && activeScanningTarget.userData?.foodType !== foodType) {
                dismissCurrentFoodAnalysis();
            }

            currentTarget = target;
            dwellTimer = 0;

            if (!isShowingInfo) {
                hud.setReticleState('detected', foodType);
                if (voice) voice.playLockOn();
            }
        }

        updateHolographicTargetBox(target);

        // Si aún no está mostrando la información, avanza el tiempo de fijar la vista
        if (!isShowingInfo) {
            dwellTimer += delta;

            if (dwellTimer >= CONFIG.scan.dwellTime) {
                startScanning(target);
            } else {
                const progress = dwellTimer / CONFIG.scan.dwellTime;
                hud.showScanProgress(progress);
            }
        }
    } else {
        // ¡EL USUARIO APARTÓ LA VISTA DEL ALIMENTO!
        // Deja de analizar ese alimento de inmediato, oculta el panel y CORTA EL AUDIO DE INMEDIATO
        if (currentTarget || isShowingInfo || isScanning) {
            dismissCurrentFoodAnalysis();
        }
    }
}

/**
 * Cancela el análisis, apaga el audio de voz de inmediato y restablece el HUD
 * cuando el usuario aparta la vista del alimento.
 */
function dismissCurrentFoodAnalysis() {
    currentTarget = null;
    activeScanningTarget = null;
    dwellTimer = 0;
    isScanning = false;
    isShowingInfo = false;

    if (hud) {
        hud.hideInfoPanel();
        hud.hideScanIndicator();
        hud.hideScanProgress();
        hud.setReticleState('normal');
    }

    if (voice) {
        voice.stop(); // Corta el audio en el instante exacto en que se aparta la vista
    }

    updateHolographicTargetBox(null);
}

function startScanning(target) {
    if (!target) return;

    activeScanningTarget = target;
    currentTarget = target;
    isScanning = true;
    isShowingInfo = false;
    scanProgress = 0;

    const foodType = target.userData?.foodType || 'naranjas';

    hud.setReticleState('scanning', foodType);
    hud.showScanIndicator();

    if (voice) {
        voice.playScanSweep();
    }

    const worldPos = new THREE.Vector3();
    target.getWorldPosition(worldPos);

    const freshness = target.userData?.freshness || 0.92;
    particles.emit(worldPos, target, freshness);
}

function updateScanning(delta) {
    scanProgress += delta / 1.5;

    if (scanProgress >= 1) {
        completeScanning();
    } else {
        hud.updateScanProgress(scanProgress);
        updateHolographicTargetBox(activeScanningTarget || currentTarget);
    }
}

function completeScanning() {
    isScanning = false;
    isShowingInfo = true;
    scanProgress = 0;

    hud.hideScanIndicator();

    const target = activeScanningTarget || currentTarget;
    const foodType = target?.userData?.foodType || 'naranjas';

    const dataConfigs = {
        manzanas: {
            name: 'Manzana Fuji Premium',
            variety: 'Cosecha Selección Especial — Fundo El Roble',
            score: '96% ÓPTIMO',
            freshness: '96% — ALTA',
            freshnessClass: 'green',
            ripeness: 'MADURACIÓN ÓPTIMA',
            evolution: '2–3 DÍAS (Consumo recomendado)',
            organic: '0.00 ppm (Certificado BIO)'
        },
        manzanas_verdes: {
            name: 'Manzana Granny Smith',
            variety: 'Acidez y firmeza crujiente intactas — Grado A+',
            score: '98% ÓPTIMO',
            freshness: '98% — EXCELENTE',
            freshnessClass: 'green',
            ripeness: 'FIRMEZA MÁXIMA',
            evolution: '5–7 DÍAS',
            organic: '0.00 ppm (Cultivo Libre de Ceras)'
        },
        naranjas: {
            name: 'Naranja Valencia Jugo',
            variety: 'Alto contenido de zumo natural y vitamina C activa',
            score: '95% ÓPTIMO',
            freshness: '95% — ALTA',
            freshnessClass: 'green',
            ripeness: 'EN SU PUNTO',
            evolution: '4–5 DÍAS',
            organic: '0.01 ppm (Seguro)'
        },
        platanos: {
            name: 'Plátano de Canarias',
            variety: 'Punto dulce con motas de azúcar natural',
            score: '88% DULCE',
            freshness: '88% — MEDIA',
            freshnessClass: 'yellow',
            ripeness: 'MADURACIÓN COMPLETA',
            evolution: '1–2 DÍAS (Consumir pronto)',
            organic: '0.00 ppm (Comercio Justo)'
        },
        tomates: {
            name: 'Tomate en Racimo',
            variety: 'Tallo verde turgente, rico en licopeno activo',
            score: '97% ÓPTIMO',
            freshness: '97% — EXCELENTE',
            freshnessClass: 'green',
            ripeness: 'EN SU PUNTO',
            evolution: '3–4 DÍAS',
            organic: '0.00 ppm (Bio Residuos Cero)'
        },
        zanahorias: {
            name: 'Zanahoria de Campo',
            variety: 'Textura crujiente, altísimo betacaroteno',
            score: '98% CRUJIENTE',
            freshness: '98% — ÓPTIMA',
            freshnessClass: 'green',
            ripeness: 'TURGENCIA MÁXIMA',
            evolution: '6–8 DÍAS',
            organic: '0.00 ppm (Cultivo Ecológico)'
        },
        lechugas: {
            name: 'Lechuga Hidropónica Viva',
            variety: 'Hojas tiernas rizadas con clorofila activa y raíz húmeda',
            score: '96% VIVA',
            freshness: '96% — FRESCA',
            freshnessClass: 'green',
            ripeness: 'CRUJIENTE',
            evolution: '2–3 DÍAS',
            organic: '0.00 ppm (Agua Filtrada UV)'
        },
        paltas: {
            name: 'Palta / Aguacate Hass',
            variety: 'Punto mantecoso de consumo, rico en Omega 9',
            score: '94% EN SU PUNTO',
            freshness: '94% — LISTA PARA HOY',
            freshnessClass: 'green',
            ripeness: 'MADURACIÓN PERFECTA',
            evolution: '1–2 DÍAS',
            organic: '0.00 ppm (Cosecha Nacional)'
        },
        pimientos: {
            name: 'Pimiento Morrón Tricolor',
            variety: 'Piel tersa sin deshidratación, Vitamina C x3',
            score: '95% FRESCO',
            freshness: '95% — ALTA',
            freshnessClass: 'green',
            ripeness: 'EN SU PUNTO',
            evolution: '4–5 DÍAS',
            organic: '0.00 ppm (Certificado)'
        },
        uvas: {
            name: 'Uvas de Mesa Sweet',
            variety: 'Racimo denso con resveratrol y polifenoles',
            score: '93% FRESCA',
            freshness: '93% — ALTA',
            freshnessClass: 'green',
            ripeness: 'DULZOR EQUILIBRADO',
            evolution: '2–3 DÍAS',
            organic: '0.00 ppm (Sin Sulfito)'
        },
        limones: {
            name: 'Limón Eureka Fresco',
            variety: 'Cáscara aromática con alto rendimiento de ácido cítrico',
            score: '97% JUGOSO',
            freshness: '97% — ÓPTIMA',
            freshnessClass: 'green',
            ripeness: 'EN SU PUNTO',
            evolution: '7–10 DÍAS',
            organic: '0.00 ppm (Cultivo Limpio)'
        },
        frutillas: {
            name: 'Frutillas Seleccionadas',
            variety: 'Rubí homogéneo, aroma dulce y alto poder antioxidante',
            score: '96% DULCE',
            freshness: '96% — EXCELENTE',
            freshnessClass: 'green',
            ripeness: 'MADURA',
            evolution: '2 DÍAS',
            organic: '0.00 ppm (Libre de Químicos)'
        }
    };

    const config = dataConfigs[foodType] || dataConfigs.manzanas;

    // Despliega los paneles informativos en pantalla
    hud.showInfoPanel({
        name: config.name,
        variety: config.variety,
        score: config.score,
        freshness: config.freshness,
        freshnessClass: config.freshnessClass,
        ripeness: config.ripeness,
        evolution: config.evolution,
        organic: config.organic,
        foodType: foodType
    });

    // La voz en vivo habla la explicación exacta del recuadro superior derecho
    // Se dice una sola vez (sin loop), no se corta a la mitad y se apaga si aparta la vista
    if (voice) {
        voice.speakAnalysis(foodType);
    }
}

// ===== ARRANQUE AUTOMÁTICO =====
window.addEventListener('DOMContentLoaded', init);
