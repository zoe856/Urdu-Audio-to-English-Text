import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Configure high payload limit for audio files (up to 50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Convert Urdu Voice to English API
  app.post('/api/convert-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', tone = 'natural' } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: 'No audio data received. Please provide a valid audio file or recording.' });
      }

      // Clean base64 string if it contains data prefix
      const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.+_-]+;base64,/, '');

      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: cleanBase64,
        },
      };

      const systemInstruction = `You are a master Urdu linguist, phonetician, and bilingual English translator with deep knowledge of Pakistani Urdu accents, dialects (Lahori, Karachite, Pothwari, colloquial slang, formal ادبی اردو), and modern English idioms.

Your task:
1. Listen attentively to the Urdu voice input.
2. Accurately transcribe the spoken Urdu in pristine, authentic Urdu script (نستعلیق / عربی رسم الخط). Do not omit nuances or filler words if meaningful.
3. Provide an accurate, phonetic Roman Urdu transliteration (e.g., "Aap kaise hain?").
4. Translate the spoken Urdu into crystal-clear, natural, grammatically perfect English. The English must sound completely natural to a native English speaker while preserving the full intent, emotional tone, and politeness level (ادب و احترام) of the original Urdu.
5. Provide contextual variants:
   - formal: Suitable for business, academia, or official contexts.
   - casual: Everyday conversational style between friends or peers.
   - literal: A word-by-word structural translation to help the user understand how the Urdu expression maps to English.
6. Extract key vocabulary terms (Urdu, Roman Urdu, English meaning).
7. If the audio is silent or not speech, clearly state this in the summary and set audioNotes.

Output strictly valid JSON matching the schema provided.`;

      const promptText = `Please convert this Urdu voice recording into English. Target style focus: ${tone}.
Ensure the Urdu transcription is 100% faithful to the speaker's words, and the English translation is elegant, precise, and completely natural.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            audioPart,
            { text: promptText },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urduTranscript: {
                type: Type.STRING,
                description: 'Full accurate transcription in proper Urdu script (نستعلیق)',
              },
              romanUrdu: {
                type: Type.STRING,
                description: 'Roman Urdu phonetic representation for easy reading',
              },
              englishTranslation: {
                type: Type.STRING,
                description: 'The primary, highly accurate, natural English translation',
              },
              formalTranslation: {
                type: Type.STRING,
                description: 'Professional or formal English version',
              },
              casualTranslation: {
                type: Type.STRING,
                description: 'Casual or colloquial English version',
              },
              literalTranslation: {
                type: Type.STRING,
                description: 'Word-for-word or direct structural translation',
              },
              toneDetected: {
                type: Type.STRING,
                description: 'Detected tone, e.g. Polite & Respectful, Friendly Casual, Urgent, Inquisitive, Formal',
              },
              confidenceScore: {
                type: Type.INTEGER,
                description: 'Speech recognition and translation confidence score between 0 and 100',
              },
              summary: {
                type: Type.STRING,
                description: 'A 1-sentence synopsis of what the speaker expressed',
              },
              audioNotes: {
                type: Type.STRING,
                description: 'Observations regarding speaker pace, audio clarity, background noise, or accent',
              },
              vocabulary: {
                type: Type.ARRAY,
                description: 'Key Urdu words and phrases broken down',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    urdu: { type: Type.STRING },
                    roman: { type: Type.STRING },
                    english: { type: Type.STRING },
                    context: { type: Type.STRING },
                  },
                  required: ['urdu', 'roman', 'english'],
                },
              },
            },
            required: ['urduTranscript', 'romanUrdu', 'englishTranslation'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('No translation response returned by Gemini model');
      }

      const parsedData = JSON.parse(responseText);
      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error during audio conversion:', err);
      const errorMessage = err?.message || 'Failed to process audio translation';
      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // English Text-to-Speech endpoint using gemini-3.8-flash-lite-tts
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for TTS' });
      }

      // Valid prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      const allowedVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
      const selectedVoice = allowedVoices.includes(voice) ? voice : 'Kore';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 500),
                speechMetadata: {
                  style: 'Clear, natural, well-paced and warm English speech',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('TTS returned no audio stream');
      }

      // Complete WAV file is returned in unary mode
      return res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err: any) {
      console.error('Error during TTS generation:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to synthesize English speech',
      });
    }
  });

  // Provide synthetic sample audio generator for quick testing
  app.post('/api/sample-audio', async (req, res) => {
    try {
      const { sampleKey } = req.body;

      const samples: Record<string, { prompt: string; text: string }> = {
        greeting: {
          prompt: 'Say in warm, clear conversational Urdu: "السلام علیکم! امید ہے آپ خیریت سے ہوں گے۔ میں آپ کی کیا مدد کر سکتا ہوں؟"',
          text: 'Assalam-o-Alaikum! Umeed hai aap khairiyat se honge. Main aap ki kya madad kar sakta hoon?',
        },
        business: {
          prompt: 'Say in professional Urdu: "براہ کرم کل کی میٹنگ کا وقت تصدیق کر دیں تاکہ ہم پراجیکٹ کی رپورٹ مکمل کر سکیں۔"',
          text: 'Barahe karam kal ki meeting ka waqt tasdeeq kar dein taake hum project ki report mukammal kar sakein.',
        },
        travel: {
          prompt: 'Say in everyday Urdu: "کیا آپ مجھے بتا سکتے ہیں کہ سب سے قریبی میٹرو اسٹیشن کس طرف ہے؟"',
          text: 'Kya aap mujhe bata sakte hain ke sab se qareebi metro station kis taraf hai?',
        },
        proverb: {
          prompt: 'Say in expressive Urdu: "محنت کبھی رائیگاں نہیں جاتی، اور صبر کا پھل ہمیشہ میٹھا ہوتا ہے۔"',
          text: 'Mehnat kabhi raigan nahi jaati, aur sabar ka phal hamesha meetha hota hai.',
        },
      };

      const selected = samples[sampleKey] || samples.greeting;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: selected.prompt,
                speechMetadata: {
                  style: 'Authentic, fluent Urdu pronunciation and intonation',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('Sample audio could not be generated');
      }

      return res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        title: sampleKey,
      });
    } catch (err: any) {
      console.error('Error generating sample audio:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Could not generate sample audio',
      });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BolTranslate server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
