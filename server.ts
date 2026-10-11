import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Recipe generation fallback generator
function generateArtisanalFallback(ingredients: Record<string, number>, totalVolume: number, temperature = 'Hot / Steamed') {
  const esp = ingredients.espresso || 0;
  const oat = ingredients.oat || 0;
  const lav = ingredients.lavender || 0;
  const salt = ingredients.salt || 0;
  const card = ingredients.cardamom || 0;
  const isCold = temperature.toLowerCase().includes('iced') || temperature.toLowerCase().includes('cold');

  const tokenHash = `#TWC-${Math.floor(1000 + Math.random() * 9000)}-${isCold ? 'ICE' : 'HOT'}`;

  let drinkName = isCold
    ? "Glacial Solstice: Cold Brew & Lavender Sweet Cream"
    : "The Velvet Solstice: Smoked Oat & Lavender Ristretto";
  let tastingNotes = isCold
    ? ["Chilled Bergamot", "Candied Violet", "Silky Sweet Cream", "Crisp Saline Finish"]
    : ["Smoked Bergamot", "Toasted Graham", "Floral Velvet", "Saline Crisp"];
  let baristaInstructions = isCold
    ? "Fill a ribbed highball glass with 120g crystal clear ice blocks. Layer 60ml flash-chilled espresso concentrate over lavender-infused mineral water. Top with 40ml float of cold sweet oat foam."
    : "Pre-warm ceramic mug to 65°C. Extract 18g fine grind into 36g double ristretto over 27s. Aerate 140ml oat microfoam to glossy velveteen paint texture. Swirl 10ml lavender syrup into base before pouring.";
  let vibeCard = isCold
    ? "Crisp, crystalline soundscape with clinking ice FM bell tones and cooling clarity."
    : "A cozy sunlit Third Wave roastery glowing with warm analog chords and soft steam whisper.";
  let estimatedWaitSec = isCold ? 35 : 45;

  if (esp >= 70) {
    drinkName = isCold ? "Cryo Obsidian: Flash-Chilled Cold Drip" : "Obsidian Monolith: Pure Double Extraction";
    tastingNotes = isCold
      ? ["Dark Cacao Nibs", "Chilled Black Walnut", "Stonefruit", "Cold Saline Snap"]
      : ["Dark Molasses", "Black Walnut", "Smoked Cacao", "Peat Smoke"];
    baristaInstructions = isCold
      ? "Pull double shot over stainless chilling stones directly into an iced tumbler. Zero dilution."
      : "Single-origin Ethiopian Yirgacheffe pulled at 9.2 bars. Zero dilution. Serve immediately at 68°C in pre-warmed ceramic vessel.";
    vibeCard = isCold
      ? "Sharp, frosted sonic clarity with resonant mineral precision."
      : "Stark, unyielding sub-bass drone clarity. High sensory focus.";
    estimatedWaitSec = isCold ? 25 : 30;
  } else if (card > 0 || salt > 0) {
    drinkName = isCold ? "Kyoto Frost: Spiced Botanical Cold Foam" : "Kyoto Alchemical: Spiced Botanical Fog";
    tastingNotes = isCold
      ? ["Crushed Cardamom Ice", "Maldon Saline Brine", "Chilled Velvet Cream", "Wild Honey"]
      : ["Crushed Green Cardamom", "Maldon Sea Salt", "Velvety Oat Cream", "Wild Honey"];
    baristaInstructions = isCold
      ? "Muddle cardamom with lavender ice. Pour chilled espresso concentrate through strainer over geometric ice cubes; finish with flake salt on cold foam cap."
      : "Grind whole green cardamom pod directly into portafilter basket. Pull split shot. Finish with micro-pinch of flake salt over foam crest.";
    vibeCard = isCold
      ? "Harmonized acoustic spectrum with shimmering cold FM bells and crisp water clarity."
      : "Harmonized acoustic spectrum with shimmering warm resonance and hearth comfort.";
    estimatedWaitSec = 50;
  } else if (oat >= 60) {
    drinkName = isCold ? "Cloud Stratus: Iced Oat Cream Drift" : "Cloud Labyrinth: Silky Oat Microfoam Steam";
    tastingNotes = isCold
      ? ["Chilled Brioche", "Cold Oat Cream", "Vanilla Husk", "Iced Nougat"]
      : ["Steamed Cereal", "Warm Brioche", "Vanilla Husk", "Creamy Nougat"];
    baristaInstructions = isCold
      ? "Shake cold-pressed oat milk with ice until frothy; pour over espresso base to create distinct stratified layers in a cold fluted tumbler."
      : "Gentle espresso foundation layered under slow-pour textured microfoam with zero air pockets at 62°C.";
    vibeCard = isCold
      ? "Deep lo-fi cafe relaxation with airy cold foam lightness."
      : "Deep lo-fi cafe relaxation with soothing warm triad chord spread.";
    estimatedWaitSec = 40;
  }

  return {
    drinkName,
    tastingNotes,
    baristaInstructions,
    vibeCard,
    estimatedWaitSec,
    tokenHash,
    temperature,
  };
}

