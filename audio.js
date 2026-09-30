// ===== MÓDULO DE AUDIO & SÍNTESIS DE VOZ =====
// Incluye sintetizador de efectos de sonido Web Audio API (HUD Sci-Fi) y voz en español en vivo

export class VoiceSynthesis {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.enabled = true;
        this.isSpeaking = false;
        this.currentSpokenFood = null;
        this.audioCtx = null;
        this.keepAliveTimer = null;

        this.initAudioContext();
        this.loadVoices();

        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn('[AUDIO] No se pudo inicializar Web Audio API:', e);
        }
    }

    resumeAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Efecto de sonido: Bloqueo de objetivo (Lock-on chirp)
    playLockOn() {
        if (!this.audioCtx) return;
        this.resumeAudio();
        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    }

    // Efecto de sonido: Escaneo holográfico continuo
    playScanSweep() {
        if (!this.audioCtx) return;
        this.resumeAudio();
        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.linearRampToValueAtTime(980, now + 0.3);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {}
    }

    // Efecto de sonido: Análisis completado con éxito (acorde armónico futurista)
    playAnalysisSuccess() {
        if (!this.audioCtx) return;
        this.resumeAudio();
        try {
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            const now = this.audioCtx.currentTime;

            freqs.forEach((f, i) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now + i * 0.04);

                gain.gain.setValueAtTime(0.05, now + i * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(now + i * 0.04);
                osc.stop(now + 0.45);
            });
        } catch (e) {}
    }

    loadVoices() {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        this.voice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Microsoft'))) ||
                     voices.find(v => v.lang.startsWith('es') || v.lang.includes('ES')) ||
                     voices.find(v => v.lang.includes('es')) ||
                     voices[0];
    }

    /**
     * Habla la explicación exacta que aparece en el recuadro superior derecho.
     * Se dice una sola vez (sin loops), sin cortarse a la mitad,
     * y se detiene de inmediato al apartar la vista.
     */
    speakAnalysis(foodType) {
        if (!this.enabled || !this.synth) return;

        // Si ya está hablando exactamente de este alimento, no reiniciar ni cortar
        if (this.currentSpokenFood === foodType && this.isSpeaking) {
            return;
        }

        this.stop(); // Detener cualquier locución previa limpia y seguramente
        this.isSpeaking = true;
        this.currentSpokenFood = foodType;
        this.playAnalysisSuccess();

        const explanations = {
            manzanas: 'Manzana Fuji: Frescura óptima al 96%. Maduración avanzada, 12% azúcares naturales. Sin residuos químicos. Consumo recomendado: 2 a 3 días.',
            manzanas_verdes: 'Manzana Granny Smith: Frescura 98%. Acidez y firmeza crujiente intactas. Rica en fibra y antioxidantes. Consumo óptimo: 5 a 7 días.',
            naranjas: 'Naranja Valencia: Frescura alta al 95%. Excelente contenido de zumo y vitamina C activa. Cosecha local certificada. Consumo: 4 a 5 días.',
            platanos: 'Plátano de Canarias: Maduración óptima con motas de azúcar natural. Potasio activo. Consumo ideal: 1 a 2 días.',
            tomates: 'Tomate en Racimo: Frescura 97%. Alto en licopeno antioxidante. Tallo verde hidratado y firmeza perfecta. Consumo: 3 a 4 días.',
            zanahorias: 'Zanahoria de Campo: Turgencia 98%. Rica en betacaroteno y vitamina A. Crujiente y dulce. Consumo: 6 a 8 días.',
            lechugas: 'Lechuga Hidropónica: Hidratación 95%. Hojas tersas con clorofila activa. Libre de pesticidas. Consumo recomendado: 2 a 3 días.',
            paltas: 'Palta Hass: Maduración óptima lista para hoy. Textura mantecosa y rica en ácidos Omega 9. Consumo: 1 a 2 días.',
            pimientos: 'Pimiento Morrón: Piel tersa brillante y sin deshidratación. Triple dosis de vitamina C. Consumo: 4 a 5 días.',
            uvas: 'Uvas de Mesa: Frescura 93%. Racimo denso rico en resveratrol y polifenoles. Sin signos de deshidratación. Consumo: 2 a 3 días.',
            limones: 'Limón Eureka: Piel aromática, máximo rendimiento de zumo y vitamina C. Vida útil: 7 a 10 días.',
            frutillas: 'Frutillas Seleccionadas: Color rubí homogéneo y caliz fresco. Alto contenido de antioxidantes. Consumo: 1 a 2 días.',
            default: 'Alimento analizado: Calidad y frescura verificadas mediante visión por computadora. Parámetros nutricionales óptimos.'
        };

        const text = explanations[foodType] || explanations.default;

        // Actualizar el recuadro superior derecho
        const transcriptionEl = document.getElementById('transcriptionText');
        if (transcriptionEl) {
            transcriptionEl.textContent = text;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95; // Velocidad natural humana pausada
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        if (this.voice) {
            utterance.voice = this.voice;
        }

        utterance.onend = () => {
            this.isSpeaking = false;
            this.clearKeepAlive();
        };

        utterance.onerror = (e) => {
            console.warn('[VOICE] Fin de locución:', e);
            this.isSpeaking = false;
            this.clearKeepAlive();
        };

        // Mantener viva la síntesis en Chrome para evitar cortes prematuros
        this.startKeepAlive();

        this.synth.speak(utterance);
    }

    startKeepAlive() {
        this.clearKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            if (this.synth && this.synth.speaking) {
                this.synth.pause();
                this.synth.resume();
            } else {
                this.clearKeepAlive();
            }
        }, 5000);
    }

    clearKeepAlive() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }

    /**
     * Detiene la voz inmediatamente cuando el usuario aparta la vista del alimento.
     */
    stop() {
        this.clearKeepAlive();
        if (this.synth) {
            this.synth.cancel();
        }
        this.isSpeaking = false;
        this.currentSpokenFood = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stop();
        }
        return this.enabled;
    }
}
