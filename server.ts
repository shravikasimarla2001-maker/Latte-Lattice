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
function generateArtisanalFallback(ingredients: Record<string, number>, totalVolume: number) {
  const esp = ingredients.espresso || 0;
  const oat = ingredients.oat || 0;
  const lav = ingredients.lavender || 0;
  const salt = ingredients.salt || 0;
  const card = ingredients.cardamom || 0;

  const tokenHash = `#LL-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  let drinkName = "The Velvet Solstice: Smoked Oat & Lavender Ristretto";
  let tastingNotes = ["Smoked Bergamot", "Toasted Graham", "Floral Velvet", "Saline Crisp"];
  let baristaInstructions = "Extract 18g fine grind into 36g double ristretto over 27s. Aerate 140ml oat microfoam to glossy wet-paint texture. Swirl 10ml cold-pressed lavender infusion into vessel base before pouring.";
  let vibeCard = "A nocturnal Japanese jazz kissa ambience resonating at 55Hz bass resonance with comforting oat warmth.";
  let estimatedWaitSec = 45;

  if (esp >= 70) {
    drinkName = "Obsidian Monolith: Pure Double Extraction";
    tastingNotes = ["Dark Molasses", "Black Walnut", "Smoked Cacao", "Peat Smoke"];
    baristaInstructions = "Single-origin Ethiopian Yirgacheffe pulled at 9.2 bars. Zero dilution. Serve immediately at 68°C in pre-warmed ceramic vessel.";
    vibeCard = "Stark, unyielding sub-bass drone clarity. High sensory focus.";
    estimatedWaitSec = 25;
  } else if (card > 0 || salt > 0) {
    drinkName = "Kyoto Alchemical: Spiced Botanical Fog";
    tastingNotes = ["Crushed Green Cardamom", "Maldon Sea Salt", "Velvety Oat Cream", "Wild Honey"];
    baristaInstructions = "Grind whole green cardamom pod directly into portafilter basket. Pull split shot. Finish with micro-pinch of flake salt over foam crest.";
    vibeCard = "Harmonized acoustic spectrum with shimmering pentatonic resonance.";
    estimatedWaitSec = 60;
  } else if (oat >= 60) {
    drinkName = "Cloud Labyrinth: Silky Oat Microfoam Steam";
    tastingNotes = ["Steamed Cereal", "Warm Brioche", "Vanilla Husk", "Creamy Nougat"];
    baristaInstructions = "Gentle espresso foundation layered under slow-pour textured microfoam with zero air pockets.";
    vibeCard = "Deep lo-fi cafe relaxation. Soothing triad chord spread.";
    estimatedWaitSec = 40;
  } else if (lav > 25) {
    drinkName = "Elysian Violet: Floral Cascara Mist";
    tastingNotes = ["French Lavender", "Lilac Nectar", "Candied Lemon Peel", "Warm Cream"];
    baristaInstructions = "Infuse warm oat base with botanical lavender reduction. Float ristretto carefully to form distinct density stratification.";
    vibeCard = "High-frequency floral lift floating atop comforting warm undertones.";
    estimatedWaitSec = 50;
  }

  return {
    drinkName,
    tastingNotes,
    baristaInstructions,
    vibeCard,
    estimatedWaitSec,
    tokenHash,
  };
}

// POST endpoint for Gemini Barista Recipe
app.post('/api/gemini/recipe', async (req, res) => {
  const { ingredients = {}, totalVolume = 100 } = req.body;
  const tokenHash = `#LL-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  if (!ai || !apiKey) {
    const fallback = generateArtisanalFallback(ingredients, totalVolume);
    return res.json(fallback);
  }

  try {
    const prompt = `You are an elite master barista and sensory audio-aesthetic director at Latte Lattice, an avant-garde Japanese jazz kissa sound laboratory.
A patron crafted a custom drink with the following formulation fractions (total capacity: ${totalVolume}%):
- Espresso (55Hz Bass Drone): ${ingredients.espresso || 0}%
- Steamed Oat (Ambient Pad Chord): ${ingredients.oat || 0}%
- Lavender Syrup (Pentatonic Arpeggio): ${ingredients.lavender || 0}%
- Sea Salt (Mineral Resonance): ${ingredients.salt || 0}%
- Cardamom (Warm Shimmer Texture): ${ingredients.cardamom || 0}%

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
              description: 'Poetic artisanal cafe beverage name (e.g., The Velvet Solstice, Kyoto Alchemical)',
            },
            tastingNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 sensory tasting notes',
            },
            baristaInstructions: {
              type: Type.STRING,
              description: 'Concise step-by-step extraction and texturing steps for the barista',
            },
            vibeCard: {
              type: Type.STRING,
              description: 'Poetic one-sentence description of the drink and sonic atmosphere',
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
    });
  } catch (err) {
    console.warn('Gemini API call failed, using high-fidelity fallback:', err);
    const fallback = generateArtisanalFallback(ingredients, totalVolume);
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
