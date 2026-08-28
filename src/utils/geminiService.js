/* ============================================================
   CivicPulse — Gemini AI Service
   ------------------------------------------------------------
   Three responsibilities:
     1. Report Analyzer: image + text → category, severity, dept
     2. STT: voice blob → transcript (Tamil, Hindi, English, etc.)
     3. Translation: text → target language, with double-verify
        (translate target → source, compare with original for
         confidence). Includes in-memory token-rate limiter to
        stay well under the per-minute Gemini quota.

   Auth: prefers OAuth Bearer token (works with gcloud ADC tokens
   and service-account access tokens like AQ.xxxx). Falls back to
   ?key= query param for AIza-style API keys.
   ============================================================ */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';

// Resolve the auth header.
//   AIza...    → ?key= query param (default Gemini public API key)
//   AQ.xxx     → x-goog-api-key header (Google-issued access token
//                for the Gemini API; works because the API treats it
//                as an opaque API key when sent in this header)
//   Other      → Authorization: Bearer (gcloud ADC token, etc.)
function authHeaders() {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return { mode: 'none' };
  if (key.startsWith('AIza')) return { mode: 'key', key };
  if (key.startsWith('AQ.')) return { mode: 'x-goog-key', key };
  return { mode: 'bearer', key };
}

async function geminiRequest(model, body) {
  const auth = authHeaders();
  if (auth.mode === 'none') throw new Error('Gemini API key not configured');
  let url = `${GEMINI_BASE}/models/${model}:generateContent`;
  if (auth.mode === 'key') url += `?key=${auth.key}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth.mode === 'bearer') headers['Authorization'] = `Bearer ${auth.key}`;
  if (auth.mode === 'x-goog-key') headers['x-goog-api-key'] = auth.key;

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 240)}`);
  }
  return res.json();
}

// =========================================================
// TOKEN RATE LIMITER
// Free Gemini tier: 15 RPM, 1M TPM. We self-cap at 8 RPM and
// 200K TPM so we stay well under the limit. Tokens are estimated
// as ~4 chars per token.
// =========================================================

const RL = {
  minuteRequests: [],
  minuteTokens: 0,
  minuteTokensResetAt: 0,
  RPM_CAP: 8,
  TPM_CAP: 200_000,
  waitForSlot: async function (estTokens) {
    const now = Date.now();
    if (now > this.minuteTokensResetAt) {
      this.minuteRequests = [];
      this.minuteTokens = 0;
      this.minuteTokensResetAt = now + 60_000;
    }
    // Evict entries older than 60s
    this.minuteRequests = this.minuteRequests.filter(t => t > now - 60_000);
    if (this.minuteTokensResetAt === now + 60_000) {
      // just reset
    }
    // Wait until both under cap
    while (
      this.minuteRequests.length >= this.RPM_CAP ||
      this.minuteTokens + estTokens > this.TPM_CAP
    ) {
      const sleepMs = 1500;
      await new Promise(r => setTimeout(r, sleepMs));
      const t = Date.now();
      this.minuteRequests = this.minuteRequests.filter(x => x > t - 60_000);
      if (t > this.minuteTokensResetAt) {
        this.minuteRequests = [];
        this.minuteTokens = 0;
        this.minuteTokensResetAt = t + 60_000;
      }
    }
    this.minuteRequests.push(now);
    this.minuteTokens += estTokens;
  },
  estTokens: (text) => Math.max(1, Math.ceil((text || '').length / 4)),
};