// POST endpoint for Gemini Barista Recipe
app.post('/api/gemini/recipe', async (req, res) => {
  const { ingredients = {}, totalVolume = 100, temperature = 'Hot / Steamed' } = req.body;
  const isCold = temperature.toLowerCase().includes('iced') || temperature.toLowerCase().includes('cold');
  const tokenHash = `#TWC-${Math.floor(1000 + Math.random() * 9000)}-${isCold ? 'ICE' : 'HOT'}`;

  if (!ai || !apiKey) {
    const fallback = generateArtisanalFallback(ingredients, totalVolume, temperature);
    return res.json(fallback);
  }

  try {
    const prompt = `You are an elite master barista and sensory audio-aesthetic director at Latte Lattice, an avant-garde Third Wave Coffee sound laboratory.
A patron crafted a custom drink with thermal profile: ${temperature}.
Formulation fractions (total capacity: ${totalVolume}%):
- Espresso (${isCold ? 'Cold Brew / Flash Chilled Concentrate' : 'Hot Extraction Crema'}): ${ingredients.espresso || 0}%
- Oat Milk (${isCold ? 'Chilled Sweet Cream / Cold Foam' : 'Steamed Microfoam'}): ${ingredients.oat || 0}%
- Lavender Syrup (${isCold ? 'Crystalline Floral Droplets' : 'Warm Floral Infusion'}): ${ingredients.lavender || 0}%
- Sea Salt: ${ingredients.salt || 0}%
- Cardamom (${isCold ? 'Spiced Infusion over Ice' : 'Warm Dust & Steam'}): ${ingredients.cardamom || 0}%

THERMAL DIRECTIVE:
${isCold
  ? 'This is a COLD / ICED beverage. Specify glass style (e.g. ribbed highball or chilled tumbler), ice proportion, layering technique (e.g. cold foam float, stratified density layers), and crisp chill-factor tasting notes.'
  : 'This is a HOT / STEAMED beverage. Specify ceramic mug pre-warming temperature (in °C), milk steaming temperature (~60-65°C), microfoam texture (velveteen vs dense), and warming aromatic profiles.'}

Generate an artisanal beverage codename, tasting notes, professional barista extraction steps, a poetic acoustic vibe card, and an estimated wait time in seconds.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drinkName: {
              type: Type.STRING,
              description: 'Poetic artisanal cafe beverage name (e.g., Glacial Solstice, Velvet Monolith)',
            },
            tastingNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 sensory tasting notes reflecting the hot or cold thermal profile',
            },
            baristaInstructions: {
              type: Type.STRING,
              description: 'Concise step-by-step extraction and texturing steps including glassware/ceramic and thermal details',
            },
            vibeCard: {
              type: Type.STRING,
              description: 'Poetic one-sentence description of the drink and its ambient thermal/sonic atmosphere',
            },
            estimatedWaitSec: {
              type: Type.INTEGER,
              description: 'Estimated preparation time in seconds (between 25 and 90)',
            },
          },
          required: [
            'drinkName',
            'tastingNotes',
            'baristaInstructions',
            'vibeCard',
            'estimatedWaitSec',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.drinkName) {
      throw new Error('Invalid schema received');
    }

    return res.json({
      ...parsed,
      tokenHash,
      temperature,
    });
  } catch (err) {
    console.warn('Gemini API call failed, using high-fidelity fallback:', err);
    const fallback = generateArtisanalFallback(ingredients, totalVolume, temperature);
    return res.json(fallback);
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Latte Lattice workstation running on http://localhost:${port}`);
  });
}

startServer();
