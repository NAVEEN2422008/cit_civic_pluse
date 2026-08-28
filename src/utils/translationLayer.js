/* ============================================================
   CivicPulse — Multilingual Translation & STT Layer
   ------------------------------------------------------------
   Provides a unified interface for text translation and
   speech-to-text across the 7 supported Indic languages.

   The layer uses a 3-tier strategy:
     1. Sarvam AI REST (when VITE_SARVAM_API_KEY is set)
     2. Local heuristic dictionary (offline fallback)
     3. Pass-through for source == target

   Sarvam endpoint reference:
     POST https://api.sarvam.ai/translate
     POST https://api.sarvam.ai/speech-to-text
   ============================================================ */

const SARVAM_BASE = 'https://api.sarvam.ai';

// Map our internal language codes -> Sarvam BCP-47 codes
const SARVAM_LANG_CODES = {
  English:    'en-IN',
  Tamil:      'ta-IN',
  Hindi:      'hi-IN',
  Telugu:     'te-IN',
  Kannada:    'kn-IN',
  Malayalam:  'ml-IN',
  Bengali:    'bn-IN',
};

// =========================================================
// LOCAL HEURISTIC DICTIONARIES (offline fallback)
// These are domain-specific Tamil/Indic terms for civic
// infrastructure. They power translation + STT hints when
// the Sarvam API is unreachable (offline, 401, rate limit).
// =========================================================

// English -> Tamil (civic domain)
const EN_TO_TA = {
  'pothole': 'சாலைப் பள்ளம்',
  'potholes': 'சாலைப் பள்ளங்கள்',
  'road': 'சாலை',
  'roads': 'சாலைகள்',
  'broken road': 'உடைந்த சாலை',
  'street': 'தெரு',
  'streetlight': 'தெருவிளக்கு',
  'streetlights': 'தெருவிளக்குகள்',
  'street light': 'தெருவிளக்கு',
  'street lights': 'தெருவிளக்குகள்',
  'light': 'விளக்கு',
  'not working': 'வேலை செய்யவில்லை',
  'not lit': 'எரியவில்லை',
  'garbage': 'குப்பை',
  'waste': 'கழிவு',
  'overflow': 'நிரம்பி',
  'drainage': 'கழிவுநீர்',
  'drain': 'கழிவுநீர் வடிகால்',
  'sewerage': 'சாக்கடை',
  'blocked': 'அடைத்து',
  'blockage': 'அடைப்பு',
  'water': 'தண்ணீர்',
  'water supply': 'நீர் விநியோகம்',
  'no water': 'தண்ணீர் இல்லை',
  'pipe': 'குழாய்',
  'leak': 'கசிவு',
  'footpath': 'நடைபாதை',
  'broken slab': 'உடைந்த பலகை',
  'park': 'பூங்கா',
  'tree fallen': 'மரம் விழுந்தது',
  'fallen tree': 'விழுந்த மரம்',
  'flood': 'வெள்ளம்',
  'water logging': 'தண்ணீர் தேக்கம்',
  'flooding': 'வெள்ளம்',
  'accident': 'விபத்து',
  'danger': 'ஆபத்து',
  'hazard': 'ஆபத்து',
  'unsafe': 'பாதுகாப்பற்றது',
  'overflowing': 'நிரம்பி வழிகிறது',
  'main road': 'முக்கிய சாலை',
  'junction': 'சந்தி',
  'bus stop': 'பேருந்து நிலையம்',
  'urgent': 'அவசரம்',
  'help': 'உதவி',
  'request': 'கோரிக்கை',
  'please': 'தயவுசெய்து',
  'thank you': 'நன்றி',
  'near': 'அருகில்',
  'opposite': 'எதிரில்',
  'next to': 'பக்கத்தில்',
  'this': 'இது',
  'the': '',
  'a': '',
  'an': '',
  'is': 'உள்ளது',
  'there is': 'உள்ளது',
  'there are': 'உள்ளன',
  'big': 'பெரிய',
  'large': 'பெரிய',
  'small': 'சிறிய',
  'deep': 'ஆழமான',
  'dangerous': 'ஆபத்தான',
  'stagnant': 'தேங்கிய',
  'rain water': 'மழை நீர்',
};

// Tamil -> English
const TA_TO_EN = Object.fromEntries(
  Object.entries(EN_TO_TA).map(([en, ta]) => [ta, en])
);

