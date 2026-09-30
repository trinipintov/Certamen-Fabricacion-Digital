// ===== MÓDULO HUD — Interfaz de Usuario Futurista de Anteojos Inteligentes =====

export class HUD {
    constructor() {
        this.reticle = document.getElementById('reticle');
        this.reticleLabel = document.getElementById('reticleLabel');
        this.scanIndicator = document.getElementById('scanIndicator');
        this.scanProgress = document.querySelector('.scan-progress');
        this.instructions = document.getElementById('instructions');
        this.voice = null;

        this.createAllPanels();

        setTimeout(() => {
            if (this.instructions) {
                this.instructions.classList.add('faded');
            }
        }, 8000);
    }

    createAllPanels() {
        this.createTopStatusBar();
        this.createAnalysisPanel();
        this.createTranscriptionPanel();
        this.createCentralPanel();
        this.createCompositionPanel();
        this.createComparisonPanel();
        this.createNavigationBar();
        this.createLegend();
        this.createControlsPanel();
    }

    createTopStatusBar() {
        const bar = document.createElement('div');
        bar.id = 'topStatusBar';
        bar.innerHTML = `
            <div class="status-pill status-live">
                <span class="live-dot"></span>
                <span>NEURO-VISION™ AR v4.5</span>
            </div>
            <div class="status-pill status-loc">
                <span>📍 PASILLO 1 — FRUTERÍA & HUERTA FRESCA</span>
            </div>
            <div class="status-pill status-sys">
                <span>🔋 98%</span>
                <span>📶 5G Ultra</span>
                <span id="hudClock">11:42</span>
            </div>
        `;
        document.getElementById('hud').appendChild(bar);

        setInterval(() => {
            const clockEl = document.getElementById('hudClock');
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toTimeString().substring(0, 5);
            }
        }, 1000);
    }

    createAnalysisPanel() {
        const panel = document.createElement('div');
        panel.id = 'analysisPanel';
        panel.innerHTML = `
            <div class="analysis-content">
                <span class="analysis-icon" id="analysisIcon">🎯</span>
                <span class="analysis-text" id="analysisStatusText">IA en espera de fijar objetivo...</span>
            </div>
        `;
        document.getElementById('hud').appendChild(panel);
        this.analysisPanel = panel;
    }

    createTranscriptionPanel() {
        const panel = document.createElement('div');
        panel.id = 'transcriptionPanel';
        panel.className = 'hidden';
        panel.innerHTML = `
            <div class="transcription-content">
                <div class="audio-wave">
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="transcription-body">
                    <div class="transcription-title">SÍNTESIS DE VOZ IA <span id="transcriptionFoodIcon">🍎</span></div>
                    <p class="transcription-text" id="transcriptionText">
                        Apunte la retícula central a cualquier fruta o verdura para escanear en tiempo real.
                    </p>
                </div>
                <div class="audio-icon" id="audioToggleBtn" title="Silenciar / Activar Voz">🔊</div>
            </div>
        `;
        document.getElementById('hud').appendChild(panel);
        this.transcriptionPanel = panel;

        const toggleBtn = panel.querySelector('#audioToggleBtn');
        if (toggleBtn) {
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.pointerEvents = 'auto';
            toggleBtn.addEventListener('click', () => {
                if (this.voice) {
                    const isEnabled = this.voice.toggle();
                    toggleBtn.textContent = isEnabled ? '🔊' : '🔇';
                    toggleBtn.style.opacity = isEnabled ? '1' : '0.5';
                }
            });
        }
    }

    createCentralPanel() {
        const panel = document.createElement('div');
        panel.id = 'centralPanel';
        panel.className = 'hidden';
        panel.innerHTML = `
            <div class="central-content">
                <div class="food-header">
                    <span class="food-icon" id="foodIcon">🍎</span>
                    <div class="food-title-group">
                        <span class="food-name" id="foodName">ALIMENTO SELECCIONADO</span>
                        <span class="food-variety" id="foodVariety">Cultivo Nacional de Proximidad</span>
                    </div>
                    <span class="quality-badge" id="qualityBadge">96% ÓPTIMO</span>
                </div>
                <div class="data-grid">
                    <div class="data-row">
                        <span class="data-dot green"></span>
                        <span class="data-label">FRESCURA</span>
                        <span class="data-value green" id="freshnessValue">96% — ALTA</span>
                    </div>
                    <div class="data-row">
                        <span class="data-dot yellow"></span>
                        <span class="data-label">MADURACIÓN</span>
                        <span class="data-value" id="ripenessValue">EN SU PUNTO</span>
                    </div>
                    <div class="data-row">
                        <span class="data-dot blue"></span>
                        <span class="data-label">CONSUMO ESTIMADO</span>
                        <span class="data-value" id="evolutionValue">2–3 DÍAS</span>
                    </div>
                    <div class="data-row">
                        <span class="data-dot green"></span>
                        <span class="data-label">PESTICIDAS / BIO</span>
                        <span class="data-value green" id="organicValue">0.00 ppm (SEGURO)</span>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('hud').appendChild(panel);
        this.centralPanel = panel;
    }

    createCompositionPanel() {
        const panel = document.createElement('div');
        panel.id = 'compositionPanel';
        panel.className = 'hidden';
        panel.innerHTML = `
            <div class="composition-content">
                <div class="panel-title">
                    <span class="panel-icon" id="compFoodIcon">⚛</span>
                    BIO-COMPOSICIÓN APROX. (100g)
                </div>
                <div class="comp-row">
                    <span class="comp-label">Agua</span>
                    <span class="comp-value" id="compWater">~ 85%</span>
                </div>
                <div class="comp-row">
                    <span class="comp-label">Azúcares Naturales</span>
                    <span class="comp-value" id="compSugars">~ 12%</span>
                </div>
                <div class="comp-row">
                    <span class="comp-label">Fibra Dietética</span>
                    <span class="comp-value" id="compFiber">~ 2.4%</span>
                </div>
                <div class="comp-row">
                    <span class="comp-label">Calorías</span>
                    <span class="comp-value" id="compCalories">52 kcal</span>
                </div>
                <div class="comp-row">
                    <span class="comp-label">Nutriente Clave</span>
                    <span class="comp-value" id="compOther">Vitamina C</span>
                </div>
            </div>
        `;
        document.getElementById('hud').appendChild(panel);
        this.compositionPanel = panel;
    }

    createComparisonPanel() {
        const panel = document.createElement('div');
        panel.id = 'comparisonPanel';
        panel.className = 'hidden';
        panel.innerHTML = `
            <div class="comparison-content">
                <div class="panel-title" id="comparisonTitle">COMPARATIVA DE LOTES EN ESTANTERÍA</div>
                <div class="comparison-items" id="comparisonItems">
                    <!-- Se llena dinámicamente con iconos del alimento correspondiente -->
                </div>
            </div>
        `;
        document.getElementById('hud').appendChild(panel);
        this.comparisonPanel = panel;
    }

    createNavigationBar() {
        const bar = document.createElement('div');
        bar.id = 'navigationBar';
        bar.innerHTML = `
            <div class="nav-item active">
                <span class="nav-icon" id="navFoodIcon">🍎</span>
                <span class="nav-label">ESCÁNER BIO</span>
            </div>
            <div class="nav-item">
                <span class="nav-icon">📊</span>
                <span class="nav-label">CALIDAD & FRESCURA</span>
            </div>
            <div class="nav-item">
                <span class="nav-icon">⏱</span>
                <span class="nav-label">VIDA ÚTIL</span>
            </div>
        `;
        document.getElementById('hud').appendChild(bar);
    }

    createLegend() {
        const legend = document.createElement('div');
        legend.id = 'legendPanel';
        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-dot green"></span>
                <span class="legend-text">Frescura Óptima (>85%)</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot yellow"></span>
                <span class="legend-text">Maduración Media (Consumir pronto)</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot red"></span>
                <span class="legend-text">Pérdida de Firmeza / Deterioro</span>
            </div>
        `;
        document.getElementById('hud').appendChild(legend);
    }

    createControlsPanel() {
        const controls = document.createElement('div');
        controls.id = 'quickControls';
        controls.innerHTML = `
            <button id="btnVoiceToggle" class="hud-btn" title="Silenciar / Activar Voz">🔊 Voz Activa</button>
            <button id="btnScanTarget" class="hud-btn" title="Escanear Alimento Enfocado">🎯 Escaneo Rápido</button>
            <button id="btnResetView" class="hud-btn" title="Volver al pasillo principal">📍 Posición Inicial</button>
        `;
        document.getElementById('hud').appendChild(controls);

        const btnVoice = controls.querySelector('#btnVoiceToggle');
        btnVoice.addEventListener('click', () => {
            if (this.voice) {
                const active = this.voice.toggle();
                btnVoice.textContent = active ? '🔊 Voz Activa' : '🔇 Voz Muteada';
                btnVoice.classList.toggle('muted', !active);
            }
        });
    }

    /**
     * Mapeo exhaustivo y normalizado de iconos emoji según el tipo de alimento.
     * Soporta nombres en singular, plural, español e inglés.
     */
    getFoodIcon(foodType) {
        if (!foodType) return '🍎';
        const key = String(foodType).toLowerCase().trim();

        if (key.includes('naranja') || key.includes('orange') || key.includes('citric')) return '🍊';
        if (key.includes('platano') || key.includes('banana') || key.includes('banano')) return '🍌';
        if (key.includes('tomate') || key.includes('tomato')) return '🍅';
        if (key.includes('zanahoria') || key.includes('carrot')) return '🥕';
        if (key.includes('lechuga') || key.includes('lettuce') || key.includes('salad')) return '🥬';
        if (key.includes('palta') || key.includes('aguacate') || key.includes('avocado')) return '🥑';
        if (key.includes('pimiento') || key.includes('morron') || key.includes('pepper')) return '🫑';
        if (key.includes('uva') || key.includes('grape')) return '🍇';
        if (key.includes('limon') || key.includes('lemon') || key.includes('lima') || key.includes('lime')) return '🍋';
        if (key.includes('frutilla') || key.includes('fresa') || key.includes('berry') || key.includes('strawb')) return '🍓';
        if (key.includes('pera') || key.includes('pear')) return '🍐';
        if (key.includes('pepino') || key.includes('cucumber')) return '🥒';
        if (key.includes('cebolla') || key.includes('onion')) return '🧅';
        if (key.includes('brocoli') || key.includes('broccoli')) return '🥦';
        if (key.includes('espinaca') || key.includes('spinach')) return '🌿';
        if (key.includes('verde') || key.includes('smith')) return '🍏';
        if (key.includes('manzana') || key.includes('apple') || key.includes('fuji') || key.includes('gala')) return '🍎';

        return '🍎';
    }

    getComparisonData(foodType) {
        const icon = this.getFoodIcon(foodType);
        const key = String(foodType).toLowerCase().trim();

        if (key.includes('naranja') || key.includes('orange')) {
            return [
                { name: 'Valencia Premium', icon: '🍊', status: 'Frescura 95%', days: '4–5 días', color: 'green' },
                { name: 'Navel Tardía', icon: '🍊', status: 'Frescura 84%', days: '3–4 días', color: 'green' },
                { name: 'Sanguina Extra', icon: '🍊', status: 'Maduración avanzada', days: '2 días', color: 'yellow' }
            ];
        }

        if (key.includes('platano') || key.includes('banana')) {
            return [
                { name: 'Canario Punto Dulce', icon: '🍌', status: 'Consumo hoy/mañana', days: '1–2 días', color: 'yellow' },
                { name: 'Canario Firme', icon: '🍌', status: 'Madurando (firme)', days: '4–5 días', color: 'green' },
                { name: 'Cavendish', icon: '🍌', status: 'Frescura 88%', days: '2–3 días', color: 'green' }
            ];
        }

        if (key.includes('tomate') || key.includes('tomato')) {
            return [
                { name: 'Tomate en Racimo', icon: '🍅', status: 'Frescura 97%', days: '3–4 días', color: 'green' },
                { name: 'Tomate Pera', icon: '🍅', status: 'Frescura 91%', days: '4–5 días', color: 'green' },
                { name: 'Tomate Cherry', icon: '🍅', status: 'Punto óptimo', days: '2–3 días', color: 'green' }
            ];
        }

        if (key.includes('zanahoria') || key.includes('carrot')) {
            return [
                { name: 'Nantesa con Hojas', icon: '🥕', status: 'Turgencia 98%', days: '6–8 días', color: 'green' },
                { name: 'Chantenay Lavada', icon: '🥕', status: 'Frescura 88%', days: '4–5 días', color: 'green' },
                { name: 'Zanahoria Baby', icon: '🥕', status: 'Firmeza óptima', days: '5–6 días', color: 'green' }
            ];
        }

        if (key.includes('lechuga') || key.includes('lettuce')) {
            return [
                { name: 'Romana Hidropónica', icon: '🥬', status: 'Frescura 96%', days: '2–3 días', color: 'green' },
                { name: 'Francesa Rizada', icon: '🥬', status: 'Frescura 92%', days: '2–3 días', color: 'green' },
                { name: 'Iceberg Cortada', icon: '🥬', status: 'Oxidación en bordes', days: '1 día', color: 'red' }
            ];
        }

        if (key.includes('palta') || key.includes('aguacate') || key.includes('avocado')) {
            return [
                { name: 'Hass Madura', icon: '🥑', status: 'Lista para hoy', days: '1–2 días', color: 'green' },
                { name: 'Hass Firme', icon: '🥑', status: 'Maduración previa', days: '3–4 días', color: 'yellow' },
                { name: 'Fuerte Nacional', icon: '🥑', status: 'Frescura 89%', days: '2–3 días', color: 'green' }
            ];
        }

        if (key.includes('pimiento') || key.includes('morron') || key.includes('pepper')) {
            return [
                { name: 'Morrón Rojo Intenso', icon: '🫑', status: 'Frescura 96%', days: '4–5 días', color: 'green' },
                { name: 'Morrón Amarillo', icon: '🫑', status: 'Frescura 93%', days: '3–4 días', color: 'green' },
                { name: 'Morrón Verde Crocante', icon: '🫑', status: 'Turgencia 97%', days: '5–7 días', color: 'green' }
            ];
        }

        if (key.includes('uva') || key.includes('grape')) {
            return [
                { name: 'Crimson Seedless', icon: '🍇', status: 'Frescura 95%', days: '3–4 días', color: 'green' },
                { name: 'Thompson Blanca', icon: '🍇', status: 'Frescura 92%', days: '2–3 días', color: 'green' },
                { name: 'Red Globe Premium', icon: '🍇', status: 'Frescura 88%', days: '2–3 días', color: 'green' }
            ];
        }

        if (key.includes('limon') || key.includes('lemon')) {
            return [
                { name: 'Eureka de Jugo', icon: '🍋', status: 'Frescura 97%', days: '7–10 días', color: 'green' },
                { name: 'Sutil Aromático', icon: '🍋', status: 'Frescura 94%', days: '6–8 días', color: 'green' },
                { name: 'Limón Real', icon: '🍋', status: 'Maduración plena', days: '4–5 días', color: 'green' }
            ];
        }

        if (key.includes('frutilla') || key.includes('fresa') || key.includes('berry')) {
            return [
                { name: 'Selección Grado A', icon: '🍓', status: 'Frescura 96%', days: '2 días', color: 'green' },
                { name: 'Camarosa Dulce', icon: '🍓', status: 'Punto de azúcar', days: '1–2 días', color: 'yellow' },
                { name: 'Silvestre Especial', icon: '🍓', status: 'Madurez plena', days: '1 día', color: 'yellow' }
            ];
        }

        if (key.includes('verde') || key.includes('smith')) {
            return [
                { name: 'Granny Smith A', icon: '🍏', status: 'Frescura 98%', days: '5–7 días', color: 'green' },
                { name: 'Granny Smith B', icon: '🍏', status: 'Frescura 88%', days: '3–4 días', color: 'green' },
                { name: 'Verde Doncella', icon: '🍏', status: 'Firmeza 92%', days: '4–5 días', color: 'green' }
            ];
        }

        // Manzanas rojas por defecto
        return [
            { name: 'Fuji Selección', icon: '🍎', status: 'Frescura 96%', days: '2–3 días', color: 'green' },
            { name: 'Gala Boreal', icon: '🍎', status: 'Frescura 85%', days: '4–5 días', color: 'green' },
            { name: 'Red Chief', icon: '🍎', status: 'Pérdida firmeza', days: '1 día', color: 'red' }
        ];
    }

    setReticleState(state, foodType = null) {
        this.reticle.classList.remove('scanning', 'detected');
        const statusText = document.getElementById('analysisStatusText');
        const icon = foodType ? this.getFoodIcon(foodType) : '🎯';

        if (state === 'scanning') {
            this.reticle.classList.add('scanning');
            this.reticleLabel.textContent = `${icon} ESCANEANDO BIO-DATOS...`;
            this.analysisPanel.classList.add('active');
            if (statusText) statusText.textContent = `Analizando firma espectral ${icon}...`;
            const analysisIconEl = document.getElementById('analysisIcon');
            if (analysisIconEl) analysisIconEl.textContent = icon;
        } else if (state === 'detected') {
            this.reticle.classList.add('detected');
            this.reticleLabel.textContent = `${icon} OBJETIVO [MANTENER MIRA]`;
            this.analysisPanel.classList.add('active');
            if (statusText) statusText.textContent = `Objetivo fijado ${icon} mantenga la vista 1.4s`;
            const analysisIconEl = document.getElementById('analysisIcon');
            if (analysisIconEl) analysisIconEl.textContent = icon;
        } else {
            this.reticleLabel.textContent = '';
            this.analysisPanel.classList.remove('active');
            if (statusText) statusText.textContent = 'IA en espera de fijar objetivo...';
            const analysisIconEl = document.getElementById('analysisIcon');
            if (analysisIconEl) analysisIconEl.textContent = '🎯';
        }
    }

    showScanProgress(progress) {
        const ring = this.reticle.querySelector('.reticle-ring');
        ring.style.background = `conic-gradient(rgba(0,255,136,0.4) ${progress * 360}deg, transparent 0deg)`;
    }

    hideScanProgress() {
        const ring = this.reticle.querySelector('.reticle-ring');
        ring.style.background = '';
    }

    showScanIndicator() {
        this.scanIndicator.classList.remove('hidden');
        this.updateScanProgress(0);
    }

    hideScanIndicator() {
        this.scanIndicator.classList.add('hidden');
    }

    updateScanProgress(progress) {
        this.scanProgress.style.width = `${progress * 100}%`;
    }

    /**
     * Muestra el panel informativo con el icono exacto del alimento analizado
     * reflejado en el panel central, barra de navegación, panel de composición y comparativa.
     */
    showInfoPanel(data) {
        const foodType = data.foodType || 'manzanas';
        const icon = this.getFoodIcon(foodType);

        // 1. Icono dinámico principal del panel central
        const foodIconEl = document.getElementById('foodIcon');
        if (foodIconEl) {
            foodIconEl.textContent = icon;
        }

        // 2. Icono en la barra de navegación inferior
        const navFoodIconEl = document.getElementById('navFoodIcon');
        if (navFoodIconEl) {
            navFoodIconEl.textContent = icon;
        }

        // 3. Icono en el panel de análisis superior
        const analysisIconEl = document.getElementById('analysisIcon');
        if (analysisIconEl) {
            analysisIconEl.textContent = icon;
        }

        // 4. Icono en el panel de transcripción
        const transcriptionIconEl = document.getElementById('transcriptionFoodIcon');
        if (transcriptionIconEl) {
            transcriptionIconEl.textContent = icon;
        }

        // 5. Icono en el panel de composición
        const compIconEl = document.getElementById('compFoodIcon');
        if (compIconEl) {
            compIconEl.textContent = icon;
        }

        // Panel central de datos
        const foodNameEl = document.getElementById('foodName');
        if (foodNameEl) foodNameEl.textContent = data.name.toUpperCase();

        const varietyEl = document.getElementById('foodVariety');
        if (varietyEl && data.variety) varietyEl.textContent = data.variety;

        const badgeEl = document.getElementById('qualityBadge');
        if (badgeEl) badgeEl.textContent = data.score || '96% ÓPTIMO';

        const freshnessEl = document.getElementById('freshnessValue');
        if (freshnessEl) {
            freshnessEl.textContent = data.freshness;
            freshnessEl.className = `data-value ${data.freshnessClass}`;
        }

        const ripenessEl = document.getElementById('ripenessValue');
        if (ripenessEl) ripenessEl.textContent = data.ripeness;

        const evolutionEl = document.getElementById('evolutionValue');
        if (evolutionEl) evolutionEl.textContent = data.evolution;

        const organicEl = document.getElementById('organicValue');
        if (organicEl && data.organic) organicEl.textContent = data.organic;

        this.centralPanel.classList.remove('hidden');

        // Panel de composición bioquímica
        const compData = this.getCompositionData(data.name, foodType);
        document.getElementById('compWater').textContent = compData.water;
        document.getElementById('compSugars').textContent = compData.sugars;
        document.getElementById('compFiber').textContent = compData.fiber;
        document.getElementById('compCalories').textContent = compData.calories || '48 kcal';
        document.getElementById('compOther').textContent = compData.other;
        this.compositionPanel.classList.remove('hidden');

        // Panel de comparación dinámico con iconos del mismo alimento
        const comparisonItems = document.getElementById('comparisonItems');
        const compDataItems = this.getComparisonData(foodType);
        comparisonItems.innerHTML = compDataItems.map(item => `
            <div class="comp-item">
                <div class="comp-item-circle ${item.color}-border">
                    <span class="comp-item-emoji">${item.icon}</span>
                </div>
                <div class="comp-item-name">${item.name}</div>
                <div class="comp-item-status ${item.color}">${item.status}</div>
                <div class="comp-item-days">${item.days}</div>
            </div>
        `).join('');
        this.comparisonPanel.classList.remove('hidden');

        // Transcripción de voz
        this.transcriptionPanel.classList.remove('hidden');
    }

    getCompositionData(foodName, foodType) {
        const key = String(foodType).toLowerCase().trim();

        if (key.includes('naranja') || key.includes('orange')) {
            return { water: '~ 87%', sugars: '~ 9.2%', fiber: '~ 2.4%', calories: '47 kcal', other: 'Vitamina C y Hesperidina' };
        }
        if (key.includes('platano') || key.includes('banana')) {
            return { water: '~ 74%', sugars: '~ 21%', fiber: '~ 2.6%', calories: '89 kcal', other: 'Potasio, Magnesio y B6' };
        }
        if (key.includes('tomate') || key.includes('tomato')) {
            return { water: '~ 94.5%', sugars: '~ 3.2%', fiber: '~ 1.2%', calories: '18 kcal', other: 'Licopeno y Vitamina A' };
        }
        if (key.includes('zanahoria') || key.includes('carrot')) {
            return { water: '~ 88%', sugars: '~ 6.8%', fiber: '~ 2.8%', calories: '41 kcal', other: 'Betacaroteno y Luteína' };
        }
        if (key.includes('lechuga') || key.includes('lettuce')) {
            return { water: '~ 95.6%', sugars: '~ 1.1%', fiber: '~ 1.3%', calories: '15 kcal', other: 'Clorofila y Ácido Fólico' };
        }
        if (key.includes('palta') || key.includes('aguacate') || key.includes('avocado')) {
            return { water: '~ 73%', sugars: '~ 0.7%', fiber: '~ 6.7%', calories: '160 kcal', other: 'Ácidos Grasos Omega 9' };
        }
        if (key.includes('pimiento') || key.includes('morron') || key.includes('pepper')) {
            return { water: '~ 92%', sugars: '~ 4.2%', fiber: '~ 2.1%', calories: '31 kcal', other: 'Vitamina C (x3 requerimiento)' };
        }
        if (key.includes('uva') || key.includes('grape')) {
            return { water: '~ 81%', sugars: '~ 16%', fiber: '~ 1.0%', calories: '69 kcal', other: 'Resveratrol y Polifenoles' };
        }
        if (key.includes('limon') || key.includes('lemon')) {
            return { water: '~ 89%', sugars: '~ 2.5%', fiber: '~ 2.8%', calories: '29 kcal', other: 'Ácido Cítrico & Flavonoides' };
        }
        if (key.includes('frutilla') || key.includes('fresa') || key.includes('berry')) {
            return { water: '~ 91%', sugars: '~ 4.9%', fiber: '~ 2.0%', calories: '32 kcal', other: 'Antocianinas Antioxidantes' };
        }
        if (key.includes('verde') || key.includes('smith')) {
            return { water: '~ 86%', sugars: '~ 9.5%', fiber: '~ 2.8%', calories: '48 kcal', other: 'Ácido Málico y Pectina' };
        }

        return { water: '~ 85%', sugars: '~ 12%', fiber: '~ 2.4%', calories: '52 kcal', other: 'Vitamina C y Quercetina' };
    }

    hideInfoPanel() {
        this.centralPanel.classList.add('hidden');
        this.compositionPanel.classList.add('hidden');
        this.comparisonPanel.classList.add('hidden');
        this.transcriptionPanel.classList.add('hidden');

        if (this.voice) {
            this.voice.stop();
        }
    }
}