const callGemini = async (model, promptText, options = {}) => {
  const est = RL.estTokens(promptText) + (options.imageBytes ? 1024 : 0);
  await RL.waitForSlot(est);
  const parts = [{ text: promptText }];
  if (options.imageBase64 && options.imageMime) {
    parts.push({
      inline_data: { mime_type: options.imageMime, data: options.imageBase64 },
    });
  }
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 1024,
      ...(options.jsonSchema ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (options.jsonSchema) {
    body.generationConfig.responseSchema = options.jsonSchema;
  }
  const data = await geminiRequest(model, body);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const safeJson = (text) => {
  // Strip ```json fences
  let t = (text || '').trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  try { return JSON.parse(t); } catch {
    // Try to grab the first {...} block
    const m = t.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
};

// =========================================================
// 1) REPORT ANALYZER
// Input: optional photo (base64), text description, city/ward
// Output: { category, categoryTa, department, priority,
//           priorityScore, summary, confidence, reasoning }
// =========================================================

const ANALYZER_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', description: 'One of: ROADS, STREETLIGHTS, WATER, DRAINAGE, GARBAGE, FOOTPATH, TRAFFIC, PARKS, SAFETY, GENERAL' },
    categoryTa: { type: 'string', description: 'Tamil name of the category' },
    department: { type: 'string', description: 'One of: HIGHWAYS, TNEB, CMWSSB, SWM, TRAFFIC, CORPORATION' },
    priority: { type: 'string', description: 'One of: CRITICAL, HIGH, MEDIUM, LOW' },
    priorityScore: { type: 'integer', description: '0-100 numeric severity' },
    summary: { type: 'string', description: 'One-sentence English summary of the issue' },
    summaryTa: { type: 'string', description: 'One-sentence Tamil summary' },
    reasoning: { type: 'string', description: 'Why the model chose this category and severity' },
    confidence: { type: 'number', description: '0.0 to 1.0' },
  },
  required: ['category', 'department', 'priority', 'priorityScore', 'summary', 'confidence'],
};

export async function analyzeReport({ description = '', photoBase64 = null, photoMime = 'image/jpeg', city = '', ward = '' }) {
  const model = DEFAULT_MODEL;
  const system = `You are CivicPulse's AI report analyst for the Government of Tamil Nadu, India.
Your job: classify citizen civic-issue reports and decide which department should handle them.

CATEGORIES → DEPARTMENTS:
- ROADS / FOOTPATH / POTHOLE / TRAFFIC → HIGHWAYS
- STREETLIGHTS / ELECTRICITY → TNEB
- WATER / DRAINAGE / SEWERAGE / FLOODING → CMWSSB
- GARBAGE / SANITATION / WASTE → SWM (Solid Waste Management)
- TRAFFIC / SIGNAL → TRAFFIC
- PARKS / TREE FALLEN / GENERAL → CORPORATION (Municipal)

PRIORITY RULES:
- CRITICAL (80-100): immediate public safety risk (live wire, road collapse, sewage flood, fallen tree on road)
- HIGH (60-79): serious civic defect blocking daily life (large pothole, water outage, major streetlight outage, garbage pileup on a hospital route)
- MEDIUM (40-59): routine maintenance (single streetlight off, small pothole, drain slow)
- LOW (0-39): cosmetic, low-impact

Be honest about confidence. If a photo is missing or ambiguous, set confidence below 0.6.
Always respond in the requested JSON schema.`;

  const userParts = [];
  userParts.push(`Description: ${description || '(no text provided)'}`);
  if (city) userParts.push(`City: ${city}`);
  if (ward) userParts.push(`Ward: ${ward}`);
  userParts.push('Classify this report. Return JSON only.');

  const text = system + '\n\n' + userParts.join('\n');
  try {
    const out = await callGemini(model, text, {
      imageBase64: photoBase64,
      imageMime: photoMime,
      jsonSchema: ANALYZER_SCHEMA,
      maxTokens: 600,
    });
    const parsed = safeJson(out);
    if (!parsed) throw new Error('No JSON from analyzer');
    return {
      category: parsed.category || 'GENERAL',
      categoryTa: parsed.categoryTa || '',
      department: parsed.department || 'CORPORATION',
      priority: parsed.priority || 'MEDIUM',
      priorityScore: Number(parsed.priorityScore) || 50,
      summary: parsed.summary || description.slice(0, 120),
      summaryTa: parsed.summaryTa || '',
      reasoning: parsed.reasoning || '',
      confidence: Number(parsed.confidence) || 0.5,
      _source: 'gemini',
    };
  } catch (err) {
    console.warn('[GeminiAnalyzer] falling back to heuristic:', err.message);
    return null;
  }
}

// =========================================================
// 2) SPEECH-TO-TEXT
// Input: audio blob, source language
// Output: { transcript, detectedLanguage, confidence }
// =========================================================

export async function transcribeWithGemini(audioBase64, audioMime = 'audio/wav', sourceLang = 'Tamil') {
  const model = DEFAULT_MODEL;
  const langMap = {
    Tamil: 'Tamil', Hindi: 'Hindi', English: 'English',
    Telugu: 'Telugu', Kannada: 'Kannada', Malayalam: 'Malayalam', Bengali: 'Bengali',
  };
  const lang = langMap[sourceLang] || 'Tamil';

  const system = `You are a speech-to-text engine for the Government of Tamil Nadu civic-issue app.
The audio is a citizen describing a civic problem (pothole, streetlight, garbage, water, etc.).
Transcribe the audio VERBATIM in its original language (${lang}). Do not translate.
Respond ONLY in JSON: {"transcript": "...", "language": "${lang}", "confidence": 0.0-1.0}.`;

  try {
    const out = await callGemini(model, system, {
      imageBase64: audioBase64,
      imageMime: audioMime,
      jsonSchema: {
        type: 'object',
        properties: {
          transcript: { type: 'string' },
          language: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['transcript', 'language'],
      },
      maxTokens: 800,
    });
    const parsed = safeJson(out);
    if (!parsed?.transcript) throw new Error('empty transcript');
    return {
      transcript: parsed.transcript,
      language: parsed.language || sourceLang,
      confidence: Number(parsed.confidence) || 0.7,
    };
  } catch (err) {
    console.warn('[GeminiSTT] failed:', err.message);
    return null;
  }
}

// =========================================================
// 2b) AI IMAGE DETECTOR — Is this photo real or AI-generated?
// Uses Gemini Vision to analyze the image and return a
// confidence score that the image is AI-synthesized.
// =========================================================

const AI_DETECTOR_SCHEMA = {
  type: 'object',
  properties: {
    isAiGenerated: { type: 'boolean', description: 'True if the image appears to be AI-synthesized or digitally generated' },
    confidence: { type: 'number', description: 'Confidence 0.0-1.0 that this assessment is correct' },
    reasoning: { type: 'string', description: 'Brief explanation of what was observed in the image that suggests AI generation or authenticity' },
    telltales: { type: 'array', items: { type: 'string' }, description: 'List of visual anomalies or authentic markers observed' },
  },
  required: ['isAiGenerated', 'confidence', 'reasoning'],
};

export async function detectAiGenerated(photoBase64, photoMime = 'image/jpeg') {
  const model = DEFAULT_MODEL;
  const system = `You are CivicPulse's AI image authenticity analyst for the Government of Tamil Nadu civic-issue platform.
Your job: determine whether a submitted citizen photo is a REAL physical photograph taken by a real camera, or an AI-synthesized / digitally generated image.

AI-GENERATED IMAGE TELLTALE SIGNS:
- Overly perfect, symmetrical, or "too clean" surfaces and textures
- Impossible or physically inconsistent lighting / shadows
- Waxy, smooth, "airbrushed" skin or road surfaces with unnatural uniformity
- Repeating patterns or "cloning" artifacts on road markings or walls
- Hallucinated text on signs or vehicle plates
- Oversaturated or unnatural color palettes
- Seamless or impossible reflections
- Perfect geometric structures where real-world damage would be irregular
- AI watermarks or metadata showing AI generation tools

AUTHENTIC REAL PHOTO TELLTALE SIGNS:
- Natural noise, grain, slight blur from real camera lens
- Realistic, imperfect damage: irregular cracks, uneven surfaces, organic patterns
- Consistent real-world lighting direction and shadows
- Natural color variation and realistic depth-of-field
- Real dust, wear, weathering patterns
- Genuine EXIF-capable camera artifacts

Be honest and strict. Return JSON only. If photo is missing or cannot be analyzed, set isAiGenerated=false and confidence below 0.5.`;

  try {
    const out = await callGemini(model, system, {
      imageBase64: photoBase64,
      imageMime: photoMime,
      jsonSchema: AI_DETECTOR_SCHEMA,
      maxTokens: 400,
    });
    const parsed = safeJson(out);
    if (!parsed) throw new Error('No JSON from AI detector');
    return {
      isAiGenerated: Boolean(parsed.isAiGenerated),
      confidence: Number(parsed.confidence) || 0.5,
      reasoning: parsed.reasoning || '',
      telltales: Array.isArray(parsed.telltales) ? parsed.telltales : [],
      _source: 'gemini_vision',
    };
  } catch (err) {
    console.warn('[detectAiGenerated] Gemini vision failed:', err.message);
    return null;
  }
}

// =========================================================
// 3) TRANSLATION + DOUBLE-VERIFY
// Forward: source -> target
// Verify: target -> source, then compute similarity
// If similarity is high -> confidence high
// If similarity is low -> fall back to local heuristic
// =========================================================

const langCodeMap = {
  English: 'English', Tamil: 'Tamil', Hindi: 'Hindi',
  Telugu: 'Telugu', Kannada: 'Kannada', Malayalam: 'Malayalam', Bengali: 'Bengali',
};

// Simple token-overlap similarity (good enough for short civic text)
function tokenSimilarity(a, b) {
  if (!a || !b) return 0;
  const tok = (s) => new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2));
  const A = tok(a), B = tok(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = new Set([...A, ...B]).size;
  return inter / union;
}

export async function translateWithGemini(text, sourceLang, targetLang) {
  if (!text || !text.trim()) return { text, confidence: 1, _source: 'passthrough' };
  if (sourceLang === targetLang) return { text, confidence: 1, _source: 'passthrough' };
  const model = DEFAULT_MODEL;
  const sLang = langCodeMap[sourceLang] || sourceLang || 'English';
  const tLang = langCodeMap[targetLang] || targetLang || 'English';

  const forwardPrompt = `Translate the following civic-issue text from ${sLang} to ${tLang}. Preserve all technical terms (pothole, drainage, streetlight, ward number, etc.). Respond with ONLY the translated text, no quotes, no explanation.`;

  try {
    const forward = await callGemini(model, `${forwardPrompt}\n\nText:\n${text}`, { maxTokens: 600, temperature: 0.1 });
    const translated = forward.trim();
    if (!translated) throw new Error('empty translation');

    // Double-verify: translate back
    const verifyPrompt = `Translate the following ${tLang} text back to ${sLang}. Respond with ONLY the back-translated text.`;
    const back = await callGemini(model, `${verifyPrompt}\n\nText:\n${translated}`, { maxTokens: 600, temperature: 0.1 });
    const backTrimmed = back.trim();

    // Compare back-translation to original
    const confidence = tokenSimilarity(text, backTrimmed);
    return {
      text: translated,
      confidence,
      backTranslation: backTrimmed,
      _source: 'gemini',
    };
  } catch (err) {
    console.warn('[GeminiTranslate] failed:', err.message);
    return null;
  }
}

export const __rateLimitStatus = () => ({
  rpmUsed: RL.minuteRequests.length,
  rpmCap: RL.RPM_CAP,
  tpmUsed: RL.minuteTokens,
  tpmCap: RL.TPM_CAP,
});

export default { analyzeReport, transcribeWithGemini, translateWithGemini, detectAiGenerated, __rateLimitStatus };