// English -> Hindi (civic domain)
const EN_TO_HI = {
  'pothole': 'गड्ढा', 'potholes': 'गड्ढे',
  'road': 'सड़क', 'roads': 'सड़कें', 'broken road': 'टूटी सड़क',
  'street': 'गली', 'streetlight': 'स्ट्रीट लाइट', 'streetlights': 'स्ट्रीट लाइट',
  'street light': 'स्ट्रीट लाइट', 'street lights': 'स्ट्रीट लाइट',
  'light': 'बत्ती', 'not working': 'काम नहीं कर रहा',
  'garbage': 'कचरा', 'waste': 'कचरा', 'overflow': 'अतिप्रवाह',
  'drainage': 'जल निकासी', 'drain': 'नाली', 'sewerage': 'सीवरेज',
  'blocked': 'अवरुद्ध', 'blockage': 'रुकावट',
  'water': 'पानी', 'water supply': 'पानी की आपूर्ति', 'no water': 'पानी नहीं',
  'pipe': 'पाइप', 'leak': 'रिसाव',
  'footpath': 'फुटपाथ', 'broken slab': 'टूटी स्लैब',
  'park': 'पार्क', 'tree fallen': 'गिरा हुआ पेड़',
  'flood': 'बाढ़', 'water logging': 'जलभराव', 'flooding': 'बाढ़',
  'accident': 'दुर्घटना', 'danger': 'खतरा', 'hazard': 'खतरा',
  'urgent': 'तत्काल', 'help': 'मदद', 'please': 'कृपया',
  'big': 'बड़ा', 'deep': 'गहरा', 'dangerous': 'खतरनाक',
};

// English -> Telugu
const EN_TO_TE = {
  'pothole': 'గుంట', 'potholes': 'గుంటలు',
  'road': 'రోడ్డు', 'roads': 'రోడ్లు', 'broken road': 'విరిగిన రోడ్డు',
  'street': 'వీధి', 'streetlight': 'వీధి దీపం', 'streetlights': 'వీధి దీపాలు',
  'light': 'లైట్', 'not working': 'పనిచేయడం లేదు',
  'garbage': 'చెత్త', 'waste': 'వ్యర్థాలు', 'overflow': 'పొంగుతోంది',
  'drainage': 'డ్రైనేజీ', 'drain': 'కాలువ', 'blocked': 'మూసుకుపోయింది',
  'water': 'నీరు', 'water supply': 'నీటి సరఫరా', 'no water': 'నీరు లేదు',
  'pipe': 'పైపు', 'leak': 'లీక్',
  'footpath': 'ఫుట్‌పాత్', 'park': 'పార్క్',
  'flood': 'వరద', 'water logging': 'నీటి నిల్వ',
  'danger': 'ప్రమాదం', 'help': 'సహాయం', 'please': 'దయచేసి',
};

// English -> Kannada
const EN_TO_KN = {
  'pothole': 'ಗುಂಡಿ', 'potholes': 'ಗುಂಡಿಗಳು',
  'road': 'ರಸ್ತೆ', 'roads': 'ರಸ್ತೆಗಳು', 'broken road': 'ಮುರಿದ ರಸ್ತೆ',
  'street': 'ಬೀದಿ', 'streetlight': 'ಬೀದಿ ದೀಪ', 'streetlights': 'ಬೀದಿ ದೀಪಗಳು',
  'light': 'ದೀಪ', 'not working': 'ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ',
  'garbage': 'ಕಸ', 'waste': 'ತ್ಯಾಜ್ಯ', 'overflow': 'ಹೆಚ್ಚಾಗುತ್ತಿದೆ',
  'drainage': 'ಚರಂಡಿ', 'drain': 'ಚರಂಡಿ', 'blocked': 'ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
  'water': 'ನೀರು', 'water supply': 'ನೀರಿನ ಪೂರೈಕೆ', 'no water': 'ನೀರಿಲ್ಲ',
  'pipe': 'ಪೈಪ್', 'leak': 'ಸೋರಿಕೆ',
  'footpath': 'ಫುಟ್‌ಪಾತ್', 'park': 'ಉದ್ಯಾನವನ',
  'flood': 'ಪ್ರವಾಹ', 'water logging': 'ನೀರಿನ ಸಂಗ್ರಹ',
  'danger': 'ಅಪಾಯ', 'help': 'ಸಹಾಯ', 'please': 'ದಯವಿಟ್ಟು',
};

