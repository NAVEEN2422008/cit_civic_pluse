/* ============================================================
   CivicPulse — Officer Progress Proof Store
   Persists all officer progress updates with photo/video proof
   and GPS verification, locally and via Firestore.

   Data model:
   {
     id, issueId, type, notes,
     photoUrl, videoUrl,
     exif, aiCheck, locationMatch, distanceMeters,
     officerId, officerName, officerDepartment,
     timestamp, verified
   }
   ============================================================ */

const STORAGE_KEY = 'civicpulse:officer_progress';

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function listProgressForIssue(issueId) {
  return loadAll()
    .filter(p => p.issueId === issueId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function listAllProgress() {
  return loadAll().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function addProgressEntry(entry) {
  const list = loadAll();
  const newEntry = {
    id: entry.id || `PROOF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    verified: entry.verified || false,
    ...entry,
  };
  list.push(newEntry);
  saveAll(list);

  // Fire-and-forget: persist to Firestore too
  if (typeof window !== 'undefined') {
        import('../firebase').then(({ db }) => {
      if (!db) return;
      import('firebase/firestore').then(({ collection, addDoc }) => {
        addDoc(collection(db, 'officer_progress'), newEntry).catch((err) => {
          console.warn('firestore progress save failed:', err.message);
        });
      });
    }).catch(() => {});
  }

  return newEntry;
}

export function getLatestProof(issueId) {
  return listProgressForIssue(issueId).slice(-1)[0] || null;
}

export function updateCitizenVerification(proofId, confirmed) {
  const list = loadAll();
  const idx = list.findIndex(p => p.id === proofId);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], citizenVerified: confirmed, citizenVerifiedAt: new Date().toISOString() };
  saveAll(list);
  return list[idx];
}

export function countProgressForIssue(issueId) {
  return listProgressForIssue(issueId).length;
}

/**
 * Clear all (test only)
 */
export function clearAllProgress() {
  saveAll([]);
}

export const PROGRESS_TYPES = {
  INSPECTION:  { key: 'INSPECTION',  label: 'Site Inspection',  ta: 'தள ஆய்வு',   icon: 'search' },
  WORK_START:  { key: 'WORK_START',  label: 'Work Started',     ta: 'வேலை தொடக்கம்', icon: 'play' },
  PROGRESS:    { key: 'PROGRESS',    label: 'Progress Update',  ta: 'முன்னேற்றம்',  icon: 'trending' },
  EVIDENCE:    { key: 'EVIDENCE',    label: 'Resolution Proof', ta: 'தீர்வு சான்று',  icon: 'check' },
  BLOCKED:     { key: 'BLOCKED',     label: 'Work Blocked',     ta: 'வேலை தடைபட்டது', icon: 'alert' },
};
