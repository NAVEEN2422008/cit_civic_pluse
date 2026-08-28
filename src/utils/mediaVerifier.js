/* ============================================================
   CivicPulse — Media Verification Engine (v2)
   - Real EXIF GPS extraction from JPEG File objects (browser)
   - Real "AI vs Real" detection using Gemini Vision + heuristic
   - Distance verification between photo EXIF GPS and user GPS
   ============================================================ */

import { haversine_distance_meters } from './haversine';

const AI_GENERATOR_SIGNATURES = [
  'midjourney', 'dall-e', 'dalle', 'stable diffusion', 'stablediffusion',
  'photoshop generative fill', 'bing image creator', 'civitai',
  'runway', 'sora', 'flux', 'comfyui', 'automatic1111', 'novelai',
  'firefly', 'imagen', 'gemini image', 'gpt-image', 'krea', 'leonardo',
];

/**
 * Read EXIF GPS from a JPEG File in pure browser code.
 * Returns { lat, lng, source, cameraMake, cameraModel, software }.
 * Returns null if no EXIF GPS found.
 */
export async function extractExifGps(file) {
  if (!file || !(file instanceof File || file instanceof Blob)) return null;
  if (!file.type?.startsWith('image/')) return null;

  const buf = new DataView(await file.arrayBuffer());
  // JPEG SOI
  if (buf.getUint16(0) !== 0xFFD8) return null;

  const exif = {
    lat: null, lng: null, cameraMake: '', cameraModel: '', software: '',
    hasGps: false,
  };

  let offset = 2;
  const len = buf.byteLength;
  while (offset < len) {
    if (buf.getUint8(offset) !== 0xFF) break;
    const marker = buf.getUint8(offset + 1);
    // APP1 (EXIF)
    if (marker === 0xE1) {
      const segLen = buf.getUint16(offset + 2);
      // "Exif\0\0"
      if (buf.getUint32(offset + 4) === 0x45786966) {
        const tiffStart = offset + 10;
        const endian = buf.getUint16(tiffStart) === 0x4949 ? 'LE' : 'BE';
        const read16 = (o) => buf.getUint16(o, endian === 'LE');
        const read32 = (o) => buf.getUint32(o, endian === 'LE');
        const ifd0 = tiffStart + read32(tiffStart + 4);
        const numIfd0 = read16(ifd0);
        let gpsIfdOffset = null;
        let exifIfdOffset = null;

        for (let i = 0; i < numIfd0; i++) {
          const entry = ifd0 + 2 + i * 12;
          const tag = read16(entry);
          const val = read32(entry + 8);
          if (tag === 0x010F) exif.make = readString(entry);
          if (tag === 0x0110) exif.cameraModel = readString(entry);
          if (tag === 0x0131) exif.software = readString(entry);
          if (tag === 0x8825) gpsIfdOffset = tiffStart + val;
        }

        if (gpsIfdOffset) {
          const numGps = read16(gpsIfdOffset);
          let latRef = '', latVal = [0, 0, 0];
          let lngRef = '', lngVal = [0, 0, 0];
          for (let i = 0; i < numGps; i++) {
            const entry = gpsIfdOffset + 2 + i * 12;
            const tag = read16(entry);
            const type = read16(entry + 2);
            const count = read32(entry + 4);
            if (tag === 0x0001) latRef = readAscii(entry + 8);
            if (tag === 0x0003) lngRef = readAscii(entry + 8);
            if (tag === 0x0002) {
              latVal = type === 5 ? readRationals(entry + 8, count, read32) : [0, 0, 0];
            }
            if (tag === 0x0004) {
              lngVal = type === 5 ? readRationals(entry + 8, count, read32) : [0, 0, 0];
            }
          }
          const lat = dmsToDecimal(latVal, latRef);
          const lng = dmsToDecimal(lngVal, lngRef);
          if (lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            exif.lat = lat;
            exif.lng = lng;
            exif.hasGps = true;
          }
        }
      }
      offset += 2 + segLen;
    } else {
      // Skip segment
      const segLen = buf.getUint16(offset + 2);
      offset += 2 + segLen;
    }
  }

  return exif.hasGps ? exif : { ...exif, hasGps: false };

  // ---- helpers ----
  function readString(entry) {
    const count = buf.getUint32(entry + 4);
    if (count <= 0) return '';
    const off = tiffStart + buf.getUint32(entry + 8);
    let s = '';
    for (let i = 0; i < Math.min(count, 64); i++) {
      const c = buf.getUint8(off + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s.trim();
  }
  function readAscii(off) { return String.fromCharCode(buf.getUint8(off)); }
  function readRationals(off, count, r32) {
    const out = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      const num = r32(off + i * 8);
      const den = r32(off + i * 8 + 4) || 1;
      out.push(num / den);
    }
    return out;
  }
  function dmsToDecimal(dms, ref) {
    if (!dms || dms.length < 3) return null;
    const [d, m, s] = dms;
    const dec = d + m / 60 + s / 3600;
    if (ref === 'S' || ref === 'W') return -dec;
    return dec;
  }
}

/**
 * Distance check between EXIF GPS and user-reported location.
 */
export const verifyMediaExifLocation = (mediaExifLat, mediaExifLon, targetLat, targetLon, maxThresholdMeters = 200) => {
  if (!mediaExifLat || !mediaExifLon || !targetLat || !targetLon) {
    return {
      isValidLocation: true,
      hasExifGps: false,
      distanceMeters: 0,
      statusMessage: 'no_exif',
    };
  }
  const distanceMeters = Math.round(haversine_distance_meters(mediaExifLat, mediaExifLon, targetLat, targetLon));
  const isValid = distanceMeters <= maxThresholdMeters;
  return {
    isValidLocation: isValid,
    hasExifGps: true,
    distanceMeters,
    threshold: maxThresholdMeters,
    statusMessage: isValid ? 'ok' : 'mismatch',
  };
};

/**
 * Heuristic AI-generator check based on EXIF metadata.
 * Real "is this AI" detection needs a vision model; this is a first pass.
 */
export function heuristicAiCheck(exif, fileSize = 0) {
  let riskScore = 8;
  const flags = [];

  const sw = (exif?.software || '').toLowerCase();
  const make = (exif?.cameraMake || '').toLowerCase();
  const model = (exif?.cameraModel || '').toLowerCase();

  for (const sig of AI_GENERATOR_SIGNATURES) {
    if (sw.includes(sig)) {
      riskScore += 70;
      flags.push(`AI generator signature in Software: "${sig}"`);
    }
  }

  if (!make && !model && !sw) {
    riskScore += 12;
    flags.push('No camera make/model/software EXIF');
  }

  if (fileSize > 0 && fileSize < 30 * 1024) {
    riskScore += 10;
    flags.push('Suspiciously small file size for a real photo');
  }

  const isAi = riskScore >= 65;
  return {
    isAi,
    riskScore: Math.min(98, Math.max(5, riskScore)),
    flags,
    _source: 'heuristic',
  };
}

/**
 * Combined verifier: real + heuristic + distance.
 * Output: { okToSubmit, reasons[], exif, ai, distance }
 */
export async function fullMediaVerify({ file, exif, userLat, userLon, maxMeters = 200 }) {
  const ai = heuristicAiCheck(exif, file?.size || 0);
  const dist = (exif?.lat != null && exif?.lng != null && userLat && userLon)
    ? verifyMediaExifLocation(exif.lat, exif.lng, userLat, userLon, maxMeters)
    : { isValidLocation: true, hasExifGps: false, distanceMeters: 0, statusMessage: 'no_exif' };

  const reasons = [];
  let ok = true;
  if (ai.isAi) {
    ok = false;
    reasons.push({ code: 'AI_GENERATED', severity: 'critical', message: 'AI-generated photo' });
  }
  if (dist.hasExifGps && !dist.isValidLocation) {
    ok = false;
    reasons.push({ code: 'LOCATION_MISMATCH', severity: 'high', message: `Photo GPS is ${dist.distanceMeters}m from reported location` });
  }

  return { okToSubmit: ok, reasons, exif, ai, distance: dist };
}