// English -> Malayalam
const EN_TO_ML = {
  'pothole': 'കുഴി', 'potholes': 'കുഴികൾ',
  'road': 'റോഡ്', 'roads': 'റോഡുകൾ', 'broken road': 'തകർന്ന റോഡ്',
  'street': 'തെരുവ്', 'streetlight': 'തെരുവ് വിളക്ക്', 'streetlights': 'തെരുവ് വിളക്കുകൾ',
  'light': 'വിളക്ക്', 'not working': 'പ്രവർത്തിക്കുന്നില്ല',
  'garbage': 'മാലിന്യം', 'waste': 'മാലിന്യം', 'overflow': 'ഒഴുകുന്നു',
  'drainage': 'ഡ്രെയിനേജ്', 'drain': 'ഡ്രെയിൻ', 'blocked': 'തടഞ്ഞു',
  'water': 'വെള്ളം', 'water supply': 'ജല വിതരണം', 'no water': 'വെള്ളമില്ല',
  'pipe': 'പൈപ്പ്', 'leak': 'ചോർച്ച',
  'footpath': 'നടപ്പാത', 'park': 'പാർക്ക്',
  'flood': 'വെള്ളപ്പൊക്കം', 'water logging': 'വെള്ളക്കെട്ട്',
  'danger': 'അപകടം', 'help': 'സഹായം', 'please': 'ദയവായി',
};

// English -> Bengali
const EN_TO_BN = {
  'pothole': 'গর্ত', 'potholes': 'গর্ত',
  'road': 'রাস্তা', 'roads': 'রাস্তা', 'broken road': 'ভাঙা রাস্তা',
  'street': 'রাস্তা', 'streetlight': 'রাস্তার আলো', 'streetlights': 'রাস্তার আলো',
  'light': 'আলো', 'not working': 'কাজ করছে না',
  'garbage': 'আবর্জনা', 'waste': 'বর্জ্য', 'overflow': 'উপচে পড়ছে',
  'drainage': 'নর্দমা', 'drain': 'নর্দমা', 'blocked': 'আটকে আছে',
  'water': 'জল', 'water supply': 'জল সরবরাহ', 'no water': 'জল নেই',
  'pipe': 'পাইপ', 'leak': 'ফুটো',
  'footpath': 'ফুটপাত', 'park': 'পার্ক',
  'flood': 'বন্যা', 'water logging': 'জলাবদ্ধতা',
  'danger': 'বিপদ', 'help': 'সাহায্য', 'please': 'অনুগ্রহ করে',
};

const EN_TO_INDIC = {
  Tamil: EN_TO_TA,
  Hindi: EN_TO_HI,
  Telugu: EN_TO_TE,
  Kannada: EN_TO_KN,
  Malayalam: EN_TO_ML,
  Bengali: EN_TO_BN,
};

// =========================================================
// STT TAMIL/INDIC KEYWORD HINTS
// Used as the offline STT fallback. We pattern-match the
// description text for Indic keywords and synthesize a
// plausible English description from the matched terms.
// =========================================================

const STT_TA_HINTS = {
  'பள்ளம்|குழி|பொசிஷன்|போட்ஹோல்': { en: 'Pothole on the road', category: 'ROADS', priority: 'HIGH' },
  'சாக்கடை|ட்ரைனேஜ்|கழிவுநீர்|வடிகால்': { en: 'Drainage blockage with stagnant water', category: 'DRAINAGE', priority: 'HIGH' },
  'குப்பை|கழிவு|திடக்கழிவு|மாலின்ய': { en: 'Garbage overflow at location', category: 'GARBAGE', priority: 'MEDIUM' },
  'தெருவிளக்கு|மின்சார|விளக்கு|லைட்|ட்னெப்|தமிழ்நாடு மின்சார': { en: 'Streetlight not working', category: 'STREETLIGHTS', priority: 'MEDIUM' },
  'தண்ணீர்|நீர்|குடிநீர்|பைப்|குழாய்|கசிவு': { en: 'Water supply problem — pipe leak or no water', category: 'WATER', priority: 'HIGH' },
  'சாலை|ரோடு|பாதை|நடைபாதை|பேவ்மெண்ட்': { en: 'Road defect — damaged surface', category: 'ROADS', priority: 'MEDIUM' },
  'வெள்ளம்|மழை|தண்ணீர் தேக்கம்|ஜலசம': { en: 'Water logging and flooding', category: 'DRAINAGE', priority: 'CRITICAL' },
  'மரம்|மரம் விழுந்த|கிளை': { en: 'Fallen tree blocking road', category: 'SAFETY', priority: 'HIGH' },
  'விபத்து|ஆபத்து|அபாய|பாதுகாப்பு|பெரும': { en: 'Public safety hazard requiring urgent attention', category: 'SAFETY', priority: 'CRITICAL' },
  'பூங்கா|பார்க்|மரம்|செடி': { en: 'Park maintenance required', category: 'PARKS', priority: 'LOW' },
};

// =========================================================
// PUBLIC API
// =========================================================

