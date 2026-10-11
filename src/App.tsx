import React, { useEffect, useRef, useState, useCallback } from 'react';

// Types
type ThermalMode = 'hot' | 'cold';

interface IngredientDef {
  id: string;
  label: string;
  hotBadge: string;
  coldBadge: string;
  hotSound: string;
  coldSound: string;
  hotDesc: string;
  coldDesc: string;
  color: [number, number, number];
  hex: string;
  icon: string;
  borderClass: string;
  bgGradHot: string;
  bgGradCold: string;
}

interface BeverageRecipe {
  drinkName: string;
  tastingNotes: string[];
  baristaInstructions: string;
  vibeCard: string;
  estimatedWaitSec: number;
  tokenHash: string;
  temperature?: string;
}

const INGREDIENTS: Record<string, IngredientDef> = {
  espresso: {
    id: 'espresso',
    label: 'Espresso',
    hotBadge: 'Hot Crema Pull',
    coldBadge: 'Flash Chilled',
    hotSound: 'Deep Velvet Drone',
    coldSound: 'Obsidian Clarity',
    hotDesc: 'Rich crema, amber tint, billowing steam',
    coldDesc: 'Dark obsidian gloss, sharp droplets',
    color: [52, 26, 11],
    hex: '#4A2311',
    icon: 'coffee',
    borderClass: 'border-[#7A3E20]',
    bgGradHot: 'from-[#633019] to-[#2B1207]',
    bgGradCold: 'from-[#3A2A22] to-[#161210]',
  },
  oat: {
    id: 'oat',
    label: 'Oat Milk',
    hotBadge: 'Steamed Microfoam',
    coldBadge: 'Cold Foam Float',
    hotSound: 'Warm Analog Pad',
    coldSound: 'Crystalline Pad',
    hotDesc: 'Velveteen texture & latte-art swirls',
    coldDesc: 'Viscous sweet cream float layer',
    color: [242, 233, 218],
    hex: '#EADFCF',
    icon: 'grain',
    borderClass: 'border-[#CBBDA9]',
    bgGradHot: 'from-[#FFFFFF] to-[#E5D8C4]',
    bgGradCold: 'from-[#F5FAFF] to-[#DCE8F2]',
  },
  thermal: {
    id: 'thermal',
    label: 'Thermal Agitator',
    hotBadge: 'Boiling Steam Shot',
    coldBadge: 'Crystal Ice Block',
    hotSound: 'Boiler Steam Hiss',
    coldSound: 'Clinking Ice Bells',
    hotDesc: 'Agitates fluid with micro-bubbles',
    coldDesc: 'Rigid clinking ice blocks with splash',
    color: [214, 140, 62],
    hex: '#D68C3E',
    icon: 'thermostat',
    borderClass: 'border-[#D68C3E]',
    bgGradHot: 'from-[#E59F48] to-[#BD621C]',
    bgGradCold: 'from-[#A8D8F8] to-[#4A9FD9]',
  },
  lavender: {
    id: 'lavender',
    label: 'Lavender',
    hotBadge: 'Floral Infusion',
    coldBadge: 'Crystal Spritz',
    hotSound: 'Pentatonic Warmth',
    coldSound: 'FM Glass Chime',
    hotDesc: 'Warm floral mist diffusing gently',
    coldDesc: 'Crystalline droplets floating on crest',
    color: [168, 145, 194],
    hex: '#8E77B3',
    icon: 'spa',
    borderClass: 'border-[#9E86C6]',
    bgGradHot: 'from-[#C4B2E0] to-[#7B61A4]',
    bgGradCold: 'from-[#D0C2F2] to-[#5C7CB8]',
  },
  salt: {
    id: 'salt',
    label: 'Sea Salt',
    hotBadge: 'Mineral Melt',
    coldBadge: 'Frost Saline',
    hotSound: 'Resonant Saline',
    coldSound: 'High-Pass Clink',
    hotDesc: 'Melts instantly into liquid base',
    coldDesc: 'Crisp saline snap atop ice cubes',
    color: [250, 248, 245],
    hex: '#FFFFFF',
    icon: 'diamond',
    borderClass: 'border-[#D9CFC2]',
    bgGradHot: 'from-[#FFFFFF] to-[#ECE5DC]',
    bgGradCold: 'from-[#FFFFFF] to-[#D5E8F5]',
  },
  cardamom: {
    id: 'cardamom',
    label: 'Cardamom',
    hotBadge: 'Spiced Steam Dust',
    coldBadge: 'Chilled Infusion',
    hotSound: 'Velvet Spice Shimmer',
    coldSound: 'Frost Shimmer Bell',
    hotDesc: 'Melts instantly with low resistance',
    coldDesc: 'Chilled aromatic spice suspension',
    color: [222, 155, 84],
    hex: '#D68C3E',
    icon: 'flare',
    borderClass: 'border-[#D68C3E]',
    bgGradHot: 'from-[#F3B774] to-[#B87027]',
    bgGradCold: 'from-[#E8C28A] to-[#6EA3C9]',
  },
};

