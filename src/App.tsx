import React, { useEffect, useRef, useState, useCallback } from 'react';

// Types
interface IngredientDef {
  id: string;
  label: string;
  soundLabel: string;
  color: [number, number, number]; // [r, g, b]
  hex: string;
  icon: string;
  badge: string;
  borderClass: string;
  bgGrad: string;
  textCol: string;
}

interface BeverageRecipe {
  drinkName: string;
  tastingNotes: string[];
  baristaInstructions: string;
  vibeCard: string;
  estimatedWaitSec: number;
  tokenHash: string;
}

const INGREDIENTS: Record<string, IngredientDef> = {
  espresso: {
    id: 'espresso',
    label: 'Espresso',
    soundLabel: 'Warm Deep Bass',
    color: [52, 26, 11],
    hex: '#4A2311',
    icon: 'coffee',
    badge: 'Single Origin',
    borderClass: 'border-[#7A3E20]',
    bgGrad: 'from-[#633019] to-[#2B1207]',
    textCol: 'text-[#4A2311]',
  },
  oat: {
    id: 'oat',
    label: 'Steamed Oat',
    soundLabel: 'Silky Warm Pad',
    color: [242, 233, 218],
    hex: '#EADFCF',
    icon: 'grain',
    badge: 'Microfoam Cream',
    borderClass: 'border-[#CBBDA9]',
    bgGrad: 'from-[#FFFFFF] to-[#E5D8C4]',
    textCol: 'text-[#7A6A55]',
  },
  lavender: {
    id: 'lavender',
    label: 'Lavender',
    soundLabel: 'Gentle Chime Arp',
    color: [168, 145, 194],
    hex: '#8E77B3',
    icon: 'spa',
    badge: 'Floral Nectar',
    borderClass: 'border-[#9E86C6]',
    bgGrad: 'from-[#C4B2E0] to-[#7B61A4]',
    textCol: 'text-[#78253A]',
  },
  salt: {
    id: 'salt',
    label: 'Sea Salt',
    soundLabel: 'Pure Mineral Tone',
    color: [250, 248, 245],
    hex: '#FFFFFF',
    icon: 'diamond',
    badge: 'Saline Balance',
    borderClass: 'border-[#D9CFC2]',
    bgGrad: 'from-[#FFFFFF] to-[#ECE5DC]',
    textCol: 'text-[#627383]',
  },
  cardamom: {
    id: 'cardamom',
    label: 'Cardamom',
    soundLabel: 'Warm Velvet Spice',
    color: [222, 155, 84],
    hex: '#D68C3E',
    icon: 'flare',
    badge: 'Spiced Shimmer',
    borderClass: 'border-[#D68C3E]',
    bgGrad: 'from-[#F3B774] to-[#B87027]',
    textCol: 'text-[#9E5A17]',
  },
};

class FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: [number, number, number];
  alpha: number;

  constructor(x: number, y: number, color: [number, number, number]) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = Math.random() * 2 + 1.2;
    this.radius = Math.random() * 9 + 10;
    this.color = color;
    this.alpha = 0.88;
  }

  update(fillLevelY: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.13; // gentle gravity

    if (this.y > fillLevelY) {
      this.y = fillLevelY - Math.random() * 7;
      this.vy *= -0.25;
      this.vx += (Math.random() - 0.5) * 0.8;
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

// Peaceful, lush chords (Dmaj9, Bm11, Gmaj7, A6/9)
const PEACEFUL_CHORD_FREQS = [
  [146.83, 220.00, 277.18, 329.63, 369.99], // D3, A3, C#4, E4, F#4 (Dmaj9)
  [123.47, 185.00, 220.00, 293.66, 369.99], // B2, F#3, A3, D4, F#4 (Bm11)
  [98.00, 146.83, 196.00, 246.94, 293.66],  // G2, D3, G3, B3, D4 (Gmaj7)
  [110.00, 164.81, 220.00, 293.66, 329.63], // A2, E3, A3, D4, E4 (A9sus4)
];

export default function App() {
  // Formulation state
  const [amounts, setAmounts] = useState<Record<string, number>>({
    espresso: 0,
    oat: 0,
    lavender: 0,
    salt: 0,
    cardamom: 0,
  });

  // Mobile active tab
  const [mobileTab, setMobileTab] = useState<'reservoir' | 'telemetry' | 'gemini'>('reservoir');

  // Audio Engine State
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.75);
  const [chordWarmth, setChordWarmth] = useState<number>(0.65);
  const [reverbDepth, setReverbDepth] = useState<number>(0.45);
  const [cafeAmbienceLevel, setCafeAmbienceLevel] = useState<number>(0.15);
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
    baristaInstructions: 'Extract 18.5g of medium roast Arabica at 9 bars into 38g double shot. Gently steam 120ml oat milk to a velvety microfoam. Swirl evenly into warm ceramic vessel.',
    vibeCard: 'A peaceful sunlit morning at a Third Wave roastery, gently humming with warm lo-fi chords.',
    estimatedWaitSec: 35,
    tokenHash: '#TWC-4091-A',
  });

  // Refs for Web Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Peaceful Audio Synth Nodes
  const bassOscRef = useRef<OscillatorNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);

  // Chord Pad Nodes
  const padOscsRef = useRef<OscillatorNode[]>([]);
  const padGainRef = useRef<GainNode | null>(null);
  const padFilterRef = useRef<BiquadFilterNode | null>(null);
  const chordCycleIdxRef = useRef<number>(0);
  const chordIntervalRef = useRef<number | null>(null);

  // Delay & Reverb effect
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);

  // Cafe ASMR Steam & Room warmth
  const steamGainRef = useRef<GainNode | null>(null);

  // Melodic Chimes (Lavender / Cardamom)
  const arpIntervalRef = useRef<number | null>(null);

  // Canvas refs
  const fluidCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<FluidParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Derived Totals
  const totalVolume = Object.values(amounts).reduce((a, b) => a + b, 0);
  const massGrams = (totalVolume * 2.2).toFixed(1);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 1800);
  };

  // Helper to re-tune peaceful chord oscillators with smooth gliding
  const transitionToChord = useCallback((chordIndex: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const chord = PEACEFUL_CHORD_FREQS[chordIndex % PEACEFUL_CHORD_FREQS.length];

    padOscsRef.current.forEach((osc, i) => {
      if (chord[i]) {
        osc.frequency.setTargetAtTime(chord[i], now, 0.9);
      }
    });
  }, []);

  // Initialize Smooth, Peaceful Web Audio Engine
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

      // Delay / Reverb bus for peaceful space
      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.48, ctx.currentTime);
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.setValueAtTime(reverbDepth, ctx.currentTime);

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(master);
      delayNodeRef.current = delay;
      delayGainRef.current = delayFeedback;

      // 1. Smooth Deep Velvet Sub-Bass (Espresso)
      // Pure warm Sine wave + gentle lowpass (no harsh sawtooth)
      const bassOsc = ctx.createOscillator();
      const bassFilter = ctx.createBiquadFilter();
      const bassGain = ctx.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(55, ctx.currentTime); // A1

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(160, ctx.currentTime);
      bassFilter.Q.setValueAtTime(0.8, ctx.currentTime); // Very soft Q, no harshness

      bassGain.gain.setValueAtTime(0, ctx.currentTime);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(master);
      bassOsc.start();

      bassOscRef.current = bassOsc;
      bassFilterRef.current = bassFilter;
      bassGainRef.current = bassGain;

      // 2. Peaceful Warm Chord Pad (Steamed Oat)
      // Soft Triangle waves through warm lowpass (Rhodes / Ambient acoustic piano feel)
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0, ctx.currentTime);
      padGainRef.current = padGain;

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(480, ctx.currentTime);
      padFilter.Q.setValueAtTime(0.7, ctx.currentTime);
      padFilterRef.current = padFilter;

      const initialChord = PEACEFUL_CHORD_FREQS[0];
      const oscs = initialChord.map((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
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

      // Cycle peaceful chords smoothly every 7 seconds
      const chordInterval = window.setInterval(() => {
        chordCycleIdxRef.current = (chordCycleIdxRef.current + 1) % PEACEFUL_CHORD_FREQS.length;
        transitionToChord(chordCycleIdxRef.current);
      }, 7000);
      chordIntervalRef.current = chordInterval;

      // 3. Peaceful Cafe Steam & Room Tone (ASMR)
      // Ultra-soft lowpassed pink noise (like the quiet, comforting warmth of a coffee bar)
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
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.015; // very gentle
        b6 = white * 0.115926;
      }

      const sNode = ctx.createBufferSource();
      sNode.buffer = noiseBuffer;
      sNode.loop = true;

      const sFilter = ctx.createBiquadFilter();
      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(800, ctx.currentTime);
      sFilter.Q.setValueAtTime(0.5, ctx.currentTime);

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(cafeAmbienceLevel * 0.2, ctx.currentTime);
      steamGainRef.current = sGain;

      sNode.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(master);
      sNode.start();

      // 4. Peaceful Gentle Chime Arp (Botanicals - Lavender / Cardamom)
      // Delicate musical sine plucks in dreamy Major Pentatonic (D5, E5, F#5, A5, B5, D6)
      const pentatonicChimes = [587.33, 659.25, 739.99, 880.00, 987.77, 1174.66];
      let chimeIdx = 0;
      const chimeTimer = window.setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        const botanicalSum = (amounts.lavender || 0) + (amounts.cardamom || 0);
        if (botanicalSum <= 0) return;

        const f = pentatonicChimes[chimeIdx % pentatonicChimes.length];
        chimeIdx++;

        const t = audioCtxRef.current.currentTime;
        const cOsc = audioCtxRef.current.createOscillator();
        const cGain = audioCtxRef.current.createGain();

        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(f, t);

        const peak = Math.min(0.16, (botanicalSum / 70) * 0.14);
        cGain.gain.setValueAtTime(0.001, t);
        cGain.gain.linearRampToValueAtTime(peak, t + 0.03); // gentle attack
        cGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65); // lush long decay

        cOsc.connect(cGain);
        cGain.connect(master);
        cGain.connect(delay); // add soothing reverb

        cOsc.start(t);
        cOsc.stop(t + 0.7);
      }, 750); // slow, peaceful pacing
      arpIntervalRef.current = chimeTimer;

      setAudioActive(true);
    } catch (e) {
      console.warn('AudioContext failed to start:', e);
    }
  }, [amounts, masterVolume, reverbDepth, cafeAmbienceLevel, transitionToChord]);

  // Peaceful droplet water sound SFX
  const playSplashSfx = useCallback((ingId: string) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    const ing = INGREDIENTS[ingId];
    const baseF = ing ? ing.color[0] + 280 : 380;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const dropGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseF * 1.3, now);
    osc.frequency.exponentialRampToValueAtTime(baseF * 0.65, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1.5, now);

    dropGain.gain.setValueAtTime(0.22, now);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(filter);
    filter.connect(dropGain);
    dropGain.connect(masterGainRef.current);

    osc.start(now);
    osc.stop(now + 0.19);
  }, []);

  // Update Dynamic Audio synthesis levels whenever amounts change
  useEffect(() => {
    if (!audioCtxRef.current || !audioActive) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Smooth Sub-bass level (Espresso)
    if (bassGainRef.current) {
      const bVol = Math.min(0.28, (amounts.espresso / 60) * 0.28);
      bassGainRef.current.gain.setTargetAtTime(bVol, now, 0.2);
    }
    // Sub-bass frequency slides very gently
    if (bassOscRef.current) {
      const f = 55 + (amounts.espresso / 100) * 15;
      bassOscRef.current.frequency.setTargetAtTime(f, now, 0.3);
    }

    // Peaceful Pad level (Steamed Oat)
    if (padGainRef.current) {
      const pVol = Math.min(0.25, (amounts.oat / 60) * 0.25 * chordWarmth);
      padGainRef.current.gain.setTargetAtTime(pVol, now, 0.25);
    }
  }, [amounts, audioActive, chordWarmth]);

  // Master Gain slider handler
  const handleMasterGainChange = (val: number) => {
    setMasterVolume(val);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Chord warmth slider handler
  const handleChordWarmthChange = (val: number) => {
    setChordWarmth(val);
    if (padFilterRef.current && audioCtxRef.current) {
      const cutoff = 260 + val * 450;
      padFilterRef.current.frequency.setValueAtTime(cutoff, audioCtxRef.current.currentTime);
    }
    if (padGainRef.current && audioCtxRef.current) {
      const pVol = Math.min(0.25, (amounts.oat / 60) * 0.25 * val);
      padGainRef.current.gain.setValueAtTime(pVol, audioCtxRef.current.currentTime);
    }
  };

  // Reverb Depth slider handler
  const handleReverbChange = (val: number) => {
    setReverbDepth(val);
    if (delayGainRef.current && audioCtxRef.current) {
      delayGainRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Cafe ASMR slider handler
  const handleCafeAmbienceChange = (val: number) => {
    setCafeAmbienceLevel(val);
    if (steamGainRef.current && audioCtxRef.current) {
      steamGainRef.current.gain.setValueAtTime(val * 0.2, audioCtxRef.current.currentTime);
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

      // Spawn particles
      const ing = INGREDIENTS[ingId];
      const dropX = posX !== null ? posX : 170 + (Math.random() - 0.5) * 80;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(
          new FluidParticle(dropX + (Math.random() - 0.5) * 24, 30 + Math.random() * 20, ing.color)
        );
      }

      showToast(`Added +5% ${ing.label}`);
    },
    [initAudio, playSplashSfx]
  );

  // Presets matching Third Wave Coffee signatures
  const applyPreset = (presetName: string) => {
    initAudio();
    let newAmounts = { espresso: 0, oat: 0, lavender: 0, salt: 0, cardamom: 0 };
    if (presetName === 'cortado') {
      newAmounts = { espresso: 50, oat: 50, lavender: 0, salt: 0, cardamom: 0 };
    } else if (presetName === 'lavender') {
      newAmounts = { espresso: 30, oat: 50, lavender: 20, salt: 0, cardamom: 0 };
    } else if (presetName === 'alchemy') {
      newAmounts = { espresso: 35, oat: 40, lavender: 10, salt: 5, cardamom: 10 };
    } else if (presetName === 'ristretto') {
      newAmounts = { espresso: 100, oat: 0, lavender: 0, salt: 0, cardamom: 0 };
    }
    setAmounts(newAmounts);

    particlesRef.current = [];
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push(
        new FluidParticle(170 + (Math.random() - 0.5) * 100, 140 + Math.random() * 80, [242, 233, 218])
      );
    }
    showToast(`Loaded ${presetName.toUpperCase()} blend`);
  };

  // Flush cup
  const flushCup = () => {
    setAmounts({ espresso: 0, oat: 0, lavender: 0, salt: 0, cardamom: 0 });
    particlesRef.current = [];
    showToast('Reservoir Cleared');
  };

  // Call Gemini API for Barista Recipe
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

  // Animation Loop for Fluid Canvas & Oscilloscope
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
      const fillHeight = (tot / 100) * 200; // max 200px depth
      const surfaceY = 300 - fillHeight;

      if (tot > 0) {
        // Weighted Color Blend
        let r = 0, g = 0, b = 0;
        Object.keys(amounts).forEach((k) => {
          const frac = amounts[k] / tot;
          const col = INGREDIENTS[k].color;
          r += col[0] * frac;
          g += col[1] * frac;
          b += col[2] * frac;
        });
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);

        fCtx.save();
        // Ceramic Cup Mask
        fCtx.beginPath();
        fCtx.moveTo(35, 30);
        fCtx.lineTo(305, 30);
        fCtx.lineTo(290, 260);
        fCtx.quadraticCurveTo(270, 315, 170, 315);
        fCtx.quadraticCurveTo(70, 315, 50, 260);
        fCtx.closePath();
        fCtx.clip();

        // Liquid Body Gradient with warm coffee tones
        const liquidGrad = fCtx.createLinearGradient(0, surfaceY, 0, 315);
        liquidGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.96)`);
        liquidGrad.addColorStop(
          1,
          `rgba(${Math.max(0, r - 25)}, ${Math.max(0, g - 18)}, ${Math.max(0, b - 8)}, 0.99)`
        );
        fCtx.fillStyle = liquidGrad;
        fCtx.fillRect(35, surfaceY, 270, 315 - surfaceY);

        // Meniscus surface wave
        fCtx.beginPath();
        fCtx.moveTo(35, surfaceY);
        const waveOffset = Math.sin(Date.now() * 0.0025) * 2.2;
        fCtx.quadraticCurveTo(170, surfaceY + waveOffset - 2, 305, surfaceY);
        fCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        fCtx.lineWidth = 2.5;
        fCtx.stroke();

        // Liquid Particles
        particlesRef.current.forEach((p, idx) => {
          p.update(300);
          p.draw(fCtx);
          if (p.y >= 295 && Math.random() < 0.04) {
            particlesRef.current.splice(idx, 1);
          }
        });

        fCtx.restore();
      }

      // 2. Oscilloscope Rendering (Smooth Third Wave Navy & Wine tone)
      sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
      const analyser = analyserRef.current;

      if (!analyser || !audioActive) {
        // Flat peaceful line
        sCtx.strokeStyle = '#D9CFC2';
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
        sCtx.strokeStyle = '#78253A'; // Third Wave Coffee signature wine
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
  }, [amounts, audioActive]);

  // Initial load: Set Cortado baseline preset
  useEffect(() => {
    setAmounts({ espresso: 50, oat: 50, lavender: 0, salt: 0, cardamom: 0 });
  }, []);

  return (
    <div className="bg-[#FBF9F5] text-[#132738] antialiased select-none min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* TOP NAVIGATION HEADER (Matching Third Wave Coffee aesthetic) */}
      <header className="w-full h-16 md:h-18 flex items-center justify-between px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs z-40 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-3 md:gap-5">
          {/* Logo Brand Mark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0E283F] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[18px]">coffee</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm md:text-base tracking-wider text-[#0E283F] uppercase">
                LATTE LATTICE
              </span>
              <span className="text-[10px] md:text-[11px] font-sans font-medium text-[#78253A] tracking-wider uppercase">
                SONIC-BREW WORKSTATION
              </span>
            </div>
          </div>

          {/* Desktop Soundscape Status Badge */}
          <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-[#E3D9C9] text-xs font-mono text-[#647282]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6F1E9] border border-[#E3D9C9]">
              <span
                className={`w-2 h-2 rounded-full ${
                  audioActive ? 'bg-[#78253A] active-beacon' : 'bg-[#D68C3E]'
                }`}
              ></span>
              <span className="text-[#0E283F] font-bold">
                {audioActive ? 'PEACEFUL AMBIENCE' : 'STANDBY'}
              </span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F6F1E9] border border-[#E3D9C9] text-[#0E283F]">
              48.0 kHz LO-FI LOUNGE
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6F1E9] border border-[#E3D9C9]">
              <span>LEVEL:</span>
              <div className="w-12 h-2 bg-[#E3D9C9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#78253A] transition-all duration-75"
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
            title="Toggle Peaceful Audio Engine"
            className="px-3 py-1.5 rounded-full bg-[#F6F1E9] border border-[#E3D9C9] text-[#0E283F] hover:border-[#78253A] hover:text-[#78253A] flex items-center gap-1.5 transition-all text-xs font-medium"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                audioActive ? 'bg-[#78253A] active-beacon' : 'bg-[#8B7E72]'
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

          <div className="px-3 py-1.5 rounded-full bg-[#FAF3EC] border border-[#E5C7A3] text-[#9E5A17] font-mono text-xs font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#D68C3E]">water_drop</span>
            <span>{totalVolume}% FULL</span>
          </div>

          {/* Golden CTA Button matching "PRE-BOOK NOW" from Third Wave Coffee screenshot */}
          <button
            onClick={handleSynthesizeBrew}
            className="px-4 md:px-6 py-2 bg-gradient-to-r from-[#E59F48] to-[#D68C3E] hover:from-[#D68C3E] hover:to-[#C17A2F] text-white font-headline font-bold text-xs md:text-sm tracking-wider rounded-full flex items-center gap-1.5 shadow-[0_3px_12px_rgba(214,140,62,0.35)] transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>{totalVolume >= 100 ? 'BREW DRINK' : 'SYNTHESIZE BREW'}</span>
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
              <span className="text-[11px] font-mono tracking-widest text-[#78253A] font-bold uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">tune</span>
                MODULE 01 // TELEMETRY
              </span>
              <span className="text-xs font-mono text-[#D68C3E] font-bold">
                {totalVolume}% BLEND
              </span>
            </div>

            {/* 1. FORMULATION RATIO MATRIX (BROUGHT TO TOP AS REQUESTED) */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-1.5 border-b border-[#E8E2D8]">
                <span className="text-[11px] font-headline font-bold text-[#0E283F] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#78253A]">
                    pie_chart
                  </span>
                  FORMULATION RATIO MATRIX
                </span>
                <span className="text-[10px] font-mono text-[#647282] uppercase">IN RESERVOIR</span>
              </div>

              <div className="space-y-2.5">
                {Object.keys(INGREDIENTS).map((key) => {
                  const ing = INGREDIENTS[key];
                  const amt = amounts[key] || 0;
                  const pct = totalVolume > 0 ? Math.round((amt / totalVolume) * 100) : 0;
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
                            ({ing.badge})
                          </span>
                        </span>
                        <span className="text-[#0E283F] font-mono font-bold text-xs">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E8E2D8] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-200 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: ing.hex }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Vessel Meniscus Saturation & Mass Gauge */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] shadow-xs">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-headline font-bold text-[#0E283F]">
                  Vessel Saturation
                </span>
                <span className="text-xl font-mono font-bold text-[#78253A]">
                  {totalVolume}
                  <span className="text-xs text-[#D68C3E]">%</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#E8E2D8] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#D68C3E] via-[#78253A] to-[#0E283F] rounded-full transition-all duration-300"
                  style={{ width: `${totalVolume}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2.5 text-[11px] font-mono text-[#647282]">
                <span>0.0 ml (TARE)</span>
                <span className="font-semibold text-[#0E283F]">{massGrams} / 220.0 g</span>
              </div>
            </div>

            {/* 3. Mini Live Audio Waveform (Oscilloscope) */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-[#0E283F] font-bold uppercase">
                  PEACEFUL HARMONIC WAVEFORM
                </span>
                <span className="text-[10px] font-mono text-[#78253A] font-bold">
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
                  <span>WARM SINE</span>
                  <span>VELVET PAD</span>
                  <span>LO-FI ASMR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10px] font-mono text-[#8B7E72]">
            <span>THIRD WAVE ROAST LAB</span>
            <span>LATENCY: 4.2ms</span>
          </div>
        </aside>

        {/* ========================================================== */}
        {/* CENTER COLUMN: CERAMIC CUP & FLUID CANVAS (~col-span-6)     */}
        {/* ========================================================== */}
        <section
          className={`lg:col-span-6 flex flex-col justify-between p-3 md:p-5 relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE8] to-[#ECE5DC] ${
            mobileTab === 'reservoir' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Top Ingredient Injector Bar */}
          <div className="z-20 bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl p-3 md:p-3.5 mb-2 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-[11px] font-headline font-bold text-[#0E283F] flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px] text-[#D68C3E]">
                  bubble_chart
                </span>
                INGREDIENT INJECTORS (DRAG & DROP OR TAP)
              </span>
              <span className="text-[10px] md:text-[11px] font-mono text-[#647282] font-semibold">
                {massGrams} / 220.0 g
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 md:gap-2.5">
              {Object.keys(INGREDIENTS).map((key) => {
                const ing = INGREDIENTS[key];
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', ing.id);
                    }}
                    onClick={() => injectIngredient(ing.id, 4)}
                    className="cursor-grab active:cursor-grabbing flex flex-col items-center p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] hover:border-[#D68C3E] hover:bg-white transition-all active:scale-95 shadow-xs"
                  >
                    <div
                      className={`w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br ${ing.bgGrad} border ${ing.borderClass} shadow-xs flex items-center justify-center text-white`}
                    >
                      <span className="material-symbols-outlined text-[17px] md:text-[20px]">
                        {ing.icon}
                      </span>
                    </div>
                    <span className="text-[10px] md:text-xs font-headline font-bold text-[#0E283F] mt-1.5 truncate max-w-full">
                      {ing.label}
                    </span>
                    <span className="text-[8px] md:text-[9px] text-[#78253A] font-mono font-medium truncate">
                      {ing.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN STAGE: CERAMIC CUP & FLUID PHYSICS CANVAS */}
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
            {/* Warm Ambient Aura Behind Ceramic Cup */}
            <div className="absolute w-72 md:w-88 h-72 md:h-88 rounded-full bg-[#E59F48]/15 blur-3xl pointer-events-none transition-all duration-700"></div>

            {/* Ceramic Vessel Structure (Warm Sand & Kaolin Clay) */}
            <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] flex items-center justify-center">
              {/* Ceramic Outline Silhouette */}
              <div className="absolute inset-0 rounded-b-[60px] md:rounded-b-[70px] rounded-t-lg border-[3px] border-[#DDD3C4] bg-[#F7F2EA] shadow-[0_15px_40px_rgba(14,40,63,0.12)] overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#EFE8DD] via-transparent to-[#E3D9C9]/50 pointer-events-none"></div>

                {/* Graduation Markers */}
                <div className="absolute left-2.5 md:left-3 top-6 md:top-8 bottom-8 md:bottom-10 flex flex-col justify-between text-[8px] md:text-[9px] font-mono text-[#8B7E72] select-none pointer-events-none">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 md:w-3 h-[1.5px] bg-[#8B7E72]"></span>200ml (MAX)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-[1px] bg-[#8B7E72]/70"></span>150ml
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 md:w-3 h-[1.5px] bg-[#8B7E72]"></span>100ml (CORTO)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-[1px] bg-[#8B7E72]/70"></span>50ml
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 md:w-3 h-[1.5px] bg-[#8B7E72]"></span>25ml (SOLO)
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-4 bg-[#E2D6C5] border-t border-[#D5C8B4]"></div>
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
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/90 border border-[#E8E2D8] shadow-md flex items-center justify-center text-[#D68C3E] mb-2 animate-bounce">
                    <span className="material-symbols-outlined text-[24px]">water_drop</span>
                  </div>
                  <p className="text-xs md:text-sm font-headline font-bold text-[#0E283F]">
                    Tap globules or click cup to infuse
                  </p>
                  <p className="text-[10px] md:text-xs font-sans text-[#647282] mt-0.5">
                    Generates peaceful cafe ambience
                  </p>
                </div>
              )}
            </div>

            {/* Toast Message Notification */}
            {toastMessage && (
              <div className="absolute bottom-1 md:bottom-2 z-30 transition-all duration-300 bg-[#0E283F] text-white px-3.5 py-1.5 rounded-full text-xs font-mono shadow-md">
                {toastMessage}
              </div>
            )}
          </div>

          {/* Quick Formulation Presets (Third Wave Signatures) */}
          <div className="z-20 bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl p-3 md:p-3.5 mt-1 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-[11px] font-headline font-bold text-[#0E283F] flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px] text-[#78253A]">
                  auto_fix_high
                </span>
                SIGNATURE CAFE BLEND PRESETS
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
                  Cortado
                </span>
                <span className="text-[9px] font-mono text-[#78253A] block truncate font-medium">
                  50/50 Oat Foam
                </span>
              </button>
              <button
                onClick={() => applyPreset('lavender')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  Lavender Fog
                </span>
                <span className="text-[9px] font-mono text-[#78253A] block truncate font-medium">
                  Floral Triad
                </span>
              </button>
              <button
                onClick={() => applyPreset('alchemy')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  Alchemical
                </span>
                <span className="text-[9px] font-mono text-[#78253A] block truncate font-medium">
                  5-Tone Spice
                </span>
              </button>
              <button
                onClick={() => applyPreset('ristretto')}
                className="p-2 md:p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] hover:border-[#D68C3E] text-left transition-all active:scale-95 shadow-xs"
              >
                <span className="block text-xs font-headline font-bold text-[#0E283F] truncate">
                  Ristretto
                </span>
                <span className="text-[9px] font-mono text-[#78253A] block truncate font-medium">
                  100% Espresso
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
              <span className="text-[11px] font-mono tracking-widest text-[#78253A] font-bold uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">graphic_eq</span>
                MODULE 02 // SYNTH RACK
              </span>
              <span className="text-[10px] font-mono text-[#0E283F] font-bold">PEACEFUL ENGINE</span>
            </div>

            {/* Audio Activate Banner if not started */}
            {!audioActive && (
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#D68C3E]/50 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D68C3E] text-[20px]">
                    spa
                  </span>
                  <div>
                    <p className="text-xs font-headline font-bold text-[#0E283F]">Sound Standby</p>
                    <p className="text-[10px] font-sans text-[#647282]">
                      Click to unlock smooth cafe soundscape
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

            {/* Peaceful DSP Controls */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] shadow-xs space-y-3">
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
                  <span className="text-[#0E283F] font-semibold">Warm Chord Pad Warmth</span>
                  <span className="text-[#78253A] font-mono font-bold">
                    {Math.round(chordWarmth * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.02"
                  value={chordWarmth}
                  onChange={(e) => handleChordWarmthChange(parseFloat(e.target.value))}
                  className="w-full h-6"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D8]">
                <div className="flex justify-between items-center text-xs font-sans mb-1">
                  <span className="text-[#0E283F] font-semibold">Peaceful Reverb & Delay</span>
                  <span className="text-[#647282] font-mono font-bold">
                    {Math.round(reverbDepth * 100)}% Depth
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.75"
                  step="0.05"
                  value={reverbDepth}
                  onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
                  className="w-full h-6"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D8]">
                <div className="flex justify-between items-center text-xs font-sans mb-1">
                  <span className="text-[#0E283F] font-semibold">Cafe Steam & Room Tone</span>
                  <span className="text-[#8B7E72] font-mono font-bold">
                    {Math.round(cafeAmbienceLevel * 100)}% ASMR
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.02"
                  value={cafeAmbienceLevel}
                  onChange={(e) => handleCafeAmbienceChange(parseFloat(e.target.value))}
                  className="w-full h-6"
                />
              </div>
            </div>

            {/* GEMINI 2.5 FLASH BARISTA SPECIFICATION */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-[#78253A]">
                    psychology
                  </span>
                  <span className="text-[11px] font-headline font-bold text-[#0E283F] uppercase tracking-wider">
                    GEMINI BARISTA SPEC
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#D68C3E] font-bold">READY</span>
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
                  <span className="text-[9px] font-mono text-[#78253A] block uppercase font-bold">
                    EXTRACTION WORKFLOW
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
            <span>STATUS: READY</span>
          </div>
        </aside>
      </main>

      {/* MOBILE FIXED BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] z-40 flex items-center justify-around px-2 shadow-sm">
        <button
          onClick={() => setMobileTab('reservoir')}
          className={`flex-1 py-1 flex flex-col items-center justify-center active:scale-95 transition-all ${
            mobileTab === 'reservoir' ? 'text-[#78253A] font-bold' : 'text-[#647282]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">coffee</span>
          <span className="text-[9px] font-mono tracking-wider uppercase mt-0.5">RESERVOIR</span>
        </button>
        <button
          onClick={() => setMobileTab('telemetry')}
          className={`flex-1 py-1 flex flex-col items-center justify-center active:scale-95 transition-all ${
            mobileTab === 'telemetry' ? 'text-[#78253A] font-bold' : 'text-[#647282]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">pie_chart</span>
          <span className="text-[9px] font-mono tracking-wider uppercase mt-0.5">FORMULATION</span>
        </button>
        <button
          onClick={() => setMobileTab('gemini')}
          className={`flex-1 py-1 flex flex-col items-center justify-center active:scale-95 transition-all ${
            mobileTab === 'gemini' ? 'text-[#78253A] font-bold' : 'text-[#647282]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">psychology</span>
          <span className="text-[9px] font-mono tracking-wider uppercase mt-0.5">AI RECIPE</span>
        </button>
      </nav>

      {/* GEMINI BARISTA SYNTHESIS MODAL (Styled with Third Wave Coffee Burgundy & Gold) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0E283F]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-[0_25px_60px_rgba(14,40,63,0.25)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#78253A] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </div>
                <span className="text-xs font-headline font-bold text-[#0E283F] uppercase tracking-wider">
                  THIRD WAVE COFFEE // BARISTA SPECIFICATION
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
                <div className="w-10 h-10 border-3 border-[#D68C3E] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-sans text-[#647282]">
                  Consulting Gemini 2.5 Flash for Third Wave tasting notes...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-[#78253A] tracking-wider uppercase font-bold">
                    OFFICIAL ORDER RECEIPT
                  </span>
                  <div className="flex justify-between items-baseline mt-0.5">
                    <h2 className="text-lg font-headline font-bold text-[#0E283F]">
                      {currentRecipe.drinkName}
                    </h2>
                    <span className="text-xs font-mono text-[#D68C3E] font-bold bg-[#FAF3EC] px-2.5 py-0.5 rounded-full border border-[#E5C7A3]">
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
                  <span className="text-[10px] font-mono text-[#78253A] uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">coffee_maker</span>
                    BARISTA WORKFLOW BLUEPRINT
                  </span>
                  <p className="text-xs text-[#132738] leading-relaxed">
                    {currentRecipe.baristaInstructions}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF3EC] border border-[#E5C7A3]">
                  <div className="text-xs font-mono">
                    <span className="text-[#8B7E72] block text-[10px]">ESTIMATED EXTRACTION</span>
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
                        ? 'bg-[#78253A] text-white'
                        : 'bg-gradient-to-r from-[#E59F48] to-[#D68C3E] hover:from-[#D68C3E] hover:to-[#C17A2F] text-white'
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