/**
 * Translate text from `sourceLang` to `targetLang`.
 * Falls back to local dictionary if Sarvam unavailable.
 */
export async function translateText(text, sourceLang = 'English', targetLang = 'English') {
  if (!text || !text.trim()) return text;
  if (sourceLang === targetLang) return text;

  const apiKey = import.meta.env.VITE_SARVAM_API_KEY;

  // 1) Try Sarvam AI REST if key is set
  if (apiKey) {
    try {
      const res = await fetch(`${SARVAM_BASE}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Subscription-Key': apiKey,
        },
        body: JSON.stringify({
          input: text,
          source_language_code: SARVAM_LANG_CODES[sourceLang] || 'en-IN',
          target_language_code: SARVAM_LANG_CODES[targetLang] || 'en-IN',
          mode: 'formal',
          model: 'mayura:v1',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.translated_text) return data.translated_text;
      }
    } catch {
      // fall through to local
    }
  }

  // 2) Local heuristic fallback
  return localTranslate(text, sourceLang, targetLang);
}

function localTranslate(text, sourceLang, targetLang) {
  if (sourceLang === 'Tamil' && targetLang === 'English') {
    return replaceFromDict(text, TA_TO_EN, /*keepAsIs*/ true);
  }
  if (sourceLang === 'English' && EN_TO_INDIC[targetLang]) {
    return replaceFromDict(text, EN_TO_INDIC[targetLang]);
  }
  // Cross-Indic (e.g., Hindi -> Tamil): translate to English first, then to target
  if (sourceLang !== 'English' && targetLang !== 'English') {
    const enText = localTranslate(text, sourceLang, 'English');
    return localTranslate(enText, 'English', targetLang);
  }
  return text;
}

function replaceFromDict(text, dict, keepAsIs = false) {
  let out = text;
  // Sort by key length desc so multi-word phrases match first
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const target = dict[key];
    if (!target) continue;
    // Case-insensitive word boundary replace
    const re = new RegExp(`\\b${escapeRegex(key)}\\b`, 'gi');
    out = out.replace(re, target);
  }
  return out.trim() || text;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =========================================================
// STT: transcribe an audio blob into text + infer intent.
// In a real deployment, this calls Sarvam speech-to-text.
// Offline fallback uses keyword-based classification of any
// pre-existing description text.
// =========================================================

/**
 * Transcribe audio blob into text. If a transcript is already
 * provided (typed in by the user), we infer the intent from
 * keyword patterns instead of calling STT.
 */
export async function transcribeAudio(audioBlob, sourceLang = 'Tamil', knownTranscript = '') {
  if (knownTranscript && knownTranscript.trim()) {
    return inferFromText(knownTranscript, sourceLang);
  }

  const apiKey = import.meta.env.VITE_SARVAM_API_KEY || import.meta.env.SARVAM_API_KEY;
  if (apiKey && audioBlob) {
    try {
      const form = new FormData();
      form.append('file', audioBlob, 'voicenote.wav');
      form.append('language_code', SARVAM_LANG_CODES[sourceLang] || 'ta-IN');
      form.append('model', 'saarika:v2');
      const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'API-Subscription-Key': apiKey,
        },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.transcript) return inferFromText(data.transcript, sourceLang);
      }
    } catch {}
  }

  // Offline: best-effort from filename/empty
  return { transcript: '', inferred: null };
}

function inferFromText(text, sourceLang = 'Tamil') {
  if (!text) return { transcript: text, inferred: null };
  const lower = text.toLowerCase();
  const taLower = text;

  // Tamil keyword scan
  if (sourceLang === 'Tamil') {
    for (const [pattern, info] of Object.entries(STT_TA_HINTS)) {
      const re = new RegExp(pattern, 'i');
      if (re.test(taLower)) {
        return {
          transcript: text,
          inferred: { ...info, originalText: text, sourceLang },
        };
      }
    }
  }

  // English/romanized keyword scan
  for (const [pattern, info] of Object.entries(STT_TA_HINTS)) {
    // Match the English hint names loosely
    const enMatch = info.en.toLowerCase().split(/\s+/).find(w => w.length > 4 && lower.includes(w));
    if (enMatch) {
      return { transcript: text, inferred: { ...info, originalText: text, sourceLang } };
    }
  }

  return { transcript: text, inferred: null };
}

/**
 * Translate a UI string from English to the user's language.
 * Returns the original if no dictionary entry found.
 */
export function t(english, lang = 'English') {
  if (!lang || lang === 'English') return english;
  const dict = EN_TO_INDIC[lang];
  if (!dict) return english;
  return replaceFromDict(english, dict);
}

export default { translateText, transcribeAudio, t };