// Physics Particle
class FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: [number, number, number];
  alpha: number;

  constructor(x: number, y: number, color: [number, number, number], isCold: boolean) {
    this.x = x;
    this.y = y;
    const speedScale = isCold ? 0.65 : 1.35;
    this.vx = (Math.random() - 0.5) * 1.5 * speedScale;
    this.vy = (Math.random() * 2 + 1.2) * speedScale;
    this.radius = Math.random() * 8 + (isCold ? 12 : 9);
    this.color = color;
    this.alpha = isCold ? 0.92 : 0.82;
  }

  update(fillLevelY: number, isCold: boolean) {
    const gravity = isCold ? 0.09 : 0.16;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += gravity;

    if (this.y > fillLevelY) {
      this.y = fillLevelY - Math.random() * (isCold ? 5 : 9);
      this.vy *= isCold ? -0.15 : -0.32;
      this.vx += (Math.random() - 0.5) * (isCold ? 0.4 : 0.9);
    }
    if (this.x < 50) this.x = 50;
    if (this.x > 290) this.x = 290;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const grad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius);
    grad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.alpha})`);
    grad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Rigid Floating Ice Cube Body
class IceBlock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  vAngle: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = Math.random() * 1.5 + 0.8;
    this.size = Math.random() * 10 + 26;
    this.angle = Math.random() * Math.PI;
    this.vAngle = (Math.random() - 0.5) * 0.03;
  }

  update(surfaceY: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.vAngle;

    // Buoyancy: ice floats near the surface
    const targetY = Math.max(surfaceY + 8, surfaceY + this.size * 0.35);
    if (this.y > targetY) {
      this.vy += (targetY - this.y) * 0.08;
      this.vy *= 0.88;
      this.vx *= 0.94;
    } else {
      this.vy += 0.08; // gravity down into liquid
    }

    if (this.x < 70) {
      this.x = 70;
      this.vx = Math.abs(this.vx) * 0.7;
    }
    if (this.x > 270) {
      this.x = 270;
      this.vx = -Math.abs(this.vx) * 0.7;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Realistic Frosted Ice Cube
    ctx.fillStyle = 'rgba(235, 248, 255, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.8;

    const half = this.size / 2;
    ctx.beginPath();
    ctx.roundRect(-half, -half, this.size, this.size, 5);
    ctx.fill();
    ctx.stroke();

    // Internal crystalline facets
    ctx.strokeStyle = 'rgba(215, 238, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-half + 4, -half + 5);
    ctx.lineTo(half - 6, -half + 8);
    ctx.lineTo(half - 5, half - 7);
    ctx.stroke();

    // Frost highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(-half + 7, -half + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Rising Steam Ribbon Particle
class SteamRibbon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;

  constructor(surfaceX: number, surfaceY: number) {
    this.x = surfaceX + (Math.random() - 0.5) * 60;
    this.y = surfaceY - Math.random() * 5;
    this.vx = (Math.random() - 0.5) * 0.45;
    this.vy = -(Math.random() * 0.8 + 0.6);
    this.radius = Math.random() * 12 + 10;
    this.alpha = Math.random() * 0.22 + 0.12;
    this.life = 0;
    this.maxLife = Math.random() * 50 + 60;
  }

  update() {
    this.x += this.vx + Math.sin(this.life * 0.08) * 0.35;
    this.y += this.vy;
    this.radius += 0.28;
    this.life++;
    this.alpha *= 0.975;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0.01) return;
    ctx.save();
    const grad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
    grad.addColorStop(0.6, `rgba(255, 248, 240, ${this.alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default function App() {
  // Thermal State Mode
  const [thermalMode, setThermalMode] = useState<ThermalMode>('hot');

  // Formulation state
  const [amounts, setAmounts] = useState<Record<string, number>>({
    espresso: 0,
    oat: 0,
    thermal: 0,
    lavender: 0,
    salt: 0,
    cardamom: 0,
  });

  // Mobile active tab
  const [mobileTab, setMobileTab] = useState<'reservoir' | 'telemetry' | 'gemini'>('reservoir');

  // Audio Engine State
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.75);
  const [steamGainVal, setSteamGainVal] = useState<number>(0.2);
  const [reverbDepth, setReverbDepth] = useState<number>(0.45);
  const [meterDb, setMeterDb] = useState<string>('-inf');
  const [meterPct, setMeterPct] = useState<number>(0);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gemini Recipe & Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [dispatchedToast, setDispatchedToast] = useState<boolean>(false);
  const [currentRecipe, setCurrentRecipe] = useState<BeverageRecipe>({
    drinkName: 'Third Wave Cortado Reserve',
    tastingNotes: ['Almond Blossom', 'Toasted Hazelnut', 'Warm Brioche', 'Silky Crema'],
    baristaInstructions: 'Extract 18.5g of medium roast Arabica at 9 bars into 38g double shot. Gently steam 120ml oat milk to a velvety microfoam. Swirl evenly into warm ceramic vessel at 65°C.',
    vibeCard: 'A peaceful sunlit morning at a Third Wave roastery, gently humming with warm lo-fi chords.',
    estimatedWaitSec: 35,
    tokenHash: '#TWC-4091-HOT',
    temperature: 'Hot / Steamed',
  });

  // Refs for Web Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Synth Nodes
  const bassOscRef = useRef<OscillatorNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);

  const padOscsRef = useRef<OscillatorNode[]>([]);
  const padGainRef = useRef<GainNode | null>(null);
  const padFilterRef = useRef<BiquadFilterNode | null>(null);

  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);

  const steamGainRef = useRef<GainNode | null>(null);
  const steamFilterRef = useRef<BiquadFilterNode | null>(null);

  const arpIntervalRef = useRef<number | null>(null);
  const clinkIntervalRef = useRef<number | null>(null);

  // Canvas refs
  const fluidCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<FluidParticle[]>([]);
  const iceBlocksRef = useRef<IceBlock[]>([]);
  const steamRibbonsRef = useRef<SteamRibbon[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Derived Totals
  const totalVolume = Object.values(amounts).reduce((a, b) => a + b, 0);
  const massGrams = (totalVolume * 2.2).toFixed(1);
  const isCold = thermalMode === 'cold';

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 1800);
  };

  // Play clinking ice cube FM sound
  const playIceClinkSfx = useCallback(() => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    const t = ctx.currentTime;
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const clinkGain = ctx.createGain();

    // FM synthesis for realistic crystal ice clink
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(1400 + Math.random() * 400, t);
    carrier.frequency.exponentialRampToValueAtTime(800, t + 0.12);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(480 + Math.random() * 80, t);

    modGain.gain.setValueAtTime(350, t);
    modGain.gain.exponentialRampToValueAtTime(10, t + 0.1);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    clinkGain.gain.setValueAtTime(0.18, t);
    clinkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    carrier.connect(clinkGain);
    clinkGain.connect(masterGainRef.current);

    if (delayNodeRef.current) {
      clinkGain.connect(delayNodeRef.current);
    }

    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 0.15);
    carrier.stop(t + 0.15);
  }, []);

  // Droplet splash SFX respecting thermal state
  const playSplashSfx = useCallback(
    (ingId: string) => {
      if (!audioCtxRef.current || !masterGainRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state !== 'running') return;

      const t = ctx.currentTime;
      const ing = INGREDIENTS[ingId];

      if (isCold) {
        // Cold Mode SFX: High-pass filtered crisp glass/ice clink & snappy splash
        playIceClinkSfx();

        const dropOsc = ctx.createOscillator();
        const dropFilter = ctx.createBiquadFilter();
        const dropGain = ctx.createGain();

        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(950, t);
        dropOsc.frequency.exponentialRampToValueAtTime(420, t + 0.08);

        dropFilter.type = 'highpass';
        dropFilter.frequency.setValueAtTime(600, t);

        dropGain.gain.setValueAtTime(0.16, t);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

        dropOsc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(masterGainRef.current);

        dropOsc.start(t);
        dropOsc.stop(t + 0.11);
      } else {
        // Hot Mode SFX: Deep, warm, muffled bubbling drops
        const baseF = ing ? ing.color[0] + 240 : 320;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const dropGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseF * 1.2, t);
        osc.frequency.exponentialRampToValueAtTime(baseF * 0.55, t + 0.18);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, t);
        filter.Q.setValueAtTime(1.2, t);

        dropGain.gain.setValueAtTime(0.24, t);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

        osc.connect(filter);
        filter.connect(dropGain);
        dropGain.connect(masterGainRef.current);

        osc.start(t);
        osc.stop(t + 0.19);
      }
    },
    [isCold, playIceClinkSfx]
  );

  // Initialize Web Audio Engine
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        setAudioActive(true);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(masterVolume, ctx.currentTime);
      masterGainRef.current = master;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      master.connect(analyser);
      analyser.connect(ctx.destination);

      // Reverb / Delay Line
      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(isCold ? 0.35 : 0.48, ctx.currentTime);
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.setValueAtTime(reverbDepth, ctx.currentTime);

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(master);
      delayNodeRef.current = delay;
      delayGainRef.current = delayFeedback;

      // 1. Sub-Bass
      const bassOsc = ctx.createOscillator();
      const bassFilter = ctx.createBiquadFilter();
      const bassGain = ctx.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(55, ctx.currentTime);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(160, ctx.currentTime);
      bassFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      bassGain.gain.setValueAtTime(0, ctx.currentTime);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(master);
      bassOsc.start();

      bassOscRef.current = bassOsc;
      bassFilterRef.current = bassFilter;
      bassGainRef.current = bassGain;

      // 2. Chords Pad
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0, ctx.currentTime);
      padGainRef.current = padGain;

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(isCold ? 900 : 440, ctx.currentTime);
      padFilterRef.current = padFilter;

      const chordFreqs = [146.83, 220.0, 277.18, 329.63, 369.99]; // Dmaj9
      const oscs = chordFreqs.map((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = isCold ? 'square' : idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        if (ctx.createStereoPanner) {
          const pan = ctx.createStereoPanner();
          pan.pan.setValueAtTime(((idx - 2) / 2.5) * 0.7, ctx.currentTime);
          osc.connect(pan);
          pan.connect(padFilter);
        } else {
          osc.connect(padFilter);
        }
        osc.start();
        return osc;
      });
      padOscsRef.current = oscs;

      padFilter.connect(padGain);
      padGain.connect(master);
      padGain.connect(delay);

      // 3. Steam Noise / Cold Air
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
        b6 = white * 0.115926;
      }

      const sNode = ctx.createBufferSource();
      sNode.buffer = noiseBuffer;
      sNode.loop = true;

      const sFilter = ctx.createBiquadFilter();
      sFilter.type = isCold ? 'highpass' : 'lowpass';
      sFilter.frequency.setValueAtTime(isCold ? 2200 : 750, ctx.currentTime);
      steamFilterRef.current = sFilter;

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(steamGainVal * 0.25, ctx.currentTime);
      steamGainRef.current = sGain;

      sNode.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(master);
      sNode.start();

      // 4. Botanicals Arpeggiator / Cold FM Clinking Bells
      const pentatonic = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66];
      let pIdx = 0;
      const arpTimer = window.setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        const botanicalSum = (amounts.lavender || 0) + (amounts.cardamom || 0);
        if (botanicalSum <= 0) return;

        const f = pentatonic[pIdx % pentatonic.length];
        pIdx++;

        const t = audioCtxRef.current.currentTime;
        const cOsc = audioCtxRef.current.createOscillator();
        const cGain = audioCtxRef.current.createGain();

        cOsc.type = isCold ? 'square' : 'sine';
        cOsc.frequency.setValueAtTime(isCold ? f * 1.5 : f, t);

        const peak = Math.min(0.15, (botanicalSum / 70) * 0.13);
        cGain.gain.setValueAtTime(0.001, t);
        cGain.gain.linearRampToValueAtTime(peak, t + 0.025);
        cGain.gain.exponentialRampToValueAtTime(0.0001, t + (isCold ? 0.45 : 0.65));

        cOsc.connect(cGain);
        cGain.connect(master);
        cGain.connect(delay);

        cOsc.start(t);
        cOsc.stop(t + 0.7);
      }, 700);
      arpIntervalRef.current = arpTimer;

      setAudioActive(true);
    } catch (e) {
      console.warn('AudioContext failed to start:', e);
    }
  }, [amounts, masterVolume, reverbDepth, steamGainVal, isCold]);

  // Handle Dynamic Thermal Shift in Web Audio Engine
  useEffect(() => {
    if (!audioCtxRef.current || !audioActive) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Shift Chord Timbre
    if (padOscsRef.current.length > 0) {
      padOscsRef.current.forEach((osc, i) => {
        // Cold mode uses crystalline square/sine blend; Hot mode uses velvety sine/triangle
        osc.type = isCold ? 'square' : i % 2 === 0 ? 'sine' : 'triangle';
      });
    }

    // Filter Cutoff
    if (padFilterRef.current) {
      const targetCutoff = isCold ? 950 : 440;
      padFilterRef.current.frequency.setTargetAtTime(targetCutoff, now, 0.4);
    }

    // Delay Time: Cold mode is snappier; Hot mode is lusher
    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.setTargetAtTime(isCold ? 0.32 : 0.5, now, 0.5);
    }

    // Steam Noise Filter: Hot = low-pass steam hiss; Cold = high-pass air chime
    if (steamFilterRef.current) {
      steamFilterRef.current.type = isCold ? 'highpass' : 'lowpass';
      steamFilterRef.current.frequency.setTargetAtTime(isCold ? 2400 : 700, now, 0.4);
    }

    // If switching to cold, trigger intermittent crystalline ice clinks
    if (isCold && !clinkIntervalRef.current) {
      clinkIntervalRef.current = window.setInterval(() => {
        if (amounts.thermal > 0 || Math.random() < 0.4) {
          playIceClinkSfx();
        }
      }, 3800);
    } else if (!isCold && clinkIntervalRef.current) {
      clearInterval(clinkIntervalRef.current);
      clinkIntervalRef.current = null;
    }

    return () => {
      if (clinkIntervalRef.current) {
        clearInterval(clinkIntervalRef.current);
        clinkIntervalRef.current = null;
      }
    };
  }, [isCold, audioActive, amounts.thermal, playIceClinkSfx]);

  // Adjust volume levels as amounts change
  useEffect(() => {
    if (!audioCtxRef.current || !audioActive) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    if (bassGainRef.current) {
      const bVol = Math.min(0.28, (amounts.espresso / 60) * 0.28);
      bassGainRef.current.gain.setTargetAtTime(bVol, now, 0.2);
    }
    if (padGainRef.current) {
      const pVol = Math.min(0.26, (amounts.oat / 60) * 0.26);
      padGainRef.current.gain.setTargetAtTime(pVol, now, 0.2);
    }
  }, [amounts, audioActive]);

  // Thermal Mode Toggle Handler
  const handleToggleThermal = (mode: ThermalMode) => {
    setThermalMode(mode);
    initAudio();

    if (mode === 'cold') {
      // Spawn initial floating ice cubes
      if (iceBlocksRef.current.length === 0) {
        for (let i = 0; i < 3; i++) {
          iceBlocksRef.current.push(new IceBlock(130 + i * 40, 160 + i * 15));
        }
      }
      playIceClinkSfx();
      showToast('Switched to Cryo Iced Mode (4°C)');
    } else {
      // Clear ice cubes, let hot steam ribbons rise
      iceBlocksRef.current = [];
      showToast('Switched to Steamed Thermal Mode (68°C)');
    }
  };

  // Inject ingredient function
  const injectIngredient = useCallback(
    (ingId: string, count = 3, posX: number | null = null) => {
      initAudio();
      playSplashSfx(ingId);

      setAmounts((prev) => {
        const curTotal = Object.values(prev).reduce((a, b) => a + b, 0);
        if (curTotal >= 100) return prev;
        const add = Math.min(5, 100 - curTotal);
        return {
          ...prev,
          [ingId]: prev[ingId] + add,
        };
      });

      const dropX = posX !== null ? posX : 170 + (Math.random() - 0.5) * 80;

      // Special handling for Thermal Agitator
      if (ingId === 'thermal') {
        if (isCold) {
          // Drop an Ice Block into reservoir
          iceBlocksRef.current.push(new IceBlock(dropX, 50));
          playIceClinkSfx();
          showToast('Added Crystal Ice Cube');
        } else {
          // Burst of steam ribbons & micro-bubbles
          for (let i = 0; i < 6; i++) {
            steamRibbonsRef.current.push(new SteamRibbon(dropX, 200));
          }
          showToast('Injected Boiling Steam Shot');
        }
      } else {
        const ing = INGREDIENTS[ingId];
        for (let i = 0; i < count; i++) {
          particlesRef.current.push(
            new FluidParticle(dropX + (Math.random() - 0.5) * 24, 30 + Math.random() * 20, ing.color, isCold)
          );
        }
        showToast(`Added +5% ${ing.label}`);
      }
    },
    [initAudio, playSplashSfx, isCold, playIceClinkSfx]
  );

  // Apply Presets
  const applyPreset = (presetName: string) => {
    initAudio();
    let newAmounts = { espresso: 0, oat: 0, thermal: 0, lavender: 0, salt: 0, cardamom: 0 };
    if (presetName === 'cortado') {
      newAmounts = { espresso: 50, oat: 50, thermal: 0, lavender: 0, salt: 0, cardamom: 0 };
    } else if (presetName === 'lavender') {
      newAmounts = { espresso: 30, oat: 50, thermal: 0, lavender: 20, salt: 0, cardamom: 0 };
    } else if (presetName === 'alchemy') {
      newAmounts = { espresso: 30, oat: 35, thermal: 15, lavender: 10, salt: 5, cardamom: 5 };
    } else if (presetName === 'ristretto') {
      newAmounts = { espresso: 100, oat: 0, thermal: 0, lavender: 0, salt: 0, cardamom: 0 };
    }
    setAmounts(newAmounts);

    particlesRef.current = [];
    if (isCold) {
      iceBlocksRef.current = [new IceBlock(130, 160), new IceBlock(170, 175), new IceBlock(210, 160)];
    }
    showToast(`Loaded ${presetName.toUpperCase()} blend`);
  };

  // Flush cup
  const flushCup = () => {
    setAmounts({ espresso: 0, oat: 0, thermal: 0, lavender: 0, salt: 0, cardamom: 0 });
    particlesRef.current = [];
    iceBlocksRef.current = [];
    steamRibbonsRef.current = [];
    showToast('Reservoir Cleared');
  };

  // Call Gemini API for Barista Recipe with Thermal Dimension
  const handleSynthesizeBrew = async () => {
    setIsModalOpen(true);
    setIsLoadingRecipe(true);
    setDispatchedToast(false);

    try {
      const response = await fetch('/api/gemini/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: amounts,
          totalVolume,
          temperature: isCold ? 'Iced / Cold Brew' : 'Hot / Steamed',
        }),
      });
      const data = await response.json();
      setCurrentRecipe(data);
    } catch (e) {
      console.warn('Failed to synthesize brew via API:', e);
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // Master Gain slider handler
  const handleMasterGainChange = (val: number) => {
    setMasterVolume(val);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Reverb Depth slider handler
  const handleReverbChange = (val: number) => {
    setReverbDepth(val);
    if (delayGainRef.current && audioCtxRef.current) {
      delayGainRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Steam ASMR slider handler
  const handleSteamGainChange = (val: number) => {
    setSteamGainVal(val);
    if (steamGainRef.current && audioCtxRef.current) {
      steamGainRef.current.gain.setValueAtTime(val * 0.25, audioCtxRef.current.currentTime);
    }
  };

  // Toggle Audio state
  const toggleAudio = () => {
    if (!audioCtxRef.current) {
      initAudio();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
      setAudioActive(true);
    } else if (audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
      setAudioActive(false);
    }
  };

  // Canvas Animation Loop
  useEffect(() => {
    const fCanvas = fluidCanvasRef.current;
    const sCanvas = scopeCanvasRef.current;
    if (!fCanvas || !sCanvas) return;

    const fCtx = fCanvas.getContext('2d');
    const sCtx = sCanvas.getContext('2d');
    if (!fCtx || !sCtx) return;

    let animId: number;

    const render = () => {
      // 1. Fluid Canvas Rendering
      fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);

      const tot = Object.values(amounts).reduce((a, b) => a + b, 0);
      const fillHeight = (tot / 100) * 200;
      const surfaceY = 300 - fillHeight;

      if (tot > 0) {
        // Weighted Color Blend with thermal tinting
        let r = 0, g = 0, b = 0;
        Object.keys(amounts).forEach((k) => {
          const frac = amounts[k] / tot;
          const col = INGREDIENTS[k].color;
          r += col[0] * frac;
          g += col[1] * frac;
          b += col[2] * frac;
        });

        // Cold mode tint shift towards cool condensation tones; Hot mode towards rich warm amber
        if (isCold) {
          r = Math.round(r * 0.88);
          g = Math.round(Math.min(255, g * 0.98 + 8));
          b = Math.round(Math.min(255, b * 1.1 + 18));
        } else {
          r = Math.round(Math.min(255, r * 1.05 + 8));
          g = Math.round(g * 0.96);
          b = Math.round(b * 0.9);
        }

        fCtx.save();
        // Vessel Mask
        fCtx.beginPath();
        fCtx.moveTo(35, 30);
        fCtx.lineTo(305, 30);
        fCtx.lineTo(290, 260);
        fCtx.quadraticCurveTo(270, 315, 170, 315);
        fCtx.quadraticCurveTo(70, 315, 50, 260);
        fCtx.closePath();
        fCtx.clip();

        // Liquid Body Gradient
        const liquidGrad = fCtx.createLinearGradient(0, surfaceY, 0, 315);
        liquidGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isCold ? 0.98 : 0.95})`);
        liquidGrad.addColorStop(
          1,
          `rgba(${Math.max(0, r - 25)}, ${Math.max(0, g - 18)}, ${Math.max(0, b - 8)}, 0.99)`
        );
        fCtx.fillStyle = liquidGrad;
        fCtx.fillRect(35, surfaceY, 270, 315 - surfaceY);

        // Meniscus surface wave: Hot = rapid energetic wave; Cold = stiff, gentle wave
        fCtx.beginPath();
        fCtx.moveTo(35, surfaceY);
        const waveSpeed = isCold ? 0.0018 : 0.0045;
        const waveAmp = isCold ? 1.4 : 3.2;
        const waveOffset = Math.sin(Date.now() * waveSpeed) * waveAmp;
        fCtx.quadraticCurveTo(170, surfaceY + waveOffset - 2, 305, surfaceY);
        fCtx.strokeStyle = isCold ? 'rgba(215, 240, 255, 0.65)' : 'rgba(255, 245, 230, 0.45)';
        fCtx.lineWidth = isCold ? 3 : 2;
        fCtx.stroke();

        // Ice Blocks (Cold Mode only)
        if (isCold) {
          iceBlocksRef.current.forEach((ice) => {
            ice.update(surfaceY);
            ice.draw(fCtx);
          });
        }

        // Fluid Particles
        particlesRef.current.forEach((p, idx) => {
          p.update(300, isCold);
          p.draw(fCtx);
          if (p.y >= 295 && Math.random() < 0.04) {
            particlesRef.current.splice(idx, 1);
          }
        });

        // Steam Vapor Ribbons (Hot Mode only)
        if (!isCold) {
          if (Math.random() < 0.35 && tot > 10) {
            steamRibbonsRef.current.push(new SteamRibbon(170, surfaceY));
          }
          steamRibbonsRef.current.forEach((s, idx) => {
            s.update();
            s.draw(fCtx);
            if (s.life >= s.maxLife || s.alpha <= 0.01) {
              steamRibbonsRef.current.splice(idx, 1);
            }
          });
        }

        fCtx.restore();

        // Condensation droplets on the outer glass in Cold Mode
        if (isCold) {
          fCtx.save();
          fCtx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          const tNow = Date.now() * 0.0005;
          for (let i = 0; i < 7; i++) {
            const dropX = 60 + i * 32 + Math.sin(tNow + i) * 4;
            const dropY = surfaceY + 25 + (i * 18) % 90;
            fCtx.beginPath();
            fCtx.ellipse(dropX, dropY, 2, 3.5, 0, 0, Math.PI * 2);
            fCtx.fill();
          }
          fCtx.restore();
        }
      }

      // 2. Oscilloscope Waveform
      sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
      const analyser = analyserRef.current;

      if (!analyser || !audioActive) {
        sCtx.strokeStyle = isCold ? '#A8D8F8' : '#D9CFC2';
        sCtx.lineWidth = 1.5;
        sCtx.beginPath();
        sCtx.moveTo(0, sCanvas.height / 2);
        sCtx.lineTo(sCanvas.width, sCanvas.height / 2);
        sCtx.stroke();
      } else {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        sCtx.lineWidth = 2;
        sCtx.strokeStyle = isCold ? '#2B84B8' : '#78253A';
        sCtx.beginPath();

        const sliceWidth = (sCanvas.width * 1.0) / bufferLength;
        let x = 0;
        let sum = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * sCanvas.height) / 2;
          sum += Math.abs(dataArray[i] - 128);

          if (i === 0) sCtx.moveTo(x, y);
          else sCtx.lineTo(x, y);

          x += sliceWidth;
        }
        sCtx.stroke();

        const avgAmp = sum / bufferLength;
        const pct = Math.min(100, Math.round((avgAmp / 40) * 100));
        setMeterPct(pct);
        setMeterDb(pct > 2 ? `-${Math.max(0, 36 - Math.round(pct * 0.36))}dB` : '-inf');
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    animFrameRef.current = animId;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [amounts, audioActive, isCold]);

  // Initial load: Set Cortado baseline preset
  useEffect(() => {
    setAmounts({ espresso: 50, oat: 50, thermal: 0, lavender: 0, salt: 0, cardamom: 0 });
  }, []);

  return (
    <div
      className={`text-[#132738] antialiased select-none min-h-screen flex flex-col font-sans overflow-x-hidden transition-colors duration-500 ${
        isCold ? 'bg-[#F4F9FD]' : 'bg-[#FBF9F5]'
      }`}
    >
      {/* TOP NAVIGATION HEADER */}
      <header className="w-full h-16 md:h-18 flex items-center justify-between px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs z-40 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-3 md:gap-5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs transition-colors duration-500 ${
              isCold ? 'bg-[#2B84B8]' : 'bg-[#0E283F]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCold ? 'ac_unit' : 'coffee'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-sm md:text-base tracking-wider text-[#0E283F] uppercase">
              LATTE LATTICE
            </span>
            <span
              className={`text-[10px] md:text-[11px] font-sans font-semibold tracking-wider uppercase transition-colors duration-500 ${
                isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
              }`}
            >
              {isCold ? 'CRYO COLD BREW LAB' : 'SONIC-BREW WORKSTATION'}
            </span>
          </div>

          {/* Desktop Status Badge */}
          <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-[#E3D9C9] text-xs font-mono text-[#647282]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6F1E9] border border-[#E3D9C9]">
              <span
                className={`w-2 h-2 rounded-full active-beacon ${
                  isCold ? 'bg-[#2B84B8]' : 'bg-[#78253A]'
                }`}
              ></span>
              <span className="text-[#0E283F] font-bold">
                {audioActive ? (isCold ? 'CRYO BELLS' : 'PEACEFUL STEAM') : 'STANDBY'}
              </span>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6F1E9] border border-[#E3D9C9]">
              <span>LEVEL:</span>
              <div className="w-12 h-2 bg-[#E3D9C9] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    isCold ? 'bg-[#2B84B8]' : 'bg-[#78253A]'
                  }`}
                  style={{ width: `${meterPct}%` }}
                ></div>
              </div>
              <span className="w-7 text-right font-mono text-[10px] text-[#0E283F] font-semibold">
                {meterDb}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleAudio}
            title="Toggle Audio Engine"
            className="px-3 py-1.5 rounded-full bg-[#F6F1E9] border border-[#E3D9C9] text-[#0E283F] hover:border-[#78253A] hover:text-[#78253A] flex items-center gap-1.5 transition-all text-xs font-medium"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                audioActive
                  ? isCold
                    ? 'bg-[#2B84B8] active-beacon'
                    : 'bg-[#78253A] active-beacon'
                  : 'bg-[#8B7E72]'
              }`}
            ></span>
            <span className="material-symbols-outlined text-[17px]">
              {audioActive ? 'volume_up' : 'volume_off'}
            </span>
            <span className="hidden sm:inline font-mono text-[11px]">
              {audioActive ? 'MUSIC ON' : 'MUTED'}
            </span>
          </button>

          <button
            onClick={flushCup}
            title="Reset Fluid Reservoir"
            className="p-1.5 md:px-2.5 md:py-1.5 rounded-full bg-[#F6F1E9] border border-[#E3D9C9] text-[#647282] hover:text-red-700 hover:border-red-200 flex items-center gap-1 transition-all text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
            <span className="hidden sm:inline font-mono text-[11px]">FLUSH</span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 transition-colors duration-500 ${
              isCold
                ? 'bg-[#EAF4FC] border border-[#B5DAF4] text-[#1E6796]'
                : 'bg-[#FAF3EC] border border-[#E5C7A3] text-[#9E5A17]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">water_drop</span>
            <span>{totalVolume}% FULL</span>
          </div>

          {/* Golden Brew Button */}
          <button
            onClick={handleSynthesizeBrew}
            className={`px-4 md:px-6 py-2 text-white font-headline font-bold text-xs md:text-sm tracking-wider rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
              isCold
                ? 'bg-gradient-to-r from-[#3B9ED9] to-[#2072A8] hover:from-[#2072A8] hover:to-[#175A86]'
                : 'bg-gradient-to-r from-[#E59F48] to-[#D68C3E] hover:from-[#D68C3E] hover:to-[#C17A2F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>{totalVolume >= 100 ? 'BREW NOW' : 'SYNTHESIZE BREW'}</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSTATION SUITE */}
      <main className="flex-1 pt-16 md:pt-18 pb-16 md:pb-0 flex flex-col lg:grid lg:grid-cols-12 min-h-[calc(100vh-4.5rem)]">
        {/* ========================================================== */}
        {/* LEFT COLUMN: MODULE 01 // TELEMETRY WITH FORMULATION ON TOP */}
        {/* ========================================================== */}
        <aside
          className={`lg:col-span-3 bg-white border-r border-[#E8E2D8] p-4 md:p-5 flex-col justify-between overflow-y-auto max-h-[calc(100vh-4.5rem)] ${
            mobileTab === 'telemetry' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <span
                className={`text-[11px] font-mono tracking-widest font-bold uppercase flex items-center gap-1.5 ${
                  isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">tune</span>
                MODULE 01 // TELEMETRY
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  isCold ? 'text-[#2B84B8]' : 'text-[#D68C3E]'
                }`}
              >
                {totalVolume}% BLEND
              </span>
            </div>

            {/* 1. FORMULATION RATIO MATRIX (AT THE TOP) */}
            <div
              className={`p-4 rounded-xl border shadow-xs space-y-3 transition-colors duration-500 ${
                isCold
                  ? 'bg-[#F6FAFD] border-[#D8EAF8]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div className="flex justify-between items-center pb-1.5 border-b border-[#E8E2D8]">
                <span className="text-[11px] font-headline font-bold text-[#0E283F] uppercase tracking-wider flex items-center gap-1">
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                    }`}
                  >
                    pie_chart
                  </span>
                  FORMULATION RATIO MATRIX
                </span>
                <span className="text-[10px] font-mono text-[#647282] uppercase">
                  {isCold ? 'CRYO RATIO' : 'STEAM RATIO'}
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.keys(INGREDIENTS).map((key) => {
                  const ing = INGREDIENTS[key];
                  const amt = amounts[key] || 0;
                  const pct = totalVolume > 0 ? Math.round((amt / totalVolume) * 100) : 0;
                  const activeBadge = isCold ? ing.coldBadge : ing.hotBadge;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-sans">
                        <span className="flex items-center gap-2 font-medium text-[#0E283F]">
                          <span
                            className={`w-3 h-3 rounded-full border ${ing.borderClass} shadow-xs`}
                            style={{ backgroundColor: ing.hex }}
                          ></span>
                          <span>{ing.label}</span>
                          <span className="text-[10px] font-mono text-[#8B7E72] hidden sm:inline">
                            ({activeBadge})
                          </span>
                        </span>
                        <span className="text-[#0E283F] font-mono font-bold text-xs">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E8E2D8] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-200 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isCold && key === 'thermal' ? '#4A9FD9' : ing.hex,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Vessel Meniscus Saturation & Mass Gauge */}
            <div
              className={`p-4 rounded-xl border shadow-xs transition-colors duration-500 ${
                isCold
                  ? 'bg-[#F6FAFD] border-[#D8EAF8]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-headline font-bold text-[#0E283F]">
                  Vessel Saturation
                </span>
                <span
                  className={`text-xl font-mono font-bold ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  {totalVolume}
                  <span className="text-xs text-[#D68C3E]">%</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#E8E2D8] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCold
                      ? 'bg-gradient-to-r from-[#70BBE8] via-[#2B84B8] to-[#0E283F]'
                      : 'bg-gradient-to-r from-[#D68C3E] via-[#78253A] to-[#0E283F]'
                  }`}
                  style={{ width: `${totalVolume}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2.5 text-[11px] font-mono text-[#647282]">
                <span>0.0 ml (TARE)</span>
                <span className="font-semibold text-[#0E283F]">{massGrams} / 220.0 g</span>
              </div>
            </div>

            {/* 3. Live Audio Waveform (Oscilloscope) */}
            <div
              className={`p-3.5 rounded-xl border shadow-xs space-y-2 transition-colors duration-500 ${
                isCold
                  ? 'bg-[#F6FAFD] border-[#D8EAF8]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-[#0E283F] font-bold uppercase">
                  {isCold ? 'CRYO HARMONIC SPECTRUM' : 'THERMAL HARMONIC SPECTRUM'}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  {audioActive ? '256 BINS LIVE' : 'STANDBY'}
                </span>
              </div>
              <div className="h-14 bg-white rounded-lg border border-[#E8E2D8] overflow-hidden relative shadow-inner">
                <canvas
                  ref={scopeCanvasRef}
                  width={300}
                  height={70}
                  className="w-full h-full block"
                ></canvas>
                <div className="absolute inset-0 pointer-events-none flex justify-between items-end px-2.5 py-1 text-[8px] font-mono text-[#8B7E72]/60">
                  <span>{isCold ? 'CRYO FM' : 'WARM SINE'}</span>
                  <span>{isCold ? 'ICE CLINK' : 'VELVET PAD'}</span>
                  <span>{isCold ? 'SHIMMER' : 'LO-FI ASMR'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10px] font-mono text-[#8B7E72]">
            <span>THERMAL STATE: {isCold ? 'ICED (4°C)' : 'HOT STEAM (68°C)'}</span>
            <span>LATENCY: 4.2ms</span>
          </div>
        </aside>

        {/* ========================================================== */}
        {/* CENTER COLUMN: CERAMIC CUP & TACTILE THERMAL CORE CONTROLLER */}
        {/* ========================================================== */}
        <section
          className={`lg:col-span-6 flex flex-col justify-between p-3 md:p-5 relative overflow-hidden transition-colors duration-700 ${
            isCold
              ? 'bg-gradient-to-b from-[#EFF6FC] via-[#E6F0F8] to-[#DCE8F2]'
              : 'bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE8] to-[#ECE5DC]'
          } ${mobileTab === 'reservoir' ? 'flex' : 'hidden lg:flex'}`}
        >
          {/* TACTILE "THERMAL CORE" DUAL-ZONE CONTROLLER */}
          <div className="z-20 bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl p-2.5 md:p-3 mb-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0E283F]">
                  device_thermostat
                </span>
                <div>
                  <span className="text-[11px] font-headline font-bold text-[#0E283F] uppercase tracking-wider block">
                    THERMAL CORE CONTROLLER
                  </span>
                  <span className="text-[9px] font-mono text-[#647282]">
                    Alters fluid viscosity, ice crystals, and synthesizer harmonics
                  </span>
                </div>
              </div>

              {/* Physical Dual-Zone Thermal State Orb Switcher */}
              <div className="flex items-center p-1 rounded-full bg-[#EDE5D8] border border-[#D5C8B4] relative">
                <button
                  onClick={() => handleToggleThermal('hot')}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-headline font-bold transition-all duration-300 cursor-pointer ${
                    !isCold
                      ? 'bg-gradient-to-r from-[#D68C3E] to-[#BD621C] text-white shadow-md'
                      : 'text-[#647282] hover:text-[#0E283F]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">mode_heat</span>
                  <span>HOT STEAM (68°C)</span>
                </button>

                <button
                  onClick={() => handleToggleThermal('cold')}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-headline font-bold transition-all duration-300 cursor-pointer ${
                    isCold
                      ? 'bg-gradient-to-r from-[#3A9DD8] to-[#1C6BA0] text-white shadow-md'
                      : 'text-[#647282] hover:text-[#0E283F]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">ac_unit</span>
                  <span>CRYO ICED (4°C)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Injector Bar with Thermal Variants */}
          <div className="z-20 bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl p-3 md:p-3.5 mb-2 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-[11px] font-headline font-bold text-[#0E283F] flex items-center gap-1.5 uppercase tracking-wider">
                <span
                  className={`material-symbols-outlined text-[15px] ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#D68C3E]'
                  }`}
                >
                  bubble_chart
                </span>
                INGREDIENT INJECTORS ({isCold ? 'COLD ADAPTED' : 'HOT ADAPTED'})
              </span>
              <span className="text-[10px] md:text-[11px] font-mono text-[#647282] font-semibold">
                {massGrams} / 220.0 g
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5 md:gap-2">
              {Object.keys(INGREDIENTS).map((key) => {
                const ing = INGREDIENTS[key];
                const activeBadge = isCold ? ing.coldBadge : ing.hotBadge;
                const activeBg = isCold ? ing.bgGradCold : ing.bgGradHot;

                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', ing.id);
                    }}
                    onClick={() => injectIngredient(ing.id, 4)}
                    title={isCold ? ing.coldDesc : ing.hotDesc}
                    className={`cursor-grab active:cursor-grabbing flex flex-col items-center p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] transition-all active:scale-95 shadow-xs ${
                      isCold
                        ? 'hover:border-[#2B84B8] hover:bg-[#F2F8FD]'
                        : 'hover:border-[#D68C3E] hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${activeBg} border ${ing.borderClass} shadow-xs flex items-center justify-center text-white`}
                    >
                      <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                        {key === 'thermal' ? (isCold ? 'ac_unit' : 'air') : ing.icon}
                      </span>
                    </div>
                    <span className="text-[10px] md:text-[11px] font-headline font-bold text-[#0E283F] mt-1.5 truncate max-w-full text-center">
                      {ing.label}
                    </span>
                    <span
                      className={`text-[8px] md:text-[9px] font-mono font-medium truncate ${
                        isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                      }`}
                    >
                      {activeBadge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN STAGE: CERAMIC CUP / CHILLED GLASS & FLUID PHYSICS CANVAS */}
          <div
            className="relative flex-1 flex flex-col items-center justify-center min-h-[300px] md:min-h-[340px] my-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const ingId = e.dataTransfer.getData('text/plain');
              if (ingId && INGREDIENTS[ingId]) {
                const rect = fluidCanvasRef.current?.getBoundingClientRect();
                const clickX = rect ? e.clientX - rect.left : 170;
                injectIngredient(ingId, 5, clickX);
              }
            }}
          >
            {/* Ambient Aura reflecting Thermal State */}
            <div
              className={`absolute w-72 md:w-88 h-72 md:h-88 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                isCold ? 'bg-[#70BBE8]/20' : 'bg-[#E59F48]/15'
              }`}
            ></div>

            {/* Vessel Structure (Ceramic for Hot, Frost Glass for Cold) */}
            <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-b-[60px] md:rounded-b-[70px] rounded-t-lg border-[3px] shadow-[0_15px_40px_rgba(14,40,63,0.12)] overflow-hidden pointer-events-none transition-all duration-500 ${
                  isCold
                    ? 'border-[#B5DAF4] bg-[#EAF4FC]/90 backdrop-blur-sm'
                    : 'border-[#DDD3C4] bg-[#F7F2EA]'
                }`}
              >
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isCold
                      ? 'bg-gradient-to-b from-[#E0F0FC]/70 via-transparent to-[#BCE0F8]/50'
                      : 'bg-gradient-to-b from-[#EFE8DD] via-transparent to-[#E3D9C9]/50'
                  }`}
                ></div>

                {/* Graduation Markers */}
                <div
                  className={`absolute left-2.5 md:left-3 top-6 md:top-8 bottom-8 md:bottom-10 flex flex-col justify-between text-[8px] md:text-[9px] font-mono select-none pointer-events-none ${
                    isCold ? 'text-[#48789A]' : 'text-[#8B7E72]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`w-2.5 md:w-3 h-[1.5px] ${
                        isCold ? 'bg-[#48789A]' : 'bg-[#8B7E72]'
                      }`}
                    ></span>
                    200ml (MAX)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-[1px] opacity-60"></span>150ml
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`w-2.5 md:w-3 h-[1.5px] ${
                        isCold ? 'bg-[#48789A]' : 'bg-[#8B7E72]'
                      }`}
                    ></span>
                    100ml (CORTO)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-[1px] opacity-60"></span>50ml
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`w-2.5 md:w-3 h-[1.5px] ${
                        isCold ? 'bg-[#48789A]' : 'bg-[#8B7E72]'
                      }`}
                    ></span>
                    25ml (SOLO)
                  </span>
                </div>

                <div
                  className={`absolute bottom-0 inset-x-0 h-4 border-t ${
                    isCold
                      ? 'bg-[#D2EAF8] border-[#B5DAF4]'
                      : 'bg-[#E2D6C5] border-[#D5C8B4]'
                  }`}
                ></div>
              </div>

              {/* HTML5 Fluid Simulation Canvas */}
              <canvas
                ref={fluidCanvasRef}
                width={340}
                height={340}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scale = 340 / rect.width;
                  const clickX = (e.clientX - rect.left) * scale;
                  const keys = Object.keys(INGREDIENTS);
                  const randomIng = keys[Math.floor(Math.random() * keys.length)];
                  injectIngredient(randomIng, 4, clickX);
                }}
                className="absolute inset-0 z-10 w-[280px] h-[280px] md:w-[340px] md:h-[340px] cursor-crosshair"
              ></canvas>

              {/* Drop Prompt Cue when empty */}
              {totalVolume === 0 && (
                <div className="absolute z-20 pointer-events-none text-center px-4 transition-opacity duration-300">
                  <div
                    className={`w-12 h-12 mx-auto rounded-full bg-white/90 border shadow-md flex items-center justify-center mb-2 animate-bounce ${
                      isCold
                        ? 'border-[#B5DAF4] text-[#2B84B8]'
                        : 'border-[#E8E2D8] text-[#D68C3E]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {isCold ? 'ac_unit' : 'water_drop'}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-headline font-bold text-[#0E283F]">
                    {isCold ? 'Tap ice or cold brew to infuse' : 'Tap globules or cup to infuse'}
                  </p>
                  <p className="text-[10px] md:text-xs font-sans text-[#647282] mt-0.5">
                    {isCold ? 'Crisp cold foam & ice cube clink' : 'Billowing steam & lo-fi warmth'}
                  </p>
                </div>
              )}
            </div>

            {/* Toast Message Notification */}
            {toastMessage && (
              <div
                className={`absolute bottom-1 md:bottom-2 z-30 transition-all duration-300 text-white px-3.5 py-1.5 rounded-full text-xs font-mono shadow-md ${
                  isCold ? 'bg-[#1E6796]' : 'bg-[#0E283F]'
                }`}
              >
                {toastMessage}
              </div>
            )}
          </div>

          {/* Quick Formulation Presets */}
          <div className="z-20 bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl p-3 md:p-3.5 mt-1 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-[11px] font-headline font-bold text-[#0E283F] flex items-center gap-1.5 uppercase tracking-wider">
                <span
                  className={`material-symbols-outlined text-[14px] ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  auto_fix_high
                </span>
                {isCold ? 'CRYO COLD BREW PRESETS' : 'SIGNATURE STEAMED PRESETS'}
              </span>
              <button
                onClick={flushCup}
                className="text-[10px] md:text-xs font-mono text-[#647282] hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px] md:text-[14px]">delete</span>
                <span>Flush Cup</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => applyPreset('cortado')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  {isCold ? 'Iced Cortado' : 'Cortado'}
                </span>
                <span
                  className={`text-[9px] font-mono block truncate font-medium ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  {isCold ? 'Cold Foam 50/50' : '50/50 Oat Foam'}
                </span>
              </button>
              <button
                onClick={() => applyPreset('lavender')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  {isCold ? 'Glacial Fog' : 'Lavender Fog'}
                </span>
                <span
                  className={`text-[9px] font-mono block truncate font-medium ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  {isCold ? 'Crystalline Spritz' : 'Floral Triad'}
                </span>
              </button>
              <button
                onClick={() => applyPreset('alchemy')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  {isCold ? 'Kyoto Frost' : 'Alchemical'}
                </span>
                <span
                  className={`text-[9px] font-mono block truncate font-medium ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  {isCold ? 'Clinking Spice' : '5-Tone Spice'}
                </span>
              </button>
              <button
                onClick={() => applyPreset('ristretto')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  {isCold ? 'Flash Chilled' : 'Ristretto'}
                </span>
                <span
                  className={`text-[9px] font-mono block truncate font-medium ${
                    isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                  }`}
                >
                  {isCold ? 'Obsidian Drip' : '100% Espresso'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* RIGHT COLUMN: SYNTH RACK & GEMINI BARISTA CARD (~col-span-3) */}
        {/* ========================================================== */}
        <aside
          className={`lg:col-span-3 bg-white border-l border-[#E8E2D8] p-4 md:p-5 flex-col justify-between overflow-y-auto max-h-[calc(100vh-4.5rem)] ${
            mobileTab === 'gemini' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <span
                className={`text-[11px] font-mono tracking-widest font-bold uppercase flex items-center gap-1.5 ${
                  isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">graphic_eq</span>
                MODULE 02 // SYNTH RACK
              </span>
              <span className="text-[10px] font-mono text-[#0E283F] font-bold">
                {isCold ? 'CRYO ENGINE' : 'THERMAL ENGINE'}
              </span>
            </div>

            {/* Audio Activate Banner if not started */}
            {!audioActive && (
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#D68C3E]/50 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D68C3E] text-[20px]">
                    {isCold ? 'ac_unit' : 'spa'}
                  </span>
                  <div>
                    <p className="text-xs font-headline font-bold text-[#0E283F]">Sound Standby</p>
                    <p className="text-[10px] font-sans text-[#647282]">
                      Click to unlock {isCold ? 'crystalline ice lounge' : 'warm cafe lounge'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={initAudio}
                  className="px-3 py-1 bg-[#D68C3E] text-white text-[10px] font-mono font-bold rounded-full uppercase hover:bg-[#C17A2F] active:scale-95 transition-all shadow-xs"
                >
                  START
                </button>
              </div>
            )}

            {/* DSP Controls */}
            <div
              className={`p-4 rounded-xl border shadow-xs space-y-3 transition-colors duration-500 ${
                isCold
                  ? 'bg-[#F6FAFD] border-[#D8EAF8]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-sans mb-1">
                  <span className="text-[#0E283F] font-semibold">Master Ambience Volume</span>
                  <span className="text-[#D68C3E] font-mono font-bold">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterVolume}
                  onChange={(e) => handleMasterGainChange(parseFloat(e.target.value))}
                  className="w-full h-6"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D8]">
                <div className="flex justify-between items-center text-xs font-sans mb-1">
                  <span className="text-[#0E283F] font-semibold">
                    {isCold ? 'Crystalline Reverb & Frost' : 'Warm Lo-Fi Reverb'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                    }`}
                  >
                    {Math.round(reverbDepth * 100)}% Depth
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={reverbDepth}
                  onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
                  className="w-full h-6"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D8]">
                <div className="flex justify-between items-center text-xs font-sans mb-1">
                  <span className="text-[#0E283F] font-semibold">
                    {isCold ? 'Crystalline Ice Clink Rate' : 'Cafe Steam & Boiler ASMR'}
                  </span>
                  <span className="text-[#8B7E72] font-mono font-bold">
                    {Math.round(steamGainVal * 100)}% ASMR
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.45"
                  step="0.02"
                  value={steamGainVal}
                  onChange={(e) => handleSteamGainChange(parseFloat(e.target.value))}
                  className="w-full h-6"
                />
              </div>
            </div>

            {/* GEMINI BARISTA SPECIFICATION */}
            <div
              className={`p-4 rounded-xl border shadow-xs space-y-3 relative overflow-hidden transition-colors duration-500 ${
                isCold
                  ? 'bg-[#F6FAFD] border-[#D8EAF8]'
                  : 'bg-[#FAF8F5] border-[#E8E2D8]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                    }`}
                  >
                    psychology
                  </span>
                  <span className="text-[11px] font-headline font-bold text-[#0E283F] uppercase tracking-wider">
                    GEMINI BARISTA SPEC
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isCold
                      ? 'bg-[#EAF4FC] text-[#2B84B8] border border-[#B5DAF4]'
                      : 'bg-[#FAF3EC] text-[#D68C3E] border border-[#E5C7A3]'
                  }`}
                >
                  {isCold ? 'CRYO ICED' : 'HOT STEAM'}
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[9px] font-mono text-[#647282] block uppercase font-semibold">
                    BEVERAGE CODENAME
                  </span>
                  <h3 className="text-sm font-headline font-bold text-[#0E283F] mt-0.5">
                    {currentRecipe.drinkName}
                  </h3>
                  <p className="text-[11px] text-[#647282] mt-0.5 italic">
                    {currentRecipe.vibeCard}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-mono text-[#647282] block mb-1 uppercase font-semibold">
                    TASTING NOTES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRecipe.tastingNotes.map((note, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8E2D8] text-[10px] font-sans font-medium text-[#78253A] shadow-2xs"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E8E2D8] space-y-1 shadow-2xs">
                  <span
                    className={`text-[9px] font-mono block uppercase font-bold ${
                      isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                    }`}
                  >
                    EXTRACTION & GLASSWARE WORKFLOW
                  </span>
                  <p className="text-xs text-[#132738] leading-relaxed">
                    {currentRecipe.baristaInstructions}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs font-mono">
                  <span className="text-[#647282]">
                    TOKEN:{' '}
                    <span className="text-[#0E283F] font-bold">{currentRecipe.tokenHash}</span>
                  </span>
                  <span className="text-[#D68C3E] font-bold">
                    WAIT:{' '}
                    {currentRecipe.estimatedWaitSec > 0
                      ? `${currentRecipe.estimatedWaitSec} SEC`
                      : '-- SEC'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10px] font-mono text-[#8B7E72]">
            <span>MODEL: gemini-2.5-flash</span>
            <span>THERMAL PROFILE: {isCold ? 'ICED 4°C' : 'HOT 68°C'}</span>
          </div>
        </aside>
      </main>

      {/* MOBILE FIXED BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] z-40 flex items-center justify-around px-2 shadow-sm">
        <button
          onClick={() => setMobileTab('reservoir')}
          className={`flex-1 py-1 flex flex-col items-center justify-center active:scale-95 transition-all ${
            mobileTab === 'reservoir'
              ? isCold
                ? 'text-[#2B84B8] font-bold'
                : 'text-[#78253A] font-bold'
              : 'text-[#647282]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">coffee</span>
          <span className="text-[9px] font-mono tracking-wider uppercase mt-0.5">RESERVOIR</span>
        </button>
        <button
          onClick={() => setMobileTab('telemetry')}
          className={`flex-1 py-1 flex flex-col items-center justify-center active:scale-95 transition-all ${
            mobileTab === 'telemetry'
              ? isCold
                ? 'text-[#2B84B8] font-bold'
                : 'text-[#78253A] font-bold'
              : 'text-[#647282]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">pie_chart</span>
          <span className="text-[9px] font-mono tracking-wider uppercase mt-0.5">FORMULATION</span>
        </button>
        <button
          onClick={() => setMobileTab('gemini')}
          className={`flex-1 py-1 flex flex-col items-center justify-center active:scale-95 transition-all ${
            mobileTab === 'gemini'
              ? isCold
                ? 'text-[#2B84B8] font-bold'
                : 'text-[#78253A] font-bold'
              : 'text-[#647282]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">psychology</span>
          <span className="text-[9px] font-mono tracking-wider uppercase mt-0.5">AI RECIPE</span>
        </button>
      </nav>

      {/* GEMINI BARISTA SYNTHESIS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0E283F]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-[0_25px_60px_rgba(14,40,63,0.25)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    isCold ? 'bg-[#2B84B8]' : 'bg-[#78253A]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isCold ? 'ac_unit' : 'psychology'}
                  </span>
                </div>
                <span className="text-xs font-headline font-bold text-[#0E283F] uppercase tracking-wider">
                  THIRD WAVE COFFEE // {isCold ? 'CRYO COLD BREW SPEC' : 'STEAMED SPECIFICATION'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#647282] hover:text-[#0E283F] transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {isLoadingRecipe ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div
                  className={`w-10 h-10 border-3 border-t-transparent rounded-full animate-spin ${
                    isCold ? 'border-[#2B84B8]' : 'border-[#D68C3E]'
                  }`}
                ></div>
                <p className="text-xs font-sans text-[#647282]">
                  Consulting Gemini 2.5 Flash for {isCold ? 'chilled glassware & cold foam' : 'steaming temperatures & microfoam'}...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span
                    className={`text-[10px] font-mono tracking-wider uppercase font-bold ${
                      isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                    }`}
                  >
                    OFFICIAL ORDER RECEIPT // {isCold ? 'ICED 4°C' : 'HOT 68°C'}
                  </span>
                  <div className="flex justify-between items-baseline mt-0.5">
                    <h2 className="text-lg font-headline font-bold text-[#0E283F]">
                      {currentRecipe.drinkName}
                    </h2>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        isCold
                          ? 'bg-[#EAF4FC] text-[#2B84B8] border-[#B5DAF4]'
                          : 'bg-[#FAF3EC] text-[#D68C3E] border-[#E5C7A3]'
                      }`}
                    >
                      {currentRecipe.tokenHash}
                    </span>
                  </div>
                  <p className="text-xs text-[#647282] mt-1.5 italic">
                    &ldquo;{currentRecipe.vibeCard}&rdquo;
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#8B7E72] uppercase font-bold">
                    TASTING NOTES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRecipe.tastingNotes.map((note, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-sans text-[#0E283F] font-medium shadow-2xs"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-1.5">
                  <span
                    className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1 ${
                      isCold ? 'text-[#2B84B8]' : 'text-[#78253A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isCold ? 'icecream' : 'coffee_maker'}
                    </span>
                    BARISTA WORKFLOW BLUEPRINT
                  </span>
                  <p className="text-xs text-[#132738] leading-relaxed">
                    {currentRecipe.baristaInstructions}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF3EC] border border-[#E5C7A3]">
                  <div className="text-xs font-mono">
                    <span className="text-[#8B7E72] block text-[10px]">EXTRACTION TIME</span>
                    <span className="text-[#0E283F] font-bold text-sm">
                      {currentRecipe.estimatedWaitSec} SECONDS
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setDispatchedToast(true);
                      setTimeout(() => {
                        setIsModalOpen(false);
                        showToast(`Dispatched ${currentRecipe.tokenHash} to Barista!`);
                      }, 700);
                    }}
                    className={`px-5 py-2.5 font-headline font-bold text-xs rounded-full transition-all active:scale-95 shadow-sm cursor-pointer ${
                      dispatchedToast
                        ? isCold
                          ? 'bg-[#2B84B8] text-white'
                          : 'bg-[#78253A] text-white'
                        : isCold
                        ? 'bg-gradient-to-r from-[#3B9ED9] to-[#2072A8] text-white'
                        : 'bg-gradient-to-r from-[#E59F48] to-[#D68C3E] text-white'
                    }`}
                  >
                    {dispatchedToast ? 'DISPATCHED ✓' : 'DISPATCH TO ESPRESSO BAR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
